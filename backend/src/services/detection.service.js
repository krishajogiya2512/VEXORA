'use strict';

const Profile = require('../models/Profile');
const Detection = require('../models/Detection');
const RiskScoreService = require('./riskScore.service');

const riskScorer = new RiskScoreService();

class DetectionService {
  /**
   * Analyze a profile and persist the detection result.
   */
  async analyzeProfile(profileId, userId) {
    const profile = await Profile.findById(profileId);
    if (!profile) throw new Error('Profile not found');

    // Rule-based scoring
    const analysis = riskScorer.analyzeProfile(profile);

    // Try ML service (graceful degradation)
    let mlPrediction = { available: false };
    if (process.env.ML_SERVICE_URL) {
      try {
        const http = require('http');
        const url = new URL('/predict', process.env.ML_SERVICE_URL);
        const payload = JSON.stringify({ profileId: profile._id.toString(), features: analysis.indicators });
        const result = await new Promise((resolve, reject) => {
          const options = {
            hostname: url.hostname,
            port: url.port || 80,
            path: url.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
          };
          const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(JSON.parse(data)));
          });
          req.on('error', reject);
          req.setTimeout(3000, () => { req.destroy(); reject(new Error('ML timeout')); });
          req.write(payload);
          req.end();
        });
        if (result && typeof result.score === 'number') {
          mlPrediction = { available: true, score: result.score, confidence: result.confidence || 0, modelVersion: result.version || '1.0' };
        }
      } catch (_) {
        // ML unavailable – rule-based only
      }
    }

    // If ML available, blend scores (70% rule-based, 30% ML)
    let finalScore = analysis.riskScore;
    let detectionMethod = 'rule_based';
    if (mlPrediction.available) {
      finalScore = Math.round(analysis.riskScore * 0.7 + mlPrediction.score * 0.3);
      detectionMethod = 'hybrid';
    }

    const riskLevel = this._classifyRisk(finalScore);

    const detection = await Detection.create({
      profile: profile._id,
      analyzedBy: userId,
      riskScore: finalScore,
      riskLevel,
      confidenceScore: analysis.confidenceScore,
      indicators: analysis.indicators,
      suspiciousPatterns: analysis.suspiciousPatterns,
      recommendation: analysis.recommendation,
      detectionMethod,
      mlPrediction,
      rawFeatures: { originalRuleScore: analysis.riskScore },
    });

    // Update profile status
    const statusMap = { LOW: 'analyzed', MEDIUM: 'analyzed', HIGH: 'flagged', CRITICAL: 'flagged' };
    await Profile.findByIdAndUpdate(profileId, { status: statusMap[riskLevel] || 'analyzed' });

    return {
      detectionId: detection._id,
      riskScore: finalScore,
      riskLevel,
      confidenceScore: analysis.confidenceScore,
      indicators: analysis.indicators,
      suspiciousPatterns: analysis.suspiciousPatterns,
      recommendation: analysis.recommendation,
      detectionMethod,
      mlPrediction,
      profile: { id: profile._id, username: profile.username, platform: profile.platform },
      analyzedAt: detection.createdAt,
    };
  }

  async getDetectionById(id) {
    return Detection.findById(id).populate('profile').populate('analyzedBy', 'name email');
  }

  async getDetections(query, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [detections, total] = await Promise.all([
      Detection.find(query).populate('profile', 'username platform').populate('analyzedBy', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Detection.countDocuments(query),
    ]);
    return { detections, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getStatistics() {
    const [byRisk, byMethod, total, avgScore, recentTrend] = await Promise.all([
      Detection.aggregate([{ $group: { _id: '$riskLevel', count: { $sum: 1 } } }]),
      Detection.aggregate([{ $group: { _id: '$detectionMethod', count: { $sum: 1 } } }]),
      Detection.countDocuments(),
      Detection.aggregate([{ $group: { _id: null, avg: { $avg: '$riskScore' } } }]),
      Detection.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    byRisk.forEach(r => { riskCounts[r._id] = r.count; });

    const methodCounts = {};
    byMethod.forEach(m => { methodCounts[m._id] = m.count; });

    return {
      total,
      averageRiskScore: avgScore[0]?.avg ? Math.round(avgScore[0].avg) : 0,
      byRiskLevel: riskCounts,
      byDetectionMethod: methodCounts,
      recentActivity: recentTrend,
      suspicious: (riskCounts.HIGH || 0) + (riskCounts.CRITICAL || 0),
    };
  }

  async getHistory(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query = userId ? { analyzedBy: userId } : {};
    const [detections, total] = await Promise.all([
      Detection.find(query).populate('profile', 'username platform displayName').populate('analyzedBy', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Detection.countDocuments(query),
    ]);
    return { detections, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async batchAnalyze(profileIds, userId) {
    const results = [], errors = [];
    for (const id of profileIds) {
      try {
        const r = await this.analyzeProfile(id, userId);
        results.push({ profileId: id, success: true, result: r });
      } catch (e) {
        errors.push({ profileId: id, success: false, error: e.message });
      }
    }
    return { total: profileIds.length, successful: results.length, failed: errors.length, results, errors };
  }

  _classifyRisk(score) {
    if (score <= 29) return 'LOW';
    if (score <= 59) return 'MEDIUM';
    if (score <= 79) return 'HIGH';
    return 'CRITICAL';
  }
}

module.exports = DetectionService;
