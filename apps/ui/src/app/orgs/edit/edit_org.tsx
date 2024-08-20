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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
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
import { capitalize } from "@/lib/utils";
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

  const [notificationEndpoints, setNotificationEndpoints] = useState<any[]>([]);
  const [createNotificationEndpointModal, setCreateNotificationEndpointModal] =
    useState(false);

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

    fetch(`/api/organization/${user.selected_org}/notification-endpoints`, {
      credentials: "include"
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setNotificationEndpoints(data.endpoints);
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

  function deleteNotificationEndpoint(endpoint_id: string) {
    fetch(
      `/api/organization/${user.selected_org}/notification-endpoint/${endpoint_id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast("Error deleting notification endpoint!");
          return;
        }

        toast("Notification endpoint deleted!");

        window.location.reload();
      })
      .catch((err) => {
        console.log(err);
        toast("Error deleting notification endpoint!");
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

                <div className="flex flex-col pt-4 gap-4">
                  <div className="flex flex-row justify-between w-full gap-2">
                    <span className="text-sm font-bold">
                      Notification Endpoints
                    </span>
                    <div>
                      <Button
                        size="sm"
                        onClick={() => setCreateNotificationEndpointModal(true)}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="w-full">Type</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notificationEndpoints &&
                          notificationEndpoints.map((endpoint: any) => (
                            <TableRow key={endpoint.id}>
                              <TableCell className="font-medium w-full">
                                {endpoint.name}
                              </TableCell>
                              <TableCell className="text-right">
                                {capitalize(endpoint.type.toLowerCase())}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    deleteNotificationEndpoint(endpoint.id)
                                  }
                                >
                                  Delete
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

      <NewNotificationEndpointModal
        user={user}
        showModal={createNotificationEndpointModal}
        onClose={() => setCreateNotificationEndpointModal(false)}
      />
    </main>
  );
}

enum EndpointType {
  DISCORD = "DISCORD",
  SLACK = "SLACK",
  WEBHOOK = "WEBHOOK"
}

export function NewNotificationEndpointModal({
  user,
  showModal,
  onClose
}: {
  user: Session;
  showModal: boolean;
  onClose: () => void;
}) {
  const [endpointName, setEndpointName] = useState("");
  const [endpointURL, setEndpointURL] = useState("");
  const [endpointType, setEndpointType] = useState("DISCORD");
  const [urlPlaceholder, setURLPlaceholder] = useState(
    "https://discord.com/api/webhooks/..."
  );

  useEffect(() => {
    if (endpointType === EndpointType.DISCORD) {
      setURLPlaceholder("https://discord.com/api/webhooks/...");
    } else if (endpointType === EndpointType.SLACK) {
      setURLPlaceholder("https://hooks.slack.com/services/...");
    } else if (endpointType === EndpointType.WEBHOOK) {
      setURLPlaceholder("https://...");
    }
  }, [endpointType]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      endpoint_name: HTMLInputElement;
      endpoint_url: HTMLInputElement;
      endpoint_type: HTMLSelectElement;
    };

    const name = target.endpoint_name.value;
    const url = target.endpoint_url.value;
    const type = target.endpoint_type.value;

    if (!name) {
      toast("Please give the endpoint a name!", {
        dismissible: true,
        duration: 2000
      });
      return;
    }

    if (name.length > 100) {
      toast("Name must be less than 100 characters!", {
        dismissible: true,
        duration: 2000
      });
      return;
    }

    if (!(type in EndpointType)) {
      toast("Invalid endpoint type!", {
        dismissible: true,
        duration: 2000
      });
      return;
    }

    if (type === EndpointType.WEBHOOK && !url.startsWith("https://")) {
      toast("Webhook URL must start with https://", {
        dismissible: true,
        duration: 2000
      });
      return;
    } else if (
      type === EndpointType.DISCORD &&
      !url.startsWith("https://discord.com/api/webhooks/")
    ) {
      toast(
        "Discord Webhook URL must start with https://discord.com/api/webhooks/",
        {
          dismissible: true,
          duration: 2000
        }
      );
      return;
    } else if (
      type === EndpointType.SLACK &&
      !(
        url.startsWith("https://hooks.slack.com/services/") ||
        url.startsWith("https://hooks.slack-gov.com/services/")
      )
    ) {
      toast(
        "Slack Webhook URL must start with https://hooks.slack.com/services/ or https://hooks.slack-gov.com/services/",
        {
          dismissible: true,
          duration: 2000
        }
      );
      return;
    }

    fetch(
      `/api/organization/${user.selected_org}/create-notification-endpoint`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name,
          type: type,
          endpoint: url
        })
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast("Error creating notification endpoint!", {
            description: "Please try again.",
            dismissible: true,
            duration: 2000
          });
          return;
        }

        toast("Notification endpoint created!");

        window.location.reload();
      })
      .catch((err) => {
        toast("Error creating notification endpoint!", {
          description: "Please try again.",
          dismissible: true,
          duration: 2000
        });
      });

    onClose();

    // window.location.reload();
  }

  return (
    <Dialog open={showModal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Creating a Notification Endpoint</DialogTitle>
          <DialogDescription>
            This will create a new Notification Endpoint in your organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">Endpoint Name</label>
              <input
                type="text"
                placeholder="Endpoint Name"
                autoComplete="off"
                maxLength={100}
                name="endpoint_name"
                value={endpointName}
                onChange={(e) => setEndpointName(e.target.value)}
                required
                className="w-full rounded-md border-2 border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">URL</label>
              <input
                type="text"
                name="endpoint_url"
                placeholder={urlPlaceholder}
                className="w-full rounded-md border-2 border-gray-300 px-3 py-2 text-sm"
                value={endpointURL}
                onChange={(e) => setEndpointURL(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">Endpoint Type</label>
              <select
                className="w-full rounded-md border-2 border-gray-300 px-3 py-2 text-sm"
                name="endpoint_type"
                required
                value={endpointType}
                onChange={(e) => setEndpointType(e.target.value)}
              >
                <option value="DISCORD">Discord</option>
                <option value="SLACK">Slack</option>
                <option value="WEBHOOK">Webhook</option>
              </select>
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-2 pt-4">
            <Button type="submit" disabled={!endpointName || !endpointURL}>
              Create
            </Button>

            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
