'use strict';

const mongoose = require('mongoose');

/**
 * connectDB – Establishes a Mongoose connection.
 *
 * Strategy (development only):
 *   1. Attempt to connect to the URI in MONGODB_URI env var (defaults to
 *      mongodb://localhost:27017/vexora).
 *   2. If the connection fails AND NODE_ENV is "development", fall back to
 *      an in-process mongodb-memory-server so the app works without a local
 *      MongoDB installation.
 *
 * In production the fallback is intentionally disabled – a real MongoDB URI
 * must be reachable or the process exits with a non-zero code.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vexora';
  const isDev = (process.env.NODE_ENV || 'development') === 'development';
  const forceMemory = process.env.USE_MEMORY_DB === 'true';

  // ── Helper: attempt a real connection ─────────────────────────────────────
  const tryConnect = async (connectionUri) => {
    await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(
      `✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`
    );
  };

  // ── Helper: start in-process memory server ────────────────────────────────
  const startMemoryServer = async () => {
    let MongoMemoryServer;
    try {
      ({ MongoMemoryServer } = require('mongodb-memory-server'));
    } catch {
      throw new Error(
        'mongodb-memory-server is not installed. ' +
          'Run: npm install --save-dev mongodb-memory-server'
      );
    }

    const mongod = await MongoMemoryServer.create({
      instance: { dbName: 'vexora' },
    });
    const memUri = mongod.getUri();

    await mongoose.connect(memUri, { serverSelectionTimeoutMS: 10000 });

    console.log('✅ MongoDB (in-process memory server) connected – development mode');
    console.warn(
      '⚠️  Data is stored in memory and will be lost when the server stops.\n' +
        '   Install MongoDB locally for persistent storage.'
    );

    // Keep the mongod instance alive for the process lifetime
    process.on('exit', () => mongod.stop());
    process.on('SIGINT', async () => { await mongod.stop(); process.exit(); });
    process.on('SIGTERM', async () => { await mongod.stop(); process.exit(); });
  };

  // ── Main connection logic ──────────────────────────────────────────────────
  try {
    if (forceMemory) {
      await startMemoryServer();
    } else {
      await tryConnect(uri);
    }
  } catch (primaryError) {
    if (isDev) {
      console.warn(
        `⚠️  Could not reach MongoDB at ${uri}: ${primaryError.message}`
      );
      console.log('🔄 Falling back to in-process mongodb-memory-server …');
      try {
        await startMemoryServer();
      } catch (memErr) {
        console.error(`❌ Memory server failed: ${memErr.message}`);
        process.exit(1);
      }
    } else {
      console.error(`❌ MongoDB connection failed: ${primaryError.message}`);
      process.exit(1);
    }
  }

  // ── Ongoing connection event listeners ────────────────────────────────────
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err.message);
  });
};

module.exports = connectDB;
