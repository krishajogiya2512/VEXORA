const DetectionService = require('../services/detection.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const detectionService = new DetectionService();

/**
 * @desc    Analyze a social media profile
 * @route   POST /api/detection/analyze
 * @access  Private (ADMIN, ANALYST)
 */
const analyzeProfile = async (req, res, next) => {
  try {
    const { profileId } = req.body;

    if (!profileId) {
      return errorResponse(res, 'profileId is required', 400);
    }

    const result = await detectionService.analyzeProfile(profileId, req.user.id);

    return successResponse(res, 'Profile analyzed successfully', result, 201);
  } catch (error) {
    if (error.message === 'Profile not found') {
      return errorResponse(res, 'Profile not found', 404);
    }
    next(error);
  }
};

/**
 * @desc    Get all detection records with pagination
 * @route   GET /api/detection
 * @access  Private
 */
const getDetections = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { riskLevel, detectionMethod, startDate, endDate } = req.query;

    const query = {};
    if (riskLevel) query.riskLevel = riskLevel.toUpperCase();
    if (detectionMethod) query.detectionMethod = detectionMethod;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const result = await detectionService.getDetections(query, page, limit);

    return paginatedResponse(res, 'Detections retrieved successfully', result.detections, result.pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detection statistics
 * @route   GET /api/detection/statistics
 * @access  Private
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await detectionService.getStatistics();
    return successResponse(res, 'Detection statistics retrieved', stats);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detection history
 * @route   GET /api/detection/history
 * @access  Private
 */
const getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Admins see all, others see their own
    const userId = req.user.role === 'ADMIN' ? null : req.user.id;
    const result = await detectionService.getHistory(userId, page, limit);

    return paginatedResponse(res, 'Detection history retrieved', result.detections, result.pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single detection result
 * @route   GET /api/detection/:id
 * @access  Private
 */
const getDetection = async (req, res, next) => {
  try {
    const detection = await detectionService.getDetectionById(req.params.id);

    if (!detection) {
      return errorResponse(res, 'Detection not found', 404);
    }

    return successResponse(res, 'Detection retrieved successfully', { detection });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Batch analyze multiple profiles
 * @route   POST /api/detection/batch
 * @access  Private (ADMIN, ANALYST)
 */
const batchAnalyze = async (req, res, next) => {
  try {
    const { profileIds } = req.body;

    if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
      return errorResponse(res, 'profileIds must be a non-empty array', 400);
    }

    if (profileIds.length > 10) {
      return errorResponse(res, 'Maximum 10 profiles can be analyzed at once', 400);
    }

    const results = await detectionService.batchAnalyze(profileIds, req.user.id);

    return successResponse(res, `Batch analysis completed. ${results.successful} of ${results.total} profiles analyzed.`, results, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeProfile,
  getDetections,
  getDetection,
  getStatistics,
  getHistory,
  batchAnalyze,
};
