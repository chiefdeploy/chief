import { Router } from "express";
import prisma from "../lib/prisma";
import { authMiddleware, type RequestWithUser } from "../lib/auth_middleware";
import { sendSocketToOrg, sendSocketToUser } from "../lib/redis";

const router = Router();

// @/logs/build/:build_id - get all logs
router.get(
  "/build/:build_id",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const build_id = req.params.build_id;

      const logs = (
        await prisma.buildLog.findMany({
          where: {
            build_id: build_id
          }
        })
      ).map((log: any) => ({
        ...log,
        type: "build"
      }));

      const deployment_logs = (
        await prisma.deploymentLog.findMany({
          where: {
            build_id: build_id
          }
        })
      ).map((log: any) => ({
        ...log,
        type: "deployment"
      }));

      res.json({
        ok: true,
        logs: [...logs, ...deployment_logs]
      });
    } catch (error) {
      res.status(500).json({
        error: "internal_server_error"
      });
    }
  }
);

router.get("/test", async (req, res) => {
  sendSocketToOrg("2d84cbfe-bbc1-453a-9813-7d167163d293", {
    event: "new_project_org"
  });

  sendSocketToUser("dabaee7a-ecfb-4797-9116-dd8f039c1cd1", {
    event: "new_project_user"
  });

  res.json({ ok: true });
});

export default router;
