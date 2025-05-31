const { body, validationResult } = require("express-validator");

/**
 * Validation Middleware
 * Centralized input validation for all endpoints
 */
class ValidationMiddleware {
  /**
   * Handle validation errors
   */
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }

  /**
   * User registration validation
   */
  static validateUserRegistration = [
    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["manager", "delivery_partner"])
      .withMessage("Role must be manager or delivery_partner"),
    body("estimatedDeliveryTime")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Estimated delivery time must be a positive number"),
    ValidationMiddleware.handleValidationErrors,
  ];

  /**
   * User login validation
   */
  static validateUserLogin = [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
    ValidationMiddleware.handleValidationErrors,
  ];

  /**
   * User profile update validation
   */
  static validateProfileUpdate = [
    body("username")
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("estimatedDeliveryTime")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Estimated delivery time must be a positive number"),
    ValidationMiddleware.handleValidationErrors,
  ];

  /**
   * Order creation validation
   */
  static validateOrderCreation = [
    body("items")
      .isArray({ min: 1 })
      .withMessage("Items array is required and must not be empty"),
    body("items.*.name").notEmpty().withMessage("Item name is required"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Item quantity must be a positive integer"),
    body("items.*.price")
      .isFloat({ min: 0 })
      .withMessage("Item price must be a positive number"),
    body("prepTime")
      .isInt({ min: 1 })
      .withMessage("Prep time must be a positive integer"),
    body("customerInfo.name")
      .notEmpty()
      .withMessage("Customer name is required"),
    body("customerInfo.phone")
      .notEmpty()
      .withMessage("Customer phone is required"),
    body("customerInfo.address")
      .notEmpty()
      .withMessage("Customer address is required"),
    ValidationMiddleware.handleValidationErrors,
  ];

  /**
   * Order update validation
   */
  static validateOrderUpdate = [
    body("items")
      .optional()
      .isArray({ min: 1 })
      .withMessage("Items must be a non-empty array"),
    body("items.*.name")
      .optional()
      .notEmpty()
      .withMessage("Item name is required"),
    body("items.*.quantity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Item quantity must be a positive integer"),
    body("items.*.price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Item price must be a positive number"),
    body("prepTime")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Prep time must be a positive integer"),
    body("customerInfo.name")
      .optional()
      .notEmpty()
      .withMessage("Customer name is required"),
    body("customerInfo.phone")
      .optional()
      .notEmpty()
      .withMessage("Customer phone is required"),
    body("customerInfo.address")
      .optional()
      .notEmpty()
      .withMessage("Customer address is required"),
    ValidationMiddleware.handleValidationErrors,
  ];

  /**
   * Delivery partner assignment validation
   */
  static validateDeliveryPartnerAssignment = [
    body("deliveryPartnerId")
      .notEmpty()
      .withMessage("Delivery partner ID is required"),
    ValidationMiddleware.handleValidationErrors,
  ];

  /**
   * Order status update validation
   */
  static validateOrderStatusUpdate = [
    body("status")
      .isIn(["PREP", "PICKED", "ON_ROUTE", "DELIVERED"])
      .withMessage("Invalid status"),
    ValidationMiddleware.handleValidationErrors,
  ];

  /**
   * Availability update validation
   */
  static validateAvailabilityUpdate = [
    body("isAvailable").isBoolean().withMessage("Availability must be boolean"),
    ValidationMiddleware.handleValidationErrors,
  ];

  /**
   * Estimated delivery time update validation
   */
  static validateEstimatedDeliveryTimeUpdate = [
    body("estimatedDeliveryTime")
      .isInt({ min: 1 })
      .withMessage("Estimated delivery time must be a positive integer"),
    ValidationMiddleware.handleValidationErrors,
  ];
}

module.exports = ValidationMiddleware;
