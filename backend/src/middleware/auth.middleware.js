'use strict';

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

/**
 * Resolve the User model lazily to avoid circular-dependency issues
 * that can arise when models and middleware are loaded in different orders.
 */
const getUserModel = () => mongoose.model('User');

/**
 * protect – Requires a valid JWT in the Authorization header.
 *
 * Flow:
 *  1. Extract the Bearer token from the Authorization header.
 *  2. Verify and decode the token with JWT_SECRET.
 *  3. Load the corresponding user (excluding the password hash).
 *  4. Confirm the user account is still active.
 *  5. Attach the user document to `req.user`.
 *
 * On any failure the request is rejected with 401.
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find user (exclude password)
    const User = getUserModel();
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user associated with this token no longer exists.',
      });
    }

    // 4. Check active status
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'This account has been deactivated. Please contact support.',
      });
    }

    // 5. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    // Let JWT-specific errors bubble to the global error handler
    // so they are formatted consistently.
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      return next(error);
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Invalid or expired token.',
    });
  }
};

/**
 * optionalAuth – Behaves like `protect` but never rejects the request.
 *
 * If a valid token is present the user is attached to `req.user`;
 * otherwise `req.user` is set to `null` and the request proceeds.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const User = getUserModel();
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch (_error) {
    // Silently fall through – optional auth should never block.
    req.user = null;
    next();
  }
};

module.exports = { protect, optionalAuth };
