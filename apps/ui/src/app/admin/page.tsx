"use server";

import { useServerSession } from "@/lib/use-server-session";
import Admin from "./admin";
import { redirect } from "next/navigation";
import { Session } from "@/lib/session-type";

export default async function ProfileRoute() {
  const user = await useServerSession();

  if (!user) {
    redirect("/auth/login");
  }

  if (!user.instance_admin) {
    redirect("/");
  }

  return <Admin user={user as Session} />;
}
