const ReportService = require('../services/report.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const reportService = new ReportService();

/**
 * @desc    Submit a new report
 * @route   POST /api/reports
 * @access  Private (ADMIN, ANALYST)
 */
const createReport = async (req, res, next) => {
  try {
    const report = await reportService.createReport(req.body, req.user.id);
    return successResponse(res, 'Report submitted successfully', { report }, 201);
  } catch (error) {
    if (error.message.includes('not found')) {
      return errorResponse(res, error.message, 404);
    }
    next(error);
  }
};

/**
 * @desc    Get all reports with filtering
 * @route   GET /api/reports
 * @access  Private
 */
const getReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { status, severity, startDate, endDate } = req.query;

    const query = {};
    if (status) query.status = status.toUpperCase();
    if (severity) query.severity = severity.toUpperCase();
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Viewers see only their submitted reports
    if (req.user.role === 'VIEWER') {
      query.submittedBy = req.user.id;
    }

    const result = await reportService.getReports(query, page, limit);

    return paginatedResponse(res, 'Reports retrieved successfully', result.reports, result.pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single report
 * @route   GET /api/reports/:id
 * @access  Private
 */
const getReport = async (req, res, next) => {
  try {
    const report = await reportService.getReportById(req.params.id);

    if (!report) {
      return errorResponse(res, 'Report not found', 404);
    }

    return successResponse(res, 'Report retrieved successfully', { report });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update report status
 * @route   PUT /api/reports/:id/status
 * @access  Private (ADMIN, ANALYST)
 */
const updateReportStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;

    if (!status) {
      return errorResponse(res, 'Status is required', 400);
    }

    const validStatuses = [
      'PENDING', 'UNDER_REVIEW', 'VERIFIED_SUSPICIOUS',
      'INSUFFICIENT_EVIDENCE', 'ESCALATED', 'CLOSED',
    ];

    if (!validStatuses.includes(status.toUpperCase())) {
      return errorResponse(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const report = await reportService.updateReportStatus(
      req.params.id,
      status.toUpperCase(),
      req.user.id,
      reason
    );

    if (!report) {
      return errorResponse(res, 'Report not found', 404);
    }

    return successResponse(res, 'Report status updated successfully', { report });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add analyst note to report
 * @route   POST /api/reports/:id/notes
 * @access  Private (ADMIN, ANALYST)
 */
const addNote = async (req, res, next) => {
  try {
    const { note } = req.body;

    if (!note || note.trim().length < 5) {
      return errorResponse(res, 'Note must be at least 5 characters long', 400);
    }

    const report = await reportService.addAnalystNote(
      req.params.id,
      note,
      req.user.id
    );

    if (!report) {
      return errorResponse(res, 'Report not found', 404);
    }

    return successResponse(res, 'Note added successfully', { report });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get report statistics
 * @route   GET /api/reports/statistics
 * @access  Private (ADMIN, ANALYST)
 */
const getReportStatistics = async (req, res, next) => {
  try {
    const stats = await reportService.getReportStatistics();
    return successResponse(res, 'Report statistics retrieved', stats);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export report
 * @route   GET /api/reports/:id/export
 * @access  Private (ADMIN, ANALYST)
 */
const exportReport = async (req, res, next) => {
  try {
    const format = req.query.format || 'json';

    if (!['json', 'pdf'].includes(format)) {
      return errorResponse(res, 'Format must be "json" or "pdf"', 400);
    }

    const result = await reportService.exportReport(req.params.id, format);

    if (!result) {
      return errorResponse(res, 'Report not found', 404);
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=report-${result.caseId}.json`);
      return res.json(result);
    }

    // PDF format - return structured data with download note
    return successResponse(res, 'Report exported', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getReports,
  getReport,
  updateReportStatus,
  addNote,
  getReportStatistics,
  exportReport,
};
