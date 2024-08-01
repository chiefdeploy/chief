"use server";

import { prisma } from "@chief/db";

export async function checkSetup() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        instance_admin: true
      },
      select: {
        id: true
      }
    });

    if (!user) {
      return false;
    }

    const instance = await prisma.instance.findMany();

    if (!instance || instance.length === 0) {
      return false;
    }

    return true;
  } catch (e) {
    return true;
  }
}
