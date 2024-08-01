"use client";
import Link from "next/link";

import { Session } from "@/lib/session-type";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { cn, compareTime } from "@/lib/utils";
import { Footer } from "@/components/footer";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  EllipsisVertical,
  Eye,
  EyeOff
} from "lucide-react";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { NewPostgresModal } from "./new_postgres";
import { NewRedisModal } from "./new_redis";
import { DeleteServiceDialog } from "./delete_service";
import { Project } from "../projects/[id]/project";
import { PostgresIcon } from "@/components/icons/postgres_icon";
import { RedisIcon } from "@/components/icons/redis_icon";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

function PasswordDisplay({ password }: { password: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-row gap-2">
      <span className="font-bold">Password:</span>{" "}
      <Tooltip delayDuration={200}>
        <TooltipTrigger>
          <pre
            onClick={() => {
              navigator.clipboard.writeText(password);
              toast("Copied password to clipboard!", {
                dismissible: true,
                duration: 2000
              });
            }}
          >
            {show ? password : Array(password.length).fill("*").join("")}
          </pre>
        </TooltipTrigger>
        <TooltipContent>Click to copy.</TooltipContent>
      </Tooltip>
      <button onClick={() => setShow(!show)}>
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function ServiceDropdown({ service, user }: { service: any; user: Session }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="w-6">
            <EllipsisVertical className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" alignOffset={-4}>
          <DropdownMenuItem onClick={() => setShowTransferModal(true)}>
            Transfer
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-500"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteServiceDialog
        service={service}
        type={service.type}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      />
      <TransferModal
        service={service}
        user={user}
        showModal={showTransferModal}
        onClose={() => setShowTransferModal(false)}
      />
    </>
  );
}

function ClickToCopy({ value }: { value: string }) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger>
        <pre
          className="text-ellipsis overflow-hidden whitespace-nowrap h-6 text-left w-[50vw] max-w-[600px]"
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast("Copied to clipboard!", {
              dismissible: true,
              duration: 2000
            });
          }}
        >
          {value}
        </pre>
      </TooltipTrigger>
      <TooltipContent>Click to copy.</TooltipContent>
    </Tooltip>
  );
}

function ServiceItem({ service, user }: { service: any; user: Session }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm px-5 w-full max-w-[800px]">
      <div className="py-1.5 flex flex-col">
        <div className="flex flex-row gap-2 justify-between items-center">
          <div className="flex flex-row gap-2 items-center">
            {service.type === "postgres" && (
              <PostgresIcon className="w-4 h-4 mt-0.5" />
            )}
            {service.type === "redis" && (
              <RedisIcon className="w-4 h-4 mt-0.5" />
            )}
            <h3 className="text-md font-bold">{service.name}</h3>
          </div>
          <div className="flex flex-row gap-2 items-center">
            <div className="text-muted-foreground font-bold">
              {service.type === "postgres" && "Postgres"}
              {service.type === "redis" && "Redis"}
            </div>
            <ServiceDropdown service={service} user={user} />
          </div>
        </div>
        <div className="flex flex-row gap-2 items-center">
          <span className="font-bold">Status:</span>{" "}
          <span>{service.status.toUpperCase()}</span>
        </div>
        {expanded && (
          <div className="flex flex-row gap-2">
            <span className="font-bold">Image:</span> {service.image}
          </div>
        )}
      </div>
      {expanded && (
        <div className="py-2">
          <div className="flex flex-row gap-2">
            <span className="font-bold">Hostname:</span>{" "}
            {service.type === "postgres" && (
              <ClickToCopy value={`pg-${service.id}`} />
            )}
            {service.type === "redis" && (
              <ClickToCopy value={`redis-${service.id}`} />
            )}
          </div>
          {service.type === "postgres" && (
            <div className="flex flex-row gap-2">
              <span className="font-bold">Database:</span>{" "}
              <ClickToCopy value={service.db} />
            </div>
          )}
          {service.type === "postgres" && (
            <div className="flex flex-row gap-2">
              <span className="font-bold">Username:</span>{" "}
              <ClickToCopy value={service.username} />
            </div>
          )}
          <PasswordDisplay password={service.password} />
          <div className="flex flex-row gap-2">
            <span className="font-bold">Port:</span>
            <ClickToCopy value={service.port} />
          </div>
          <div className="flex flex-row gap-2">
            <span className="font-bold">URI:</span>{" "}
            {service.type === "postgres" && (
              <ClickToCopy
                value={`postgres://${service.username}:${service.password}@pg-${service.id}:5432/${service.db}`}
              />
            )}
            {service.type === "redis" && (
              <ClickToCopy
                value={`redis://:${service.password}@redis-${service.id}:6379`}
              />
            )}
          </div>
        </div>
      )}
      <div className="flex flex-row justify-center">
        {expanded ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-20"
            onClick={() => setExpanded(false)}
          >
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-20"
            onClick={() => setExpanded(true)}
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function Services({ user }: { user: Session }) {
  const [showPostgresModal, setShowPostgresModal] = useState(false);
  const [showRedisModal, setShowRedisModal] = useState(false);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetch(`/api/service/${user.selected_org}`, {
        credentials: "include"
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setServices(data.services);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [user]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center">
      <Header user={user} />

      <div className="px-8 flex flex-col items-start w-full max-w-[800px]">
        <div className="flex flex-row gap-4 w-full text-sm justify-between items-center pb-4">
          <h1 className="text-2xl font-bold">Services</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="default">
                Create New{" "}
                <div className="pl-1">
                  <ChevronDown />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setShowPostgresModal(true)}>
                Postgres
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowRedisModal(true)}>
                Redis
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-4 w-full py-2">
          {services && services.length > 0 ? (
            services.map((service: any) => (
              <ServiceItem key={service.id} service={service} user={user} />
            ))
          ) : (
            <div>No services found.</div>
          )}
        </div>
      </div>
      <div className="flex-1" />
      <Footer />

      <NewPostgresModal
        user={user}
        showModal={showPostgresModal}
        onClose={() => setShowPostgresModal(false)}
      />

      <NewRedisModal
        user={user}
        showModal={showRedisModal}
        onClose={() => setShowRedisModal(false)}
      />
    </main>
  );
}

function TransferModal({
  service,
  user,
  showModal,
  onClose
}: {
  service: any;
  user: Session;
  showModal: boolean;
  onClose: () => void;
}) {
  const [selectedOrganization, setSelectedOrganization] = useState("");

  const orgs = user.organizations
    .map((org) => ({
      value: org.organization.id,
      label: org.organization.name
    }))
    .filter((org) => org.value !== service.organization_id);

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

    fetch(`/api/service/${service.id}/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        org_id: id,
        type: service.type
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast("Error transferring service!");
          return;
        }

        onClose();
        toast("Service transferred!");
        window.location.reload();
      })
      .catch((err) => {
        toast("Error transferring service!");
      });
  }

  return (
    <Dialog open={showModal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Service</DialogTitle>
          <DialogDescription>
            This let&apos;s you transfer the service to another organization.
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
