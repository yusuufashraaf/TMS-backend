const express = require("express");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const app = express();

// Middlewares
app.use(express.json());

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);

// 404 handler
app.use((req, res, next) => {
  res
    .status(404)
    .json({ status: "failed", message: "Route not found", data: null });
});

module.exports = app;
