import { validatePayload } from '../validators/payloadValidator.js';
import { fraudStats, calculateFraudScore, riskLevel, recordStats } from '../services/fraudService.js';

const evaluateRisk = async (req, res) => {
    const { error, value } = validatePayload(req.body);

    if(error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { score, explanation } = await calculateFraudScore(value);

    const level = riskLevel(score);

    recordStats(value, score, level);

    return res.json({ 
        score, 
        riskLevel: level,
        explanation: explanation || 'No significant risks detected.'
    });
};

const getFraudStats = async (req, res) => {
    const total = fraudStats.length;
    const counts = fraudStats.reduce((acc, stat) => {
        acc[stat.riskLevel] = (acc[stat.riskLevel] || 0) + 1;
        return acc;
    }, {});

    return res.json({ totalEvaluation: total, riskDistribution: counts});
};

export default { evaluateRisk, getFraudStats };