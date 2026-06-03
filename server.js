const express = require('express');
const routes = require('./routes/index');
const bodyParser = require('body-parser');
const cors = require('cors');
const setup = require('./db');
const path = require('path');

const { startResumeWorker } = require('./services/resumeProcessor');

const PORT = process.env.PORT || 5001;
const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Connect to MongoDB
(async () => {
  await setup();

  // Start workers only after DB is ready
  const enableWorkers = (process.env.ENABLE_WORKERS || "true").toLowerCase() === "true";
  if (enableWorkers) {
    startResumeWorker();
    console.log("Resume worker started.");
  } else {
    console.log("Resume worker is disabled (ENABLE_WORKERS=false).");
  }
})().catch(err => {
  console.error("DB setup error:", err);
  process.exit(1);
});

app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.status(200).json({ success: true, message: "Backend is running." });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.use("/resumes", express.static(path.join(__dirname, "generated-resumes")));
// Routes
app.use(routes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// Graceful shutdown (optional)
process.on("SIGINT", () => {
  console.log("Shutting down...");
  process.exit(0);
});
