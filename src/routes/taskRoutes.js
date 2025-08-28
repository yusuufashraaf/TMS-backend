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

// Create a new task (Admin only)
router.post("/", restrictTo("Admin"), taskController.createTask);

// Get all tasks
router.get("/", taskController.getAllTasks);

// Get single task by ID
router.get("/:id", taskController.getTaskById);

// Update task (Admin only)
router.put("/:id", restrictTo("Admin"), taskController.updateTask);

// Delete task (Admin only)
router.delete("/:id", restrictTo("Admin"), taskController.deleteTask);

module.exports = router;
