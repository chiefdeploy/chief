import { Router } from "express";
import prisma from "../lib/prisma";
import { authMiddleware, type RequestWithUser } from "../lib/auth_middleware";
import {
  create_postgres_service,
  create_redis_service,
  delete_postgres_service,
  delete_redis_service,
} from "../lib/workers/workers";

const router = Router();

router.get("/:org_id", authMiddleware, async (req, res) => {
  try {
    const { org_id } = req.params;

    if (!org_id) {
      res.status(400).json({ error: "missing_required_fields" });
      return;
    }

    const postgres_services = (
      await prisma.postgresInstance.findMany({
        where: {
          organization_id: org_id.toString(),
        },
      })
    ).map((service: any) => ({
      ...service,
      type: "postgres",
      port: "5432",
    }));

    const redis_services = (
      await prisma.redisInstance.findMany({
        where: {
          organization_id: org_id.toString(),
        },
      })
    ).map((service: any) => ({
      ...service,
      type: "redis",
      port: "6379",
    }));

    // sort by created_at
    const services = [...postgres_services, ...redis_services].sort(
      (a, b) => b.created_at.getTime() - a.created_at.getTime(),
    );

    res.status(200).json({
      ok: true,
      services: services,
    });
  } catch (error) {
    res.status(500).json({
      error: "failed_to_get_services",
    });
  }
});

router.get("/:org_id/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;

    let service: any = await prisma.postgresInstance.findFirst({
      where: {
        id: id,
      },
    });

    if (!service) {
      service = await prisma.redisInstance.findFirst({
        where: {
          id: id,
        },
      });
    }

    if (!service) {
      return res.status(404).json({
        error: "not_found",
      });
    }

    res.status(200).json({
      ok: true,
      service: service,
    });
  } catch (error) {
    res.status(500).json({
      error: "failed_to_get_services",
    });
  }
});

router.post(
  "/:org_id/postgres",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    const { name, db_name, image } = req.body;
    const { org_id } = req.params;

    if (!name || !db_name || !org_id) {
      res.status(400).json({ error: "missing_required_fields" });
      return;
    }

    if (!db_name.match(/^[a-z0-9_-]+$/) || db_name.length > 60) {
      res.status(400).json({ error: "invalid_db_name" });
      return;
    }

    if (image && !(image === "14" || image === "15" || image === "16")) {
      res.status(400).json({ error: "invalid_image" });
      return;
    }

    try {
      const member = await prisma.organizationMember.findFirst({
        where: {
          organization_id: org_id,
          user_id: req.user!.id,
        },
      });

      if (!member) {
        res.status(403).json({ error: "invalid_organization" });
        return;
      }

      await create_postgres_service(name, db_name, image || 16, org_id);

      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({
        error: "failed_to_create_postgres_service",
      });
    }
  },
);

router.post(
  "/:org_id/redis",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    const { name } = req.body;
    const { org_id } = req.params;

    if (!name || !org_id) {
      res.status(400).json({ error: "missing_required_fields" });
      return;
    }

    try {
      const member = await prisma.organizationMember.findFirst({
        where: {
          organization_id: org_id,
          user_id: req.user!.id,
        },
      });

      if (!member) {
        res.status(403).json({ error: "invalid_organization" });
        return;
      }

      await create_redis_service(name, org_id);

      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({
        error: "failed_to_create_redis_service",
      });
    }
  },
);

router.delete(
  "/postgres/:id",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    const { id } = req.params;

    if (!id) {
      res.status(400).send("ID is required");
      return;
    }

    try {
      const service = await prisma.postgresInstance.findFirst({
        where: {
          id: id,
        },
      });

      if (!service) {
        return res.status(404).json({
          error: "not_found",
        });
      }

      delete_postgres_service(id);

      res.json({ ok: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: "failed_to_delete_service",
      });
    }
  },
);

router.delete(
  "/redis/:id",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    const { id } = req.params;

    if (!id) {
      res.status(400).send("ID is required");
      return;
    }

    try {
      const service = await prisma.redisInstance.findFirst({
        where: {
          id: id,
        },
      });

      if (!service) {
        return res.status(404).json({
          error: "not_found",
        });
      }

      delete_redis_service(id);

      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({
        error: "failed_to_delete_service",
      });
    }
  },
);

router.post(
  "/:service_id/transfer",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    const { org_id, type } = req.body;
    const { service_id } = req.params;

    if (!service_id || !org_id) {
      res.status(400).json({ error: "missing_required_fields" });
      return;
    }

    if (type !== "postgres" && type !== "redis") {
      res.status(400).json({ error: "invalid_service_type" });
      return;
    }

    try {
      if (type === "postgres") {
        const service = await prisma.postgresInstance.findFirst({
          where: {
            id: service_id,
            organization: {
              members: {
                some: {
                  user_id: req.user!.id,
                },
              },
            },
          },
        });

        if (!service) {
          return res.status(404).json({
            error: "not_found",
          });
        }

        const member = await prisma.organizationMember.findFirst({
          where: {
            organization_id: org_id,
            user_id: req.user!.id,
          },
        });

        if (!member) {
          return res.status(403).json({
            error: "not_a_member",
          });
        }

        await prisma.postgresInstance.update({
          where: {
            id: service_id,
          },
          data: {
            organization_id: org_id,
          },
        });
      } else if (type === "redis") {
        const service = await prisma.redisInstance.findFirst({
          where: {
            id: service_id,
            organization: {
              members: {
                some: {
                  user_id: req.user!.id,
                },
              },
            },
          },
        });

        if (!service) {
          return res.status(404).json({
            error: "not_found",
          });
        }

        const member = await prisma.organizationMember.findFirst({
          where: {
            organization_id: org_id,
            user_id: req.user!.id,
          },
        });

        if (!member) {
          return res.status(403).json({
            error: "not_a_member",
          });
        }

        await prisma.redisInstance.update({
          where: {
            id: service_id,
          },
          data: {
            organization_id: org_id,
          },
        });

        res.json({ ok: true });
      }

      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({
        error: "failed_to_transfer_service",
      });
    }
  },
);

export default router;
