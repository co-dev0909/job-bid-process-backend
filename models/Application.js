const mongoose = require("mongoose");
const { Schema } = mongoose;

const applicationSchema = new mongoose.Schema({
  job_title: String,
  company: String,
  job_posted_date: String,
  is_closed: Boolean,
  job_category: String,
  seniority_level: String,
  country: String,
  employment_type: String,
  industry_domain: String,
  job_url: String,
  description: String,
  resumePDFPath: String,
  resumeWordPath: String,
  cvPath: String,
  driveDocxLink: String,
  driveDocxDownloadLink: String,
  drivePdfLink: String,
  date_applied: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["Pending", "Generating", "Generated", "Downloaded", "Applied"],
    default: "Pending",
  },
  profile: {
    type: Schema.Types.ObjectId,
    ref: "Profile",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

// Ensure uniqueness: one jobLink per profile
applicationSchema.index({ job_title: 1, company: 1, profile: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
