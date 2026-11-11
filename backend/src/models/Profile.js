const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: [true, 'Platform is required'],
      lowercase: true,
      enum: {
        values: ['instagram', 'facebook', 'twitter', 'other'],
        message: 'Platform must be one of: instagram, facebook, twitter, other',
      },
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [2, 'Username must be at least 2 characters long'],
      maxlength: [50, 'Username must not exceed 50 characters'],
    },
    normalizedUsername: {
      type: String,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    profileUrl: {
      type: String,
      trim: true,
    },
    accountCreationDate: {
      type: Date,
    },
    followersCount: {
      type: Number,
      min: [0, 'Followers count cannot be negative'],
    },
    followingCount: {
      type: Number,
      min: [0, 'Following count cannot be negative'],
    },
    postsCount: {
      type: Number,
      min: [0, 'Posts count cannot be negative'],
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio must not exceed 500 characters'],
    },
    hasProfilePicture: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    accountActivity: {
      lastPostDate: {
        type: Date,
      },
      postingFrequency: {
        type: String,
        enum: {
          values: ['none', 'very_low', 'low', 'moderate', 'high', 'very_high'],
          message:
            'Posting frequency must be one of: none, very_low, low, moderate, high, very_high',
        },
      },
      engagementRate: {
        type: Number,
      },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitted-by user reference is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'analyzed', 'flagged', 'cleared'],
        message: 'Status must be one of: pending, analyzed, flagged, cleared',
      },
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// ── Pre-save: generate normalizedUsername ─────────────────────────────────────
profileSchema.pre('save', function (next) {
  if (this.isModified('username') || !this.normalizedUsername) {
    this.normalizedUsername = this.username.toLowerCase().trim();
  }
  return next();
});

// ── Indexes ──────────────────────────────────────────────────────────────────
profileSchema.index({ platform: 1, normalizedUsername: 1 }, { unique: true });
profileSchema.index({ submittedBy: 1 });
profileSchema.index({ status: 1 });
profileSchema.index({ platform: 1 });

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
