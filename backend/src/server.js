const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { startScheduler } = require('./services/schedulerService');
const Settings = require('./models/Settings');

(async () => {
  await connectDB();
  await Settings.getSingleton();
  startScheduler();
  app.listen(env.PORT, () => {
    console.log(`[server] API running at http://localhost:${env.PORT}`);
  });
})().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
