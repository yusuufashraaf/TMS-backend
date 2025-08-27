const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { protect, restrictTo } = require("../middlewares/auth");

// Only admins can create projects
router.post("/", protect, restrictTo("admin"), projectController.createProject);

// Any authenticated user can update projects
router.put("/:id", protect, projectController.updateProject);

// Anyone can view projects
router.get("/", projectController.getAllProjects);
router.get("/:id", projectController.getProjectById);

// Only admins can delete projects
router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  projectController.deleteProject
);

module.exports = router;
