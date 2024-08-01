"use client";
import Link from "next/link";

import { Session } from "@/lib/session-type";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { cn, compareTime } from "@/lib/utils";
import { Footer } from "@/components/footer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import dayjs from "dayjs";
import { useContext, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { SocketContext } from "@/components/socket-provider";

export function Project({
  user,
  loaded_project,
}: {
  user: Session;
  loaded_project: any;
}) {
  const { socket } = useContext(SocketContext);

  const [project, setProject] = useState(loaded_project);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    socket.on("message", (data: any) => {
      if (
        data.event === "new_build_log" ||
        data.event === "new_deployment_log"
      ) {
        if (data.project.id === project.id) {
          setProject(data.project);
        }
      }
    });
  }, [socket, project.id]);

  function triggerBuild() {
    fetch(`/api/project/${project.id}/builds/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        triggered_by_user_id: user.id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          toast("Build triggered!", {
            description: "The build will start shortly.",
            dismissible: true,
            duration: 2000,
          });
        } else {
          toast("Error triggering build!", {
            description: "Please try again.",
            dismissible: true,
            duration: 2000,
          });
        }
      })
      .catch((err) => {
        toast("Error triggering build!", {
          description: "Please try again.",
          dismissible: true,
          duration: 2000,
        });
      });
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center">
      <Header user={user} />

      <div className="px-8 flex flex-col items-start w-full max-w-[800px]">
        <div className="flex flex-col gap-2 w-full text-sm pb-4">
          <div className="flex flex-row gap-2 w-full justify-between items-center">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <div className="flex flex-row gap-2">
              <Button size="sm" variant="outline" onClick={triggerBuild}>
                Re-build
              </Button>
              <Link href={`/projects/${project.id}/settings`}>
                <Button size="sm">Settings</Button>
              </Link>
            </div>
          </div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Projects</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{project.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="pb-4">
          <div>
            <div className="text-sm">
              <span className="text-muted-foreground">Domain:</span>{" "}
              <Link
                href={`https://${project.domain}`}
                className="hover:underline"
                target="_blank"
              >
                {project.domain}
              </Link>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Repository:</span>{" "}
              <Link
                href={`https://github.com/${project.repository}`}
                className="hover:underline"
                target="_blank"
              >
                {project.repository}
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full">
          <h2 className="text-2xl font-bold">Builds</h2>
          <div className="flex flex-col gap-2 w-full">
            {project.builds.map((build: any) => (
              <Link
                key={build.id}
                href={`/projects/${project.id}/builds/${build.id}`}
              >
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 w-full max-w-[800px] flex flex-col items-start">
                  <div className="text-md flex flex-row gap-2 items-center">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        build.status === "deployed"
                          ? "bg-green-500"
                          : build.status.includes("failed")
                            ? "bg-red-500"
                            : "bg-gray-500",
                      )}
                    />
                    <span className="font-bold">
                      {build.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-md">
                    Commit:{" "}
                    <span className="font-bold">
                      {build.commit_id.substring(0, 7)}
                    </span>
                  </div>
                  <div className="text-md flex flex-row gap-1 items-center">
                    Started :{" "}
                    <div className="font-bold">
                      {isClient ? (
                        dayjs(build.created_at).format("YYYY-MM-DD HH:mm:ss")
                      ) : (
                        <Skeleton className="w-[165px] h-[18px] mt-0.5" />
                      )}
                    </div>
                  </div>
                  {build.finished_at && (
                    <div className="text-md flex flex-row gap-1 items-center">
                      Built :{" "}
                      <div className="font-bold">
                        {isClient ? (
                          dayjs(build.finished_at).format("YYYY-MM-DD HH:mm:ss")
                        ) : (
                          <Skeleton className="w-[165px] h-[18px] mt-0.5" />
                        )}
                      </div>
                    </div>
                  )}
                  {build.deployed_at && (
                    <div className="text-md flex flex-row gap-1 items-center">
                      Deployed :{" "}
                      <div className="font-bold">
                        {isClient ? (
                          dayjs(build.deployed_at).format("YYYY-MM-DD HH:mm:ss")
                        ) : (
                          <Skeleton className="w-[165px] h-[18px] mt-0.5" />
                        )}
                      </div>
                    </div>
                  )}
                  {build.finished_at && build.deployed_at && (
                    <div className="text-md">
                      Duration :{" "}
                      <span className="font-bold">
                        {compareTime(build.created_at, build.deployed_at)}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1" />
      <Footer />
    </main>
  );
}
