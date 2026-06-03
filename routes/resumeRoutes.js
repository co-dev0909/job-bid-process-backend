const express = require('express')
const router = express.Router();
const {
  generateResume
} = require("../controllers/resumeController");

router.post("/generate", generateResume);

module.exports = router;
