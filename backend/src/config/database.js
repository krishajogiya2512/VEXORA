'use strict';

const mongoose = require('mongoose');

let mongodInstance = null;

/**
 * connectDB – Connects Mongoose to MongoDB.
 *
 * Supported Modes:
 *   1. In-Memory Database (Development/Testing only):
 *      - Enabled when USE_MEMORY_DB=true and NODE_ENV is 'development' or 'test'.
 *      - Spins up an embedded MongoMemoryServer instance.
 *      - Ephemeral storage, cleanly shuts down on process exit/SIGINT/SIGTERM.
 *
 *   2. Persistent Database (MongoDB Atlas or Local MongoDB):
 *      - Active when USE_MEMORY_DB is false or not set (and in production).
 *      - Connects via MONGODB_URI.
 *      - The server will NOT start if the connection fails (no silent fallback).
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const env = process.env.NODE_ENV || 'development';
  const isMemoryDb =
    process.env.USE_MEMORY_DB === 'true' && (env === 'development' || env === 'test');

  // ── Mode 1: In-Memory MongoDB (Development / Test) ─────────────────────────
  if (isMemoryDb) {
    await _startMemoryServer(env);
    _registerEventListeners();
    return;
  }

  // ── Mode 2: Real MongoDB (Atlas / Local) ───────────────────────────────────
  if (!uri || uri === 'your_mongodb_atlas_connection_string_here') {
    console.error('❌  MONGODB_URI is not configured.');
    console.error('    1. Set MONGODB_URI in backend/.env to your MongoDB Atlas or local URI, OR');
    console.error('    2. Set USE_MEMORY_DB=true in backend/.env for local in-memory development.');
    console.error('    3. Restart the server.');
    process.exit(1);
  }

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
    console.error('    Check that MONGODB_URI is correct and your IP is whitelisted if using Atlas.');
    process.exit(1);
  }

  _registerEventListeners();
};

// ── Ongoing event listeners ──────────────────────────────────────────────────
const _registerEventListeners = () => {
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

// ── Helper: in-process memory server ─────────────────────────────────────────
const _startMemoryServer = async (env) => {
  let MongoMemoryServer;
  try {
    ({ MongoMemoryServer } = require('mongodb-memory-server'));
  } catch {
    throw new Error(
      'mongodb-memory-server is not installed. ' +
        'Run: npm install --save-dev mongodb-memory-server'
    );
  }

  const dbName = env === 'test' ? 'vexora_test' : 'vexora_dev';
  console.log(`⏳  Starting in-memory MongoDB (${dbName})…`);

  try {
    mongodInstance = await MongoMemoryServer.create({ instance: { dbName } });
    const memUri = mongodInstance.getUri();

    await mongoose.connect(memUri, { serverSelectionTimeoutMS: 10000 });

    const { host, name } = mongoose.connection;
    console.log(`✅  MongoDB (in-memory) connected → ${host}/${name}`);
    console.log('📌  Note: In-memory mode active. Data resets on server restart.');
  } catch (err) {
    console.error(`❌  Failed to start in-memory MongoDB: ${err.message}`);
    process.exit(1);
  }

  const cleanup = async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      if (mongodInstance) {
        await mongodInstance.stop();
        mongodInstance = null;
      }
    } catch {
      // Ignore errors on shutdown
    }
  };

  process.on('exit', () => {
    if (mongodInstance) {
      mongodInstance.stop();
    }
  });

  process.on('SIGINT', async () => {
    await cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(0);
  });
};

module.exports = connectDB;
