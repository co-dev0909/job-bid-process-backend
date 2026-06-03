const express = require('express');
const authRouter = require("./authRoutes.js");
const profileRouter = require("./profileRoutes.js");
const jobRouter = require("./jobRoutes.js");
const resumeRouter = require("./resumeRoutes.js");
const applicationRouter = require("./applicationRoutes.js");
const isAuthenticated = require("../middlewares/authMiddleware.js");
const router = express.Router();

router.use("/auth", authRouter);
router.use("/profile", isAuthenticated, profileRouter);
router.use("/resume", resumeRouter);
router.use("/jobs", isAuthenticated, jobRouter);
router.use("/applications", isAuthenticated, applicationRouter);

module.exports = router;
