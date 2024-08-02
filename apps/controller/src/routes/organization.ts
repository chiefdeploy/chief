import { Router } from "express";
import prisma from "../lib/prisma";
import { authMiddleware, type RequestWithUser } from "../lib/auth_middleware";
import { get_github_repositories } from "../lib/github";
import { create } from "domain";

const router = Router();

// @/organization/:id
router.get("/:id", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const organization = await prisma.organization.findFirst({
      where: {
        id: req.params.id
      },
      include: {
        members: {
          select: {
            user: {
              select: {
                id: true,
                email: true
              }
            }
          }
        },
        projects: {
          select: {
            id: true,
            name: true,

            active: true,
            suspended: true,

            repository: true,
            domain: true,

            created_at: true,
            updated_at: true,

            builds: {
              select: {
                id: true,
                status: true,
                commit_id: true,
                started_at: true,
                finished_at: true,
                deployed_at: true,
                created_at: true,
                updated_at: true
              },
              orderBy: {
                created_at: "desc"
              },
              take: 1
            }
          },
          orderBy: {
            created_at: "desc"
          }
        },
        github_sources: {
          select: {
            id: true,
            name: true,
            owner_avatar: true,
            owner_login: true,
            html_url: true,
            installation_id: true,
            created_at: true,
            added_by_user: {
              select: {
                id: true,
                email: true
              }
            }
          },
          orderBy: {
            created_at: "desc"
          }
        }
      }
    });

    if (!organization) {
      res.status(404).json({ error: "organization_not_found" });
      return;
    }

    res.json({
      ok: true,
      organization
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "internal_server_error" });
  }
});

router.get(
  "/:id/sources",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const organization = await prisma.organization.findFirst({
        where: {
          id: req.params.id
        }
      });

      if (!organization) {
        res.status(404).json({ error: "organization_not_found" });
        return;
      }

      const sources = await prisma.organizationGithubSource.findMany({
        where: {
          organization_id: organization.id
        },
        select: {
          id: true,
          app_id: true,
          name: true,
          owner_login: true,
          owner_avatar: true,
          installation_id: true,
          created_at: true,
          added_by_user: {
            select: {
              id: true,
              email: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.json({
        ok: true,
        sources: sources || []
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "internal_server_error" });
    }
  }
);

// @/organization/:id/repos
router.get("/:id/repos", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const sources = await prisma.organizationGithubSource.findMany({
      where: {
        organization_id: req.params.id
      }
    });

    if (!sources) {
      res.status(404).json({ error: "no_sources_found" });
      return;
    }

    let repos: any[] = [];

    for await (const source of sources) {
      if (!source.pem || !source.app_id) {
        continue;
      }

      const repo_for_source = await get_github_repositories(
        source.app_id,
        source.pem
      );

      repos = [
        ...repos,
        ...repo_for_source.repositories.map((repo: any) => ({
          ...repo,
          source_id: source.id
        }))
      ];
    }

    res.json({
      ok: true,
      repos: repos || []
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "internal_server_error" });
  }
});

// @/organization/:id/members
router.get(
  "/:id/members",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const organization = await prisma.organization.findFirst({
        where: {
          id: req.params.id,
          members: {
            some: {
              user_id: req.user!.id
            }
          }
        }
      });

      if (!organization) {
        res.status(404).json({ error: "organization_not_found" });
        return;
      }

      const organization_members = await prisma.organizationMember.findMany({
        where: {
          organization_id: organization.id
        },
        include: {
          user: {
            select: {
              id: true,
              email: true
            }
          }
        }
      });

      res.json({
        ok: true,
        members: organization_members.map((member) => ({
          id: member.id,
          user_id: member.user_id,
          user_email: member.user.email,
          admin: member.admin,
          owner: member.user_id === organization.created_by_user_id
        }))
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "internal_server_error" });
    }
  }
);

// @/organization/create
router.post("/create", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { name } = req.body;

    if (!name || name.length < 3 || name.length > 50) {
      res.status(400).json({ error: "invalid_organization_name" });
      return;
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        created_by_user_id: req.user?.id!
      }
    });

    const organization_member = await prisma.organizationMember.create({
      data: {
        organization_id: organization.id,
        user_id: req.user?.id!,
        admin: true
      }
    });

    res.json({
      ok: true,
      organization: organization,
      organization_member: organization_member
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "internal_server_error" });
  }
});

router.post("/select", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      res.status(400).json({ error: "missing_required_fields" });
      return;
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        organization_id: id,
        user_id: req.user!.id
      }
    });

    if (!member) {
      res.status(403).json({ error: "not_a_member" });
      return;
    }

    await res.cookie("chieforg", id, {
      maxAge: 1000 * 60 * 60 * 24 * 365 * 50
    });

    res.json({
      ok: true
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "internal_server_error" });
  }
});

router.post(
  "/:id/rename",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "missing_required_fields" });
        return;
      }

      const organization = await prisma.organization.findFirst({
        where: {
          id: id,
          members: {
            some: {
              user_id: req.user!.id,
              admin: true
            }
          }
        }
      });

      if (!organization) {
        res.status(404).json({ error: "organization_not_found" });
        return;
      }

      const { name } = req.body;

      if (!name || name.length < 3 || name.length > 50) {
        res.status(400).json({ error: "invalid_organization_name" });
        return;
      }

      await prisma.organization.update({
        where: {
          id: id
        },
        data: {
          name: name
        }
      });

      res.json({
        ok: true
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "internal_server_error" });
    }
  }
);

export default router;
