import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateOrganization() {
  const [orgName, setOrgName] = useState("");

  function handleCreateOrganization(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const org_name = event.currentTarget.org_name.value;

    if (!org_name || org_name.length < 3) {
      return;
    }

    fetch(`/api/organization/create`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: org_name
      })
    })
      .then((res) => res.json())
      .then((data) => {
        window.location.href = "/";
      })
      .catch((error) => {
        console.log("create organization", error);
      });

    console.log("create organization", org_name);

    setOrgName("");
  }

  return (
    <Card className="p-4 w-80 flex flex-col items-center gap-4">
      <div className="flex flex-col gap-1 w-full">
        <h1 className="text-2xl font-bold">Create Organization</h1>

        <p className="text-sm text-muted-foreground">
          Create your organization to start building and deploying your
          projects.
        </p>
      </div>

      {/* <div className="w-full bg-muted-foreground/30 h-[1px] my-2 mb-4" /> */}

      <div className="flex flex-col gap-4 w-full">
        <form
          onSubmit={handleCreateOrganization}
          className="flex flex-col gap-4"
        >
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="org_name">Organization Name</Label>
            <Input
              type="text"
              id="org_name"
              placeholder="Acme Inc."
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>

          <div className="flex flex-row gap-2 w-full justify-center">
            <Button
              type="submit"
              variant="default"
              className="w-full"
              disabled={!orgName || orgName.length < 3}
            >
              Create Organization
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
