const { Redis } = require("ioredis");
require("dotenv").config();

// Avoid opening Redis connection during tests
if (process.env.NODE_ENV === 'test') {
  module.exports = {
    // minimal stub if needed in code paths
    on: () => {},
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

  module.exports = redis;
}
