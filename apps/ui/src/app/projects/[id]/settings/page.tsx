import { useServerSession } from "@/lib/use-server-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProjectSettings } from "./project-setings";
import { Session } from "@/lib/session-type";
import { prisma } from "@chief/db";

export const dynamic = "force-dynamic";

export default async function ProjectSettingsPage({
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
      },
      notification_endpoints: {
        select: {
          notification_endpoint: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        }
      }
    }
  });

  if (project) {
    return <ProjectSettings user={user as Session} project={project} />;
  } else {
    return redirect("/");
  }
}
