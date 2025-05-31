const Order = require("../models/Order");
const User = require("../models/User");

/**
 * Delivery Controller
 * Handles all delivery-related operations
 */

/**
 * Get delivery partner's current assigned order
 */
const getCurrentOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      deliveryPartner: req.user._id,
      status: { $in: ["PREP", "PICKED", "ON_ROUTE"] },
    })
      .populate("createdBy", "username email")
      .populate("statusHistory.updatedBy", "username");

    if (!order) {
      return res.json({
        message: "No current order assigned",
        order: null,
      });
    }

    const mappedOrder = {
      _id: order._id,
      orderId: order.orderId,
      items: order.items,
      prepTime: order.prepTime,
      status: mapStatusToFrontend(order.status),
      deliveryPartner: order.deliveryPartner,
      dispatchTime: order.dispatchTime,
      customerInfo: order.customerInfo,
      totalAmount: order.totalAmount,
      statusHistory: order.statusHistory.map((history) => ({
        ...history,
        status: mapStatusToFrontend(history.status),
      })),
      createdBy: order.createdBy,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    res.json({ order: mappedOrder });
  } catch (error) {
    console.error("Fetch current order error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to map backend status to frontend status
const mapStatusToFrontend = (backendStatus) => {
  const statusMap = {
    PREP: "PREPARING",
    PICKED: "READY",
    ON_ROUTE: "OUT_FOR_DELIVERY",
    DELIVERED: "DELIVERED",
  };
  return statusMap[backendStatus] || backendStatus;
};

// Helper function to map frontend status to backend status
const mapStatusToBackend = (frontendStatus) => {
  const statusMap = {
    PREPARING: "PREP",
    READY: "PICKED",
    OUT_FOR_DELIVERY: "ON_ROUTE",
    DELIVERED: "DELIVERED",
  };
  return statusMap[frontendStatus] || frontendStatus;
};

/**
 * Get delivery partner's order history
 */
const getOrderHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { deliveryPartner: req.user._id };

    if (status) {
      // Map frontend status to backend status for query
      query.status = mapStatusToBackend(status);
    }

    const orders = await Order.find(query)
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    // Map the orders data to match frontend expectations
    const mappedOrders = orders.map((order) => ({
      _id: order._id,
      orderId: order.orderId,
      items: order.items,
      prepTime: order.prepTime,
      status: mapStatusToFrontend(order.status),
      deliveryPartner: order.deliveryPartner,
      dispatchTime: order.dispatchTime,
      customerInfo: order.customerInfo,
      totalAmount: order.totalAmount,
      statusHistory: order.statusHistory.map((history) => ({
        ...history,
        status: mapStatusToFrontend(history.status),
      })),
      createdBy: order.createdBy,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    res.json({
      orders: mappedOrders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Fetch order history error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update delivery partner availability
 */
const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    // Check if delivery partner has active orders
    if (!isAvailable) {
      const activeOrder = await Order.findOne({
        deliveryPartner: req.user._id,
        status: { $in: ["PREP", "PICKED", "ON_ROUTE"] },
      });

      if (activeOrder) {
        return res.status(400).json({
          message: "Cannot mark unavailable while having active orders",
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isAvailable },
      { new: true }
    );

    // Emit real-time update
    req.io.emit("deliveryPartnerAvailabilityChanged", {
      partnerId: user._id,
      isAvailable: user.isAvailable,
    });

    res.json({
      message: "Availability updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update availability error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update estimated delivery time
 */
const updateEstimatedDeliveryTime = async (req, res) => {
  try {
    const { estimatedDeliveryTime } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { estimatedDeliveryTime },
      { new: true }
    );

    // Update dispatch time for current order if exists
    const currentOrder = await Order.findOne({
      deliveryPartner: req.user._id,
      status: { $in: ["PREP", "PICKED"] },
    });

    if (currentOrder) {
      currentOrder.dispatchTime = currentOrder.prepTime + estimatedDeliveryTime;
      await currentOrder.save();

      // Emit real-time update
      req.io.emit("orderUpdated", currentOrder);
    }

    res.json({
      message: "Estimated delivery time updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update ETA error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get delivery partner stats
 */
const getStats = async (req, res) => {
  try {
    const partnerId = req.user._id;

    // Get total orders delivered
    const totalDelivered = await Order.countDocuments({
      deliveryPartner: partnerId,
      status: "DELIVERED",
    });

    // Get orders in progress
    const inProgress = await Order.countDocuments({
      deliveryPartner: partnerId,
      status: { $in: ["PREP", "PICKED", "ON_ROUTE"] },
    });

    // Get today's deliveries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDeliveries = await Order.countDocuments({
      deliveryPartner: partnerId,
      status: "DELIVERED",
      updatedAt: { $gte: today, $lt: tomorrow },
    });

    // Get this week's deliveries
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const weekDeliveries = await Order.countDocuments({
      deliveryPartner: partnerId,
      status: "DELIVERED",
      updatedAt: { $gte: weekStart },
    });

    // Average delivery time (from PICKED to DELIVERED)
    const deliveredOrders = await Order.find({
      deliveryPartner: partnerId,
      status: "DELIVERED",
    }).select("statusHistory");

    let totalDeliveryTime = 0;
    let validDeliveries = 0;

    deliveredOrders.forEach((order) => {
      const pickedTime = order.statusHistory.find(
        (h) => h.status === "PICKED"
      )?.timestamp;
      const deliveredTime = order.statusHistory.find(
        (h) => h.status === "DELIVERED"
      )?.timestamp;

      if (pickedTime && deliveredTime) {
        totalDeliveryTime += (deliveredTime - pickedTime) / (1000 * 60); // Convert to minutes
        validDeliveries++;
      }
    });

    const avgDeliveryTime =
      validDeliveries > 0 ? Math.round(totalDeliveryTime / validDeliveries) : 0;

    res.json({
      stats: {
        totalDeliveries: totalDelivered,
        completedToday: todayDeliveries,
        inProgress,
        weekDeliveries,
        averageRating:
          avgDeliveryTime > 0
            ? (5 - Math.min(avgDeliveryTime / 30, 4)).toFixed(1)
            : 4.5, // Mock rating based on delivery time
        avgDeliveryTime: `${avgDeliveryTime} minutes`,
        isAvailable: req.user.isAvailable,
        estimatedDeliveryTime: req.user.estimatedDeliveryTime,
      },
    });
  } catch (error) {
    console.error("Fetch stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get all available delivery partners (for managers)
 */
const getAvailablePartners = async (req, res) => {
  try {
    const availablePartners = await User.find({
      role: "delivery_partner",
      isAvailable: true,
      currentOrder: null,
    }).select("-password");

    res.json({ partners: availablePartners });
  } catch (error) {
    console.error("Fetch available partners error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get delivery partner workload summary (for managers)
 */
const getWorkloadSummary = async (req, res) => {
  try {
    const partners = await User.find({ role: "delivery_partner" })
      .populate("currentOrder", "orderId status")
      .select("-password");

    const workloadSummary = await Promise.all(
      partners.map(async (partner) => {
        // Get active orders count
        const activeOrders = await Order.countDocuments({
          deliveryPartner: partner._id,
          status: { $in: ["PREP", "PICKED", "ON_ROUTE"] },
        });

        // Get today's completed deliveries
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayCompleted = await Order.countDocuments({
          deliveryPartner: partner._id,
          status: "DELIVERED",
          updatedAt: { $gte: today, $lt: tomorrow },
        });

        return {
          partnerId: partner._id,
          username: partner.username,
          email: partner.email,
          isAvailable: partner.isAvailable,
          estimatedDeliveryTime: partner.estimatedDeliveryTime,
          currentOrder: partner.currentOrder,
          activeOrders,
          todayCompleted,
        };
      })
    );

    res.json({ workload: workloadSummary });
  } catch (error) {
    console.error("Fetch workload error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getCurrentOrder,
  getOrderHistory,
  updateAvailability,
  updateEstimatedDeliveryTime,
  getStats,
  getAvailablePartners,
  getWorkloadSummary,
};
