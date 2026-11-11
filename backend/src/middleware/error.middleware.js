'use strict';

/**
 * notFound – Catch-all for routes that don't match any handler.
 *
 * Mount this AFTER all route definitions but BEFORE `errorHandler`.
 */
const notFound = (req, res, _next) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * errorHandler – Global Express error handler.
 *
 * Normalises a wide range of error types into the consistent
 * `{ success, message, errors }` response shape.
 *
 * In development mode the full stack trace is included for debugging.
 */
// eslint-disable-next-line no-unused-vars -- Express requires the 4-param signature.
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors = [];

  // -----------------------------------------------------------
  // Mongoose ValidationError
  // -----------------------------------------------------------
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // -----------------------------------------------------------
  // Mongoose CastError (e.g. invalid ObjectId)
  // -----------------------------------------------------------
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
    errors = [{ field: err.path, message: `Invalid value for ${err.path}` }];
  }

  // -----------------------------------------------------------
  // MongoDB duplicate-key error (code 11000)
  // -----------------------------------------------------------
  if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyPattern || {})[0] || 'unknown';
    const duplicateValue = err.keyValue
      ? err.keyValue[duplicateField]
      : 'unknown';
    message = `Duplicate value for field: ${duplicateField}`;
    errors = [
      {
        field: duplicateField,
        message: `The value '${duplicateValue}' already exists for '${duplicateField}'.`,
      },
    ];
  }

  // -----------------------------------------------------------
  // JWT errors
  // -----------------------------------------------------------
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please authenticate again.';
    errors = [{ message: 'Token verification failed' }];
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired. Please log in again.';
    errors = [{ message: 'Token expired', expiredAt: err.expiredAt }];
  }

  // -----------------------------------------------------------
  // Multer errors
  // -----------------------------------------------------------
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File is too large. Please upload a smaller file.';
    errors = [
      {
        field: err.field || 'file',
        message: `File exceeds the maximum allowed size.`,
      },
    ];
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field.';
    errors = [
      {
        field: err.field || 'file',
        message: `Unexpected file upload field: '${err.field}'.`,
      },
    ];
  }

  // -----------------------------------------------------------
  // Build response
  // -----------------------------------------------------------
  const response = {
    success: false,
    message,
    errors: errors.length > 0 ? errors : [{ message }],
  };

  // Include stack trace in development for easier debugging.
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  // Log server errors for observability (never log to the response in prod).
  if (statusCode >= 500) {
    console.error(`[ERROR] ${err.message}`, err.stack);
  }

  return res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };
