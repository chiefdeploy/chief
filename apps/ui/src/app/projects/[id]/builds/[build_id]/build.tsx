"use client";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Session } from "@/lib/session-type";
import { useContext, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/header";
import { cn, compareTime } from "@/lib/utils";
import { Footer } from "@/components/footer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import dayjs from "dayjs";
import { Skeleton } from "@/components/ui/skeleton";
import { SocketContext } from "@/components/socket-provider";

export function Build({
  user,
  initial_project,
  initial_build
}: {
  user: Session;
  initial_project: any;
  initial_build: any;
}) {
  const { socket, isConnected } = useContext(SocketContext);
  const [project, setProject] = useState(initial_project);
  const [build, setBuild] = useState(initial_build);

  const [isClient, setIsClient] = useState(false);

  const [logs, setLogs] = useState<any[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    fetch(`/api/logs/build/${build.id}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-cache"
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setLogs(data.logs);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    if (socket && socket.connected) {
      socket.on("message", (data: any) => {
        if (
          data.event === "new_build_log" ||
          data.event === "new_deployment_log"
        ) {
          if (data.build.id === build.id) {
            setLogs(data.logs);
            setProject(data.project);
            setBuild(data.build);

            bottomRef.current?.scrollIntoView(false);
          }
        }
      });
    }
  }, [socket, build.id]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center">
      <Header user={user} />

      <div className="px-8 flex flex-col items-start w-full max-w-[800px]">
        <div className="flex flex-col gap-2 w-full text-sm pb-4">
          <h1 className="text-2xl font-bold">
            Build ({build.id.substring(0, 7)})
          </h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Projects</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/projects/${project.id}`}>
                  {project.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  Build #{build.id.substring(0, 7)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* <div className="flex flex-row gap-2">
            <Link href={`/projects/${project.id}/settings`}>
              <Button size="sm" className="h-7 px-2 mt-1 w-[70px]">
                Settings
              </Button>
            </Link>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 px-2 mt-1 w-[70px]"
            >
              Delete
            </Button>
          </div> */}
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
            {/* <div className="text-sm">
              <span className="text-muted-foreground">Image:</span>{" "}
              <span>{build.docker_image}</span>
            </div> */}
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2 w-full">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 w-full max-w-full flex flex-col items-start">
              <div className="text-md flex flex-row gap-2 items-center">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full",
                    build.status === "deployed"
                      ? "bg-green-500"
                      : build.status.includes("failed")
                        ? "bg-red-500"
                        : "bg-gray-500"
                  )}
                />
                <span className="font-bold">{build.status.toUpperCase()}</span>
              </div>
              <div className="text-md">
                Commit:{" "}
                <Link
                  href={`https://github.com/${project.repository}/commit/${build.commit_id}`}
                  className="hover:underline"
                  target="_blank"
                >
                  <span className="font-bold">{build.commit_id}</span>
                </Link>
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
                    {compareTime(build.finished_at, build.deployed_at)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full pt-4">
          <div className="text-lg font-bold">Logs</div>
          <div className="flex flex-col gap-0.5 w-full border rounded-lg border-border bg-background py-2 px-4">
            {logs.map((log: any) => (
              <div key={log.id} className="w-full flex flex-row items-start">
                <div className="text-md flex flex-row gap-2 items-center h-full pr-2 min-w-[80px]">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      log.level === "ERROR"
                        ? "bg-red-500"
                        : log.level === "WARN"
                          ? "bg-yellow-500"
                          : log.level === "INFO"
                            ? "bg-blue-500"
                            : "bg-green-500"
                    )}
                  />
                  <span className="font-bold opacity-80 text-sm">
                    {log.type === "build" ? "Build" : "Deploy"}
                  </span>
                </div>

                <pre
                  className={cn(
                    "max-w-full overflow-hidden pl-2 border-l-2 border-transparent",

                    log.level === "ERROR"
                      ? "hover:border-red-500 text-red-500 font-bold"
                      : log.level === "WARN"
                        ? "hover:border-yellow-500"
                        : log.level === "INFO"
                          ? "hover:border-blue-500"
                          : "hover:border-green-500"
                  )}
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all"
                  }}
                >
                  {log.body}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1" />
      <Footer />
      <div ref={bottomRef} />
    </main>
  );
}
