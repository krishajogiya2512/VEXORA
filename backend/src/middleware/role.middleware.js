'use strict';

/**
 * authorize – Role-based access control middleware.
 *
 * Accepts one or more role strings and returns middleware that verifies
 * the authenticated user (`req.user`) holds at least one of those roles.
 *
 * Must be used AFTER the `protect` middleware so that `req.user` exists.
 *
 * @param  {...string} roles – Allowed roles (e.g. 'admin', 'analyst', 'user').
 * @returns {Function} Express middleware.
 *
 * @example
 *   router.delete('/users/:id', protect, authorize('admin'), deleteUser);
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Guard: protect middleware must have run first.
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before authorization.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}.`,
      });
    }

    next();
  };
};

module.exports = { authorize };
