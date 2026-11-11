const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
    },
    detection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Detection',
    },
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploaded-by user reference is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [500, 'Description must not exceed 500 characters'],
    },
    evidenceType: {
      type: String,
      enum: {
        values: ['screenshot', 'document', 'report', 'other'],
        message:
          'Evidence type must be one of: screenshot, document, report, other',
      },
      default: 'other',
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
evidenceSchema.index({ profile: 1 });
evidenceSchema.index({ detection: 1 });
evidenceSchema.index({ report: 1 });
evidenceSchema.index({ uploadedBy: 1 });

const Evidence = mongoose.model('Evidence', evidenceSchema);

module.exports = Evidence;
