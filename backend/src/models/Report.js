const mongoose = require('mongoose');

const analystNoteSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      required: [true, 'Note content is required'],
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Note author is required'],
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
    },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      unique: true,
      required: [true, 'Case ID is required'],
    },
    detection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Detection',
      required: [true, 'Detection reference is required'],
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: [true, 'Profile reference is required'],
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitted-by user reference is required'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters long'],
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Report description is required'],
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2000, 'Description must not exceed 2000 characters'],
    },
    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        message: 'Severity must be one of: LOW, MEDIUM, HIGH, CRITICAL',
      },
    },
    status: {
      type: String,
      enum: {
        values: [
          'PENDING',
          'UNDER_REVIEW',
          'VERIFIED_SUSPICIOUS',
          'INSUFFICIENT_EVIDENCE',
          'ESCALATED',
          'CLOSED',
        ],
        message:
          'Status must be one of: PENDING, UNDER_REVIEW, VERIFIED_SUSPICIOUS, INSUFFICIENT_EVIDENCE, ESCALATED, CLOSED',
      },
      default: 'PENDING',
    },
    analystNotes: [analystNoteSchema],
    statusHistory: [statusHistorySchema],
    evidence: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evidence',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// Note: caseId uniqueness is enforced at the field level (unique: true above).
// A separate schema index would create a duplicate – the status/author/date
// indexes below are added only for query performance, not uniqueness.
reportSchema.index({ status: 1 });
reportSchema.index({ submittedBy: 1 });
reportSchema.index({ severity: 1 });
reportSchema.index({ createdAt: -1 });

// ── Static method: get next case ID ──────────────────────────────────────────
reportSchema.statics.getNextCaseId = async function () {
  const lastReport = await this.findOne({}, { caseId: 1 })
    .sort({ caseId: -1 })
    .lean();

  if (!lastReport) {
    return 'VXRA-00001';
  }

  const lastNumber = parseInt(lastReport.caseId.split('-')[1], 10);
  const nextNumber = lastNumber + 1;
  return `VXRA-${String(nextNumber).padStart(5, '0')}`;
};

// ── Pre-save: auto-generate caseId ───────────────────────────────────────────
reportSchema.pre('save', async function (next) {
  if (this.isNew && !this.caseId) {
    try {
      this.caseId = await this.constructor.getNextCaseId();
    } catch (err) {
      return next(err);
    }
  }
  return next();
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
