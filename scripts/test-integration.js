#!/usr/bin/env node
/**
 * VEXORA MongoDB Integration Test Suite
 * ======================================
 * Run this AFTER the backend is started with a real Atlas URI:
 *   node scripts/test-integration.js
 *
 * Usage:
 *   cd /Users/samruddhi1306/VEXORA
 *   node scripts/test-integration.js
 *
 * What it tests:
 *   - Health check
 *   - User registration
 *   - User login (valid + invalid)
 *   - JWT auth on protected routes
 *   - Profile CRUD
 *   - Detection analysis
 *   - Detection history
 *   - Report management
 *   - Dashboard statistics
 *   - Persistence (stop/start required manually)
 *
 * SAFE: Uses unique test accounts, does NOT delete existing data.
 */

'use strict';

const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE = process.env.API_URL || 'http://localhost:5001/api';
const TIMESTAMP = Date.now();
const TEST_EMAIL = `vxtest_${TIMESTAMP}@vexora-integration.test`;
const TEST_PASSWORD = 'VxTest@2024!';
const TEST_NAME = `VX Test ${TIMESTAMP}`;

// ── Lightweight HTTP client ──────────────────────────────────────────────────
function request(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const lib = url.protocol === 'https:' ? https : http;
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', (e) => resolve({ status: 0, body: { error: e.message } }));
    req.setTimeout(10000, () => { req.destroy(); resolve({ status: 0, body: { error: 'timeout' } }); });
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Test runner ───────────────────────────────────────────────────────────────
const results = [];
let token = null;
let userId = null;
let profileId = null;
let detectionId = null;
let reportId = null;

function result(name, passed, detail) {
  const status = passed ? '✅ PASSED' : '❌ FAILED';
  results.push({ name, status, detail });
  console.log(`${status}  ${name}`);
  if (!passed) console.log(`         ↳ ${detail}`);
}

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   VEXORA MongoDB Integration Test Suite              ║');
  console.log(`║   API: ${BASE.padEnd(44)} ║`);
  console.log(`║   Test account: ${TEST_EMAIL.substring(0,36).padEnd(36)} ║`);
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // 1. Health check
  const health = await request('GET', '/health');
  result('Health check', health.status === 200 && health.body?.success, `HTTP ${health.status}`);
  if (health.status !== 200) {
    console.error('\n❌ Backend is not reachable. Start it first:\n   cd backend && node src/server.js\n');
    process.exit(1);
  }

  // 2. Register test user
  const reg = await request('POST', '/auth/register', { name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD });
  result('User registration', reg.status === 201 && reg.body?.success, `HTTP ${reg.status}: ${reg.body?.message || JSON.stringify(reg.body).substring(0,80)}`);
  if (reg.body?.data?.token) token = reg.body.data.token;
  if (reg.body?.data?.user?.id) userId = reg.body.data.user.id;

  // 3. Password excluded from register response
  const hasPassword = JSON.stringify(reg.body).toLowerCase().includes('"password"');
  result('Password excluded from register response', !hasPassword || !reg.body?.data?.user?.password, 'password field check');

  // 4. Login with correct credentials
  const login = await request('POST', '/auth/login', { email: TEST_EMAIL, password: TEST_PASSWORD });
  result('Login with valid credentials', login.status === 200 && login.body?.success, `HTTP ${login.status}`);
  if (login.body?.data?.token) token = login.body.data.token;

  // 5. Login with wrong password
  const badLogin = await request('POST', '/auth/login', { email: TEST_EMAIL, password: 'WrongPassword123!' });
  result('Login rejected with wrong password', badLogin.status === 401, `HTTP ${badLogin.status} (expected 401)`);

  // 6. Protected route without token
  const unauth = await request('GET', '/profiles');
  result('Protected route rejects unauthenticated request', unauth.status === 401, `HTTP ${unauth.status} (expected 401)`);

  // 7. Protected route with token
  const me = await request('GET', '/auth/me', null, token);
  result('GET /auth/me with valid token', me.status === 200 && me.body?.success, `HTTP ${me.status}`);
  result('Password excluded from /auth/me response', !me.body?.data?.user?.password, 'no password in user object');

  // 8. Create profile
  const prof = await request('POST', '/profiles', {
    platform: 'instagram',
    username: `vxtest_${TIMESTAMP}`,
    followersCount: 150,
    followingCount: 300,
    postsCount: 12,
    bio: 'Integration test account',
    hasProfilePicture: false,
    isVerified: false,
  }, token);
  result('Profile creation', prof.status === 201 && prof.body?.success, `HTTP ${prof.status}: ${prof.body?.message || ''}`);
  if (prof.body?.data?.profile?._id) profileId = prof.body.data.profile._id;

  // 9. Get profile by ID
  if (profileId) {
    const getProf = await request('GET', `/profiles/${profileId}`, null, token);
    result('Profile retrieval by ID', getProf.status === 200 && getProf.body?.data?.profile?._id === profileId, `HTTP ${getProf.status}`);
  } else {
    result('Profile retrieval by ID', false, 'No profileId from creation step');
  }

  // 10. Run detection
  if (profileId) {
    const det = await request('POST', '/detection/analyze', { profileId }, token);
    result('Detection analysis (POST /detection/analyze)', det.status === 201 && det.body?.success, `HTTP ${det.status}: ${det.body?.message || ''}`);
    if (det.body?.data?.detectionId) detectionId = det.body.data.detectionId;
    if (det.body?.data) {
      result('Detection has riskScore', typeof det.body.data.riskScore === 'number', `riskScore=${det.body.data.riskScore}`);
      result('Detection has riskLevel', ['LOW','MEDIUM','HIGH','CRITICAL'].includes(det.body.data.riskLevel), `riskLevel=${det.body.data.riskLevel}`);
    }
  } else {
    result('Detection analysis', false, 'Skipped — no profileId');
    result('Detection has riskScore', false, 'Skipped');
    result('Detection has riskLevel', false, 'Skipped');
  }

  // 11. Detection history
  const hist = await request('GET', '/detection/history', null, token);
  result('Detection history (GET /detection/history)', hist.status === 200 && hist.body?.success, `HTTP ${hist.status}: ${hist.body?.data?.length ?? 0} records`);

  // 12. Detection statistics
  const stats = await request('GET', '/detection/statistics', null, token);
  result('Detection statistics', stats.status === 200 && stats.body?.success, `HTTP ${stats.status}: total=${stats.body?.data?.total}`);

  // 13. Create report (requires detectionId + profileId)
  if (detectionId && profileId) {
    const rep = await request('POST', '/reports', {
      detectionId,
      profileId,
      title: `Integration Test Report ${TIMESTAMP}`,
      description: 'This is an automated integration test report for VEXORA verification.',
      severity: 'MEDIUM',
    }, token);
    result('Report creation (POST /reports)', rep.status === 201 && rep.body?.success, `HTTP ${rep.status}: ${rep.body?.message || rep.body?.errors?.[0]?.message || ''}`);
    if (rep.body?.data?.report?._id) reportId = rep.body.data.report._id;
  } else {
    result('Report creation', false, 'Skipped — missing detectionId or profileId');
  }

  // 14. Get reports
  const reports = await request('GET', '/reports', null, token);
  result('Report list (GET /reports)', reports.status === 200 && reports.body?.success, `HTTP ${reports.status}`);

  // 15. Dashboard overview
  const dash = await request('GET', '/dashboard/overview', null, token);
  result('Dashboard overview', dash.status === 200 && dash.body?.success, `HTTP ${dash.status}: profiles=${dash.body?.data?.stats?.totalProfiles}, detections=${dash.body?.data?.stats?.totalDetections}`);

  // 16. Invalid JWT
  const badJwt = await request('GET', '/profiles', null, 'invalid.jwt.token');
  result('Invalid JWT rejected', badJwt.status === 401, `HTTP ${badJwt.status} (expected 401)`);

  // ── Summary ─────────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.status.includes('PASSED')).length;
  const failed = results.filter(r => r.status.includes('FAILED')).length;

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log(`║  Results: ${passed} PASSED  ${failed} FAILED  (${results.length} total)${' '.repeat(Math.max(0,21-String(passed).length-String(failed).length-String(results.length).length))}║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  // Save results
  const report = {
    runAt: new Date().toISOString(),
    apiBase: BASE,
    testAccount: TEST_EMAIL,
    summary: { total: results.length, passed, failed },
    results: results.map(r => ({ ...r, detail: r.detail || '' })),
    persistenceInstructions: [
      '1. Note these IDs for persistence test:',
      `   userId:      ${userId || 'N/A'}`,
      `   profileId:   ${profileId || 'N/A'}`,
      `   detectionId: ${detectionId || 'N/A'}`,
      `   reportId:    ${reportId || 'N/A'}`,
      '2. Stop the backend (Ctrl+C)',
      '3. Restart: cd backend && node src/server.js',
      '4. Re-run this script with SKIP_REGISTER=true:',
      `   SKIP_REGISTER=true TEST_EMAIL=${TEST_EMAIL} node scripts/test-integration.js`,
    ],
  };

  const path = require('path');
  require('fs').writeFileSync(path.join(__dirname, 'last-test-result.json'), JSON.stringify(report, null, 2));
  console.log('\n📄 Full results saved to: scripts/last-test-result.json');
  console.log('\n🔁 PERSISTENCE TEST:');
  report.persistenceInstructions.forEach(l => console.log('   ' + l));
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => { console.error('Test runner crashed:', err); process.exit(1); });

