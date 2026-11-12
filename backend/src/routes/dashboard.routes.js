'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { successResponse } = require('../utils/response');
const Detection = require('../models/Detection');
const Profile = require('../models/Profile');
const Report = require('../models/Report');

router.use(protect);

// GET /api/dashboard/overview
router.get('/overview', async (req, res, next) => {
  try {
    const [
      totalProfiles, totalDetections, totalReports,
      byRiskLevel, byPlatform, pendingCases, underReviewCases,
      recentDetections, recentReports, reportStats,
    ] = await Promise.all([
      Profile.countDocuments(),
      Detection.countDocuments(),
      Report.countDocuments(),
      Detection.aggregate([{ $group: { _id: '$riskLevel', count: { $sum: 1 } } }]),
      Profile.aggregate([{ $group: { _id: '$platform', count: { $sum: 1 } } }]),
      Report.countDocuments({ status: 'PENDING' }),
      Report.countDocuments({ status: 'UNDER_REVIEW' }),
      Detection.find().populate('profile', 'username platform').sort({ createdAt: -1 }).limit(5),
      Report.find().populate('profile', 'username platform').sort({ createdAt: -1 }).limit(5),
      Report.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    byRiskLevel.forEach(r => { riskCounts[r._id] = r.count; });

    const platformCounts = {};
    byPlatform.forEach(p => { platformCounts[p._id] = p.count; });

    const reportStatusCounts = {};
    reportStats.forEach(r => { reportStatusCounts[r._id] = r.count; });

    const suspicious = (riskCounts.HIGH || 0) + (riskCounts.CRITICAL || 0);

    // 30-day trend
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activityTrend = await Detection.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, detections: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    return successResponse(res, 'Dashboard overview retrieved', {
      stats: {
        totalProfiles,
        totalDetections,
        totalReports,
        suspicious,
        pendingCases,
        underReviewCases,
        riskDistribution: riskCounts,
        platformDistribution: platformCounts,
        reportStatusDistribution: reportStatusCounts,
      },
      charts: {
        riskDistribution: [
          { name: 'Low Risk', value: riskCounts.LOW, color: '#22C55E' },
          { name: 'Medium Risk', value: riskCounts.MEDIUM, color: '#F59E0B' },
          { name: 'High Risk', value: riskCounts.HIGH, color: '#EF4444' },
          { name: 'Critical Risk', value: riskCounts.CRITICAL, color: '#7C3AED' },
        ],
        platformDistribution: Object.entries(platformCounts).map(([name, value]) => ({ name, value })),
        activityTrend,
      },
      recent: {
        detections: recentDetections,
        reports: recentReports,
      },
    });
  } catch (error) { next(error); }
});

module.exports = router;
