'use strict';

const express = require('express');
const router = express.Router();
const { createReport, getReports, getReport, updateReportStatus, addNote, getReportStatistics, exportReport } = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

// GET  /api/reports/statistics
router.get('/statistics', authorize('ADMIN', 'ANALYST'), getReportStatistics);
// POST /api/reports
router.post('/', authorize('ADMIN', 'ANALYST'), createReport);
// GET  /api/reports
router.get('/', getReports);
// GET  /api/reports/:id
router.get('/:id', getReport);
// GET  /api/reports/:id/export
router.get('/:id/export', authorize('ADMIN', 'ANALYST'), exportReport);
// PUT  /api/reports/:id/status
router.put('/:id/status', authorize('ADMIN', 'ANALYST'), updateReportStatus);
// POST /api/reports/:id/notes
router.post('/:id/notes', authorize('ADMIN', 'ANALYST'), addNote);

module.exports = router;
