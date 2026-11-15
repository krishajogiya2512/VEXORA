# Environment Configuration

Required environment variables for local development:
- `PORT`: Express server port (default 5000).
- `MONGODB_URI`: MongoDB connection string.
- `JWT_SECRET`: 256-bit cryptographically secure secret key.
- `CLIENT_ORIGIN`: Allowed CORS origin for frontend requests.

## Rate Limiting & Timeouts
- `RATE_LIMIT_WINDOW_MS`: Window size for rate limiting (default 15 minutes).
- `RATE_LIMIT_MAX`: Maximum requests allowed per IP per window (default 100).
- `MONGO_TIMEOUT_MS`: Connection pool timeout (default 30000ms).
