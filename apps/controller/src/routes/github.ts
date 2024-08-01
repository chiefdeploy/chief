import { Router } from "express";
import prisma from "../lib/prisma";
import { authMiddleware, type RequestWithUser } from "../lib/auth_middleware";

import { APP_DOMAIN } from "../lib/constants";
import { deploy_and_build } from "../lib/workers/workers";
import generate_name from "../lib/word_generator";
import { generate_id } from "../lib/utils";
import { get_github_repositories } from "../lib/github";
import { App } from "octokit";

const router = Router();

router.post("/create", authMiddleware, async (req: RequestWithUser, res) => {
  const { org_id } = req.body;

  if (!org_id) {
    return res.status(400).json({ error: "missing_required_fields" });
  }

  try {
    const org = await prisma.organization.findFirst({
      where: {
        id: org_id,
      },
    });

    if (!org) {
      return res.status(404).json({ error: "organization_not_found" });
    }

    const name = "chief-" + generate_name(2) + "-" + generate_id(6);

    const source = await prisma.organizationGithubSource.create({
      data: {
        name: name,
        organization_id: org.id,
        added_by_user_id: req.user!.id,
      },
    });

    res.json({
      ok: true,
      source_id: source.id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "internal_server_error" });
  }
});

router.get("/redirect", authMiddleware, async (req: RequestWithUser, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "missing_required_fields" });
  }

  try {
    const response: any = await fetch(
      `https://api.github.com/app-manifests/${code}/conversions`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
      },
    )
      .then((res) => res.json())
      .catch((err) => {
        throw new Error(err);
      });

    if (response.html_url && response.name) {
      const source = await prisma.organizationGithubSource.update({
        where: {
          name: response.name.toString(),
        },
        data: {
          app_id: response.id.toString(),
          owner_login: response.owner.login,
          owner_avatar: response.owner.avatar_url,
          html_url: response.html_url,
          client_id: response.client_id,
          webhook_secret: response.webhook_secret,
          pem: response.pem,
          client_secret: response.client_secret,
        },
      });

      const install_url = response.html_url + "/installations/new";

      return res.status(302).redirect(install_url.toString());
    } else {
      return res
        .status(500)
        .send("error - failed_to_get_install_url - try again");
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send("error - failed_to_get_install_url - try again");
  }
});

router.get("/install", async (req, res) => {
  const { installation_id, setup_action } = req.query;

  if (!installation_id || !setup_action) {
    return res.status(400).json({ error: "missing_required_fields" });
  }

  return res.redirect("/sources");
});

router.post("/events", async (req, res) => {
  console.log("/events", req.body);

  try {
    const { action, ref, repository } = req.body;

    // TODO: validate the webhook secret

    // New GitHub App installation
    if ((action && action === "created") || (action && action === "added")) {
      const { installation } = req.body;

      await prisma.organizationGithubSource.updateMany({
        where: {
          app_id: installation.app_id.toString(),
        },
        data: {
          installation_id: installation.id.toString(),
        },
      });
    }

    // Deploy project on push to default branch
    if (ref && repository && repository.default_branch === ref.split("/")[2]) {
      const { installation } = req.body;

      const source = await prisma.organizationGithubSource.findFirst({
        where: {
          installation_id: installation.id.toString(),
        },
      });

      if (!source) {
        return res.send("ok");
      }

      const project = await prisma.project.findMany({
        where: {
          repository: repository.full_name,
        },
      });

      if (project && project.length > 0) {
        for (const proj of project) {
          if (proj.id) await deploy_and_build(proj.id);
        }
      }
    }

    res.send("ok");
  } catch (error) {
    console.log(error);
    res.send("ok");
  }
});

router.get("/callback", authMiddleware, async (req: RequestWithUser, res) => {
  res.redirect("/");
});

router.get("/:id", authMiddleware, async (req: RequestWithUser, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "missing_required_fields" });
  }

  try {
    const source = await prisma.organizationGithubSource.findFirst({
      where: {
        id: id,
        organization: {
          members: {
            some: {
              user_id: req.user!.id,
            },
          },
        },
      },
    });

    if (!source) {
      return res.status(404).json({ error: "source_not_found" });
    }

    const domain = process.env.DOMAIN;

    const manifest_string = JSON.stringify({
      name: source.name,
      url: `https://${domain}`,
      hook_attributes: {
        url: `https://${domain}/api/github/events`,
        active: true,
      },
      redirect_url: `https://${domain}/api/github/redirect`,
      callback_urls: [`https://${domain}/api/github/callback`],
      public: false,
      request_oauth_on_install: false,
      setup_url: `https://${domain}/api/github/install`,
      setup_on_update: true,
      default_permissions: {
        contents: "read",
        metadata: "read",
        emails: "read",
        administration: "read",
        pull_requests: "write",
        statuses: "write",
      },
      default_events: ["pull_request", "push"],
    });

    res.json({
      ok: true,
      manifest_string: manifest_string,
      source: {
        id: source.id,
        name: source.name,
        owner_login: source.owner_login,
        owner_avatar: source.owner_avatar,
        html_url: source.html_url,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "internal_server_error" });
  }
});

router.get("/:id/repos", authMiddleware, async (req: RequestWithUser, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "missing_required_fields" });
  }

  try {
    const source = await prisma.organizationGithubSource.findFirst({
      where: {
        id: id,
      },
    });

    if (!source || !source.app_id || !source.pem) {
      return res.status(404).json({ error: "source_not_found" });
    }

    const repos = await get_github_repositories(source.app_id, source.pem);

    res.json({
      ok: true,
      ...repos,
    });
  } catch (error) {
    res.status(500).json({ error: "internal_server_error" });
  }
});

router.delete("/:id", authMiddleware, async (req: RequestWithUser, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "missing_required_fields" });
  }

  try {
    const source = await prisma.organizationGithubSource.findFirst({
      where: {
        id: id,
        organization: {
          members: {
            some: {
              user_id: req.user!.id,
            },
          },
        },
      },
    });

    if (!source) {
      return res.status(404).json({ error: "source_not_found" });
    }

    try {
      await prisma.organizationGithubSource.delete({
        where: {
          id: id,
        },
      });
    } catch (error) {
      res.status(400).json({ error: "failed_to_delete_source" });
    }

    res.json({
      ok: true,
    });
  } catch (error) {
    res.status(500).json({ error: "internal_server_error" });
  }
});

export default router;
