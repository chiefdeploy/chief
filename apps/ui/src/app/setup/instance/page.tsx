import { useServerSession } from "@/lib/use-server-session";
import { SetupInstance } from "./setup-instance";
import { redirect } from "next/navigation";
import { prisma } from "@chief/db";

export const dynamic = "force-dynamic";

export default async function InstancePage() {
  const user = await useServerSession();

  if (!user) {
    return redirect("/auth/login");
  }

  const existing_instance = await prisma.instance.findMany();

  if (existing_instance && existing_instance.length > 0) {
    return redirect("/setup/instance");
  }

  return <SetupInstance />;
}
