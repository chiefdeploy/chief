"use client";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Session } from "@/lib/session-type";
import { EllipsisVertical } from "lucide-react";
import { useEffect, useState } from "react";

export default function Admin({ user }: { user: Session }) {
  const [instances, setInstances] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/instance`, {
      credentials: "include"
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setInstances(data.instances);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <main className="flex min-h-screen w-full flex-col items-center">
      <Header user={user} />
      <div className="px-8 flex flex-col items-start w-full max-w-[800px]">
        <div className="flex flex-col gap-2 w-full text-sm pb-4">
          <div className="flex flex-row gap-2 w-full justify-between items-center">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full">
          <h2 className="text-xl font-bold">Instances</h2>
          <Table className="w-full max-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">ID</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instances.map((instance: any) => (
                <TableRow key={instance.id}>
                  <TableCell className="font-medium">{instance.id}</TableCell>
                  <TableCell>
                    {instance.type === "LOCAL" ? "127.0.0.1" : instance.ssh_ip}
                  </TableCell>
                  <TableCell>{instance.status}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <EllipsisVertical className="text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" alignOffset={-4}>
                        <DropdownMenuItem
                          disabled={instance.type.toLowerCase() === "local"}
                        >
                          Stop
                        </DropdownMenuItem>

                        <DropdownMenuItem disabled className="text-red-600">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex-1" />
      <Footer />
    </main>
  );
}
