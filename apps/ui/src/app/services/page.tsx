import { useServerSession } from "@/lib/use-server-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Session } from "@/lib/session-type";
import { Services } from "./services";

export default async function ProjectPage({
  params
}: {
  params: { id: string };
}) {
  const user = await useServerSession();

  if (!user) {
    redirect("/auth/login");
  }
  
  return <Services user={user as Session} />;
}
