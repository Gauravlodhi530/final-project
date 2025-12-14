const { Redis } = require("ioredis");
require("dotenv").config();

// Avoid opening Redis connection during tests
if (process.env.NODE_ENV === 'test') {
  module.exports = {
    // minimal stub if needed in code paths
    on: (event, cb) => {},
    quit: async () => {},
    set: async () => {},
  };
} else {
  const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  });

  redis.on("connect", () => {
    console.log("Redis Database is connected 😎");
  });

  // Handle Redis errors to avoid unhandled exception crashes (e.g. DNS failures)
  redis.on('error', (err) => {
    // Log the error message; do not rethrow to prevent process from crashing.
    console.error('[ioredis] Unhandled error event:', err && err.message ? err.message : err);
  });

  module.exports = redis;
}
