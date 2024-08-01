import prisma from "./prisma";
import { BuildStatus } from "./build";
import { exec } from "child_process";
import { createDeploymentLog, LogLevel } from "./logs";
import { App } from "octokit";

async function send_command(
  command: string,
): Promise<{ ok: string; error: string | false; exitCode: number }> {
  try {
    const result = (await new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        const exitCode = error ? error.code : 0; // Capture exit code
        if (exitCode !== 0) {
          reject({
            stderr: stderr.toString(),
            stdout: stdout.toString(),
            exitCode,
          });
        } else {
          resolve({
            stdout: stdout.toString(),
            stderr: stderr.toString(),
            exitCode,
          });
        }
      });
    })) as any;

    console.log("Command output", result);

    return {
      ok: result.stdout || result.stderr,
      error: false,
      exitCode: result.exitCode,
    };
  } catch (error) {
    console.error("Error sending command", error);
    return {
      ok: error.stdout,
      error: error.stderr || error.message,
      exitCode: error.exitCode || 1,
    };
  }
}

function generate_caddyfile(domain: string, service_id: string, port: number) {
  if (port > 65535 || port < 1) {
    throw new Error("proxy port must be between 1 and 65535");
  }

  return `${domain}, www.${domain} {
  import pmain

  reverse_proxy ${service_id}:${port} :9999 {
    import proxy_headers
    lb_policy first
    lb_try_duration 1s
    lb_try_interval 5s
    fail_duration 5s

    transport http {
      dial_timeout 1s
    }
  }
}`;
}

export async function deploy_project(
  project_id: string,
  source_build_id?: string,
) {
  console.log("started deploying project", project_id, source_build_id);
  const project = await prisma.project.findFirst({
    where: {
      id: project_id,
    },
    include: {
      github_source: true,
      builds: {
        orderBy: {
          created_at: "desc",
        },
        take: 1,
      },
    },
  });

  if (!project) {
    console.log("deploying, project not found");
    return false;
  }

  const build = await prisma.build.findFirst({
    where: {
      id: source_build_id || project.builds[0].id,
    },
  });

  if (!build) {
    console.log("deploying, build not found");
    return false;
  }

  const build_id = source_build_id || project.builds[0].id;

  await prisma.build.update({
    where: {
      id: build_id,
    },
    data: {
      status: BuildStatus.deploying,
    },
  });

  const app = new App({
    appId: project.github_source.app_id,
    privateKey: project.github_source.pem,
  });

  const octokit = await app.getInstallationOctokit(
    Number(project.github_source.installation_id),
  );

  await createDeploymentLog(
    project.id,
    build.id,
    "Starting deployment.",
    LogLevel.INFO,
  );

  await octokit.rest.repos.createCommitStatus({
    owner: project.repository.split("/")[0],
    repo: project.repository.split("/")[1],
    sha: build.commit_id,
    state: "pending",
    context: "chief/deployment",
    description: "Starting deployment.",
    target_url: `https://${process.env.DOMAIN}/projects/${project.id}/builds/${build.id}`,
  });

  await createDeploymentLog(
    project.id,
    build.id,
    "Checking if previous deployment already exists.",
    LogLevel.INFO,
  );

  const { ok: does_deployment_exist, error: does_deployment_exist_error } =
    await send_command(`docker service inspect ${project.id}`);

  console.log("does deployment already exist?", does_deployment_exist);

  if (!does_deployment_exist_error) {
    const deployment = JSON.parse(does_deployment_exist.toString());

    console.log("deployment exists");

    await createDeploymentLog(
      project.id,
      build.id,
      "Deployment already exists, will update.",
      LogLevel.INFO,
    );

    const { ok: does_caddyfile_exist, error: does_caddyfile_exist_error } =
      await send_command(
        `if test -f /${project.id}.caddy; then echo "true"; else echo "false"; fi`,
      );

    console.log("caddyfile exists", does_caddyfile_exist);

    if (
      does_caddyfile_exist.toString() === "false\n" ||
      does_caddyfile_exist.toString() === "false"
    ) {
      await createDeploymentLog(
        project.id,
        build.id,
        "Generating proxy config.",
        LogLevel.INFO,
      );

      let domain = project.domain;

      console.log("domain", domain);

      const caddy_file = generate_caddyfile(
        domain,
        project.id,
        project.web_port,
      );

      const caddyfile_as_base64 = Buffer.from(caddy_file).toString("base64");

      const { ok: create_caddyfile, error: create_caddyfile_error } =
        await send_command(
          `echo "${caddyfile_as_base64}" | base64 --decode > /sites/${project.id}.caddy`,
        );

      if (create_caddyfile_error) {
        console.log({
          error: "failed_to_create_caddyfile",
        });

        await prisma.build.update({
          where: {
            id: build_id,
          },
          data: {
            deployed_at: new Date(),
            status: BuildStatus.failed_deploy,
          },
        });

        await octokit.rest.repos.createCommitStatus({
          owner: project.repository.split("/")[0],
          repo: project.repository.split("/")[1],
          sha: build.commit_id,
          state: "failure",
          context: "chief/deployment",
          description: "Failed to create proxy config.",
          target_url: `https://${process.env.DOMAIN}/projects/${project.id}/builds/${build.id}`,
        });

        await createDeploymentLog(
          project.id,
          build.id,
          "Failed to create proxy config.",
          LogLevel.ERROR,
        );

        return false;
      }

      console.log("caddyfile created.");

      await createDeploymentLog(
        project.id,
        build.id,
        "Proxy config created.",
        LogLevel.INFO,
      );
    }

    const env_vars = project.env_vars
      ? "--env-add " + project.env_vars.split("\n").join(" --env-add ")
      : "";

    await createDeploymentLog(
      project.id,
      build.id,
      "Updating service.",
      LogLevel.INFO,
    );

    const { ok: update_service_docker, error: update_service_docker_error } =
      await send_command(
        `docker service update --image ${project.id}:${build.commit_id} --force --with-registry-auth ${env_vars} --env-add PORT=${project.web_port} ${project.id}`,
      );

    if (update_service_docker_error) {
      console.log({
        error: "failed_to_update_service_docker",
      });

      await prisma.build.update({
        where: {
          id: build_id,
        },
        data: {
          deployed_at: new Date(),
          status: BuildStatus.failed_deploy,
        },
      });

      await octokit.rest.repos.createCommitStatus({
        owner: project.repository.split("/")[0],
        repo: project.repository.split("/")[1],
        sha: build.commit_id,
        state: "failure",
        context: "chief/deployment",
        description: "Failed to update service.",
        target_url: `https://${process.env.DOMAIN}/projects/${project.id}/builds/${build.id}`,
      });

      await createDeploymentLog(
        project.id,
        build.id,
        "Failed to update service.",
        LogLevel.ERROR,
      );

      return false;
    }

    await createDeploymentLog(
      project.id,
      build.id,
      update_service_docker.toString(),
      LogLevel.INFO,
    );

    await createDeploymentLog(
      project.id,
      build.id,
      "Service updated.",
      LogLevel.INFO,
    );

    await createDeploymentLog(
      project.id,
      build.id,
      "Applying proxy config.",
      LogLevel.INFO,
    );

    const { ok: refresh_caddy, error: refresh_caddy_error } =
      await send_command(
        `curl "http://chief_proxy:2019/load" -H "Content-Type: text/caddyfile" --data-binary @/Caddyfile --silent`,
      );

    if (refresh_caddy_error) {
      console.log({
        error: "failed_to_refresh_caddy",
      });

      await prisma.build.update({
        where: {
          id: build_id,
        },
        data: {
          deployed_at: new Date(),
          status: BuildStatus.failed_deploy,
        },
      });

      await octokit.rest.repos.createCommitStatus({
        owner: project.repository.split("/")[0],
        repo: project.repository.split("/")[1],
        sha: build.commit_id,
        state: "failure",
        context: "chief/deployment",
        description: "Failed to refresh proxy.",
        target_url: `https://${process.env.DOMAIN}/projects/${project.id}/builds/${build.id}`,
      });

      await createDeploymentLog(
        project.id,
        build.id,
        "Failed to apply proxy config.",
        LogLevel.ERROR,
      );

      return false;
    }

    console.log("caddy refreshed.");

    await createDeploymentLog(
      project.id,
      build.id,
      "Proxy config applied.",
      LogLevel.INFO,
    );

    await prisma.build.update({
      where: {
        id: build_id,
      },
      data: {
        deployed_at: new Date(),
        status: BuildStatus.deployed,
      },
    });

    await octokit.rest.repos.createCommitStatus({
      owner: project.repository.split("/")[0],
      repo: project.repository.split("/")[1],
      sha: build.commit_id,
      state: "success",
      context: "chief/deployment",
      description: "Project deployed successfully.",
      target_url: `https://${process.env.DOMAIN}/projects/${project.id}/builds/${build.id}`,
    });

    await createDeploymentLog(
      project.id,
      build.id,
      "Deployment successful.",
      LogLevel.INFO,
    );

    return {
      status: "success",
      update_service_docker,
    };
  } else {
    const env_vars = project.env_vars
      ? "-e " + project.env_vars.split("\n").join(" -e ")
      : "";

    console.log("new deployment...");

    await createDeploymentLog(
      project.id,
      build.id,
      "Creating new deployment.",
      LogLevel.INFO,
    );

    // create new service
    const { ok: create_deployment, error: create_deployment_error } =
      await send_command(`docker service create ${env_vars} -e PORT=${project.web_port} \
--replicas 1 \
--health-cmd "echo 1" \
--health-interval 1s \
--health-retries 1 \
--update-order=start-first \
--name ${project.id} \
--update-delay 1s \
--network chief \
${project.id}:${build.commit_id}`);

    if (create_deployment_error) {
      console.log({
        error: "failed_to_create_deployment",
      });

      await prisma.build.update({
        where: {
          id: build_id,
        },
        data: {
          deployed_at: new Date(),
          status: BuildStatus.failed_deploy,
        },
      });

      await octokit.rest.repos.createCommitStatus({
        owner: project.repository.split("/")[0],
        repo: project.repository.split("/")[1],
        sha: build.commit_id,
        state: "failure",
        context: "chief/deployment",
        description: "Failed to create deployment.",
        target_url: `https://${process.env.DOMAIN}/projects/${project.id}/builds/${build.id}`,
      });

      await createDeploymentLog(
        project.id,
        build.id,
        "Failed to create deployment.",
        LogLevel.ERROR,
      );

      return false;
    }

    await createDeploymentLog(
      project.id,
      build.id,
      create_deployment.toString(),
      LogLevel.INFO,
    );

    await createDeploymentLog(
      project.id,
      build.id,
      "Deployment created.",
      LogLevel.INFO,
    );

    await createDeploymentLog(
      project.id,
      build.id,
      "Checking deployment status.",
      LogLevel.INFO,
    );

    const { ok: get_deployment, error: get_deployment_error } =
      await send_command(`docker service inspect ${project.id}`);

    if (get_deployment_error) {
      console.log({
        error: "failed_to_get_deployment",
      });

      await prisma.build.update({
        where: {
          id: build_id,
        },
        data: {
          deployed_at: new Date(),
          status: BuildStatus.failed_deploy,
        },
      });

      await octokit.rest.repos.createCommitStatus({
        owner: project.repository.split("/")[0],
        repo: project.repository.split("/")[1],
        sha: build.commit_id,
        state: "failure",
        context: "chief/deployment",
        description: "Failed to get deployment.",
        target_url: `https://${process.env.DOMAIN}/projects/${project.id}/builds/${build.id}`,
      });

      await createDeploymentLog(
        project.id,
        build.id,
        "Failed to get deployment.",
        LogLevel.ERROR,
      );

      return false;
    }

    console.log("deployment retrieved.");

    await createDeploymentLog(
      project.id,
      build.id,
      "Deployment retrieved.",
      LogLevel.INFO,
    );

    const deployment = JSON.parse(get_deployment.toString());

    console.log("deployment", deployment);

    await createDeploymentLog(
      project.id,
      build.id,
      "Checking if proxy config exists.",
      LogLevel.INFO,
    );

    const { ok: does_caddyfile_exist, error: does_caddyfile_exist_error } =
      await send_command(
        `if test -f /sites/${project.id}.caddy; then echo "true"; else echo "false"; fi`,
      );

    console.log("does_caddyfile_exist", does_caddyfile_exist);

    if (
      does_caddyfile_exist.toString() === "false\n" ||
      does_caddyfile_exist.toString() === "false"
    ) {
      let domain = project.domain;

      console.log("domain", domain);

      await createDeploymentLog(
        project.id,
        build.id,
        "Generating proxy config.",
        LogLevel.INFO,
      );

      const caddy_file = generate_caddyfile(
        domain,
        project.id,
        project.web_port,
      );

      const caddyfile_as_base64 = Buffer.from(caddy_file).toString("base64");

      const { ok: create_caddyfile, error: create_caddyfile_error } =
        await send_command(
          `echo "${caddyfile_as_base64}" | base64 --decode > /sites/${project.id}.caddy`,
        );

      if (create_caddyfile_error) {
        console.log({
          error: "failed_to_create_caddyfile",
        });

        await prisma.build.update({
          where: {
            id: build_id,
          },
          data: {
            deployed_at: new Date(),
            status: BuildStatus.failed_deploy,
          },
        });

        await octokit.rest.repos.createCommitStatus({
          owner: project.repository.split("/")[0],
          repo: project.repository.split("/")[1],
          sha: build.commit_id,
          state: "failure",
          context: "chief/deployment",
          description: "Failed to create proxy config.",
          target_url: `https://${process.env.DOMAIN}/projects/${project.id}/builds/${build.id}`,
        });

        await createDeploymentLog(
          project.id,
          build.id,
          "Failed to create proxy config.",
          LogLevel.ERROR,
        );

        return false;
      }

      await createDeploymentLog(
        project.id,
        build.id,
        "Proxy config created.",
        LogLevel.INFO,
      );

      await createDeploymentLog(
        project.id,
        build.id,
        "Applying proxy config.",
        LogLevel.INFO,
      );

      const { ok: refresh_caddy, error: refresh_caddy_error } =
        await send_command(
          `curl "http://chief_proxy:2019/load" -H "Content-Type: text/caddyfile" --data-binary @/Caddyfile --silent`,
        );

      if (refresh_caddy_error) {
        console.log({
          error: "failed_to_refresh_caddy",
        });

        await prisma.build.update({
          where: {
            id: build_id,
          },
          data: {
            deployed_at: new Date(),
            status: BuildStatus.failed_deploy,
          },
        });

        await octokit.rest.repos.createCommitStatus({
          owner: project.repository.split("/")[0],
          repo: project.repository.split("/")[1],
          sha: build.commit_id,
          state: "failure",
          context: "chief/deployment",
          description: "Failed to refresh proxy.",
          target_url: `https://${process.env.DOMAIN}/projects/${project.id}/builds/${build.id}`,
        });

        await createDeploymentLog(
          project.id,
          build.id,
          "Failed to apply proxy config.",
          LogLevel.ERROR,
        );

        return false;
      }

      await createDeploymentLog(
        project.id,
        build.id,
        "Proxy config applied.",
        LogLevel.INFO,
      );

      await prisma.build.update({
        where: {
          id: build_id,
        },
        data: {
          deployed_at: new Date(),
          status: BuildStatus.deployed,
        },
      });

      await octokit.rest.repos.createCommitStatus({
        owner: project.repository.split("/")[0],
        repo: project.repository.split("/")[1],
        sha: build.commit_id,
        state: "success",
        context: "chief/deployment",
        description: "Project deployed successfully.",
        target_url: `https://${process.env.DOMAIN}/projects/${project.id}/builds/${build.id}`,
      });

      await createDeploymentLog(
        project.id,
        build.id,
        "Deployment successful. ✅",
        LogLevel.INFO,
      );

      return {
        status: "success",
        create_deployment,
        refresh_caddy,
      };
    }
  }

  return {
    status: "success",
    does_deployment_exist,
  };
}

/**
 * Delete the deployment of a project, including the proxy.
 * @param project_id
 * @returns
 */
export async function delete_deployment(project_id: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: project_id,
    },
    include: {
      github_source: true,
      builds: {
        orderBy: {
          created_at: "desc",
        },
        take: 1,
      },
    },
  });

  if (!project) {
    return false;
  }

  const { ok: delete_service, error: delete_service_error } =
    await send_command(`docker service rm ${project_id}`);

  if (delete_service_error) {
    console.log({
      error: "failed_to_delete_service",
    });
  }

  const { ok: delete_caddyfile, error: delete_caddyfile_error } =
    await send_command(`rm /sites/${project.id}.caddy`);

  if (delete_caddyfile_error) {
    console.log({
      error: "failed_to_delete_caddyfile",
    });
  }

  const { ok: refresh_caddy, error: refresh_caddy_error } = await send_command(
    `curl "http://chief_proxy:2019/load" -H "Content-Type: text/caddyfile" --data-binary @/Caddyfile --silent`,
  );

  if (refresh_caddy_error) {
    console.log({
      error: "failed_to_refresh_caddy",
    });
  }

  return {
    ok: true,
    status: "deleted",
  };
}
