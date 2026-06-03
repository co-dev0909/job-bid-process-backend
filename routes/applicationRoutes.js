const express = require("express");
const router = express.Router();
const {
  getAllApplications,
  generateResumeForApplication,
  downloadResumeAndCV,
  setApplied,
  setRestored,
  deleteApplication,
} = require("../controllers/applicationController");

router.get("/", getAllApplications);
router.post("/:id/generate", generateResumeForApplication);
router.get("/:id/download", downloadResumeAndCV);
router.patch("/:id/applied", setApplied);
router.patch("/:id/restored", setRestored);
router.delete("/:id", deleteApplication);

module.exports = router;
