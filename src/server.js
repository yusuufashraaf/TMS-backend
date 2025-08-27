const express = require("express");
const app = require("./app");
const connectDB = require("./config/db");

// Load .env variables
require("dotenv").config();

const PORT = process.env.PORT || 8000;

// Connect to DB
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
