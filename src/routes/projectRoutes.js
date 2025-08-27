const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const {
  protect,
  restrictTo,
} = require("../middlewares/authorizationMiddleware");

// Only admins can create projects
router.post("/", protect, restrictTo("Admin"), projectController.createProject);

// Any authenticated user can update projects
router.put("/:id", protect, projectController.updateProject);

// Anyone can view projects
router.get("/", projectController.getAllProjects);
router.get("/:id", projectController.getProjectById);

// Only admins can delete projects
router.delete(
  "/:id",
  protect,
  restrictTo("Admin"),
  projectController.deleteProject
);

module.exports = router;
