'use strict';

const express = require('express');
const router = express.Router();
const { getUsers, getUser, updateUser, deleteUser } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

// GET  /api/users
router.get('/', authorize('ADMIN'), getUsers);
// GET  /api/users/:id
router.get('/:id', authorize('ADMIN'), getUser);
// PUT  /api/users/:id
router.put('/:id', authorize('ADMIN'), updateUser);
// DELETE /api/users/:id
router.delete('/:id', authorize('ADMIN'), deleteUser);

module.exports = router;
