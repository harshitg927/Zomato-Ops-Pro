const express = require("express");
const {
  getCurrentOrder,
  getOrderHistory,
  updateAvailability,
  updateEstimatedDeliveryTime,
  getStats,
  getAvailablePartners,
  getWorkloadSummary,
} = require("../controllers/deliveryController");
const { authenticateToken } = require("../middleware/auth");
const {
  requireDeliveryPartner,
  requireManager,
} = require("../middleware/roles");
const ValidationMiddleware = require("../middleware/validation");

const router = express.Router();

// Get delivery partner's current assigned order
router.get(
  "/current-order",
  authenticateToken,
  requireDeliveryPartner,
  getCurrentOrder
);

// Get delivery partner's order history
router.get(
  "/order-history",
  authenticateToken,
  requireDeliveryPartner,
  getOrderHistory
);

// Update delivery partner availability
router.put(
  "/availability",
  authenticateToken,
  requireDeliveryPartner,
  ValidationMiddleware.validateAvailabilityUpdate,
  updateAvailability
);

// Update estimated delivery time
router.put(
  "/eta",
  authenticateToken,
  requireDeliveryPartner,
  ValidationMiddleware.validateEstimatedDeliveryTimeUpdate,
  updateEstimatedDeliveryTime
);

// Get delivery partner stats
router.get("/stats", authenticateToken, requireDeliveryPartner, getStats);

// Get all available delivery partners (for managers)
router.get(
  "/available",
  authenticateToken,
  requireManager,
  getAvailablePartners
);

// Get delivery partner workload summary (for managers)
router.get("/workload", authenticateToken, requireManager, getWorkloadSummary);

module.exports = router;
