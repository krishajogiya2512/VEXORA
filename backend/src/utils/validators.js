const { body, validationResult } = require('express-validator');

/**
 * Validation chain for user registration.
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),

  body('role')
    .optional()
    .isIn(['ADMIN', 'ANALYST', 'VIEWER'])
    .withMessage('Role must be one of ADMIN, ANALYST, or VIEWER'),
];

/**
 * Validation chain for user login.
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Validation chain for social media profile submission.
 */
const profileValidation = [
  body('platform')
    .trim()
    .notEmpty()
    .withMessage('Platform is required')
    .isIn(['instagram', 'facebook', 'twitter', 'other'])
    .withMessage('Platform must be one of instagram, facebook, twitter, or other'),

  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters'),

  body('displayName')
    .optional()
    .trim(),

  body('profileUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Profile URL must be a valid URL'),

  body('followersCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Followers count must be a non-negative integer')
    .toInt(),

  body('followingCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Following count must be a non-negative integer')
    .toInt(),

  body('postsCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Posts count must be a non-negative integer')
    .toInt(),

  body('bio')
    .optional()
    .trim(),

  body('hasProfilePicture')
    .optional()
    .isBoolean()
    .withMessage('hasProfilePicture must be a boolean value')
    .toBoolean(),

  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('isVerified must be a boolean value')
    .toBoolean(),
];

/**
 * Validation chain for initiating a detection analysis.
 */
const detectionValidation = [
  body('profileId')
    .notEmpty()
    .withMessage('Profile ID is required')
    .isMongoId()
    .withMessage('Profile ID must be a valid MongoDB ObjectId'),
];

/**
 * Validation chain for creating a report.
 */
const reportValidation = [
  body('detectionId')
    .notEmpty()
    .withMessage('Detection ID is required')
    .isMongoId()
    .withMessage('Detection ID must be a valid MongoDB ObjectId'),

  body('profileId')
    .notEmpty()
    .withMessage('Profile ID is required')
    .isMongoId()
    .withMessage('Profile ID must be a valid MongoDB ObjectId'),

  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),

  body('severity')
    .trim()
    .notEmpty()
    .withMessage('Severity is required')
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Severity must be one of LOW, MEDIUM, HIGH, or CRITICAL'),
];

/**
 * Validation chain for uploading evidence.
 */
const evidenceValidation = [
  body('profileId')
    .optional()
    .isMongoId()
    .withMessage('Profile ID must be a valid MongoDB ObjectId'),

  body('detectionId')
    .optional()
    .isMongoId()
    .withMessage('Detection ID must be a valid MongoDB ObjectId'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
];

/**
 * Middleware that checks for validation errors produced by express-validator
 * chains. Returns a standardized error response if any validation errors exist,
 * otherwise passes control to the next middleware.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors,
    });
  }

  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  profileValidation,
  detectionValidation,
  reportValidation,
  evidenceValidation,
  validate,
};
