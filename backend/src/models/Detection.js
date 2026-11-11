const mongoose = require('mongoose');

const indicatorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    detected: {
      type: Boolean,
    },
    weight: {
      type: Number,
    },
    score: {
      type: Number,
    },
    reason: {
      type: String,
    },
    category: {
      type: String,
      enum: {
        values: ['profile', 'activity', 'network', 'content', 'metadata'],
        message:
          'Indicator category must be one of: profile, activity, network, content, metadata',
      },
    },
  },
  { _id: false }
);

const suspiciousPatternSchema = new mongoose.Schema(
  {
    pattern: {
      type: String,
    },
    description: {
      type: String,
    },
    severity: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Pattern severity must be one of: low, medium, high',
      },
    },
  },
  { _id: false }
);

const detectionSchema = new mongoose.Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: [true, 'Profile reference is required'],
    },
    analyzedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Analyzed-by user reference is required'],
    },
    riskScore: {
      type: Number,
      required: [true, 'Risk score is required'],
      min: [0, 'Risk score must be at least 0'],
      max: [100, 'Risk score must not exceed 100'],
    },
    riskLevel: {
      type: String,
      required: [true, 'Risk level is required'],
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        message: 'Risk level must be one of: LOW, MEDIUM, HIGH, CRITICAL',
      },
    },
    confidenceScore: {
      type: Number,
      min: [0, 'Confidence score must be at least 0'],
      max: [100, 'Confidence score must not exceed 100'],
    },
    indicators: [indicatorSchema],
    suspiciousPatterns: [suspiciousPatternSchema],
    recommendation: {
      type: String,
    },
    detectionMethod: {
      type: String,
      enum: {
        values: ['rule_based', 'ml_based', 'hybrid'],
        message:
          'Detection method must be one of: rule_based, ml_based, hybrid',
      },
      default: 'rule_based',
    },
    mlPrediction: {
      score: {
        type: Number,
      },
      confidence: {
        type: Number,
      },
      modelVersion: {
        type: String,
      },
      available: {
        type: Boolean,
        default: false,
      },
    },
    rawFeatures: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
detectionSchema.index({ profile: 1 });
detectionSchema.index({ analyzedBy: 1 });
detectionSchema.index({ riskLevel: 1 });
detectionSchema.index({ createdAt: -1 });

const Detection = mongoose.model('Detection', detectionSchema);

module.exports = Detection;
