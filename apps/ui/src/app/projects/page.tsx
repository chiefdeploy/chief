import { useServerSession } from "@/lib/use-server-session";
import { redirect } from "next/navigation";
import { Projects } from "./projects";
import { Session } from "@/lib/session-type";

export default async function ProjectsRoute() {
  const user = await useServerSession();

  if (!user) {
    redirect("/auth/login");
  }

  return <Projects user={user as Session} />;
}
