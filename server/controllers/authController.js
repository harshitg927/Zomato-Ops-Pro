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

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getDeliveryPartners,
  refreshToken,
  logout,
};
