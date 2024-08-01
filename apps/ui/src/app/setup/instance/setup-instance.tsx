"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function SetupInstance() {
  const [error, setError] = useState<string | null>(null);
  const [instanceType, setInstanceType] = useState<string>("local");
  const [submitted, setSubmitted] = useState(false);

  function setupInstance() {
    setError(null);
    setSubmitted(true);

    if (instanceType === "remote") {
      setSubmitted(false);
      return;
    } else if (instanceType === "local") {
      fetch("/api/instance/local", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            if (data.error === "instance_already_exists") {
              setError("Instance already exists.");
            } else {
              setError("An error occurred. Please try again.");
            }
          } else {
            window.location.href = "/";
            return;
          }
        })
        .catch((error) => {
          setError("An error occurred. Please try again.");
        })
        .finally(() => {
          setSubmitted(false);
        });
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-2 py-5">
      <div className="flex flex-col items-center justify-center w-full max-w-md gap-10">
        <Card className="mx-auto max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Instance Setup</CardTitle>
            <CardDescription>
              You will now setup the initial instance for Chief to host your
              apps and services on.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <RadioGroup
                value={instanceType}
                onValueChange={(value) => setInstanceType(value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="local" id="local-instance" />
                  <Label htmlFor="local-instance">Local Instance</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="remote"
                    id="remote-instance"
                    className="disabled:opacity-30"
                    disabled
                  />
                  <Label htmlFor="remote-instance" className="opacity-30">
                    Remote Instance
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="mt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={instanceType === "remote" || submitted}
                onClick={setupInstance}
              >
                {submitted ? "Creating Instance..." : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="h-20" />
      </div>
    </main>
  );
}
