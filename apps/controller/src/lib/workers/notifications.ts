import { Build, prisma, Project } from "@chief/db";
import { APP_DOMAIN } from "../constants";

export enum NotificationType {
  SuccessfulDeploy = "successful_deploy",
  FailedDeploy = "failed_deploy",
  FailedBuild = "failed_build"
}

/**
 * Send a notification about a build or deploy event.
 * @param type Type of the notification.
 * @param project Project that the notification is about.
 * @param build Build that the notification is about.
 */
export async function send_notification_worker(
  type: NotificationType,
  build: Build
) {
  const project = await prisma.project.findUnique({
    where: {
      id: build.project_id
    },
    include: {
      notification_endpoints: {
        include: {
          notification_endpoint: true
        }
      }
    }
  });

  if (!project) {
    return;
  }

  const endpoints = project.notification_endpoints;

  if (endpoints.length === 0) {
    return;
  }

  for (const endpoint of endpoints) {
    let message;

    if (type === NotificationType.SuccessfulDeploy) {
      message = `Build **[${build.id.substring(0, 7)}](https://${APP_DOMAIN}/projects/${project.id}/builds/${build.id})** for **[${project.name}](https://${APP_DOMAIN}/projects/${project.id})** (${project.domain}) has been deployed successfully.`;
    } else if (type === NotificationType.FailedDeploy) {
      message = `Deployment **[${build.id.substring(0, 7)}](https://${APP_DOMAIN}/projects/${project.id}/builds/${build.id})** for **[${project.name}](https://${APP_DOMAIN}/projects/${project.id})** failed.`;
    } else if (type === NotificationType.FailedBuild) {
      message = `Build **[${build.id.substring(0, 7)}](https://${APP_DOMAIN}/projects/${project.id}/builds/${build.id})** for **[${project.name}](https://${APP_DOMAIN}/projects/${project.id})** failed.`;
    } else {
      return;
    }

    switch (endpoint.notification_endpoint.type) {
      case "DISCORD":
        await send_discord_notification(
          message,
          endpoint.notification_endpoint.endpoint
        );
        break;
      case "SLACK":
        await send_slack_notification(
          message,
          endpoint.notification_endpoint.endpoint
        );
        break;
      case "WEBHOOK":
        await send_webhook_notification(
          build.id,
          project.id,
          type,
          message,
          endpoint.notification_endpoint.endpoint
        );
        break;
    }
  }
}

async function send_discord_notification(message: string, webhook_url: string) {
  try {
    await fetch(webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: message,
        username: "Chief",
        avatar_url:
          "https://chief-marketing.s3.eu-central-1.amazonaws.com/avatar.jpg",
        flags: 4
      })
    });
  } catch (_e) {
    /* ignore */
  }
}

async function send_slack_notification(message: string, webhook_url: string) {
  try {
    await fetch(webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: message
      })
    });
  } catch (_e) {
    /* ignore */
  }
}

async function send_webhook_notification(
  build_id: string,
  project_id: string,
  type: NotificationType,
  message: string,
  webhook_url: string
) {
  try {
    await fetch(webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        build_id,
        project_id,
        type,
        message
      })
    });
  } catch (_e) {
    /* ignore */
  }
}
