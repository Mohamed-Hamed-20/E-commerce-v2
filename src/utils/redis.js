import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT || 6379),
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("error", (err) => {
  console.log("Redis error: " + err.message);
});

export default redis;
