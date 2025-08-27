const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const {
  protect,
  restrictTo,
} = require("../middlewares/authorizationMiddleware");

// All routes require authentication
router.use(protect);

// Create a new task (any authenticated user)
router.post("/", restrictTo("Admin"), taskController.createTask);

// Get all tasks (only tasks related to logged-in user)
router.get("/", taskController.getAllTasks);

// Get single task by ID (only if related to user)
router.get("/:id", taskController.getTaskById);

// Update task (only if related to user)
router.put("/:id", restrictTo("Admin"), taskController.updateTask);

// Delete task (only if related to user)
router.delete("/:id", restrictTo("Admin"), taskController.deleteTask);

module.exports = router;
