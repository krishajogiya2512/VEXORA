'use strict';

const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePassword, logout } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// POST /api/auth/register
router.post('/register', register);
// POST /api/auth/login
router.post('/login', login);
// GET  /api/auth/me
router.get('/me', protect, getMe);
// PUT  /api/auth/password
router.put('/password', protect, updatePassword);
// POST /api/auth/logout
router.post('/logout', protect, logout);

module.exports = router;
