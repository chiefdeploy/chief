import prisma from "../prisma";
import { exec } from "child_process";

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

    console.log("Command output", { stdout, stderr });

    return {
      ok: stdout.toString() || stderr.toString(),
      error: false
    };
  } catch (error) {
    console.error("Error sending command", error);
    return { ok: "", error: error.message };
  }
}

const generatePassword = (
  length = 20,
  characters = "0123456789abcdefghijklmnopqrstuvwxyz"
) =>
  Array.from(crypto.getRandomValues(new Uint32Array(length)))
    .map((x) => characters[x % characters.length])
    .join("");

export async function create_redis_service(name: string, org_id: string) {
  console.log("started deploying project");

  const organization = await prisma.organization.findFirst({
    where: {
      id: org_id
    }
  });

  if (!organization) {
    console.log("postgres service: organization not found");
    return false;
  }

  const docker_image = "bitnami/valkey:7.2";

  const generate_password = generatePassword(24);

  const project = await prisma.redisInstance.create({
    data: {
      name: name,
      status: "pending",
      image: docker_image,
      password: generate_password,
      organization_id: organization.id,
      instance_id: "local"
    }
  });

  const volume_name = `redisdata-${project.id}`;

  const { ok: create_volume, error: create_volume_error } = await send_command(
    `docker volume create ${volume_name}`
  );

  if (create_volume_error) {
    console.log({
      error: "failed_to_create_volume"
    });
    await prisma.redisInstance.update({
      where: {
        id: project.id
      },
      data: {
        status: "failed_create_volume"
      }
    });
    return false;
  }

  const { ok: create_container, error: create_container_error } =
    await send_command(
      `docker service create --name redis-${project.id} -p 6379 --mount type=volume,src=${volume_name},dst=/bitnami/valkey/data -e VALKEY_PASSWORD=${project.password} -e REDIS_PASSWORD=${project.password} --health-cmd "echo 1" --health-interval 2s --health-timeout 5s --health-retries 5 --network chief -d ${docker_image}`
    );

  if (create_container_error) {
    console.log({
      error: "failed_to_create_container"
    });
    await prisma.redisInstance.update({
      where: {
        id: project.id
      },
      data: {
        status: "failed"
      }
    });
    return false;
  }

  await prisma.redisInstance.update({
    where: {
      id: project.id
    },
    data: {
      status: "running",
      deployed_at: new Date()
    }
  });

  return {
    status: "success"
  };
}

/**
 * Delete redis service.
 * @param service_id
 * @returns
 */
export async function delete_redis_service(service_id: string) {
  try {
    const project = await prisma.redisInstance.findFirst({
      where: {
        id: service_id
      }
    });

    if (!project) {
      return {
        error: "not_found"
      };
    }

    const { ok: delete_service, error: delete_service_error } =
      await send_command(
        `docker service rm redis-${project.id}; sleep 10; docker volume rm --force redisdata-${project.id}`
      );

    if (delete_service_error) {
      return {
        error: "failed_to_delete_service"
      };
    }

    await prisma.redisInstance.delete({
      where: {
        id: project.id
      }
    });

    return {
      ok: true,
      status: "deleted"
    };
  } catch (error) {
    console.log(error);
    return {
      error: "failed_to_delete_service"
    };
  }
}
