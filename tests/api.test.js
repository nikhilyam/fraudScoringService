import request from 'supertest';
import app from '../src/app.js';

describe('Fraud Scoring API', () => {
    test('POST /evaluate-risk - should return risk score and level', async () => {
        const payload = {
            amount: 5000,
            currency: 'USD',
            ip: '198.51.100.22',
            deviceFingerprint: 'abc123',
            email: 'user@fraud.net'
        };

        const response = await request(app)
        .post('/evaluate-risk')
        .send(payload);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('score');
        expect(response.body).toHaveProperty('riskLevel');  
    }, 10000);

    test('GET /fraud-stats - should return stats after evaluation', async () => {
        const response = await request(app).get('/fraud-stats');
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('totalEvaluation');
        expect(response.body).toHaveProperty('riskDistribution');
    });
})