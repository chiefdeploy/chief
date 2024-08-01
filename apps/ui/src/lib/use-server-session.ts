"use server";

import { cookies } from "next/headers";
import { redis } from "./redis";
import { prisma } from "@chief/db";
import { Session } from "./session-type";

export async function useServerSession() {
  const chiefsid = await cookies().get("chiefsid");

  if (!chiefsid) {
    return false;
  }

  const user_raw = await redis.get("session:" + chiefsid.value);

  if (!user_raw) {
    return false;
  }

  const user_id = JSON.parse(user_raw).id;

  const user = await prisma.user.findFirst({
    where: {
      id: user_id
    },
    select: {
      id: true,
      email: true,
      created_at: true,
      instance_admin: true,
      organizations: {
        select: {
          id: true,
          organization: {
            select: {
              id: true,
              name: true,
              created_at: true
            }
          }
        }
      },
      organizations_created: {
        select: {
          id: true,
          name: true,
          created_at: true
        }
      }
    }
  });

  if (!user) {
    return false;
  }

  const selected_org =
    (await cookies().get("chieforg"))?.value ||
    user.organizations[0]?.id ||
    null;

  return { ...user, selected_org } as Session;
}
