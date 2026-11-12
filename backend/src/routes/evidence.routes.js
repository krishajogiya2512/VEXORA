'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Evidence = require('../models/Evidence');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const multer = require('multer');

// Multer config
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed'), false);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024 } });

router.use(protect);

// POST /api/evidence (upload)
router.post('/', authorize('ADMIN', 'ANALYST'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'File is required', 400);

    const { description, profileId, detectionId, reportId, evidenceType } = req.body;
    if (!description || description.length < 10) return errorResponse(res, 'Description must be at least 10 characters', 400);

    const evidence = await Evidence.create({
      uploadedBy: req.user.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      description,
      evidenceType: evidenceType || 'other',
      profile: profileId || undefined,
      detection: detectionId || undefined,
      report: reportId || undefined,
    });

    return successResponse(res, 'Evidence uploaded successfully', { evidence }, 201);
  } catch (error) { next(error); }
});

// GET /api/evidence
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const query = {};
    if (req.query.profileId) query.profile = req.query.profileId;
    if (req.query.detectionId) query.detection = req.query.detectionId;
    if (req.query.reportId) query.report = req.query.reportId;

    const [evidence, total] = await Promise.all([
      Evidence.find(query).populate('uploadedBy', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Evidence.countDocuments(query),
    ]);
    return paginatedResponse(res, 'Evidence retrieved', evidence, { page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
});

// GET /api/evidence/:id
router.get('/:id', async (req, res, next) => {
  try {
    const evidence = await Evidence.findById(req.params.id).populate('uploadedBy', 'name email');
    if (!evidence) return errorResponse(res, 'Evidence not found', 404);
    return successResponse(res, 'Evidence retrieved', { evidence });
  } catch (error) { next(error); }
});

// DELETE /api/evidence/:id
router.delete('/:id', authorize('ADMIN', 'ANALYST'), async (req, res, next) => {
  try {
    const evidence = await Evidence.findById(req.params.id);
    if (!evidence) return errorResponse(res, 'Evidence not found', 404);

    // Only uploader or admin can delete
    if (evidence.uploadedBy.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Not authorized to delete this evidence', 403);
    }

    // Remove file from disk
    if (fs.existsSync(evidence.filePath)) fs.unlinkSync(evidence.filePath);
    await Evidence.findByIdAndDelete(req.params.id);

    return successResponse(res, 'Evidence deleted successfully');
  } catch (error) { next(error); }
});

module.exports = router;
