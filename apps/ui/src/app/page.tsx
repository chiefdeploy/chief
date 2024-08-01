import { checkSetup } from "@/lib/setup-check";
import { useServerSession } from "@/lib/use-server-session";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await useServerSession();

  const setup = await checkSetup();

  if (!setup) {
    return redirect("/setup");
  }

  if (!user) {
    return redirect("/auth/login");
  } else {
    return redirect("/projects");
  }
}
