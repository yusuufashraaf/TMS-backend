const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const {
  protect,
  restrictTo,
} = require("../middlewares/authorizationMiddleware");

// All routes require authentication
router.use(protect);

// Dashboard stats (must be before /:id)
router.get("/dashboard-stats", taskController.getDashboardStats);

// User-specific routes
router.get("/my-tasks", taskController.getMyTasks);
router.patch("/:id/status", taskController.updateMyTaskStatus);

// Create a new task (Admin only)
router.post("/", restrictTo("Admin"), taskController.createTask);

// Get all tasks (Admin only)
router.get("/", restrictTo("Admin"), taskController.getAllTasks);

// Get single task by ID (Admin only)
router.get("/:id", restrictTo("Admin"), taskController.getTaskById);

// Update task (Admin only)
router.put("/:id", restrictTo("Admin"), taskController.updateTask);

// Delete task (Admin only)
router.delete("/:id", restrictTo("Admin"), taskController.deleteTask);

module.exports = router;
