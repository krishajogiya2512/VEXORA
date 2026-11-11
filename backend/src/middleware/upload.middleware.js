'use strict';

const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

// ----------------------------------------------------------------
// Allowed MIME types
// ----------------------------------------------------------------
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

// ----------------------------------------------------------------
// Storage configuration – files written to /backend/uploads
// ----------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },

  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    // Sanitise the original name to avoid path-traversal or special chars.
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueSuffix}-${safeName}`);
  },
});

// ----------------------------------------------------------------
// File filter – reject anything not in the allow-list
// ----------------------------------------------------------------
const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      `Unsupported file type: ${file.mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
    );
    error.code = 'LIMIT_UNEXPECTED_FILE';
    cb(error, false);
  }
};

// ----------------------------------------------------------------
// Size limit – configurable via UPLOAD_MAX_SIZE env var (bytes)
// ----------------------------------------------------------------
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const getMaxSize = () => {
  const envSize = parseInt(process.env.UPLOAD_MAX_SIZE, 10);
  return Number.isFinite(envSize) && envSize > 0 ? envSize : DEFAULT_MAX_SIZE;
};

// ----------------------------------------------------------------
// Multer instance factory (fresh limits per call so env changes apply)
// ----------------------------------------------------------------
const createUpload = () =>
  multer({
    storage,
    fileFilter,
    limits: { fileSize: getMaxSize() },
  });

// ----------------------------------------------------------------
// Exported helpers
// ----------------------------------------------------------------

/**
 * uploadSingle – Middleware for uploading a single file.
 *
 * @param {string} fieldName – Name of the form field that carries the file.
 * @returns {Function} Express middleware.
 */
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const upload = createUpload().single(fieldName);

    upload(req, res, (err) => {
      if (err) {
        return next(err);
      }
      next();
    });
  };
};

/**
 * uploadMultiple – Middleware for uploading multiple files.
 *
 * @param {string}  fieldName – Name of the form field that carries the files.
 * @param {number}  [maxCount=5] – Maximum number of files allowed.
 * @returns {Function} Express middleware.
 */
const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const upload = createUpload().array(fieldName, maxCount);

    upload(req, res, (err) => {
      if (err) {
        return next(err);
      }
      next();
    });
  };
};

module.exports = { uploadSingle, uploadMultiple };
