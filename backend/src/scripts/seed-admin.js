'use strict';

/**
 * seed-admin.js – Development-only admin account seeder for VEXORA.
 *
 * Usage:
 *   node src/scripts/seed-admin.js
 *
 * What it does:
 *   • Connects to the database configured in .env (or falls back to
 *     mongodb-memory-server if the real URI is unreachable).
 *   • Creates a single admin account using the credentials below IF
 *     no admin account with that email already exists.
 *   • Prints a clear summary and exits cleanly.
 *
 * IMPORTANT:
 *   • This script is intentionally restricted to NODE_ENV=development.
 *   • Never hardcode real officer credentials here.
 *   • Change the password immediately after first login in any shared env.
 */

require('dotenv').config();

const mongoose = require('mongoose');

// ── Guard: development only ────────────────────────────────────────────────
if ((process.env.NODE_ENV || 'development') !== 'development') {
  console.error('❌ seed-admin.js may only run in development (NODE_ENV=development).');
  process.exit(1);
}

// ── Test-account credentials (not real officer credentials) ───────────────
const SEED_ADMIN = {
  name: 'VEXORA Test Admin',
  email: 'admin@vexora-dev.test',
  password: 'VexoraAdmin@2024',   // ← change after first login
  role: 'ADMIN',
};

// ── Helpers ───────────────────────────────────────────────────────────────
let mongod = null; // memory-server handle (if used)

const connectWithFallback = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vexora';

  // 1. Try the real URI first
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log(`✅ Connected to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return;
  } catch {
    // fall through
  }

  // 2. Fall back to in-process memory server
  console.warn(`⚠️  Could not reach ${uri}. Starting in-process mongodb-memory-server …`);
  const { MongoMemoryServer } = require('mongodb-memory-server');
  mongod = await MongoMemoryServer.create({ instance: { dbName: 'vexora' } });
  await mongoose.connect(mongod.getUri(), { serverSelectionTimeoutMS: 10000 });
  console.log('✅ Connected to in-process mongodb-memory-server');
  console.warn(
    '\n⚠️  NOTE: This is an in-process memory database.\n' +
    '   The seeded user will NOT persist after this script exits.\n' +
    '   Start the backend server BEFORE running this script so it uses the same\n' +
    '   shared URI – or install MongoDB locally for persistent storage.\n'
  );
};

const disconnect = async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
};

// ── Main ──────────────────────────────────────────────────────────────────
const seed = async () => {
  await connectWithFallback();

  // Load the User model AFTER connection is established
  // Path is relative to the scripts/ directory
  const User = require('../models/User');

  // Check if admin already exists
  const existing = await User.findOne({ email: SEED_ADMIN.email });
  if (existing) {
    console.log(`\nℹ️  Admin account already exists:`);
    console.log(`   Email : ${existing.email}`);
    console.log(`   Role  : ${existing.role}`);
    console.log(`   Active: ${existing.isActive}`);
    console.log('\n✅ Nothing to do. Exiting.\n');
    await disconnect();
    return;
  }

  // Create the admin user (password is hashed by the User pre-save hook)
  const admin = await User.create(SEED_ADMIN);

  console.log('\n✅ Admin account created successfully!');
  console.log('─'.repeat(44));
  console.log(`   Name    : ${admin.name}`);
  console.log(`   Email   : ${admin.email}`);
  console.log(`   Password: ${SEED_ADMIN.password}`);
  console.log(`   Role    : ${admin.role}`);
  console.log('─'.repeat(44));
  console.log('   ⚠️  Change the password on first login.\n');

  await disconnect();
};

seed().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  disconnect().finally(() => process.exit(1));
});
