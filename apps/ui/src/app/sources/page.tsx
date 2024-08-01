import { useServerSession } from "@/lib/use-server-session";
import { redirect } from "next/navigation";
import { Sources } from "./sources";
import { Session } from "@/lib/session-type";

export default async function SourcesRoute() {
  const user = await useServerSession();

  if (!user) {
    redirect("/auth/login");
  }

  return <Sources user={user as Session} />;
}
