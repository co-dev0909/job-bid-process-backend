const mongoose = require('mongoose');
const { Schema } = mongoose;

const jobSchema = new mongoose.Schema({
  jobLink: String,
  jobTitle: String,
  companyName: String,
  jobDescription: String,
  profile: {
    type: Schema.Types.ObjectId,
    ref: "Profile",
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

jobSchema.index({ jobLink: 1, profile: 1 }, { unique: true });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
