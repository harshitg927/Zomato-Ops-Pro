const jwt = require("jsonwebtoken");

/**
 * JWT Utility Functions
 */

/**
 * Generate JWT token for a user
 * @param {string} userId - User ID to include in token
 * @param {Object} options - Additional options for token generation
 * @returns {string} JWT token
 */
const generateToken = (userId, options = {}) => {
  const defaultOptions = {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  };

  const tokenOptions = { ...defaultOptions, ...options };

  return jwt.sign({ userId }, process.env.JWT_SECRET, tokenOptions);
};

/**
 * Generate refresh token for a user
 * @param {string} userId - User ID to include in token
 * @returns {string} Refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @param {boolean} isRefreshToken - Whether this is a refresh token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token, isRefreshToken = false) => {
  const secret = isRefreshToken
    ? process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    : process.env.JWT_SECRET;

  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
};
