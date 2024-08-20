import { Router } from "express";
import { build_project } from "../lib/build";
import { authMiddleware, type RequestWithUser } from "../lib/auth_middleware";
import prisma from "../lib/prisma";
import { delete_deployment, deploy_project } from "../lib/deploy";
import { APP_DOMAIN } from "../lib/constants";
import { deploy_and_build } from "../lib/workers/workers";
import { error } from "console";

const router = Router();

// GET @/project/:project_id
router.get(
  "/:project_id",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    const { project_id } = req.params;

    try {
      const project = await prisma.project.findFirst({
        where: {
          id: project_id,
          organization: {
            members: {
              some: {
                user_id: req.user!.id
              }
            }
          }
        },
        include: {
          builds: {
            orderBy: {
              created_at: "desc"
            }
          }
        }
      });

      if (!project) {
        res.status(404).json({
          error: "project_not_found"
        });
        return;
      }

      res.json({
        ok: true,
        project: project
      });
    } catch (error) {
      res.status(500).json({
        error: "internal_server_error"
      });
    }
  }
);

// POST @/project/:project:id/deploy
router.post(
  "/:project_id/deploy",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    const { project_id } = req.params;

    if (!project_id) {
      res.status(400).send("ID is required");
      return;
    }

    try {
      const project = await prisma.project.findFirst({
        where: {
          id: project_id,
          organization: {
            members: {
              some: {
                user_id: req.user!.id
              }
            }
          }
        }
      });

      if (!project) {
        return res.status(404).json({
          error: "project_not_found"
        });
      }

      const deploy = await deploy_project(project_id);

      res.json({ deploy });
    } catch (error) {
      res.status(500).json({
        error: "failed_deploy"
      });
    }
  }
);

// DELETE @/project/:project:id/deployment
router.delete(
  "/:project_id/deployment",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    const { project_id } = req.params;

    if (!project_id) {
      res.status(400).send("ID is required");
      return;
    }

    try {
      const project = await prisma.project.findFirst({
        where: {
          id: project_id,
          organization: {
            members: {
              some: {
                user_id: req.user!.id
              }
            }
          }
        }
      });

      if (!project) {
        return res.status(404).json({
          error: "project_not_found"
        });
      }

      const deleting = await delete_deployment(project_id);

      res.json({ ok: true, deleting });
    } catch (error) {
      res.status(500).json({
        error: "failed_deploy"
      });
    }
  }
);

// POST @/project/create
router.post("/create", authMiddleware, async (req: RequestWithUser, res) => {
  const { org_id, name, repo_name, source_id, domain, port, envs, type } =
    req.body;

  if (!org_id || !repo_name || !source_id || !type || !domain) {
    res.status(400).json({ error: "missing_required_fields" });
    return;
  }

  if (type !== "NIXPACKS" && type !== "DOCKER") {
    res.status(400).json({ error: "invalid_project_type" });
    return;
  }

  try {
    const org = await prisma.organization.findFirst({
      where: {
        id: org_id,
        members: {
          some: {
            user_id: req.user!.id
          }
        }
      }
    });

    if (!org) {
      res.status(404).json({
        error: "organization_not_found"
      });
      return;
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        organization_id: org_id,
        user_id: req.user!.id
      }
    });

    if (!member) {
      res.status(403).send({
        error: "not_a_member"
      });
      return;
    }

    const source = await prisma.organizationGithubSource.findFirst({
      where: {
        id: source_id
      }
    });

    if (!source) {
      res.status(404).send("Source not found");
      return;
    }

    const project = await prisma.project.create({
      data: {
        name: name,
        repository: repo_name,
        domain: domain,
        web_port: Number(port),
        env_vars: envs,
        github_source_id: source_id,
        organization_id: org_id,
        web_proxy: true,
        type: type.toUpperCase(),
        instance_id: "local"
      }
    });

    await deploy_and_build(project.id);

    res.json({ ok: true, project });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "internal_server_error", message: e });
  }
});

// POST @/project/:id/build
router.post("/:id/build", authMiddleware, async (req: RequestWithUser, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).send("ID is required");
    return;
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: id,
        organization: {
          members: {
            some: {
              user_id: req.user!.id
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        error: "project_not_found"
      });
    }

    const build = await build_project(id, "manual", req.user!.id);

    res.json({ build });
  } catch (error) {
    res.status(500).json({
      error: "failed_build",
      message: error
    });
  }
});

// DELETE @/project/:id
router.delete("/:id", authMiddleware, async (req: RequestWithUser, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).send("ID is required");
    return;
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: id,
        organization: {
          members: {
            some: {
              user_id: req.user!.id
            }
          }
        }
      },
      include: {
        github_source: true
      }
    });

    if (!project) {
      return res.status(404).json({
        error: "project_not_found"
      });
    }

    await delete_deployment(id);

    await prisma.build.deleteMany({
      where: {
        project_id: id
      }
    });

    await prisma.projectNotificationEndpoint.deleteMany({
      where: {
        project_id: id
      }
    });

    await prisma.project.delete({
      where: {
        id: id
      }
    });

    res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      error: "failed_deleting_project"
    });
  }
});

// GET @/project/:id/builds
router.get("/:id/builds", authMiddleware, async (req: RequestWithUser, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).send("ID is required");
    return;
  }

  try {
    const builds = await prisma.build.findMany({
      where: {
        project_id: id,
        project: {
          organization: {
            members: {
              some: {
                user_id: req.user!.id
              }
            }
          }
        }
      }
    });

    res.json({ ok: true, builds });
  } catch (error) {
    res.status(500).json({
      error: "failed_get_builds"
    });
  }
});

// GET @/project/:id/builds/:id
router.get(
  "/:id/builds/:build_id",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    const { id } = req.params;

    if (!id) {
      res.status(400).send("ID is required");
      return;
    }

    try {
      const build = await prisma.build.findFirst({
        where: {
          id: req.params.build_id,
          project: {
            organization: {
              members: {
                some: {
                  user_id: req.user!.id
                }
              }
            }
          }
        }
      });

      if (!build) {
        res.status(404).json({
          error: "not_found"
        });
        return;
      }

      res.json({ ok: true, build });
    } catch (error) {
      res.status(500).json({
        error: "failed_get_build"
      });
    }
  }
);

// POST @/project/:id/builds/trigger
router.post(
  "/:id/builds/trigger",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    const { id } = req.params;

    if (!id) {
      res.status(400).send("ID is required");
      return;
    }

    try {
      const project = await prisma.project.findFirst({
        where: {
          id: id,
          organization: {
            members: {
              some: {
                user_id: req.user!.id
              }
            }
          }
        }
      });

      if (!project) {
        return res.status(404).json({
          error: "project_not_found"
        });
      }

      await deploy_and_build(project.id);

      res.json({ ok: true });
    } catch (error) {
      return res.status(500).json({
        error: "failed_trigger_build"
      });
    }
  }
);

// GET @/project/:id/envs
router.get("/:id/envs", authMiddleware, async (req: RequestWithUser, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).send("ID is required");
    return;
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: id,
        organization: {
          members: {
            some: {
              user_id: req.user!.id
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        error: "project_not_found"
      });
    }

    res.json({ ok: true, envs: project.env_vars });
  } catch (error) {
    res.status(500).json({
      error: "failed_get_envs"
    });
  }
});

// POST @/project/:id/envs
router.post("/:id/envs", authMiddleware, async (req: RequestWithUser, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).send("ID is required");
    return;
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: id,
        organization: {
          members: {
            some: {
              user_id: req.user!.id
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        error: "project_not_found"
      });
    }

    const env_vars = req.body.env_vars;

    if (!env_vars) {
      return res.status(400).json({
        error: "env_vars_not_provided"
      });
    }

    await prisma.project.update({
      where: {
        id: id
      },
      data: {
        env_vars: env_vars
      }
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({
      error: "failed_to_update_envs"
    });
  }
});

router.post(
  "/:project_id/transfer",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    const { org_id } = req.body;
    const { project_id } = req.params;

    if (!project_id || !org_id) {
      res.status(400).json({
        error: "missing_required_fields"
      });
      return;
    }

    try {
      const project = await prisma.project.findFirst({
        where: {
          id: project_id,
          organization: {
            members: {
              some: {
                user_id: req.user!.id
              }
            }
          }
        }
      });

      if (!project) {
        return res.status(404).json({
          error: "project_not_found"
        });
      }

      const member = await prisma.organizationMember.findFirst({
        where: {
          organization_id: org_id,
          user_id: req.user!.id
        }
      });

      if (!member) {
        return res.status(403).json({
          error: "not_a_member"
        });
      }

      await prisma.project.update({
        where: {
          id: project_id
        },
        data: {
          organization_id: org_id
        }
      });

      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({
        error: "failed_to_transfer_project"
      });
    }
  }
);

// POST @/project/:id/notification-endpoint
router.post(
  "/:id/notification-endpoint",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    const { id } = req.params;

    try {
      const { endpoint_id } = req.body;

      if (!endpoint_id) {
        res.status(400).json({ error: "missing_required_fields" });
        return;
      }

      const endpoint = await prisma.organizationNotificationEndpoint.findFirst({
        where: {
          id: endpoint_id
        }
      });

      if (!endpoint) {
        res.status(404).json({ error: "invalid_endpoint" });
        return;
      }

      await prisma.projectNotificationEndpoint.create({
        data: {
          project_id: id,
          notification_endpoint_id: endpoint_id
        }
      });

      res.json({ ok: true });
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "internal_server_error" });
    }
  }
);

// GET @/project/:id/notification-endpoints
router.get(
  "/:id/notification-endpoints",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    const { id } = req.params;

    try {
      const endpoints = await prisma.projectNotificationEndpoint.findMany({
        where: {
          project_id: id,
          project: {
            organization: {
              members: {
                some: {
                  user_id: req.user!.id
                }
              }
            }
          }
        },
        select: {
          notification_endpoint: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        }
      });

      res.json({ ok: true, endpoints: endpoints || [] });
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "internal_server_error" });
    }
  }
);

// DELETE @/project/:id/notification-endpoint/:endpoint_id
router.delete(
  "/:id/notification-endpoint/:endpoint_id",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    const { id, endpoint_id } = req.params;

    try {
      const project = await prisma.project.findFirst({
        where: {
          id: id,
          organization: {
            members: {
              some: {
                user_id: req.user!.id
              }
            }
          }
        }
      });

      if (!project) {
        return res.status(404).json({ error: "project_not_found" });
      }

      await prisma.projectNotificationEndpoint.deleteMany({
        where: {
          project_id: id,
          notification_endpoint_id: endpoint_id
        }
      });

      res.json({ ok: true });
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "internal_server_error" });
    }
  }
);

export default router;
