const express = require("express");
const {
  register,
  login,
  getProfile,
  updateProfile,
  getDeliveryPartners,
  createDeliveryPartner,
  deleteDeliveryPartner,
  updateDeliveryPartner,
  refreshToken,
  logout,
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");
const { requireManager } = require("../middleware/roles");
const ValidationMiddleware = require("../middleware/validation");

const router = express.Router();

// Register new user
router.post(
  "/register",
  ValidationMiddleware.validateUserRegistration,
  register
);

// Login user
router.post("/login", ValidationMiddleware.validateUserLogin, login);

// Get current user profile
router.get("/profile", authenticateToken, getProfile);

// Update user profile
router.put(
  "/profile",
  authenticateToken,
  ValidationMiddleware.validateProfileUpdate,
  updateProfile
);

// Refresh JWT token
router.post("/refresh", authenticateToken, refreshToken);

// Logout user
router.post("/logout", authenticateToken, logout);

// Get all delivery partners (for managers)
router.get(
  "/delivery-partners",
  authenticateToken,
  requireManager,
  getDeliveryPartners
);

// Create new delivery partner (for managers)
router.post(
  "/delivery-partners",
  authenticateToken,
  requireManager,
  ValidationMiddleware.validateDeliveryPartnerCreation,
  createDeliveryPartner
);

// Update delivery partner (for managers)
router.put(
  "/delivery-partners/:partnerId",
  authenticateToken,
  requireManager,
  updateDeliveryPartner
);

// Delete delivery partner (for managers)
router.delete(
  "/delivery-partners/:partnerId",
  authenticateToken,
  requireManager,
  deleteDeliveryPartner
);

module.exports = router;
