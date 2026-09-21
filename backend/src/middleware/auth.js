/**
 * auth.js — JWT Authentication Middleware
 *
 * Verifies the JSON Web Token present in the Authorization header.
 * Attaches the decoded user payload (id, role) to req.user for use
 * in downstream route handlers.
 *
 * Usage:
 *   const { protect, adminOnly } = require('../middleware/auth');
 *   router.get('/protected', protect, handler);
 *   router.post('/admin-only', protect, adminOnly, handler);
 */

const jwt = require("jsonwebtoken");

/**
 * protect — Verifies JWT and attaches req.user.
 * Responds with 401 if token is missing or invalid.
 */
const protect = (req, res, next) => {
  // Extract the token from the Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify the token using the JWT_SECRET from environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded payload to the request object
    req.user = decoded; // { id, name, role, iat, exp }
    next();
  } catch (err) {
    // Handle specific JWT errors with meaningful messages
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please log in again.",
      });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

/**
 * adminOnly — Allows access only to users with role === 'admin'.
 * Must be used AFTER the protect middleware.
 * Responds with 403 if the authenticated user is not an admin.
 */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access forbidden. Admin privileges required.",
    });
  }
  next();
};

module.exports = { protect, adminOnly };
