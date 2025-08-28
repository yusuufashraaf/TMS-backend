const express = require("express");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const { restrictTo } = require("./middlewares/authorizationMiddleware");
const cors = require("cors");

const app = express();

// Allow specific frontend origin
app.use(
  cors({
    origin: "http://localhost:4200",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
// Middlewares
app.use(express.json());

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/pdf", pdfRoutes);

// 404 handler
app.use((req, res, next) => {
  res
    .status(404)
    .json({ status: "failed", message: "Route not found", data: null });
});

module.exports = app;
