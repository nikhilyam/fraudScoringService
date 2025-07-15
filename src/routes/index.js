import express from 'express';
import fraudController from '../controllers/fraudController.js';
import logger from '../logger.js';

const router = express.Router();

logger.info('routes/index.js#init - Initializing routes');

router.post('/evaluate-risk', fraudController.evaluateRisk);
router.get('/fraud-stats', fraudController.getFraudStats);

export default router;