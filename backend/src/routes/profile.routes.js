'use strict';

const express = require('express');
const router = express.Router();
const { createProfile, getProfiles, getProfile, updateProfile, deleteProfile } = require('../controllers/profile.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

// POST /api/profiles
router.post('/', authorize('ADMIN', 'ANALYST'), createProfile);
// GET  /api/profiles
router.get('/', getProfiles);
// GET  /api/profiles/:id
router.get('/:id', getProfile);
// PUT  /api/profiles/:id
router.put('/:id', authorize('ADMIN', 'ANALYST'), updateProfile);
// DELETE /api/profiles/:id
router.delete('/:id', authorize('ADMIN'), deleteProfile);

module.exports = router;
