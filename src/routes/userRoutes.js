const express = require("express");
const router = express.Router();
const userController = require("../controllers/UserController");
const authMiddleware = require("../middlewares/authorizationMiddleware");

// Protect all routes
router.use(authMiddleware.protect);

// CRUD routes
router.get("/", authMiddleware.restrictTo("Admin"), userController.getAllUsers); // Get all users
router.get("/:id", userController.getUserById); // Get single user
router.put("/:id", userController.updateUser); // Update user

// Delete user (admin only)
router.delete(
  "/:id",
  authMiddleware.restrictTo("Admin"),
  userController.deleteUser
);

module.exports = router;
