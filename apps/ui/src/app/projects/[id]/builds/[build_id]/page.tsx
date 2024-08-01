import { useServerSession } from "@/lib/use-server-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Build } from "./build";
import { Session } from "@/lib/session-type";
import { prisma } from "@chief/db";

export const dynamic = "force-dynamic";

export default async function BuildPage({
  params
}: {
  params: { id: string; build_id: string };
}) {
  const user = await useServerSession();

  if (!user) {
    redirect("/auth/login");
  }

  if (!params.id) {
    redirect("/");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: params.id,
      organization: {
        members: {
          some: {
            user_id: user!.id
          }
        }
      }
    },
    include: {
      builds: {
        orderBy: {
          created_at: "desc"
        }
      }
    }
  });

  const build = await prisma.build.findFirst({
    where: {
      id: params.build_id,
      project: {
        id: params.id
      }
    }
  });

  if (!project || !build) {
    return redirect("/projects/" + params.id);
  }

  if (project) {
    return (
      <Build
        user={user as Session}
        initial_project={project}
        initial_build={build}
      />
    );
  } else {
    return redirect("/");
  }
}
