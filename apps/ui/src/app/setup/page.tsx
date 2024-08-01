import { checkSetup } from "@/lib/setup-check";
import { Setup } from "./setup";
import { redirect } from "next/navigation";
import { prisma } from "@chief/db";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const setup = await checkSetup();
  const default_user = await prisma.user.findFirst({
    where: {
      instance_admin: true
    }
  });

  if (setup) {
    return redirect("/");
  }

  if (default_user) {
    return redirect("/setup/instance");
  }

  return <Setup />;
}
