const express = require('express')
const router = express.Router();
const {
  createJob,
  // getJobById,
  getAllJobs,
  // updateJobById,
  deleteJobById,
} = require("../controllers/jobController");


router.get("/", getAllJobs);
router.post("/", createJob);
// router.get("/:id", jobIdExists, getJobById);
// router.patch("/:id", jobIdExists, updateJobById);
router.delete("/:id", deleteJobById);

module.exports = router;
