import Queue from "bull";

import { build_project } from "./lib/build";
import { deploy_project } from "./lib/deploy";

import {
  create_postgres_service,
  delete_postgres_service
} from "./lib/workers/postgres";

import {
  create_redis_service,
  delete_redis_service
} from "./lib/workers/redis";
import { prisma } from "@chief/db";
import { send_notification_worker } from "./lib/workers/notifications";

export function workerThread(id: number) {
  console.log(`Worker thread #${id} started.`);

  // build and deploy queue
  const queue_build_deploy = new Queue("build_deploy", process.env.REDIS_URL!);

  queue_build_deploy.process(20, async (job, done) => {
    console.log("build job", job.data);

    const project_id = job.data.project_id;

    if (!project_id) {
      console.log("build job missing project id");
    }

    build_project(project_id, "automatic")
      .then((data: any) => {
        console.log(data);
        if (data) {
          if (data.status === "success") {
            console.log("build success, deploying...", data.id);
            const id = data.id;

            deploy_project(project_id, id).then((data: any) => {
              if (data) {
                console.log("deploy success");
              } else {
                console.log("deploy failed");
              }
            });
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });

    done();
  });

  // create postgres service queue
  const queue_create_postgres = new Queue(
    "create_postgres",
    process.env.REDIS_URL!
  );

  queue_create_postgres.process(20, async (job, done) => {
    console.log("create postgres service job", job.data);

    const name = job.data.name;
    const db_name = job.data.db_name;
    const image = job.data.image || 16;
    const org_id = job.data.org_id;

    if (name && image) {
      console.log("postgres worker: missing name and image provided");
    }

    if (image && !(image === 14 || image === 15 || image === 16)) {
      console.log("postgres worker: invalid image provided");
    }

    create_postgres_service(name, db_name, image, org_id)
      .then((data: any) => {
        console.log("postgres worker: ", data);

        if (data) {
          if (data.status === "success") {
            console.log("postgres worker: postgres service created");
          } else {
            console.log("postgres worker: postgres service failed to create");
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });

    done();
  });

  // create redis service queue
  const queue_create_redis = new Queue("create_redis", process.env.REDIS_URL!);

  queue_create_redis.process(20, async (job, done) => {
    console.log("create redis service job", job.data);

    const name = job.data.name;
    const org_id = job.data.org_id;

    if (name) {
      console.log("postgres worker: missing name");
    }

    create_redis_service(name, org_id)
      .then((data: any) => {
        console.log("redis worker: ", data);

        if (data) {
          if (data.status === "success") {
            console.log("redis worker: redis service created");
          } else {
            console.log("redis worker: redis service failed to create");
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });

    done();
  });

  // delete postgres service queue
  const queue_delete_postgres = new Queue(
    "delete_postgres",
    process.env.REDIS_URL!
  );

  queue_delete_postgres.process(20, async (job, done) => {
    console.log("delete postgres job", job.data);

    const id = job.data.id;

    if (!id) {
      console.log("postgres delete worker: missing id");
    }

    delete_postgres_service(id)
      .then((data: any) => {
        console.log("postgres delete worker: ", data);

        if (data) {
          if (data.ok) {
            console.log("postgres delete worker: postgres service deleted");
          } else {
            console.log(
              "postgres delete worker: postgres service failed to delete"
            );
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });

    done();
  });

  // delete redis service queue
  const queue_delete_redis = new Queue("delete_redis", process.env.REDIS_URL!);

  queue_delete_redis.process(20, async (job, done) => {
    console.log("delete redis job", job.data);

    const id = job.data.id;

    if (!id) {
      console.log("redis delete worker: missing id");
    }

    delete_redis_service(id)
      .then((data: any) => {
        console.log("redis delete worker: ", data);

        if (data) {
          if (data.ok) {
            console.log("redis delete worker: postgres service deleted");
          } else {
            console.log(
              "redis delete worker: postgres service failed to delete"
            );
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });

    done();
  });

  // send notification queue
  const queue_send_notification = new Queue(
    "send_notification",
    process.env.REDIS_URL!
  );

  queue_send_notification.process(20, async (job, done) => {
    try {
      console.log("send notification job", job.data);

      const build_id = job.data.build_id;
      const type = job.data.type;

      if (!build_id || !type) {
        console.log("send notification worker: missing build_id or type");

        done();
        return;
      }

      const build = await prisma.build.findUnique({
        where: {
          id: build_id
        }
      });

      if (!build) {
        console.log("send notification worker: build not found");

        done();
        return;
      }

      await send_notification_worker(type, build);
    } catch (err) {
      console.log(err);
    }

    done();
  });
}
