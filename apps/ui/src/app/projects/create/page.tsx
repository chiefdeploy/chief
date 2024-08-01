import { useServerSession } from "@/lib/use-server-session";
import { redirect } from "next/navigation";
import { CreateProject } from "./create_project";
import { Session } from "@/lib/session-type";

export default async function CreateProjectRoute() {
  const user = await useServerSession();

  if (!user) {
    redirect("/auth/login");
  }

  return <CreateProject user={user as Session} />;
}
