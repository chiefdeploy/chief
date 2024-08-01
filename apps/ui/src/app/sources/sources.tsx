"use client";

import { Session } from "@/lib/session-type";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export function Sources({ user }: { user: Session }) {
  const [sources, setSources] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (user.organizations) {
      const id = user.selected_org;

      fetch(`/api/organization/${id}/sources`, {
        credentials: "include"
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setSources(data.sources);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, []);

  function createSource() {
    fetch(`/api/github/create`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        org_id: user.selected_org
      })
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

      <div className="px-8 flex flex-col items-start w-full max-w-[800px]">
        <div className="flex flex-row gap-4 w-full text-sm justify-between items-center pb-4">
          <h1 className="text-2xl font-bold">Sources</h1>

          <Button
            size="sm"
            variant="default"
            onClick={() => {
              createSource();
            }}
          >
            Add Source{" "}
            <div className="pl-1">
              <Plus className="h-5 w-5" />
            </div>
          </Button>
        </div>

        <div className="flex flex-col gap-4 w-full py-2">
          {sources && sources.length > 0 ? (
            sources.map((source) => (
              <Link
                key={source.id}
                href={`/sources/${source.id}`}
                className="flex flex-row gap-2 items-center"
              >
                <div className="text-md">
                  {source.name}{" "}
                  {source.owner_login && `(${source.owner_login})`}
                </div>
              </Link>
            ))
          ) : (
            <div>No sources.</div>
          )}
        </div>
      </div>

      <div className="flex-1" />

      <Footer />
    </main>
  );
}
