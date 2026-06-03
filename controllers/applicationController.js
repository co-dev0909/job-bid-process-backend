const Application = require("../models/Application");
const generateResumeJsonWithDeepSeek = require("../services/generateResumeJsonWithDeepSeek");
const generateResumeDoc = require("../services/generateResumeDoc");
const fs = require("fs");
const path = require("path");

const ensureResumeGenerated = async (application) => {
  if (
    application.resumeWordPath ||
    application.driveDocxLink ||
    application.driveDocxDownloadLink
  ) {
    return {
      docxURL: application.resumeWordPath,
      pdfURL: application.resumePDFPath,
      driveLinks: {
        docxLink: application.driveDocxLink,
        docxDownloadLink: application.driveDocxDownloadLink,
      },
    };
  }

  const improvedResumeJSON = await generateResumeJsonWithDeepSeek(
    application.profile,
    application.description
  );
  const template = application.profile?.template;

  const resumeFiles = await generateResumeDoc(
    improvedResumeJSON,
    application.company,
    application.profile.fullName,
    application.job_title,
    template
  );

  application.resumeWordPath = resumeFiles.docxURL;
  application.resumePDFPath = resumeFiles.pdfURL;
  application.driveDocxLink = resumeFiles.driveLinks?.docxLink;
  application.driveDocxDownloadLink = resumeFiles.driveLinks?.docxDownloadLink;

  return resumeFiles;
};

// 1. Get all applications
const getAllApplications = async (req, res) => {
  try {
    const userId = req.user._id;
    const filter = req.query.status ? { user: userId, status: req.query.status } : { user: userId };

    const apps = await Application.find(filter).populate("profile");
    res.status(200).json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch applications.", error: err.message });
  }
};

// 2. Generate resume for an application (no file download response)
const generateResumeForApplication = async (req, res) => {
  try {
    const appId = req.params.id;
    const application = await Application.findById(appId).populate("profile");

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (String(application.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const resumeFiles = await ensureResumeGenerated(application);
    application.status = "Generated";
    await application.save();

    return res.status(200).json({
      success: true,
      message: "Resume generated successfully.",
      data: {
        _id: application._id,
        status: application.status,
        resumeWordPath: resumeFiles.docxURL,
        resumePDFPath: resumeFiles.pdfURL,
        driveDocxLink: resumeFiles.driveLinks?.docxLink,
        driveDocxDownloadLink: resumeFiles.driveLinks?.docxDownloadLink,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate resume.",
      error: err.message,
    });
  }
};

// 3. Download resume and set status to Downloaded
const downloadResumeAndCV = async (req, res) => {
  try {
    const appId = req.params.id;
    const application = await Application.findById(appId).populate("profile");
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });

    if (String(application.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const resumeFiles = await ensureResumeGenerated(application);

    // Update status to Downloaded
    application.status = "Downloaded";
    await application.save();

    if (application.driveDocxDownloadLink) {
      application.status = "Downloaded";
      await application.save();
      return res.status(200).json({
        success: true,
        message: "Resume download link ready.",
        data: {
          downloadUrl: application.driveDocxDownloadLink,
        },
      });
    }

    // Convert public URL to local file path for direct download response.
    const docxRelativePath = resumeFiles.docxURL.replace(/^\/resumes\//, "");
    const localDocxPath = path.resolve(__dirname, `../generated-resumes/${docxRelativePath}`);

    if (!fs.existsSync(localDocxPath)) {
      return res.status(500).json({
        success: false,
        message: "Resume file was generated but not found on disk.",
      });
    }

    res.download(localDocxPath, `${application.company}_${application.job_title}_resume.docx`);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to download resume & CV", error: err.message });
  }
};

// 4. Set Applied
const setApplied = async (req, res) => {
  try {
    const appId = req.params.id;
    const updated = await Application.findById(appId);
    if (!updated) return res.status(404).json({ success: false, message: "Application not found" });
    if (String(updated.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (!["Generated", "Downloaded"].includes(updated.status)) {
      return res.status(400).json({
        success: false,
        message: "Application must be Generated or Downloaded before applying.",
      });
    }

    updated.status = "Applied";
    updated.date_applied = new Date();
    await updated.save();

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to set applied", error: err.message });
  }
};

const setRestored = async (req, res) => {
  try {
    const appId = req.params.id;
    const updated = await Application.findById(appId);
    if (!updated) return res.status(404).json({ success: false, message: "Application not found" });
    if (String(updated.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    updated.status = "Generated";
    updated.date_applied = null;
    await updated.save();

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to set restored", error: err.message });
  }
};

const deleteApplication = async (req, res) => {
  try {
    const appId = req.params.id;

    const deleted = await Application.findByIdAndDelete(appId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Application deleted successfully",
      data: deleted,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete application",
      error: err.message,
    });
  }
};

module.exports = {
  getAllApplications,
  generateResumeForApplication,
  downloadResumeAndCV,
  setApplied,
  setRestored,
  deleteApplication,
};
