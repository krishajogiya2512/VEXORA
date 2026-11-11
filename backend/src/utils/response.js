/**
 * Send a standardized success response.
 * @param {import('express').Response} res - Express response object
 * @param {string} message - Human-readable success message
 * @param {*} data - Response payload
 * @param {number} [statusCode=200] - HTTP status code
 */
const successResponse = (res, message, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send a standardized error response.
 * @param {import('express').Response} res - Express response object
 * @param {string} message - Human-readable error message
 * @param {number} [statusCode=500] - HTTP status code
 * @param {*} [errors=null] - Detailed error information
 */
const errorResponse = (res, message, statusCode = 500, errors = null) => {
  const body = {
    success: false,
    message,
  };

  if (errors !== null) {
    body.errors = errors;
  }

  return res.status(statusCode).json(body);
};

/**
 * Send a standardized paginated response.
 * @param {import('express').Response} res - Express response object
 * @param {string} message - Human-readable success message
 * @param {*} data - Response payload (array of items)
 * @param {object} pagination - Pagination metadata (page, limit, total, totalPages)
 */
const paginatedResponse = (res, message, data, pagination) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};
