/* eslint-disable react/no-unescaped-entities */
"use client";
import Link from "next/link";

import { Session } from "@/lib/session-type";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/footer";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { CreateOrganization } from "./create_organization";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function Projects({ user }: { user: Session }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.organizations && user.organizations.length > 0) {
        const id = user.selected_org;

        fetch(`/api/organization/${id}`, {
          credentials: "include",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.ok) {
              setProjects(data.organization.projects);
              setSources(
                data.organization.github_sources.filter(
                  (source: any) => source.installation_id !== null,
                ),
              );
            }
          })
          .catch((err) => {
            console.log(err);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }
  }, [user]);

  function createSource() {
    fetch(`/api/github/create`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        org_id: user.selected_org,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          toast("Source created!");

          router.push("/sources/" + data.source_id);
        } else {
          toast("Error creating a source!");
        }
      })
      .catch((err) => {
        toast("Error creating a source!");
        console.log(err);
      });
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center">
      <Header user={user} />

      {user && user.organizations.length > 0 ? (
        <div className="px-8 flex flex-col items-start w-full max-w-[800px]">
          <div className="flex flex-col gap-2 w-full text-sm pb-4">
            <div className="flex flex-row gap-2 w-full justify-between items-center">
              <h1 className="text-2xl font-bold">Projects</h1>
              <div className="flex flex-row gap-2">
                {sources && sources.length > 0 && !loading && (
                  <Link href={`/projects/create`}>
                    <Button size="sm" variant="default">
                      New Project{" "}
                      <div className="pl-1">
                        <Plus className="h-5 w-5" />
                      </div>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full">
            {loading ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="opacity-50 rounded-lg border bg-card text-card-foreground shadow-sm px-5 py-4 w-full max-w-[800px] flex flex-col items-start h-[102px]">
                    <div className="text-md flex flex-row gap-2 items-center">
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full mt-[1px]",
                          "bg-gray-200",
                        )}
                      />

                      <span className="font-bold">
                        <Skeleton className="w-[80px] h-[20px] mt-[1px]" />
                      </span>
                    </div>
                    <div className="pt-1">
                      <div className="text-sm">
                        <Skeleton className="w-[120px] h-[20px] mt-[1px]" />
                      </div>
                      <div className="text-sm">
                        <div className="font-bold">
                          <Skeleton className="w-[75px] h-[20px] mt-[1px]" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="opacity-40 rounded-lg border bg-card text-card-foreground shadow-sm px-5 py-4 w-full max-w-[800px] flex flex-col items-start h-[102px]">
                    <div className="text-md flex flex-row gap-2 items-center">
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full mt-[1px]",
                          "bg-gray-200",
                        )}
                      />

                      <span className="font-bold">
                        <Skeleton className="w-[80px] h-[20px] mt-[1px]" />
                      </span>
                    </div>
                    <div className="pt-1">
                      <div className="text-sm">
                        <Skeleton className="w-[120px] h-[20px] mt-[1px]" />
                      </div>
                      <div className="text-sm">
                        <div className="font-bold">
                          <Skeleton className="w-[75px] h-[20px] mt-[1px]" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="opacity-30 rounded-lg border bg-card text-card-foreground shadow-sm px-5 py-4 w-full max-w-[800px] flex flex-col items-start h-[102px]">
                    <div className="text-md flex flex-row gap-2 items-center">
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full mt-[1px]",
                          "bg-gray-200",
                        )}
                      />

                      <span className="font-bold">
                        <Skeleton className="w-[80px] h-[20px] mt-[1px]" />
                      </span>
                    </div>
                    <div className="pt-1">
                      <div className="text-sm">
                        <Skeleton className="w-[120px] h-[20px] mt-[1px]" />
                      </div>
                      <div className="text-sm">
                        <div className="font-bold">
                          <Skeleton className="w-[75px] h-[20px] mt-[1px]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                {!sources || sources.length === 0 ? (
                  <>
                    <div className="flex flex-col gap-4 w-full">
                      <div className="flex flex-col gap-4 w-full">
                        <div className="flex flex-col gap-2 w-full">
                          You need to first create a source in order to create a
                          project.
                        </div>

                        <div>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={createSource}
                          >
                            Create a Source
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : projects && projects.length > 0 ? (
                  <>
                    {projects.map((project: any) => (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm px-5 py-4 w-full max-w-[800px] flex flex-col items-start h-[102px]">
                          <div className="text-md flex flex-row gap-2 items-center">
                            {project.builds && project.builds.length > 0 && (
                              <div
                                className={cn(
                                  "w-2.5 h-2.5 rounded-full mt-[1px]",
                                  project.builds[0].status === "deployed"
                                    ? "bg-green-500"
                                    : project.builds[0].status.includes(
                                          "failed",
                                        )
                                      ? "bg-red-500"
                                      : "bg-gray-500",
                                )}
                              />
                            )}
                            {/* <span>
                            {project.builds[0].commit_id.substring(0, 7)}
                          </span> */}
                            <span className="font-bold">{project.name}</span>
                          </div>
                          <div className="pt-1">
                            <div className="text-sm">
                              https://{project.domain}
                            </div>
                            <div className="text-sm">
                              {project.builds && project.builds.length > 0 && (
                                <>
                                  {project.builds[0].status === "deployed" ? (
                                    <div className="font-bold">
                                      {dayjs(
                                        project.builds[0].deployed_at,
                                      ).fromNow()}
                                    </div>
                                  ) : (
                                    <div className="font-bold">
                                      {dayjs(
                                        project.builds[0].started_at,
                                      ).fromNow()}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="text-md">
                        You don't have any projects yet.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1"></div>
          <CreateOrganization />
        </>
      )}
      <div className="flex-1" />
      <Footer />
    </main>
  );
}
