import { randomUUID } from "crypto";
import prisma from "./prisma";
import { sendSocketToOrg, sendSocketToUser } from "./redis";

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR"
}

/**
 * Creates build log entry.
 * @param project_id Project ID
 * @param build_id Build ID
 * @param body Log body
 * @param level Log level (DEBUG, INFO, WARN, ERROR)
 */
export async function createBuildLog(
  project_id: string,
  build_id: string,
  body: string,
  level: LogLevel
) {
  const project = await prisma.project.findFirst({
    where: {
      id: project_id
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
    return false;
  }

  const build = await prisma.build.findFirst({
    where: {
      id: build_id
    }
  });

  await prisma.buildLog.create({
    data: {
      body: body,
      level: level,
      project_id: project_id,
      build_id: build_id
    }
  });

  const build_logs = (
    await prisma.buildLog.findMany({
      where: {
        project_id: project_id,
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
        project_id: project_id,
        build_id: build_id
      }
    })
  ).map((log: any) => ({
    ...log,
    type: "deploy"
  }));

  sendSocketToOrg(project.organization_id, {
    event: "new_build_log",
    project: project,
    build: build,
    logs: [...build_logs, ...deployment_logs]
  });
}

/**
 * Creates deployment log entry.
 * @param project_id Project ID
 * @param build_id Build ID
 * @param body Log body
 * @param level Log level (DEBUG, INFO, WARN, ERROR)
 */
export async function createDeploymentLog(
  project_id: string,
  build_id: string,
  body: string,
  level: LogLevel
) {
  const project = await prisma.project.findFirst({
    where: {
      id: project_id
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
    return false;
  }

  const build = await prisma.build.findFirst({
    where: {
      id: build_id
    }
  });

  await prisma.deploymentLog.create({
    data: {
      body: body,
      level: level,
      project_id: project_id,
      build_id: build_id
    }
  });

  const build_logs = (
    await prisma.buildLog.findMany({
      where: {
        project_id: project_id,
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
        project_id: project_id,
        build_id: build_id
      }
    })
  ).map((log: any) => ({
    ...log,
    type: "deploy"
  }));

  sendSocketToOrg(project.organization_id, {
    event: "new_deployment_log",
    project: project,
    build: build,
    logs: [...build_logs, ...deployment_logs]
  });
}
