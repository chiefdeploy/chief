import { useServerSession } from "@/lib/use-server-session";
import { redirect } from "next/navigation";
import { Project } from "./project";
import { Session } from "@/lib/session-type";
import { prisma } from "@chief/db";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params
}: {
  params: { id: string };
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
      },
      organization: {
        select: {
          name: true
        }
      }
    }
  });

  if (project) {
    return <Project user={user as Session} loaded_project={project} />;
  } else {
    return redirect("/");
  }
}
