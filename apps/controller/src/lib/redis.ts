import Redis from "ioredis";

export const redis_sub = new Redis(process.env.REDIS_URL!);

export const redis_pub = new Redis(process.env.REDIS_URL!);

export function sendSocketToUser(user_id: string, data: any) {
  redis_pub.publish(
    "send-to-user",
    JSON.stringify({ channel: "user:" + user_id, data: data })
  );
}

export function sendSocketToOrg(org_id: string, data: any) {
  redis_pub.publish(
    "send-to-user",
    JSON.stringify({ channel: "org:" + org_id, data: data })
  );
}

export const redis = new Redis(process.env.REDIS_URL!);
