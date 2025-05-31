/**
 * Role-based Authorization Middleware
 * Provides middleware functions for different role-based access control
 */

/**
 * Generic role authorization middleware
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

/**
 * Manager role middleware
 */
const requireManager = authorize("manager");

/**
 * Delivery partner role middleware
 */
const requireDeliveryPartner = authorize("delivery_partner");

/**
 * Manager or delivery partner role middleware
 */
const requireManagerOrDelivery = authorize("manager", "delivery_partner");

/**
 * Check if user is the same as the resource owner or has manager role
 * Useful for endpoints where users can access their own data or managers can access any data
 */
const requireOwnershipOrManager = (userIdField = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    const isOwner = req.user._id.toString() === resourceUserId;
    const isManager = req.user.role === "manager";

    if (!isOwner && !isManager) {
      return res.status(403).json({
        message:
          "Access denied. You can only access your own resources or need manager privileges",
      });
    }

    next();
  };
};

module.exports = {
  authorize,
  requireManager,
  requireDeliveryPartner,
  requireManagerOrDelivery,
  requireOwnershipOrManager,
};
