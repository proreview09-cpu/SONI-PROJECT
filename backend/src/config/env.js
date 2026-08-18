const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/suvarn_bachat_yojana',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
  WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER || 'stub',
  WHATSAPP_API_KEY: process.env.WHATSAPP_API_KEY || '',
  WHATSAPP_API_URL: process.env.WHATSAPP_API_URL || '',
  DAILY_JOB_CRON: process.env.DAILY_JOB_CRON || '0 8 * * *',
  REMINDER_DAYS_BEFORE: parseInt(process.env.REMINDER_DAYS_BEFORE, 10) || 5,
  DEFAULT_DUE_DAY: parseInt(process.env.DEFAULT_DUE_DAY, 10) || 5,
};

if (!env.JWT_SECRET || env.JWT_SECRET === 'dev_secret_change_me') {
  console.warn('[env] JWT_SECRET is using a development default — set a strong secret in backend/.env for production.');
}

module.exports = env;
