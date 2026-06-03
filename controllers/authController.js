const User = require("../models/User")
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken');

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

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    return res.status(200).json({
      id: user.id,
      email,
      token,
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
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);

    const { id } = await User.create({ email, password: encryptedPassword, firstName, lastName });

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    const token = jwt.sign({ id }, process.env.JWT_SECRET);

    res.status(201).json({ id, email, token });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


module.exports = {
  login, 
  register 
}
