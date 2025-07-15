import app from './app.js';
import config from './config.js';

app.listen(config.APP_PORT, () => {
    console.log(`Fraud scoring service running on port: ${config.APP_PORT}`);
});