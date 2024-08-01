import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

import express from "express";
import throng from "throng";
import cookieParser from "cookie-parser";
import { Socket, Server } from "socket.io";
import { createServer } from "http";

import auth_router from "./routes/auth";
import organization_router from "./routes/organization";
import github_router from "./routes/github";
import project_router from "./routes/project";
import service_router from "./routes/service";
import logs_router from "./routes/logs";
import instance_router from "./routes/instance";

import { workerThread } from "./worker";
import prisma from "./lib/prisma";
import { redis, redis_sub } from "./lib/redis";

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  pingTimeout: 15000,
  pingInterval: 5000
});

interface SocketWithUser extends Socket {
  user: any;
}

import Docker from "dockerode";

function process_cookies(cookie_header: string) {
  const cookies = cookie_header.split(";").map((cookie) => {
    const parts = cookie.split("=");
    return {
      name: parts[0].trim(),
      value: parts[1].trim()
    };
  });
  return cookies;
}

async function mainThread() {
  console.log("Main thread started.");

  app.use(express.json());
  app.use(cookieParser());

  // log every request path
  app.use((req, res, next) => {
    console.log(req.method, req.path);
    next();
  });

  app.get("/", async (req, res) => {
    res.send("ok");
  });

  app.get("/api", async (req, res) => {
    res.send("api");
  });

  app.use("/api/auth", auth_router);
  app.use("/api/organization", organization_router);
  app.use("/api/github", github_router);
  app.use("/api/project", project_router);
  app.use("/api/service", service_router);
  app.use("/api/logs", logs_router);
  app.use("/api/instance", instance_router);

  const docker = new Docker({ socketPath: "/var/run/docker.sock" });

  app.get("/api/hi", async (req, res) => {
    const msg = await docker.listContainers();

    res.json({ ok: true, msg });
  });

  io.use(async (socket: SocketWithUser | any, next) => {
    try {
      const token = decodeURIComponent(
        process_cookies(socket.handshake.headers.cookie).filter((cookie) =>
          cookie.name.includes("chiefsid")
        )[0].value
      );

      const user_raw = await redis.get("session:" + token);

      if (!user_raw) {
        next(new Error("unauthorized"));
        return;
      }

      const user = JSON.parse(user_raw);

      socket.user = user;

      next();
    } catch (e) {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", async (socket: SocketWithUser | any) => {
    const user_id = socket.user.id.toString();

    const org_memberships = (
      await prisma.organizationMember.findMany({
        where: {
          user_id: user_id
        }
      })
    ).map((member) => "org:" + member.organization_id);

    socket.join(org_memberships);

    socket.join("user:" + socket.user.id);

    socket.on("disconnect", () => {
      // console.log("user disconnected");
    });
  });

  io.on("room_join", (data) => {
    console.log("socket data", data);
  });

  io.on("error", (err) => {
    console.log("socket error", err);
  });

  redis_sub.subscribe("send-to-user", (err, count) => {
    if (err) {
      console.log("error subscribing to redis channel", err);
    }
  });

  redis_sub.on("message", (channel, message) => {
    if (channel === "send-to-user") {
      const parsed = JSON.parse(message);
      const channel = parsed.channel;
      const data = parsed.data;

      io.to(channel).emit("message", data);
    }
  });

  httpServer.listen(4000, () => {
    console.log("Controller API started!");
  });
}

throng({
  workers: 1,
  master: mainThread,
  worker: workerThread
});
