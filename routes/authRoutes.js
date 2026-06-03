const express = require('express')
const isAuthenticated = require("../middlewares/authMiddleware.js");
const { login, register, getMe, changePassword } = require('../controllers/authController');
const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/me", isAuthenticated, getMe);
router.patch("/change-password", isAuthenticated, changePassword);

module.exports = router;
