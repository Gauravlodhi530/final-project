const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  username: "default-1",
  password: process.env.REDIS_PASSWORD,
});
console.log("Port",process.env.REDIS_PORT,);
console.log("Host",process.env.REDIS_HOST,);
console.log("Password",process.env.REDIS_PASSWORD,);

redis.on("ready", () => {
  console.log("✅ Redis authenticated & ready");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

module.exports = redis;
