import Queue from "bull";

export async function deploy_and_build(project_id: string) {
  const queue_build_deploy = new Queue("build_deploy", process.env.REDIS_URL!);

  await queue_build_deploy.add({
    project_id: project_id
  });
}

export async function create_postgres_service(
  name: string,
  db_name: string,
  image: 14 | 15 | 16,
  org_id: string
) {
  const queue_create_postgres = new Queue(
    "create_postgres",
    process.env.REDIS_URL!
  );

  await queue_create_postgres.add({
    name: name,
    db_name: db_name,
    image: image,
    org_id: org_id
  });
}

export async function delete_postgres_service(service_id: string) {
  const queue_delete_postgres = new Queue(
    "delete_postgres",
    process.env.REDIS_URL!
  );

  await queue_delete_postgres.add({
    id: service_id
  });
}

export async function create_redis_service(name: string, org_id: string) {
  const queue_create_redis = new Queue("create_redis", process.env.REDIS_URL!);

  await queue_create_redis.add({
    name: name,
    org_id: org_id
  });
}

export async function delete_redis_service(service_id: string) {
  const queue_delete_redis = new Queue("delete_redis", process.env.REDIS_URL!);

  await queue_delete_redis.add({
    id: service_id
  });
}
