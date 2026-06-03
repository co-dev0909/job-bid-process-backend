const Profile = require("../models/Profile");
const User = require("../models/User");
const Job = require("../models/Job");

const createProfile = async (req, res) => {
  const newProfile = await Profile.create(req.body);
  await User.findOneAndUpdate({ _id: req.user._id }, { $push: { profileIds: newProfile._id } }, { new: true });
  res.status(200).json(newProfile);
};

const getProfileById = async (req, res) => {
  res.status(200).json(req.userProfile);
};

const getAllProfiles = async (req, res) => {
  const profileIds = req.user.profileIds;
  const userProfiles = await Profile.find({ _id: { $in: profileIds } });
  res.status(200).json(userProfiles);
};

const updateProfileById = async (req, res) => {
  const updatedProfile = await Profile.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      lastModified: Date.now(),
    },
    { new: true } // <-- Return the updated document
  );
  res.status(200).json(updatedProfile);
};

const deleteProfileById = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { profileIds: req.params.id } }, { new: true });
  await Job.updateMany({ profile: req.params.id }, { $set: { profile: null } });
  await Profile.findByIdAndDelete(req.params.id);
  res.status(204).end();
};

module.exports = {
  createProfile,
  getProfileById,
  getAllProfiles,
  updateProfileById,
  deleteProfileById,
};