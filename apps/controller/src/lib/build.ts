import { App } from "octokit";
import { createBuildLog, LogLevel } from "./logs";
import prisma from "./prisma";
import { exec } from "child_process";
import { send_notification } from "./workers/workers";
import { NotificationType } from "./workers/notifications";

async function send_command(
  command: string
): Promise<{ ok: string; error: string | false }> {
  try {
    const { stdout, stderr } = (await new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    })) as any;

    console.log("Command output", command, { stdout, stderr });

    return {
      ok: stdout.toString() || stderr.toString(),
      error: false
    };
  } catch (error) {
    console.error("Error sending command", error);
    return { ok: "", error: error.message };
  }
}

export enum BuildStatus {
  pending = "pending",
  downloading = "downloading",
  building = "building",
  deploying = "deploying",
  deployed = "deployed",
  failed_download = "failed_download",
  failed_build = "failed_build",
  failed_deploy = "failed_deploy"
}

export async function build_project(
  project_id: string,
  trigger: "manual" | "automatic",
  triggered_by_user_id?: string
) {
  const project = await prisma.project.findFirst({
    where: {
      id: project_id
    },
    include: {
      github_source: true
    }
  });

  if (
    !project ||
    !project.github_source ||
    !project.github_source.app_id ||
    !project.github_source.pem ||
    !project.github_source.installation_id
  ) {
    return false;
  }

  console.log("Build started for project", project.name, project.id);

  const app = new App({
    appId: project.github_source.app_id,
    privateKey: project.github_source.pem
  });

  // get commit metadata

  const octokit = await app.getInstallationOctokit(
    Number(project.github_source.installation_id)
  );

  const repo = (
    await octokit.rest.repos.get({
      owner: project.repository.split("/")[0],
      repo: project.repository.split("/")[1]
    })
  ).data;

  const commit = (
    await octokit.rest.repos.getCommit({
      owner: project.repository.split("/")[0],
      repo: project.repository.split("/")[1],
      ref: "main"
    })
  ).data;

  if (!commit || !repo) {
    return {
      status: "failed_download"
    };
  }

  const build = await prisma.build.create({
    data: {
      project_id: project_id,
      triggered: trigger,
      triggered_by_user_id: triggered_by_user_id || null,
      started_at: new Date(),
      commit_id: commit.sha,
      status: BuildStatus.downloading
    }
  });

  await createBuildLog(project.id, build.id, "Build started.", LogLevel.INFO);

  await prisma.build.update({
    where: {
      id: build.id
    },
    data: {
      status: BuildStatus.downloading
    }
  });

  await octokit.rest.repos.createCommitStatus({
    owner: project.repository.split("/")[0],
    repo: project.repository.split("/")[1],
    sha: commit.sha,
    state: "pending",
    context: "chief/build",
    description: "Building project.",
    target_url: `https://${process.env.DOMAIN}/projects/${project.id}/builds/${build.id}`
  });

  // create build folder

  await createBuildLog(
    project.id,
    build.id,
    "Creating build folder.",
    LogLevel.INFO
  );

  const { ok: create_folder, error: create_folder_error } = await send_command(
    `mkdir -p /tmp/builder/${build.id}`
  );

  await createBuildLog(project.id, build.id, "Folder created.", LogLevel.INFO);

  await createBuildLog(
    project.id,
    build.id,
    "Getting tarball from repository.",
    LogLevel.INFO
  );

  const tarball = await octokit.rest.repos.downloadTarballArchive({
    owner: project.repository.split("/")[0],
    repo: project.repository.split("/")[1],
    ref: repo.default_branch
  });

  if (!tarball || !tarball.url) {
    console.log("Failed to get tarball from repository.");

    await createBuildLog(
      project.id,
      build.id,
      "Failed to get tarball from repository.",
      LogLevel.ERROR
    );

    await send_notification(build.id, NotificationType.FailedBuild);

    await prisma.build.update({
      where: {
        id: build.id
      },
      data: {
        status: BuildStatus.failed_download
      }
    });

    await octokit.rest.repos.createCommitStatus({
      owner: project.repository.split("/")[0],
      repo: project.repository.split("/")[1],
      sha: commit.sha,
      state: "failure",
      context: "chief/build",
      description: "Downloading project failed.",
      target_url: `https://${process.env.DOMAIN}/projects/${project.id}/builds/${build.id}`
    });

    return {
      id: build.id,
      status: "failed_download"
    };
  }

  // download project from github

  await createBuildLog(
    project.id,
    build.id,
    "Starting download.",
    LogLevel.INFO
  );

  const { ok: downloading, error: downloading_error } = await send_command(
    `cd /tmp/builder/${build.id}; wget ${tarball.url} -qO- | tar xvz`
  );

  if (downloading_error) {
    await prisma.build.update({
      where: {
        id: build.id
      },
      data: {
        status: BuildStatus.failed_download
      }
    });

    await octokit.rest.repos.createCommitStatus({
      owner: project.repository.split("/")[0],
      repo: project.repository.split("/")[1],
      sha: commit.sha,
      state: "failure",
      context: "chief/build",
      description: "Downloading project failed.",
      target_url: `https://${process.env.DOMAIN}/projects/${project.id}/builds/${build.id}`
    });

    await createBuildLog(
      project.id,
      build.id,
      "Download failed.",
      LogLevel.ERROR
    );

    await send_notification(build.id, NotificationType.FailedBuild);

    return {
      id: build.id,
      status: "failed_download"
    };
  }

  await createBuildLog(
    project.id,
    build.id,
    "Downloading finished.",
    LogLevel.INFO
  );

  await prisma.build.update({
    where: {
      id: build.id
    },
    data: {
      status: BuildStatus.building
    }
  });

  // set all env vars as build args

  if (project.type === "DOCKER") {
    const env_vars = project.env_vars
      ? "--build-arg " + project.env_vars.split("\n").join(" --build-arg ")
      : "";

    await createBuildLog(
      project.id,
      build.id,
      "Starting the build.",
      LogLevel.INFO
    );

    const { ok: build_docker, error: build_docker_error } = await send_command(
      `cd /tmp/builder/${build.id}/${project.repository.replace("/", "-")}-${commit.sha}; docker build ${env_vars} -t ${project.id}:${commit.sha} .`
    );

    if (build_docker_error) {
      await createBuildLog(
        project.id,
        build.id,
        build_docker_error,
        LogLevel.ERROR
      );

      await send_notification(build.id, NotificationType.FailedBuild);

      await prisma.build.update({
        where: {
          id: build.id
        },
        data: {
          status: BuildStatus.failed_build
        }
      });

      await octokit.rest.repos.createCommitStatus({
        owner: project.repository.split("/")[0],
        repo: project.repository.split("/")[1],
        sha: commit.sha,
        state: "failure",
        context: "chief/build",
        description: "Building project failed.",
        target_url: `https://${process.env.DOMAIN}/projects/${project.id}/builds/${build.id}`
      });

      await createBuildLog(
        project.id,
        build.id,
        "Docker build failed.",
        LogLevel.INFO
      );

      return {
        id: build.id,
        status: "failed_build"
      };
    }

    await createBuildLog(project.id, build.id, build_docker, LogLevel.INFO);
  } else if (project.type === "NIXPACKS") {
    const env_vars = project.env_vars
      ? "-e " + project.env_vars.split("\n").join(" -e ")
      : "";

    await createBuildLog(
      project.id,
      build.id,
      "Starting the build using Nixpacks.",
      LogLevel.INFO
    );

    const { ok: build_docker, error: build_docker_error } = await send_command(
      `cd /tmp/builder/${build.id}/${project.repository.replace("/", "-")}-${commit.sha}; nixpacks build . ${env_vars} --name ${project.id}:${commit.sha}`
    );

    if (build_docker_error) {
      await createBuildLog(
        project.id,
        build.id,
        build_docker_error,
        LogLevel.ERROR
      );

      await send_notification(build.id, NotificationType.FailedBuild);

      await prisma.build.update({
        where: {
          id: build.id
        },
        data: {
          status: BuildStatus.failed_build
        }
      });

      await octokit.rest.repos.createCommitStatus({
        owner: project.repository.split("/")[0],
        repo: project.repository.split("/")[1],
        sha: commit.sha,
        state: "failure",
        context: "chief/build",
        description: "Building project failed.",
        target_url: `https://${process.env.DOMAIN}/projects/${project.id}/builds/${build.id}`
      });

      await createBuildLog(
        project.id,
        build.id,
        "Nixpacks build failed.",
        LogLevel.INFO
      );

      return {
        id: build.id,
        status: "failed_build"
      };
    }

    await createBuildLog(project.id, build.id, build_docker, LogLevel.INFO);
  } else {
    throw new Error("Invalid project type.");
  }

  await createBuildLog(
    project.id,
    build.id,
    "Build finished successfully.",
    LogLevel.INFO
  );

  await createBuildLog(project.id, build.id, "Tagging image.", LogLevel.INFO);

  const { ok: tag_image, error: tag_image_error } = await send_command(
    `docker tag ${project.id}:${commit.sha} ${project.id}:latest`
  );

  if (tag_image_error) {
    await prisma.build.update({
      where: {
        id: build.id
      },
      data: {
        status: BuildStatus.failed_build
      }
    });

    await octokit.rest.repos.createCommitStatus({
      owner: project.repository.split("/")[0],
      repo: project.repository.split("/")[1],
      sha: commit.sha,
      state: "failure",
      context: "chief/build",
      description: "Failed to tag image.",
      target_url: `https://${process.env.DOMAIN}/projects/${project.id}/builds/${build.id}`
    });

    await createBuildLog(
      project.id,
      build.id,
      "Image tagging failed.",
      LogLevel.ERROR
    );

    await send_notification(build.id, NotificationType.FailedBuild);

    return {
      id: build.id,
      status: "failed_build"
    };
  }

  if (tag_image)
    await createBuildLog(project.id, build.id, tag_image, LogLevel.INFO);

  await createBuildLog(
    project.id,
    build.id,
    "Image tagged successfully.",
    LogLevel.INFO
  );

  await createBuildLog(
    project.id,
    build.id,
    "Starting cleanup.",
    LogLevel.INFO
  );

  await send_command(`rm -rf /tmp/builder/${build.id}`);

  await createBuildLog(
    project.id,
    build.id,
    "Build folder deleted.",
    LogLevel.INFO
  );

  await createBuildLog(
    project.id,
    build.id,
    "Build finished, waiting for deployment.",
    LogLevel.INFO
  );

  await prisma.build.update({
    where: {
      id: build.id
    },
    data: {
      status: BuildStatus.pending,
      finished_at: new Date(),
      docker_image: `${project.id}:${commit.sha}`
    }
  });

  await octokit.rest.repos.createCommitStatus({
    owner: project.repository.split("/")[0],
    repo: project.repository.split("/")[1],
    sha: commit.sha,
    state: "success",
    context: "chief/build",
    description: "Project built successfully.",
    target_url: `https://${process.env.DOMAIN}/projects/${project.id}/builds/${build.id}`
  });

  return {
    id: build.id,
    status: "success",
    image: project.id + ":" + commit.sha
  };
}
