const express = require('express')
const router = express.Router();
const {
  createProfile,
  getProfileById,
  getAllProfiles,
  updateProfileById,
  deleteProfileById
} = require("../controllers/profileController");

const { isProfileOwner, profileIdExists } = require("../middlewares/profileMiddleware.js");

router.get("/", getAllProfiles);
router.post("/", createProfile);
router.get("/:id", getProfileById);
router.patch("/:id", updateProfileById);
router.delete("/:id", deleteProfileById);

module.exports = router;
