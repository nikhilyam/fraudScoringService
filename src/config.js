import dotenv from 'dotenv';
import { cleanEnv, num, str } from 'envalid';

dotenv.config();

const config = cleanEnv(process.env, {
    APP_PORT: num({ default: 3000 }),
    NODE_ENV: str({ default: 'development' }),
    OPENAI_API_KEY: str(),
    OPENAI_API_URL: str()
});

export default config;