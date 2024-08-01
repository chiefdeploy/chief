import Redis from "ioredis";

let redis;

try {
  redis = new Redis({
    host: process.env.REDIS_HOSTNAME! || "chief_redis",
    port: Number(process.env.REDIS_PORT! || "6379"),
    password: process.env.REDIS_PASSWORD! || "",
    db: 0,
    reconnectOnError: function (err) {
      console.log("Redis reconnecting", err);
      return true;
    }
  });

  console.log("Redis connected", process.env.REDIS_URL);

  redis.on("error", (err) => {
    console.log("Redis error", err);
  });

  redis.on("connect", () => {
    console.log("Redis connected.");
  });
} catch (error) {
  console.log("Redis error", error);
}

export { redis };
