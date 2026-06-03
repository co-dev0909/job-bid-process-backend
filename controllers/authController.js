const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const buildUserPayload = (user) => ({
  id: user.id,
  firstName: user.firstName || "",
  lastName: user.lastName || "",
  fullName: [user.firstName, user.lastName].filter(Boolean).join(" ").trim(),
  email: user.email,
});

const signToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      fullName: [user.firstName, user.lastName].filter(Boolean).join(" ").trim(),
    },
    process.env.JWT_SECRET
  );
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).json({
        message: "Invalid password!",
      });
    }

    user.lastLogin = new Date();
    user.updatedAt = new Date();
    await user.save();

    const token = signToken(user);
    return res.status(200).json({
      token,
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const register = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: encryptedPassword,
      firstName,
      lastName,
    });

    const token = signToken(user);

    res.status(201).json({
      token,
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: buildUserPayload(req.user),
    });
  } catch (error) {
    console.error("Get me error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password, new password, and confirmation are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation do not match.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long.",
      });
    }

    const passwordIsValid = await bcrypt.compare(currentPassword, req.user.password);
    if (!passwordIsValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    req.user.password = await bcrypt.hash(newPassword, salt);
    req.user.updatedAt = new Date();
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  login,
  register,
  getMe,
  changePassword,
};
