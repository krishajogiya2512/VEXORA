'use strict';

const express = require('express');
const router = express.Router();
const { analyzeProfile, getDetections, getDetection, getStatistics, getHistory, batchAnalyze } = require('../controllers/detection.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

// POST /api/detection/analyze
router.post('/analyze', authorize('ADMIN', 'ANALYST'), analyzeProfile);
// POST /api/detection/batch
router.post('/batch', authorize('ADMIN', 'ANALYST'), batchAnalyze);
// GET  /api/detection/statistics
router.get('/statistics', getStatistics);
// GET  /api/detection/history
router.get('/history', getHistory);
// GET  /api/detection
router.get('/', getDetections);
// GET  /api/detection/:id
router.get('/:id', getDetection);

module.exports = router;
