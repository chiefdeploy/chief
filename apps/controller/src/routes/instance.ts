import { Router } from "express";

import { authMiddleware, type RequestWithUser } from "../lib/auth_middleware";
import prisma from "../lib/prisma";
import word_generator from "../lib/word_generator";
import { setup_instance, test_instance_key } from "../lib/setup_instance";

const router = Router();

function generate_id() {
  return word_generator(2);
}

router.get("/", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.user?.id,
        instance_admin: true
      }
    });

    if (!user) {
      return res.status(403).json({
        error: "invalid_permissions"
      });
    }

    const instances = await prisma.instance.findMany({
      select: {
        id: true,
        ssh_ip: true,
        created_at: true,
        updated_at: true,
        type: true
      }
    });

    res.json({
      ok: true,
      instances:
        instances.length > 0
          ? instances.map((instance: any) => {
              const status = "unknown";

              return {
                ...instance,
                status: status
              };
            })
          : []
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "internal_server_error"
    });
  }
});

router.get("/:id", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.user?.id,
        instance_admin: true
      }
    });

    if (!user) {
      return res.status(403).json({
        error: "invalid_permissions"
      });
    }

    const instance = await prisma.instance.findFirst({
      where: {
        id: req.params.id
      },
      select: {
        id: true,
        ssh_ip: true,
        created_at: true,
        updated_at: true,
        type: true
      }
    });

    if (!instance) {
      return res.status(404).json({
        error: "instance_not_found"
      });
    }

    res.json({
      ok: true,
      instance: {
        ...instance,
        status: "unknown"
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "internal_server_error"
    });
  }
});

router.post("/", authMiddleware, async (req: RequestWithUser, res) => {
  const { ssh_ip, ssh_username, ssh_key } = req.body;

  if (!ssh_ip || !ssh_username || !ssh_key) {
    return res.status(400).json({
      error: "missing_required_fields"
    });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.user?.id,
        instance_admin: true
      }
    });

    if (!user) {
      return res.status(403).json({
        error: "invalid_permissions"
      });
    }
    try {
      const test_key = await test_instance_key(ssh_ip, ssh_username, ssh_key);

      if (!test_key) {
        return res.status(400).json({
          error: "could_not_connect"
        });
      }
    } catch (error) {
      return res.status(400).json({
        error: "could_not_connect"
      });
    }

    let id;
    let exists = true;

    while (exists) {
      id = generate_id();

      const ins = await prisma.instance.findFirst({
        where: {
          id: id
        }
      });

      if (!ins) {
        exists = false;
        break;
      }
    }

    const instance = await prisma.instance.create({
      data: {
        id: id,
        ssh_ip: ssh_ip,
        ssh_username: ssh_username,
        ssh_key: ssh_key,
        report_key: crypto.randomUUID()
      }
    });

    await setup_instance(ssh_ip, ssh_username, ssh_key);

    res.json({
      ok: true,
      instance: instance
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "internal_server_error"
    });
  }
});

router.post("/local", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.user?.id,
        instance_admin: true
      }
    });

    if (!user) {
      return res.status(403).json({
        error: "invalid_permissions"
      });
    }

    const already_exists = await prisma.instance.findFirst({
      where: {
        id: "local",
        type: "LOCAL"
      }
    });

    if (already_exists) {
      return res.status(400).json({
        error: "instance_already_exists"
      });
    }

    const instance = await prisma.instance.create({
      data: {
        id: "local",
        report_key: crypto.randomUUID(),
        type: "LOCAL"
      }
    });

    // TODO: install reporting agent on local instance

    res.json({
      ok: true,
      instance: instance
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "internal_server_error"
    });
  }
});

export default router;
