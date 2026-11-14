'use strict';

const mongoose = require('mongoose');

/**
 * connectDB – Connects Mongoose to MongoDB Atlas using MONGODB_URI.
 *
 * Requirements:
 *   - MONGODB_URI must be set in backend/.env.
 *   - Works with MongoDB Atlas (mongodb+srv://) only in development/production.
 *   - The server will NOT start if the connection fails.
 *   - There is NO silent fallback to an in-memory database.
 *
 * To use mongodb-memory-server explicitly for automated tests only, set:
 *   USE_MEMORY_DB=true  (only honoured when NODE_ENV=test)
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const env = process.env.NODE_ENV || 'development';

  // ── Guard: require MONGODB_URI ─────────────────────────────────────────────
  if (!uri || uri === 'your_mongodb_atlas_connection_string_here') {
    console.error('❌  MONGODB_URI is not configured.');
    console.error('    1. Copy backend/.env.example → backend/.env');
    console.error('    2. Set MONGODB_URI to your MongoDB Atlas connection string.');
    console.error('    3. Restart the server.');
    process.exit(1);
  }

  // ── Optional: in-memory server for automated tests only ───────────────────
  if (process.env.USE_MEMORY_DB === 'true' && env === 'test') {
    return _startMemoryServer();
  }

  // ── Connect to real MongoDB ────────────────────────────────────────────────
  console.log('⏳  Connecting to MongoDB…');

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000, // 30 s — allows time for SRV DNS lookup + TLS handshake
      socketTimeoutMS:          45000,
      family:                   4,     // prefer IPv4; avoids IPv6 probe on networks without it
    });

    const { host, name } = mongoose.connection;
    console.log(`✅  MongoDB connected → ${host}/${name}`);
  } catch (err) {
    console.error(`❌  MongoDB connection failed: ${err.message}`);
    console.error('    Check that MONGODB_URI is correct and your IP is whitelisted in Atlas.');
    process.exit(1);
  }

  // ── Ongoing event listeners ────────────────────────────────────────────────
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️   MongoDB disconnected – attempting reconnect…');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅  MongoDB reconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌  MongoDB error:', err.message);
  });
};

// ── Internal helper: in-process memory server (tests only) ────────────────────
const _startMemoryServer = async () => {
  let MongoMemoryServer;
  try {
    ({ MongoMemoryServer } = require('mongodb-memory-server'));
  } catch {
    throw new Error(
      'mongodb-memory-server is not installed. ' +
        'Run: npm install --save-dev mongodb-memory-server'
    );
  }

  const mongod = await MongoMemoryServer.create({ instance: { dbName: 'vexora_test' } });
  const memUri = mongod.getUri();

  await mongoose.connect(memUri, { serverSelectionTimeoutMS: 10000 });
  console.log('✅  MongoDB (in-memory, test mode) connected');

  process.on('exit', () => mongod.stop());
  process.on('SIGINT', async () => { await mongod.stop(); process.exit(); });
  process.on('SIGTERM', async () => { await mongod.stop(); process.exit(); });
};

module.exports = connectDB;
