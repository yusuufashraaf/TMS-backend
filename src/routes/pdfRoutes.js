const express = require("express");
const router = express.Router();
const {
  protect,
  restrictTo,
} = require("../middlewares/authorizationMiddleware");
const { generateProjectPDF } = require("../controllers/pdfController");

// PDF generation route
router.get("/:projectId", protect, restrictTo("Admin"), generateProjectPDF);

module.exports = router;
