"use client";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Session } from "@/lib/session-type";
import { EllipsisVertical } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function EditOrg({ user }: { user: Session }) {
  const selected_org = user.organizations.find(
    (org: any) => org.organization.id === user.selected_org
  );

  const [organizationName, setOrganizationName] = useState(
    selected_org.organization.name
  );

  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/organization/${user.selected_org}/members`, {
      credentials: "include"
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setMembers(data.members);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  function RenameOrgHandler(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      organization_name: HTMLInputElement;
    };

    const name = target.organization_name.value;

    if (!name || name.length < 3 || name.length > 50) {
      toast("Invalid organization name!", {
        dismissible: true,
        duration: 2000
      });
      return;
    }

    fetch(`/api/organization/${user.selected_org}/rename`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: name
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast("Error renaming organization!", {
            description: "Please try again.",
            dismissible: true,
            duration: 2000
          });
          return;
        }

        toast("Organization renamed!");

        window.location.reload();
      })
      .catch((err) => {
        toast("Error renaming organization!", {
          description: "Please try again.",
          dismissible: true,
          duration: 2000
        });
      });
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center">
      <Header user={user} />
      <div className="px-8 flex flex-col items-start w-full max-w-[800px]">
        <div className="flex flex-col gap-2 w-full text-sm pb-4">
          <div className="flex flex-row gap-2 w-full justify-between items-center">
            <h1 className="text-2xl font-bold">
              {selected_org.organization.name} Settings
            </h1>
          </div>
          <div className="flex flex-col gap-4 w-full pt-4">
            <Card className="p-6 pt-2 pb-4 w-full max-w-[800px] flex flex-col items-start">
              {/* <CardTitle>Organization Name</CardTitle> */}
              {/* <CardDescription className="pt-1">
                Domain which is used to access the project.
              </CardDescription> */}
              {/* domain input with save */}
              <CardContent className="p-0 pt-2 w-full">
                <form
                  className="flex flex-row justify-between w-full gap-2 items-end"
                  onSubmit={RenameOrgHandler}
                >
                  <div className="flex flex-col gap-2 w-full">
                    <label className="text-sm font-bold">
                      Organization Name
                    </label>
                    <Input
                      type="text"
                      placeholder="example.com"
                      name="organization_name"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      maxLength={50}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      !organizationName ||
                      organizationName.length < 3 ||
                      organizationName.length > 50 ||
                      organizationName === selected_org.organization.name
                    }
                    size="sm"
                    className="px-4 mb-0.5"
                  >
                    Save
                  </Button>
                </form>

                <div className="flex flex-col pt-4 gap-4">
                  <span className="text-sm font-bold">Members</span>

                  <div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-full">Email</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members &&
                          members.map((member: any) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium w-full">
                                {member.user_email}

                                {member.admin && !member.owner && (
                                  <span className="text-sm font-bold text-red-500">
                                    {" "}
                                    (Admin)
                                  </span>
                                )}

                                {member.owner && (
                                  <span className="text-sm font-bold text-blue-500">
                                    {" "}
                                    (Owner)
                                  </span>
                                )}
                              </TableCell>

                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                >
                                  <EllipsisVertical className="text-muted-foreground size-5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="flex-1" />
      <Footer />
    </main>
  );
}
