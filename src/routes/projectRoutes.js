const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const taskController = require("../controllers/taskController");
const {
  protect,
  restrictTo,
} = require("../middlewares/authorizationMiddleware");

// Only admins can create projects
router.post("/", protect, restrictTo("Admin"), projectController.createProject);

// Route to get projects with tasks
router.get(
  "/projects-with-tasks",
  protect,
  restrictTo("Admin"),
  projectController.getProjectsWithTasks
);

// Any authenticated user can update projects
router.put(
  "/:id",
  protect,
  restrictTo("Admin"),
  projectController.updateProject
);

// Anyone can view projects
router.get("/", protect, restrictTo("Admin"), projectController.getAllProjects);
router.get("/:id", projectController.getProjectById);

// Only admins can delete projects
router.delete(
  "/:id",
  protect,
  restrictTo("Admin"),
  projectController.deleteProject
);

module.exports = router;
