const User = require("../models/User");
const Profile = require("../models/Profile");

const profileIdExists = async (req, res, next) => {
  const profile = await Profile.findById(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }
  req.userProfile = profile;
  next();
};

const isProfileOwner = async (req, res, next) => {
  const userId = req.user._id;
  const currentUser = await User.findById(userId);

  if (!currentUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const requestedProfileId = req.params.id;

  if (currentUser.profileIds.includes(requestedProfileId)) {
    next();
  } else {
    res.status(403).json({ message: "Permission denied. You do not have access to this resource." });
  }
};

module.exports = {
  isProfileOwner,
  profileIdExists
};