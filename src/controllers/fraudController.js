import { validatePayload } from '../validators/payloadValidator.js';
import { fraudStats, calculateFraudScore, riskLevel, recordStats } from '../services/fraudService.js';
import logger from '../logger.js';

const evaluateRisk = async (req, res) => {
    logger.info('fraudController.js#evaluateRisk - Invoked');

    try {

        const payloadValidationResult = validatePayload(req.body);

        if (!payloadValidationResult) {
            logger.error('fraudController.js#evaluateRisk - Payload validation returned undefined');
            return res.status(400).json({ error: 'Invalid payload provided' });
        }

        const { error, value } = validatePayload(req.body);

        if (error) {
            logger.error(`fraudController.js#evaluateRisk - Validation error: ${error.details[0].message}`);
            return res.status(400).json({ error: error.details[0].message });
        }

        const { score, explanation } = await calculateFraudScore(value);

        const level = riskLevel(score);

        recordStats(value, score, level);

        logger.info(`fraudController.js#evaluateRisk - Evaluation complete with score: ${score}, riskLevel: ${level}`);
        return res.json({ score, riskLevel: level, explanation: explanation || 'No significant risks detected.' });

    } catch (error) {
        logger.error(`fraudController.js#evaluateRisk - Error: ${error.message}`);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getFraudStats = async (req, res) => {
    logger.info('fraudController.js#getFraudStats - Invoked');

    try {
        const total = fraudStats.length;
        const counts = fraudStats.reduce((acc, stat) => {
            acc[stat.riskLevel] = (acc[stat.riskLevel] || 0) + 1;
            return acc;
        }, {});

        return res.json({ totalEvaluation: total, riskDistribution: counts});
    } catch (error) {
        logger.error(`fraudController.js#getFraudStats - Error: ${err.message}`);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
    
};

export default { evaluateRisk, getFraudStats };