const setup = require('./db');

const { startResumeWorker } = require('./services/resumeProcessor');

// Connect to MongoDB
(async () => {
  await setup();

  // Start workers only after DB is ready
  // Optionally guard with env flags: if (process.env.ENABLE_WORKERS === "true") { ... }
  startResumeWorker();
})().catch(err => {
  console.error("DB setup error:", err);
  process.exit(1);
});
