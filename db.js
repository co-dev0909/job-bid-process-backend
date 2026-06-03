const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config(); // Make sure you load environment variables

// Connect to MongoDB
const setup = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MongoDB URI is missing. Check your .env file.");
    process.exit(1); // Exit the process if URI is missing
  }

  try {
    // Use async/await to connect to MongoDB
    await mongoose.connect(uri);

    // Handle successful connection
    console.log("Connected to MongoDB");

    // You can return the mongoose connection object, if needed
    return mongoose.connection;
  } catch (error) {
    // Handle connection error
    console.error("Error connecting to MongoDB", error);
    process.exit(1); // Exit if connection fails
  }
};

module.exports = setup;
