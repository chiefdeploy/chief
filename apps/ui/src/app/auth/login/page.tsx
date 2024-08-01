import { useServerSession } from "@/lib/use-server-session";
import { Login } from "./login";
import { redirect } from "next/navigation";

export default async function LoginRoute() {
  const user = await useServerSession();

  if (user) {
    return redirect("/projects");
  }

  return <Login />;
}
