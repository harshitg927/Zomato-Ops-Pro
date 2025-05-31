const Order = require("../models/Order");
const User = require("../models/User");

/**
 * Order Controller
 * Handles all order-related operations
 */

/**
 * Create new order (Manager only)
 */
const createOrder = async (req, res) => {
  try {
    const { items, prepTime, customerInfo, totalAmount } = req.body;

    // Generate unique order ID
    const orderId = Order.generateOrderId();

    const order = new Order({
      orderId,
      items,
      prepTime,
      customerInfo,
      totalAmount,
      createdBy: req.user._id,
      statusHistory: [
        {
          status: "PREP",
          timestamp: new Date(),
          updatedBy: req.user._id,
        },
      ],
    });

    await order.save();
    await order.populate("createdBy", "username email");

    // Emit real-time update
    req.io.emit("orderCreated", order);

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Server error during order creation" });
  }
};

/**
 * Get all orders with filtering and pagination
 */
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, deliveryPartner } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // If delivery partner, only show their assigned orders
    if (req.user.role === "delivery_partner") {
      query.deliveryPartner = req.user._id;
    }

    // Apply filters
    if (status) {
      query.status = status;
    }
    if (deliveryPartner && req.user.role === "manager") {
      query.deliveryPartner = deliveryPartner;
    }

    const orders = await Order.find(query)
      .populate("deliveryPartner", "username email estimatedDeliveryTime")
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Fetch orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get single order by ID
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("deliveryPartner", "username email estimatedDeliveryTime")
      .populate("createdBy", "username email")
      .populate("statusHistory.updatedBy", "username");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If delivery partner, ensure they can only see their assigned orders
    if (
      req.user.role === "delivery_partner" &&
      (!order.deliveryPartner ||
        order.deliveryPartner._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ order });
  } catch (error) {
    console.error("Fetch order error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Assign delivery partner to order (Manager only)
 */
const assignDeliveryPartner = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order already has a delivery partner
    if (order.deliveryPartner) {
      return res.status(400).json({
        message: "Order already has a delivery partner assigned",
      });
    }

    // Check if delivery partner exists and is available
    const deliveryPartner = await User.findById(deliveryPartnerId);
    if (!deliveryPartner || deliveryPartner.role !== "delivery_partner") {
      return res.status(404).json({ message: "Delivery partner not found" });
    }

    if (!deliveryPartner.isAvailable || deliveryPartner.currentOrder) {
      return res.status(400).json({
        message: "Delivery partner is not available",
      });
    }

    // Assign delivery partner
    order.deliveryPartner = deliveryPartnerId;
    order.dispatchTime = order.prepTime + deliveryPartner.estimatedDeliveryTime;

    // Update delivery partner status
    deliveryPartner.isAvailable = false;
    deliveryPartner.currentOrder = order._id;

    await Promise.all([order.save(), deliveryPartner.save()]);

    await order.populate(
      "deliveryPartner",
      "username email estimatedDeliveryTime"
    );

    // Emit real-time update
    req.io.emit("orderAssigned", order);

    res.json({
      message: "Delivery partner assigned successfully",
      order,
    });
  } catch (error) {
    console.error("Assign delivery partner error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update order status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate(
      "deliveryPartner"
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If delivery partner, ensure they can only update their assigned orders
    if (req.user.role === "delivery_partner") {
      if (
        !order.deliveryPartner ||
        order.deliveryPartner._id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // Validate status flow (sequential)
    const statusFlow = ["PREP", "PICKED", "ON_ROUTE", "DELIVERED"];
    const currentIndex = statusFlow.indexOf(order.status);
    const newIndex = statusFlow.indexOf(status);

    if (newIndex < currentIndex) {
      return res.status(400).json({
        message: "Cannot move to a previous status",
      });
    }

    if (newIndex > currentIndex + 1) {
      return res.status(400).json({
        message:
          "Cannot skip status. Follow sequential flow: PREP → PICKED → ON_ROUTE → DELIVERED",
      });
    }

    // Update order status
    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });

    // If order is delivered, mark delivery partner as available
    if (status === "DELIVERED" && order.deliveryPartner) {
      const deliveryPartner = await User.findById(order.deliveryPartner._id);
      if (deliveryPartner) {
        deliveryPartner.isAvailable = true;
        deliveryPartner.currentOrder = null;
        await deliveryPartner.save();
      }
    }

    await order.save();
    await order.populate(
      "deliveryPartner",
      "username email estimatedDeliveryTime"
    );
    await order.populate("statusHistory.updatedBy", "username");

    // Emit real-time update
    req.io.emit("orderStatusUpdated", order);

    res.json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update order details (Manager only)
 */
const updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Prevent updating if order is already picked up or beyond
    if (["PICKED", "ON_ROUTE", "DELIVERED"].includes(order.status)) {
      return res.status(400).json({
        message: "Cannot update order after it has been picked up",
      });
    }

    const allowedUpdates = ["items", "prepTime", "customerInfo"];
    const updates = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Recalculate dispatch time if prepTime is updated and delivery partner is assigned
    if (updates.prepTime && order.deliveryPartner) {
      const deliveryPartner = await User.findById(order.deliveryPartner);
      if (deliveryPartner) {
        updates.dispatchTime =
          updates.prepTime + deliveryPartner.estimatedDeliveryTime;
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("deliveryPartner", "username email estimatedDeliveryTime")
      .populate("createdBy", "username email");

    // Emit real-time update
    req.io.emit("orderUpdated", updatedOrder);

    res.json({
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete order (Manager only)
 */
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Prevent deleting if order is already picked up or beyond
    if (["PICKED", "ON_ROUTE", "DELIVERED"].includes(order.status)) {
      return res.status(400).json({
        message: "Cannot delete order after it has been picked up",
      });
    }

    // If delivery partner is assigned, make them available again
    if (order.deliveryPartner) {
      await User.findByIdAndUpdate(order.deliveryPartner, {
        isAvailable: true,
        currentOrder: null,
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    // Emit real-time update
    req.io.emit("orderDeleted", { orderId: req.params.id });

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  assignDeliveryPartner,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
};
