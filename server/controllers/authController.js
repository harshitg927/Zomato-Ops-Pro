const User = require("../models/User");
const { generateToken } = require("../utils/jwt");

/**
 * Authentication Controller
 * Handles all authentication-related operations
 */

/**
 * Register new user
 */
const register = async (req, res) => {
  try {
    const { username, email, password, role, estimatedDeliveryTime } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email or username already exists",
      });
    }

    // Create new user
    const userData = { username, email, password, role };
    if (role === "delivery_partner" && estimatedDeliveryTime) {
      userData.estimatedDeliveryTime = estimatedDeliveryTime;
    }

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Invalid credentials");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log("Invalid password");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    res.json({
      user: req.user,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ["username", "estimatedDeliveryTime"];
    const updates = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error during profile update" });
  }
};

/**
 * Get all delivery partners (Manager only)
 */
const getDeliveryPartners = async (req, res) => {
  try {
    const deliveryPartners = await User.find({
      role: "delivery_partner",
    }).select("-password");

    res.json({
      deliveryPartners,
    });
  } catch (error) {
    console.error("Fetch delivery partners error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Refresh JWT token
 */
const refreshToken = async (req, res) => {
  try {
    // This would typically use a refresh token stored in the database
    // For now, we'll generate a new token for the authenticated user
    const token = generateToken(req.user._id);

    res.json({
      message: "Token refreshed successfully",
      token,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ message: "Server error during token refresh" });
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    // In a more complete implementation, you might invalidate the token
    // by adding it to a blacklist or removing it from a whitelist
    res.json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
};

/**
 * Create new delivery partner (Manager only)
 */
const createDeliveryPartner = async (req, res) => {
  try {
    const { username, email, password, estimatedDeliveryTime } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email or username already exists",
      });
    }

    // Create new delivery partner
    const userData = {
      username,
      email,
      password,
      role: "delivery_partner",
      estimatedDeliveryTime: estimatedDeliveryTime || 30,
    };

    const deliveryPartner = new User(userData);
    await deliveryPartner.save();

    // Emit real-time update
    req.io.emit("deliveryPartnerCreated", deliveryPartner);

    res.status(201).json({
      message: "Delivery partner created successfully",
      deliveryPartner,
    });
  } catch (error) {
    console.error("Create delivery partner error:", error);
    res.status(500).json({ message: "Server error during partner creation" });
  }
};

/**
 * Delete delivery partner (Manager only)
 */
const deleteDeliveryPartner = async (req, res) => {
  try {
    const { partnerId } = req.params;

    // Find the delivery partner
    const deliveryPartner = await User.findById(partnerId);
    if (!deliveryPartner) {
      return res.status(404).json({ message: "Delivery partner not found" });
    }

    // Check if the user is actually a delivery partner
    if (deliveryPartner.role !== "delivery_partner") {
      return res
        .status(400)
        .json({ message: "User is not a delivery partner" });
    }

    // Check if partner has active orders
    if (deliveryPartner.currentOrder) {
      return res.status(400).json({
        message:
          "Cannot delete partner with active orders. Please reassign or complete current orders first.",
      });
    }

    // Delete the partner
    await User.findByIdAndDelete(partnerId);

    // Emit real-time update
    req.io.emit("deliveryPartnerDeleted", { partnerId });

    res.json({
      message: "Delivery partner deleted successfully",
    });
  } catch (error) {
    console.error("Delete delivery partner error:", error);
    res.status(500).json({ message: "Server error during partner deletion" });
  }
};

/**
 * Update delivery partner (Manager only)
 */
const updateDeliveryPartner = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { username, estimatedDeliveryTime, isAvailable } = req.body;

    // Find the delivery partner
    const deliveryPartner = await User.findById(partnerId);
    if (!deliveryPartner) {
      return res.status(404).json({ message: "Delivery partner not found" });
    }

    // Check if the user is actually a delivery partner
    if (deliveryPartner.role !== "delivery_partner") {
      return res
        .status(400)
        .json({ message: "User is not a delivery partner" });
    }

    // Update allowed fields
    const updates = {};
    if (username !== undefined) updates.username = username;
    if (estimatedDeliveryTime !== undefined)
      updates.estimatedDeliveryTime = estimatedDeliveryTime;
    if (isAvailable !== undefined) updates.isAvailable = isAvailable;

    const updatedPartner = await User.findByIdAndUpdate(partnerId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    // Emit real-time updates
    req.io.emit("deliveryPartnerUpdated", updatedPartner);

    // If availability changed, emit specific availability change event
    if (
      isAvailable !== undefined &&
      isAvailable !== deliveryPartner.isAvailable
    ) {
      req.io.emit("deliveryPartnerAvailabilityChanged", {
        partnerId: updatedPartner._id,
        isAvailable: updatedPartner.isAvailable,
      });
    }

    res.json({
      message: "Delivery partner updated successfully",
      deliveryPartner: updatedPartner,
    });
  } catch (error) {
    console.error("Update delivery partner error:", error);
    res.status(500).json({ message: "Server error during partner update" });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getDeliveryPartners,
  refreshToken,
  logout,
  createDeliveryPartner,
  deleteDeliveryPartner,
  updateDeliveryPartner,
};
