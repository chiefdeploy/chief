"use server";

import { useServerSession } from "@/lib/use-server-session";
import { redirect } from "next/navigation";
import { Session } from "@/lib/session-type";
import { EditOrg } from "./edit_org";

export default async function ProfileRoute() {
  const user = await useServerSession();

  if (!user) {
    redirect("/auth/login");
  }

  if (!user.instance_admin) {
    redirect("/");
  }

  return <EditOrg user={user as Session} />;
}
