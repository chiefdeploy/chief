"use client";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/session-provider";
import { Session } from "@/lib/session-type";
import { useState } from "react";
import { set } from "react-hook-form";

export default function CreateOrganization({ user }: { user: Session }) {
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState("");

  function CreateOrganizationHandler(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const organization_name = e.currentTarget.organization_name.value;

    if (!organization_name) {
      setError("Please enter an organization name.");
      return;
    }

    if (organization_name.length > 50) {
      setError("Organization name must be less than 50 characters long.");
      return;
    }

    if (organization_name.length < 3) {
      setError("Organization name must be at least 3 characters long.");
      return;
    }

    fetch(`/api/organization/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: organization_name
      })
    })
      .then((res) => res.json())
      .then((data) => {
        window.location.href = "/";
      })
      .catch((err) => {
        setError("An error occurred. Please try again.");
      });
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center">
      <Header user={user} />
      <div className="flex-1" />
      <div className="flex flex-col gap-4 w-[500px] items-start">
        <Card className="p-4 w-full flex flex-col items-start">
          <CardTitle>Create Organization</CardTitle>

          <CardContent className="p-0 w-full">
            <form
              onSubmit={CreateOrganizationHandler}
              className="flex flex-col gap-4 pt-4 w-full"
            >
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="organization_name">Organization Name</Label>
                <Input
                  type="text"
                  id="organization_name"
                  placeholder="Organization Name"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div>
                  <span className="text-red-500 font-bold text-sm">
                    {error}
                  </span>
                </div>
              )}

              <div>
                <Button type="submit" disabled={!organizationName}>
                  Create
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="flex-1" />
      <Footer />
    </main>
  );
}
