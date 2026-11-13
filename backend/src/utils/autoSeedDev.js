'use strict';

/**
 * autoSeedDev.js – Seeds a development-only admin account on startup.
 *
 * This runs ONLY when NODE_ENV=development and only if the email
 * admin@vexora-dev.test does not already exist.
 *
 * It is called from server.js AFTER the database connection is established.
 * No credentials are exposed in the frontend; this purely populates the DB.
 */

const User = require('../models/User');

const DEV_ADMIN = {
  name: 'VEXORA Test Admin',
  email: 'admin@vexora-dev.test',
  password: 'VexoraAdmin@2024',
  role: 'ADMIN',
};

const autoSeedDevAdmin = async () => {
  if ((process.env.NODE_ENV || 'development') !== 'development') return;

  try {
    const exists = await User.findOne({ email: DEV_ADMIN.email });
    if (exists) {
      console.log(`🔑 Dev admin ready: ${DEV_ADMIN.email}`);
      return;
    }

    await User.create(DEV_ADMIN);
    console.log('✅ Dev admin account seeded automatically:');
    console.log(`   Email    : ${DEV_ADMIN.email}`);
    console.log(`   Password : ${DEV_ADMIN.password}`);
    console.log(`   Role     : ${DEV_ADMIN.role}`);
  } catch (err) {
    // Non-fatal – don't crash the server if seeding fails
    console.error('⚠️  Dev admin auto-seed failed:', err.message);
  }
};

module.exports = autoSeedDevAdmin;
