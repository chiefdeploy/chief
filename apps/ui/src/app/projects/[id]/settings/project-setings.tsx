"use client";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle
} from "@/components/ui/card";
import { Session } from "@/lib/session-type";
import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Combobox } from "@/components/combo_box";
import { DialogClose } from "@radix-ui/react-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export function ProjectSettings({
  user,
  project
}: {
  user: Session;
  project: any;
}) {
  const latest_build = project.builds[0];
  const [domain, setDomain] = useState(project.domain);
  const [envVars, setEnvVars] = useState(project.env_vars);

  function updateEnvVars() {
    fetch(`/api/project/${project.id}/envs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        env_vars: envVars
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          toast("Environment variables updated!");
        } else {
          toast("Error updating environment variables!");
        }
      })
      .catch((err) => {
        toast("Error updating environment variables!");
      });
  }

  function deleteProject() {
    fetch(`/api/project/${project.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast("Error deleting project!");
          return;
        }

        toast("Project deleted!");
        window.location.href = "/projects";
      })
      .catch((err) => {
        toast("Error deleting project!");
      });
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center">
      <Header user={user} />

      <div className="px-8 flex flex-col items-start w-full max-w-[800px]">
        <div className="flex flex-col gap-2 w-full text-sm pb-4">
          <h1 className="text-2xl font-bold">Settings</h1>
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
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex flex-col gap-4 w-full">
          <Card className="p-6 w-full max-w-[800px] flex flex-col items-start">
            <CardTitle>Project Domain</CardTitle>
            <CardDescription className="pt-1">
              Domain which is used to access the project.
            </CardDescription>
            {/* domain input with save */}
            <CardContent className="p-0 pt-4 w-full">
              <div className="flex flex-col gap-2 w-full">
                {/* <label className="text-sm font-bold">Domain</label> */}
                <Input
                  type="text"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-row gap-2 p-0 pt-4 justify-between w-full">
              <div className="text-sm text-muted-foreground">
                You will need to update the DNS records for your domain.
              </div>
              <Button
                type="submit"
                disabled={
                  !domain || domain.length < 3 || domain === project.domain
                }
                size="sm"
                className="px-4"
              >
                Save
              </Button>
            </CardFooter>
          </Card>
          <Card className="p-6 w-full max-w-[800px] flex flex-col items-start">
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription className="pt-1">
              Environment variables which are used to configure the project.
            </CardDescription>
            <CardContent className="p-0 pt-4 w-full">
              <div className="flex flex-col gap-2 w-full">
                {/* <label className="text-sm font-bold">Domain</label> */}
                <Textarea
                  placeholder="ENV=VAR"
                  value={envVars}
                  onChange={(e) => setEnvVars(e.target.value)}
                  rows={10}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-row gap-2 p-0 pt-4 justify-between w-full">
              <div className="text-sm text-muted-foreground">
                After saving, you need to redeploy the project for the chaganes
                to apply.
              </div>
              <Button
                type="submit"
                disabled={envVars === project.env_vars}
                size="sm"
                className="px-4"
                onClick={updateEnvVars}
              >
                Save
              </Button>
            </CardFooter>
          </Card>
          <Card className="p-6 w-full max-w-[800px] flex flex-col items-start">
            <CardTitle>Other</CardTitle>
            <CardContent className="p-0 pt-2 w-full">
              <div className="flex flex-row gap-2 w-full justify-between items-center">
                <div>
                  Current Org:{" "}
                  <span className="font-bold">{project.organization.name}</span>
                </div>
                <div className="flex flex-row gap-2">
                  <TransferModal project={project} user={user} />

                  <Button variant="destructive" onClick={deleteProject}>
                    Delete Project
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex-1" />
      <Footer />
    </main>
  );
}

function TransferModal({ project, user }: { project: any; user: Session }) {
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [open, setOpen] = useState(false);

  const orgs = user.organizations
    .map((org) => ({
      value: org.organization.id,
      label: org.organization.name
    }))
    .filter((org) => org.value !== project.organization_id);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      organization: HTMLInputElement;
    };

    const id = target.organization.value;

    if (!id) {
      toast("Please select an organization!");
      return;
    }

    fetch(`/api/project/${project.id}/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        org_id: id
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast("Error transferring project!");
          return;
        }

        setOpen(false);
        toast("Project transferred!");
      })
      .catch((err) => {
        toast("Error transferring project!");
      });
  }

  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DialogTrigger asChild>
        <Button>Transfer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Project</DialogTitle>
          <DialogDescription>
            This let&apos;s you transfer the project to another organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">Organization</label>
              <Select
                name="organization"
                value={selectedOrganization}
                onValueChange={(value) => setSelectedOrganization(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an Organization" />
                </SelectTrigger>
                <SelectContent>
                  {orgs.map((org) => (
                    <SelectItem value={org.value} key={org.value}>
                      {org.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex flex-row gap-2 pt-4">
            <Button type="submit" disabled={!selectedOrganization}>
              Transfer
            </Button>

            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
