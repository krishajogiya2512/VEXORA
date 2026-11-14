'use strict';
/**
 * reset-dev-admin.js — resets dev admin password to seed value.
 * Run from VEXORA/backend directory:
 *   cd /Users/samruddhi1306/VEXORA/backend && node ../scripts/reset-dev-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

if ((process.env.NODE_ENV || 'development') !== 'development') {
  console.error('❌  This script may only run in development (NODE_ENV=development).');
  process.exit(1);
}

const TARGET_EMAIL = 'admin@vexora-dev.test';
const NEW_PASSWORD = 'VexoraAdmin@2024';

const main = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<db_password>') || uri === 'your_mongodb_atlas_connection_string_here') {
    console.error('❌  MONGODB_URI is not configured in backend/.env');
    process.exit(1);
  }

  console.log('⏳  Connecting to MongoDB Atlas…');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`✅  Connected → ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  const User = require('./src/models/User');

  const user = await User.findOne({ email: TARGET_EMAIL }).select('+password');
  if (!user) {
    console.error(`❌  User not found: ${TARGET_EMAIL}`);
    console.log('    Create it first:  node src/scripts/seed-admin.js');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Found: ${user.email} (role: ${user.role})`);

  // Setting user.password triggers the pre-save bcrypt hook → auto-hashes it
  user.password = NEW_PASSWORD;
  user.isActive = true;
  await user.save();

  console.log('✅  Admin password reset successfully!');
  console.log('    Log in with:');
  console.log(`      Email   : ${TARGET_EMAIL}`);
  console.log('      Password: VexoraAdmin@2024');
  console.log('    ⚠️  Change the password after your first login.\n');

  await mongoose.disconnect();
};

main().catch(err => {
  console.error('❌  Reset failed:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
