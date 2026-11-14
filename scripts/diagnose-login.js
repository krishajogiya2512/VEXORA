'use strict';
/**
 * diagnose-login.js
 * Diagnoses the admin login state against MongoDB Atlas.
 *
 * Run from ANY directory:
 *   node /Users/samruddhi1306/VEXORA/scripts/diagnose-login.js
 *
 * Or from the project root:
 *   node scripts/diagnose-login.js
 *
 * Dependencies are resolved from backend/node_modules — no separate install needed.
 */

const path = require('path');
const { createRequire } = require('module');

// ── Resolve all deps from backend/node_modules ───────────────────────────────
const BACKEND_DIR    = path.resolve(__dirname, '../backend');
const backendRequire = createRequire(path.join(BACKEND_DIR, 'package.json'));

const dotenv   = backendRequire('dotenv');
const mongoose = backendRequire('mongoose');
const bcrypt   = backendRequire('bcryptjs');

// ── Load backend/.env ────────────────────────────────────────────────────────
dotenv.config({ path: path.join(BACKEND_DIR, '.env') });

// ── Load User model via backend's require context ────────────────────────────
// Using createRequire anchored to backend/package.json ensures that the model's
// own `require('mongoose')` resolves to the same instance we connected above.

// ── Dev credentials to test against ──────────────────────────────────────────
const EXPECTED_EMAIL    = 'admin@vexora-dev.test';
const EXPECTED_PASSWORD = 'VexoraAdmin@2024';

// ── Main ─────────────────────────────────────────────────────────────────────
const main = async () => {
  // 1. Validate URI before connecting
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌  MONGODB_URI is not set in backend/.env');
    process.exit(1);
  }
  if (uri.includes('<db_password>') || uri === 'your_mongodb_atlas_connection_string_here') {
    console.error('❌  MONGODB_URI still contains a placeholder — update backend/.env with real credentials.');
    process.exit(1);
  }

  // Show safe URI metadata (no credentials)
  try {
    const u = new URL(uri);
    console.log('📋  URI check:');
    console.log(`    Protocol : ${u.protocol}`);
    console.log(`    Host     : ${u.hostname}`);
    console.log(`    Database : ${u.pathname}`);
    console.log(`    Username : ${u.username}`);
    console.log(`    Password : ${'*'.repeat(u.password.length)} (${u.password.length} chars)\n`);
  } catch {
    console.error('❌  MONGODB_URI is not a valid URL — check backend/.env formatting.');
    process.exit(1);
  }

  // 2. Connect to MongoDB Atlas
  console.log('⏳  Connecting to MongoDB Atlas…');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  } catch (connErr) {
    console.error('❌  Connection failed:', connErr.message);
    console.error('\n    Possible causes:');
    console.error('    • Current IP is not whitelisted in Atlas → Network Access');
    console.error('    • Wrong username/password in MONGODB_URI');
    console.error('    • Cluster hostname is incorrect');
    process.exit(1);
  }
  console.log(`✅  Connected → ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  // 3. Load the User model using backend's own require context
  //    This ensures mongoose schema registration uses the same mongoose instance
  const User = backendRequire('./src/models/User');

  // 4. Look up the admin account
  console.log(`🔍  Looking up: ${EXPECTED_EMAIL}`);
  const user = await User.findOne({ email: EXPECTED_EMAIL }).select('+password');

  if (!user) {
    console.log('\n❌  RESULT: Admin account does NOT exist in the database.');
    console.log('    FIX: Run the seed script from your terminal:');
    console.log('         cd /Users/samruddhi1306/VEXORA/backend');
    console.log('         node src/scripts/seed-admin.js');
    await mongoose.disconnect();
    return;
  }

  // 5. Report account state
  console.log('\n📋  Account state:');
  console.log(`    Email    : ${user.email}`);
  console.log(`    Role     : ${user.role}`);
  console.log(`    Active   : ${user.isActive}`);
  console.log(`    Has hash : ${!!user.password}`);
  console.log(`    Hash len : ${user.password?.length ?? 0} chars (60 = valid bcrypt)`);

  // 6. Check isActive
  if (!user.isActive) {
    console.log('\n❌  PROBLEM: Account is DEACTIVATED (isActive = false).');
    console.log('    The login controller rejects deactivated accounts.');
    console.log('    FIX: Run reset-dev-admin.js to restore isActive = true.');
  } else {
    console.log('    isActive : ✅ true');
  }

  // 7. Validate hash format
  const hashLooksValid = typeof user.password === 'string' && user.password.startsWith('$2');
  if (!hashLooksValid) {
    console.log('\n❌  PROBLEM: Stored password field is missing or not a valid bcrypt hash.');
    console.log('    FIX: Run reset-dev-admin.js to re-hash the password.');
    await mongoose.disconnect();
    return;
  }
  console.log('    Hash fmt : ✅ valid bcrypt format');

  // 8. Compare expected dev password against stored hash
  console.log('\n🔑  Testing password comparison…');
  const bcryptMatch = await bcrypt.compare(EXPECTED_PASSWORD, user.password);
  const methodMatch = await user.comparePassword(EXPECTED_PASSWORD);

  console.log(`    bcrypt.compare()    : ${bcryptMatch  ? '✅ MATCH' : '❌ NO MATCH'}`);
  console.log(`    user.comparePassword: ${methodMatch  ? '✅ MATCH' : '❌ NO MATCH'}`);

  // 9. Final verdict
  if (bcryptMatch && methodMatch) {
    console.log('\n✅  VERDICT: Credentials are correct. Login SHOULD work with:');
    console.log(`    Email   : ${EXPECTED_EMAIL}`);
    console.log('    Password: VexoraAdmin@2024');
    console.log('\n👉  If the frontend still shows "Login failed", the issue is NOT');
    console.log('    the password. Check:');
    console.log('    • Is the backend running?  curl http://localhost:5001/api/health');
    console.log('    • Is VITE_API_URL=http://localhost:5001/api in frontend/.env?');
    console.log('    • Open browser DevTools → Network tab → look at the POST /login response.');
  } else {
    console.log('\n❌  VERDICT: Password MISMATCH — stored hash does not match VexoraAdmin@2024.');
    console.log('    The account was created with a different password.');
    console.log('\n    FIX (with your approval): Run the reset script:');
    console.log('         cd /Users/samruddhi1306/VEXORA/backend');
    console.log('         node ../scripts/reset-dev-admin.js');
  }

  await mongoose.disconnect();
  console.log('\n📊  Diagnosis complete.\n');
};

main().catch(async (err) => {
  console.error('\n❌  Unexpected error:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
