const cron = require('node-cron');
const env = require('../config/env');
const runDailyAutomation = require('../jobs/dailyAutomation.job');
const Settings = require('../models/Settings');

function startScheduler() {
  cron.schedule(
    env.DAILY_JOB_CRON,
    async () => {
      try {
        const stats = await runDailyAutomation();
        console.log('[automation] daily job completed:', stats);
      } catch (err) {
        console.error('[automation] daily job failed:', err);
        try {
          const settings = await Settings.getSingleton();
          settings.automationLastRunAt = new Date();
          settings.automationLastStatus = 'failed';
          settings.automationMessage = err.message;
          await settings.save();
        } catch (saveErr) {
          console.error('[automation] failed to record failure state:', saveErr);
        }
      }
    },
    { timezone: 'Asia/Kolkata' }
  );
  console.log(`[automation] scheduler registered (${env.DAILY_JOB_CRON}, Asia/Kolkata)`);
}

module.exports = { startScheduler };
