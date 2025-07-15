import app from './app.js';
import config from './config.js';
import logger from './logger.js';

app.listen(config.APP_PORT, () => {
    logger.info(`server.js#listen - Fraud scoring service running on port ${config.APP_PORT}`);
});