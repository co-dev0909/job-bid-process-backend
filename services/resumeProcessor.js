// workers/resumeProcessor.js
const Application = require("../models/Application");
const generateResumeJsonWithDeepSeek = require("../services/generateResumeJsonWithDeepSeek"); // your DeepSeek JSON service
const generateResumeDoc = require("../services/generateResumeDoc"); // returns a file path/string
const path = require("path");

const SLEEP_MS = 3000;
const log = (...a) =>
  console.error(new Date().toISOString(), "[resumeWorker]", ...a);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function processOneResume() {
  // claim one app to generate resume: Pending (no resume yet)
  const app = await Application.findOneAndUpdate(
    {
      status: { $in: ["Pending", "Generating"] },
      resumeWordPath: { $exists: false },
      resumePDFPath: { $exists: false },
    },
    { $set: { status: "Generating" } },
    { sort: { _id: 1 }, new: true }
  ).populate("profile");

  if (!app) {
    log("No pending applications found.");
    return false;
  }

  log("Generating resume for application", app._id?.toString());
  try {
    const resumeJSON = await generateResumeJsonWithDeepSeek(
      app.profile,
      app.description
    );

    if (!resumeJSON || !Array.isArray(resumeJSON.skills)) {
      throw new Error(
        "Resume generator returned invalid JSON. Check DeepSeek API credentials and model response."
      );
    }

    // Sanitize company and job title for filename
    const filenameSafeCompany = (app.company || "Company").replace(
      /[^\w\-]+/g,
      "_"
    );
    const filenameSafeTitle = (app.job_title || "Job").replace(
      /[^\w\-]+/g,
      "_"
    );

    const resumePath = await generateResumeDoc(
      resumeJSON,
      filenameSafeCompany,
      `${app.profile.fullName || ""}`.trim(),
      filenameSafeTitle,
      app.profile.template,
      true // Enable Google Drive upload
    );

    // Prepare update object
    const updateData = {
      status: "Generated",
      resumePDFPath: resumePath.pdfURL,
      resumeWordPath: resumePath.docxURL,
    };

    // Add Google Drive links if available
    if (resumePath.driveLinks?.docxLink) {
      updateData.driveDocxLink = resumePath.driveLinks.docxLink;
    }
    if (resumePath.driveLinks?.docxDownloadLink) {
      updateData.driveDocxDownloadLink = resumePath.driveLinks.docxDownloadLink;
    }

    await Application.findByIdAndUpdate(app._id, {
      $set: updateData,
    });

    log("Resume generated", app._id?.toString(), path.basename(resumePath.docxURL));
    if (resumePath.driveLinks) {
      log("Google Drive links stored for application");
    }
    return true;
  } catch (err) {
    log("Error generating resume:", err?.message || err);
    // roll back to Pending so it can be retried later, or set "Failed"
    await Application.findByIdAndUpdate(app._id, {
      $set: { status: "Pending" },
    });
    return true;
  }
}

async function startResumeWorker() {
  log("Worker started.");
  while (true) {
    const didWork = await processOneResume();
    if (!didWork) await sleep(SLEEP_MS); // idle backoff
  }
}

module.exports = { startResumeWorker };
