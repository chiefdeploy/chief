"use client";

import { Card } from "@/components/ui/card";
import { Session } from "@/lib/session-type";
import { useEffect, useState } from "react";

import { Header } from "@/components/header";
import { Combobox } from "@/components/combo_box";
import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { relative_time } from "@/lib/utils";

export function CreateProject({ user }: { user: Session }) {
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any>();
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [port, setPort] = useState<number>(3000);
  const [envs, setEnvs] = useState("");
  const [type, setType] = useState("NIXPACKS");

  useEffect(() => {
    if (user.organizations) {
      const id = user.selected_org;

      fetch(`/api/organization/${id}/repos`, {
        credentials: "include"
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            // remove repos with same string "repo" data.repos[].repo
            const uniqueRepos = data.repos.filter(
              (repo: any, index: any, self: any) =>
                index === self.findIndex((t) => t.full_name === repo.full_name)
            );

            setRepositories(uniqueRepos);
          }
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const name = e.currentTarget.projectName.value;
    const domain = e.currentTarget.domain.value;
    const port = e.currentTarget.port.value;
    const envs = e.currentTarget.envs.value;
    const type = e.currentTarget.type.value;

    if (!name || !domain || !port || !selectedRepo || !type) {
      toast("Please fill in all the fields!", {
        dismissible: true,
        duration: 2000
      });
      return;
    }

    if (!(type === "DOCKER" || type === "NIXPACKS")) {
      toast("Invalid project type!", {
        dismissible: true,
        duration: 2000
      });

      return;
    }

    const org_id = user.selected_org;
    const repo_name = repositories.find(
      (repo) => repo.full_name === selectedRepo
    ).full_name;

    const source_id = repositories.find(
      (repo) => repo.full_name === selectedRepo
    ).source_id;

    // TODO: domain validation ?

    fetch(`/api/project/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        org_id,
        name,
        repo_name,
        source_id,
        domain,
        port,
        envs,
        type
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          window.location.href = "/projects/" + data.project.id;
        } else {
          // console.log(data);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center">
      <Header user={user} />

      <div className="flex-1" />

      <Card className="p-4 w-[600px] flex flex-col items-start">
        <div className="flex flex-row gap-2 w-full text-sm justify-between items-center pb-4">
          <h1 className="text-2xl font-bold">Create Project</h1>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2 w-full">
              <label className="text-sm font-bold">Name</label>
              <Input
                type="text"
                placeholder="My Project"
                name="projectName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <label className="text-sm font-bold">Repository</label>
              <Combobox
                loading={loading}
                options={repositories
                  .sort((a, b) => {
                    return (
                      new Date(b.pushed_at).getTime() -
                      new Date(a.pushed_at).getTime()
                    );
                  })
                  .map((repository: any) => ({
                    value: repository.full_name,
                    label:
                      repository.full_name +
                      " • " +
                      relative_time(repository.pushed_at)
                  }))}
                setValue={setSelectedRepo}
                value={selectedRepo}
              />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <div className="flex flex-row gap-2 w-full justify-between text-sm">
                <label className="text-sm font-bold">Type</label>
              </div>
              <Select
                required
                name="type"
                value={type}
                onValueChange={(value) => setType(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Project Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NIXPACKS">Nixpacks</SelectItem>
                  <SelectItem value="DOCKER">Dockerfile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <div className="flex flex-row gap-2 w-full justify-between text-sm">
                <label className="text-sm font-bold">Domain</label>
              </div>
              <Input
                type="text"
                placeholder="example.com"
                required
                name="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <label className="text-sm font-bold">Port</label>
              <Input
                type="number"
                placeholder="3000"
                min={1}
                max={65535}
                name="port"
                required
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
              />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <label className="text-sm font-bold">Environment</label>
              <Textarea
                placeholder="ENV=VAR"
                className="max-h-[200px] min-h-[200px] resize-none"
                name="envs"
                value={envs}
                onChange={(e) => setEnvs(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <Button
                type="submit"
                className="w-full"
                disabled={!name || !domain || !port || !selectedRepo || loading}
              >
                Create Project
              </Button>
            </div>
          </form>
        </div>
      </Card>

      <div className="flex-1" />

      <Footer />
    </main>
  );
}
