"use server";

import { useServerSession } from "@/lib/use-server-session";
import CreateOrganization from "./create_organization";
import { redirect } from "next/navigation";
import { Session } from "@/lib/session-type";

export default async function ProfileRoute() {
  const user = await useServerSession();

  if (!user) {
    redirect("/auth/login");
  }

  return <CreateOrganization user={user as Session} />;
}
