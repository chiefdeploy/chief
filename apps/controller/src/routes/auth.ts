import { Router } from "express";
import prisma from "../lib/prisma";
import { authMiddleware, type RequestWithUser } from "../lib/auth_middleware";
import argon2 from "argon2";
import { redis } from "../lib/redis";

const router = Router();

// @/auth - check if user is logged in
router.get("/", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.user?.id
      },
      select: {
        id: true,
        email: true,
        created_at: true,
        instance_admin: true,
        organizations: {
          select: {
            id: true,
            organization: {
              select: {
                id: true,
                name: true,
                created_at: true
              }
            }
          }
        },
        organizations_created: {
          select: {
            id: true,
            name: true,
            created_at: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const selected_org =
      req.cookies["chieforg"] || user.organizations[0].organization.id || null;

    return res.json({
      ok: true,
      user: { ...user, selected_org }
    });
  } catch (e) {
    return res.status(500).json({
      error: "internal_server_error"
    });
  }
});

// @/auth/login
router.post("/login", async (req, res) => {
  try {
    const chiefsid = req.cookies["chiefsid"];

    if (chiefsid) {
      const user_raw = await redis.get("session:" + chiefsid);

      if (user_raw) {
        res.json({
          error: "already_logged_in"
        });
        return;
      }
    }

    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: "invalid_email_or_password"
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        email
      },
      include: {
        organizations: {
          select: {
            id: true,
            organization: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (
      !user ||
      (await argon2.verify(user.password_hash, password)) === false
    ) {
      res.status(400).json({
        error: "invalid_email_or_password"
      });
      return;
    }

    const token = Buffer.from(
      crypto.getRandomValues(new Uint8Array(64))
    ).toString("base64");

    await redis.set(
      "session:" + token,
      JSON.stringify({
        id: user.id,
        email: user.email
      }),
      "EX",
      60 * 60 * 24 * 30 * 6
    );

    await res.cookie("chiefsid", token, {
      maxAge: 1000 * 60 * 60 * 24 * 30 * 6
    });

    if (!req.cookies["chieforg"]) {
      if (user.organizations && user.organizations.length > 0) {
        await res.cookie("chieforg", user.organizations[0].organization.id, {
          maxAge: 1000 * 60 * 60 * 24 * 30 * 6
        });
      }
    }

    return res.json({
      ok: true
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      error: "internal_server_error"
    });
  }
});

// @/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).send("invalid email or password");
      return;
    }

    const password_hash = await argon2.hash(password);

    const existing_email = await prisma.user.findFirst({
      where: {
        email
      }
    });

    if (existing_email) {
      res.status(400).json({ error: "email_already_exists" });
      return;
    }

    const user = await prisma.user.create({
      data: {
        email: email,
        password_hash: password_hash
      }
    });

    if (!user) {
      res.status(500).json({ error: "internal_server_error" });
      return;
    }

    res.json({
      ok: true
    });
  } catch (e) {
    res.status(500).json({
      error: "internal_server_error"
    });
  }
});

router.post("/setup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "invalid_email_or_password" });
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        instance_admin: true
      }
    });

    if (users.length > 0) {
      res.status(400).json({ error: "already_setup" });
      return;
    }

    const password_hash = await argon2.hash(password);

    const existing_email = await prisma.user.findFirst({
      where: {
        email
      }
    });

    if (existing_email) {
      res.status(400).json({ error: "email_already_exists" });
      return;
    }

    const user = await prisma.user.create({
      data: {
        email: email,
        password_hash: password_hash,
        instance_admin: true
      }
    });

    if (!user) {
      res.status(500).json({ error: "internal_server_error" });
      return;
    }

    const token = Buffer.from(
      crypto.getRandomValues(new Uint8Array(64))
    ).toString("base64");

    await redis.set(
      "session:" + token,
      JSON.stringify({
        id: user.id,
        email: user.email
      }),
      "EX",
      60 * 60 * 24 * 30 * 6
    );

    await res.cookie("chiefsid", token, {
      maxAge: 1000 * 60 * 60 * 24 * 30 * 6
    });

    const organization = await prisma.organization.create({
      data: {
        name: "Default Organization",
        created_by_user_id: user.id,
        members: {
          create: {
            user_id: user.id,
            admin: true
          }
        }
      }
    });

    await res.cookie("chieforg", organization.id, {
      maxAge: 1000 * 60 * 60 * 24 * 30 * 6
    });

    res.json({
      ok: true
    });
  } catch (e) {
    res.status(500).json({
      error: "internal_server_error"
    });
  }
});

// @/auth/logout
router.get("/logout", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    if (req.user?.token) {
      redis.del("token:" + req.user?.token);
      await res.clearCookie("chiefsid");
    }

    res.json({
      ok: true
    });
  } catch (e) {
    await res.clearCookie("chiefsid");

    res.status(500).json({
      error: "internal_server_error"
    });
  }
});

export default router;
