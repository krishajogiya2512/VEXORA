const Profile = require('../models/Profile');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

/**
 * @desc    Create a new social media profile
 * @route   POST /api/profiles
 * @access  Private (ADMIN, ANALYST)
 */
const createProfile = async (req, res, next) => {
  try {
    const {
      platform, username, displayName, profileUrl, accountCreationDate,
      followersCount, followingCount, postsCount, bio,
      hasProfilePicture, isVerified, accountActivity, metadata,
    } = req.body;

    // Check for duplicate profile (same platform + username)
    const normalizedUsername = username.toLowerCase().trim();
    const existing = await Profile.findOne({
      platform: platform.toLowerCase(),
      normalizedUsername,
    });

    if (existing) {
      return errorResponse(
        res,
        `A profile for @${username} on ${platform} already exists`,
        409,
        [{ existingProfileId: existing._id }]
      );
    }

    const profile = await Profile.create({
      platform,
      username,
      displayName,
      profileUrl,
      accountCreationDate: accountCreationDate || undefined,
      followersCount,
      followingCount,
      postsCount,
      bio,
      hasProfilePicture: hasProfilePicture || false,
      isVerified: isVerified || false,
      accountActivity: accountActivity || {},
      metadata: metadata || {},
      submittedBy: req.user.id,
    });

    return successResponse(res, 'Profile created successfully', { profile }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all profiles with filtering and pagination
 * @route   GET /api/profiles
 * @access  Private
 */
const getProfiles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { platform, status, search, sortBy, order } = req.query;

    const filter = {};
    if (platform) filter.platform = platform.toLowerCase();
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
      ];
    }

    // Viewers can only see profiles they submitted or that are analyzed/flagged
    if (req.user.role === 'VIEWER') {
      filter.$or = [
        { submittedBy: req.user.id },
        { status: { $in: ['analyzed', 'flagged'] } },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy || 'createdAt'] = order === 'asc' ? 1 : -1;

    const [profiles, total] = await Promise.all([
      Profile.find(filter)
        .populate('submittedBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort(sortOptions),
      Profile.countDocuments(filter),
    ]);

    return paginatedResponse(res, 'Profiles retrieved successfully', profiles, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single profile by ID
 * @route   GET /api/profiles/:id
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id)
      .populate('submittedBy', 'name email');

    if (!profile) {
      return errorResponse(res, 'Profile not found', 404);
    }

    return successResponse(res, 'Profile retrieved successfully', { profile });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update profile
 * @route   PUT /api/profiles/:id
 * @access  Private (ADMIN, ANALYST)
 */
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'displayName', 'profileUrl', 'accountCreationDate',
      'followersCount', 'followingCount', 'postsCount', 'bio',
      'hasProfilePicture', 'isVerified', 'accountActivity', 'metadata',
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('submittedBy', 'name email');

    if (!profile) {
      return errorResponse(res, 'Profile not found', 404);
    }

    return successResponse(res, 'Profile updated successfully', { profile });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete profile
 * @route   DELETE /api/profiles/:id
 * @access  Private (ADMIN)
 */
const deleteProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id);

    if (!profile) {
      return errorResponse(res, 'Profile not found', 404);
    }

    await Profile.findByIdAndDelete(req.params.id);

    return successResponse(res, 'Profile deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProfile,
  getProfiles,
  getProfile,
  updateProfile,
  deleteProfile,
};
