import axios from 'axios';
import config from '../config.js';

const seenIPs = new Set();
const seenFingerPrints = new Set();

const fraudStats = [];

const HIGH_RISK_DOMAINS = ['.ru', 'fraud.net'];
const LARGE_AMOUNT_THRESHOLD = 1000;

const calculateFraudScore = async ({ amount, email, ip, deviceFingerprint }) => {
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

    return {
        score: parseFloat(Math.min(score, 1.0).toFixed(2)),
        explanation: llmGeneratedExplanation
    };
}

const generateLLMExplanation = async ({ score, explanationParts }) => {
    
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
                return response.data.choices[0].text.trim();
            } else {
                return 'No significant risks detected.';
            }

            
        } catch (err) {
            if (err.response && err.response.status === 429) {
                console.warn(`Rate limit hit. Retrying after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
                delay *= 2; // Exponential backoff
            } else {
                console.error('LLM explanation error:', err.message);
                return 'Unable to generate detailed explanation.';
            }
        }
    }

    return 'Unable to generate detailed explanation after retries.';
}


const riskLevel = (score) => {
    if (score < 0.3) return 'low';
    if (score < 0.7) return 'moderate';
    return 'high'; 
}

const recordStats = ({ ip, deviceFingerprint }, score, level) => {
    seenIPs.add(ip);
    seenFingerPrints.add(deviceFingerprint);

    fraudStats.push({
        timestamp: new Date(),
        score,
        riskLevel: level
    });
}

export { fraudStats, calculateFraudScore, riskLevel, recordStats };