'use strict';

/**
 * autoSeedDev.js – Seeds and validates the development-only admin account.
 *
 * Runs ONLY when NODE_ENV=development.
 * Called from server.js AFTER the database connection is established.
 *
 * Behaviour:
 *   • If the dev admin does not exist → create it.
 *   • If the dev admin exists but the password does not match the configured
 *     dev credential → reset it (dev environment only, never production).
 *   • Never modifies any other user account.
 *   • Never prints passwords or hashes to logs.
 */

const bcrypt = require('bcryptjs');
const User   = require('../models/User');

const DEV_ADMIN = {
  name:     'VEXORA Test Admin',
  email:    'admin@vexora-dev.test',
  password: 'VexoraAdmin@2024',
  role:     'ADMIN',
};

const autoSeedDevAdmin = async () => {
  if ((process.env.NODE_ENV || 'development') !== 'development') return;

  try {
    const existing = await User.findOne({ email: DEV_ADMIN.email }).select('+password');

    if (!existing) {
      // ── Account does not exist → create it ──────────────────────────────
      await User.create(DEV_ADMIN);
      console.log('✅  Dev admin account created.');
      console.log(`    Email : ${DEV_ADMIN.email}`);
      console.log(`    Role  : ${DEV_ADMIN.role}`);
      console.log('    ⚠️   Change the password after first login.');
      return;
    }

    // ── Account exists → verify the password matches ─────────────────────
    const passwordOk = existing.password
      ? await bcrypt.compare(DEV_ADMIN.password, existing.password)
      : false;

    if (passwordOk && existing.isActive) {
      // Everything is correct — nothing to do
      console.log(`🔑  Dev admin ready: ${DEV_ADMIN.email}`);
      return;
    }

    // ── Password mismatch or account deactivated → reset safely ──────────
    if (!passwordOk) {
      console.log('🔄  Dev admin password mismatch detected — resetting to configured dev credential…');
    }
    if (!existing.isActive) {
      console.log('🔄  Dev admin account was deactivated — reactivating…');
    }

    // Assign new password (pre-save hook bcrypt-hashes it automatically)
    existing.password = DEV_ADMIN.password;
    existing.isActive = true;
    await existing.save();

    console.log(`✅  Dev admin ready: ${DEV_ADMIN.email}`);
    console.log('    Password has been reset to the configured dev credential.');
    console.log('    ⚠️   Change the password after first login.');

  } catch (err) {
    // Non-fatal – don't crash the server if seeding fails (e.g. race condition)
    if (err.code !== 11000) {
      console.error('⚠️   Dev admin auto-seed failed:', err.message);
    }
  }
};

module.exports = autoSeedDevAdmin;
