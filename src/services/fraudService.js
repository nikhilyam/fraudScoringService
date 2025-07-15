import axios from 'axios';
import config from '../config.js';
import logger from '../logger.js';

const seenIPs = new Set();
const seenFingerPrints = new Set();

const fraudStats = [];

const HIGH_RISK_DOMAINS = ['.ru', 'fraud.net'];
const LARGE_AMOUNT_THRESHOLD = 1000;

const calculateFraudScore = async ({ amount, email, ip, deviceFingerprint }) => {
    logger.info('fraudService.js#calculateFraudScore - Invoked');
    let score = 0.0;
    let explanationParts = [];

    const domain = (email.split('@')[1] || '').trim().toLowerCase();

    if (HIGH_RISK_DOMAINS.some(d => domain.endsWith(d) || domain.includes(d))) {
        score += 0.4;
        explanationParts.push(`use of a flagged domain (${domain})`);
    }

    if (amount > LARGE_AMOUNT_THRESHOLD) {
        score += 0.3;
        explanationParts.push('high transaction amount');
    }

    if (seenIPs.has(ip)) {
        score += 0.1;
        explanationParts.push('previously seen IP');
    }

    if (seenFingerPrints.has(deviceFingerprint)) {
        score += 0.1;
        explanationParts.push('previously seen device fingerprint');
    }

    if(amount >= 5000) {
        score += 0.1;
        explanationParts.push('transaction amount exceeds or equals 5000');
    }

    const llmGeneratedExplanation = await generateLLMExplanation({ score, explanationParts });

    logger.info(`fraudService.js#calculateFraudScore - Score calculated: ${score}`);

    return {
        score: parseFloat(Math.min(score, 1.0).toFixed(2)),
        explanation: llmGeneratedExplanation
    };
}

const generateLLMExplanation = async ({ score, explanationParts }) => {
    logger.info('fraudService.js#generateLLMExplanation - Invoked');

    if (!explanationParts || explanationParts.length === 0) {
        return 'This transaction is considered safe with no significant risk factors.';
    }

    const maxRetries = 3;
    let attempt = 0;
    let delay = 500; // start with 500ms

    while (attempt < maxRetries) {
        try {
            const endPoint = `${config.OPENAI_API_URL}/completions`;
            
            const response = await axios.post(`${endPoint}`, {
                model: 'gpt-3.5-turbo-instruct',
                prompt: `Summarize the following fraud analysis factors: ${explanationParts.join(', ')}. Total fraud score is ${score}.`,
                max_tokens: 60
            }, {
                headers: {
                    'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.choices && response.data.choices.length > 0) {
                logger.warn('fraudService.js#generateLLMExplanation - LLM response structure unexpected');
                return response.data.choices[0].text.trim();
            } else {
                return 'No significant risks detected.';
            }

            
        } catch (err) {
            if (err.response && err.response.status === 429) {
                logger.warn(`fraudService.js#generateLLMExplanation - Rate limit hit, retrying in ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
                delay *= 2; // Exponential backoff
            } else {
                logger.error(`fraudService.js#generateLLMExplanation - Error: ${err.message}`);
                return 'Unable to generate detailed explanation.';
            }
        }
    }
    logger.error('fraudService.js#generateLLMExplanation - Failed after retries');
    return 'Unable to generate detailed explanation after retries.';
}

const riskLevel = (score) => {
    logger.info('fraudService.js#riskLevel - Invoked');
    if (score < 0.3) return 'low';
    if (score < 0.7) return 'moderate';
    return 'high'; 
}

const recordStats = ({ ip, deviceFingerprint }, score, level) => {
    logger.info('fraudService.js#recordStats - Recording stats');

    seenIPs.add(ip);
    seenFingerPrints.add(deviceFingerprint);

    fraudStats.push({
        timestamp: new Date(),
        score,
        riskLevel: level
    });
}

export { fraudStats, calculateFraudScore, riskLevel, recordStats };