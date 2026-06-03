const mongoose = require('mongoose');
const { Schema } = mongoose;

const experienceSchema = new mongoose.Schema({
  jobTitle: String,
  workSetting: String,
  enterDate: String,
  endDate: String,
  companyName: String,
  companyLocation: String,
});

const educationSchema = new mongoose.Schema({
  universityName: String,
  universityDegree: String,
  universityLocation: String,
  enterDate: String,
  endDate: String,
});

const profileSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  location: String,
  linkedin: String,
  educations: [educationSchema],
  template: String,
  experiences: [experienceSchema],
  profileStatus: {
    type: String,
    enum: ["active", "deactive"],
    default: "deactive",
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
