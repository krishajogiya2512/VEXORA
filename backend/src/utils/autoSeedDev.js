'use strict';

/**
 * autoSeedDev.js – Seeds a development-only admin account on startup.
 *
 * This runs ONLY when NODE_ENV=development and only if the email
 * admin@vexora-dev.test does not already exist in the database.
 *
 * It is called from server.js AFTER the database connection is established.
 * With MongoDB Atlas, the seeded user PERSISTS across server restarts.
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
      console.log(`🔑  Dev admin ready: ${DEV_ADMIN.email}`);
      return;
    }

    await User.create(DEV_ADMIN);
    console.log('✅  Dev admin account seeded:');
    console.log(`    Email    : ${DEV_ADMIN.email}`);
    console.log(`    Password : ${DEV_ADMIN.password}`);
    console.log(`    Role     : ${DEV_ADMIN.role}`);
    console.log('    ⚠️  Change the password after first login.');
  } catch (err) {
    // Non-fatal – don't crash the server if seeding fails (e.g. duplicate key race)
    if (err.code !== 11000) {
      console.error('⚠️   Dev admin auto-seed failed:', err.message);
    }
  }
};

module.exports = autoSeedDevAdmin;
