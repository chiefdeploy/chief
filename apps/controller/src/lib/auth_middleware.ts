import type { NextFunction, Request, Response } from "express";
import prisma from "./prisma";
import { redis } from "./redis";

export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    token: string;
  };
}

export async function authMiddleware(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const chiefsid = req.cookies.chiefsid || req.headers.authorization;

  try {
    if (chiefsid) {
      const user_raw = await redis.get("session:" + chiefsid);

      if (user_raw) {
        const user = JSON.parse(user_raw);

        req.user = {
          id: user?.id,
          email: user?.email,
          token: chiefsid
        };
      } else {
        res.clearCookie("chiefsid");

        await redis.del("session:" + chiefsid);

        return res.status(401).json({ error: "unauthorized" });
      }

      return next();
    } else {
      return res.status(401).json({ error: "unauthorized" });
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({ error: "unauthorized" });
  }
}
