'use strict';

/**
 * seed-admin.js – Creates a development admin account in the persistent database.
 *
 * Usage:
 *   cd backend && node src/scripts/seed-admin.js
 *
 * Requirements:
 *   - .env must be configured with a valid MONGODB_URI (Atlas or local).
 *   - NODE_ENV must be "development".
 *
 * What it does:
 *   - Connects to the real database configured in .env.
 *   - Creates a single ADMIN account if one does not already exist.
 *   - Exits cleanly.
 *
 * IMPORTANT:
 *   - Change the password immediately after first login.
 *   - Never hardcode real credentials here.
 */

require('dotenv').config();

const mongoose = require('mongoose');

// ── Guard: development only ────────────────────────────────────────────────
if ((process.env.NODE_ENV || 'development') !== 'development') {
  console.error('❌ seed-admin.js may only run in development (NODE_ENV=development).');
  process.exit(1);
}

// ── Test-account credentials ───────────────────────────────────────────────
const SEED_ADMIN = {
  name: 'VEXORA Test Admin',
  email: 'admin@vexora-dev.test',
  password: 'VexoraAdmin@2024',   // ← change after first login
  role: 'ADMIN',
};

// ── Main ──────────────────────────────────────────────────────────────────
const seed = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri === 'your_mongodb_atlas_connection_string_here') {
    console.error('❌  MONGODB_URI is not configured in .env');
    console.error('    Set MONGODB_URI to your Atlas connection string and try again.');
    process.exit(1);
  }

  console.log('⏳  Connecting to MongoDB…');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`✅  Connected → ${mongoose.connection.host}/${mongoose.connection.name}`);

  const User = require('../models/User');

  const existing = await User.findOne({ email: SEED_ADMIN.email });
  if (existing) {
    console.log(`\nℹ️  Admin account already exists:`);
    console.log(`   Email : ${existing.email}`);
    console.log(`   Role  : ${existing.role}`);
    console.log(`   Active: ${existing.isActive}`);
    console.log('\n✅  Nothing to do. Exiting.\n');
    await mongoose.disconnect();
    return;
  }

  const admin = await User.create(SEED_ADMIN);

  console.log('\n✅  Admin account created successfully!');
  console.log('─'.repeat(44));
  console.log(`   Name    : ${admin.name}`);
  console.log(`   Email   : ${admin.email}`);
  console.log(`   Password: ${SEED_ADMIN.password}`);
  console.log(`   Role    : ${admin.role}`);
  console.log('─'.repeat(44));
  console.log('   ⚠️  Change the password on first login.\n');

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
