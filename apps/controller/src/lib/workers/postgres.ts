import { exec } from "child_process";
import prisma from "../prisma";

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

const images = {
  16: "postgres:16-alpine",
  15: "postgres:15-alpine",
  14: "postgres:14-alpine"
};

const generatePassword = (
  length = 20,
  characters = "0123456789abcdefghijklmnopqrstuvwxyz"
) =>
  Array.from(crypto.getRandomValues(new Uint32Array(length)))
    .map((x) => characters[x % characters.length])
    .join("");

export async function create_postgres_service(
  name: string,
  db_name: string,
  image: 14 | 15 | 16,
  org_id: string
) {
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

  const docker_image = images[image];

  const generate_username = generatePassword(6);
  const generate_password = generatePassword(24);

  const project = await prisma.postgresInstance.create({
    data: {
      name: name,
      status: "pending",
      image: docker_image,
      username: generate_username,
      password: generate_password,
      db: db_name,
      organization_id: organization.id,
      instance_id: "local"
    }
  });

  const volume_name = `pgdata-${project.id}`;

  const { ok: create_volume, error: create_volume_error } = await send_command(
    `docker volume create ${volume_name}`
  );

  if (create_volume_error) {
    console.log({
      error: "failed_to_create_volume"
    });
    await prisma.postgresInstance.update({
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
      `docker service create --name pg-${project.id} -p 5432 --mount type=volume,src=${volume_name},dst=/var/lib/postgresql/data -e POSTGRES_USER=${project.username} -e POSTGRES_PASSWORD=${project.password} -e POSTGRES_DB=${project.db} --health-cmd pg_isready --health-interval 5s --health-timeout 5s --health-retries 5 --network chief -d ${docker_image}`
    );

  if (create_container_error) {
    console.log({
      error: "failed_to_create_container"
    });
    await prisma.postgresInstance.update({
      where: {
        id: project.id
      },
      data: {
        status: "failed"
      }
    });
    return false;
  }

  await prisma.postgresInstance.update({
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
 * Delete postgres service.
 * @param service_id
 * @returns
 */
export async function delete_postgres_service(service_id: string) {
  try {
    const project = await prisma.postgresInstance.findFirst({
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
        `docker service rm pg-${project.id}; sleep 10; docker volume rm --force pgdata-${project.id}`
      );

    if (delete_service_error) {
      console.log({
        error: "failed_to_delete_service",
        delete_service: delete_service
      });

      return {
        error: "failed_to_delete_service"
      };
    }

    await prisma.postgresInstance.delete({
      where: {
        id: project.id
      }
    });

    return {
      ok: true,
      status: "deleted"
    };
  } catch (error) {
    console.log("postgres delete worker error", error);
    return {
      error: "failed_to_delete_service"
    };
  }
}
