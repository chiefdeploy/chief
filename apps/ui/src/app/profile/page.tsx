"use server";

import { useServerSession } from "@/lib/use-server-session";
import Profile from "./profile";
import { redirect } from "next/navigation";
import { Session } from "@/lib/session-type";

export default async function ProfileRoute() {
  const user = await useServerSession();

  if (!user) {
    redirect("/auth/login");
  }

  return <Profile user={user as Session} />;
}
