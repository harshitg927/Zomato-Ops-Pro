const express = require("express");
const {
  createOrder,
  getAllOrders,
  getOrderById,
  assignDeliveryPartner,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController");
const { authenticateToken } = require("../middleware/auth");
const {
  requireManager,
  requireManagerOrDelivery,
} = require("../middleware/roles");
const ValidationMiddleware = require("../middleware/validation");

const router = express.Router();

// Create new order (Manager only)
router.post(
  "/",
  authenticateToken,
  requireManager,
  ValidationMiddleware.validateOrderCreation,
  createOrder
);

// Get all orders with filtering and pagination
router.get("/", authenticateToken, requireManagerOrDelivery, getAllOrders);

// Get single order by ID
router.get("/:id", authenticateToken, requireManagerOrDelivery, getOrderById);

// Assign delivery partner to order (Manager only)
router.post(
  "/:id/assign",
  authenticateToken,
  requireManager,
  ValidationMiddleware.validateDeliveryPartnerAssignment,
  assignDeliveryPartner
);

// Update order status
router.put(
  "/:id/status",
  authenticateToken,
  requireManagerOrDelivery,
  ValidationMiddleware.validateOrderStatusUpdate,
  updateOrderStatus
);

// Update order details (Manager only)
router.put(
  "/:id",
  authenticateToken,
  requireManager,
  ValidationMiddleware.validateOrderUpdate,
  updateOrder
);

// Delete order (Manager only)
router.delete("/:id", authenticateToken, requireManager, deleteOrder);

module.exports = router;
