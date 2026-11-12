'use strict';

/**
 * authorize – Role-based access control middleware factory.
 * @param {...string} roles - Allowed roles (e.g., 'ADMIN', 'ANALYST')
 * @returns {import('express').RequestHandler}
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = { authorize };
