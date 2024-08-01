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

export function Setup() {
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatpassword, setRepeatpassword] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);

    const email = e.currentTarget.email.value;
    const password = e.currentTarget.password.value;
    const repeatpassword = e.currentTarget.repeatpassword.value;

    if (!email || !password || !repeatpassword) {
      setError("Please fill in all the fields.");
      return;
    }

    if (password !== repeatpassword) {
      setError("Passwords do not match.");
      return;
    }

    fetch("/api/auth/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          if (data.error === "already_setup") {
            setError("Primary user was already setup.");
          } else {
            setError("An error occurred. Please try again.");
          }
        } else {
          window.location.href = "/setup/instance";
          return;
        }
      })
      .catch((error) => {
        setError("An error occurred. Please try again.");
      });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-2 py-5">
      <div className="flex flex-col items-center justify-center w-full max-w-md gap-10">
        <h2 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Chief
        </h2>
        <Card className="mx-auto max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to Chief</CardTitle>
            <CardDescription>
              You will now setup the initial user account for Chief.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="•••••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Repeat Password</Label>
                </div>
                <Input
                  id="repeatpassword"
                  type="password"
                  placeholder="•••••••••••••••"
                  value={repeatpassword}
                  onChange={(e) => setRepeatpassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{error}</AlertTitle>
                  </Alert>
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={
                  !email ||
                  email.length < 5 ||
                  !email.includes("@") ||
                  !password ||
                  !repeatpassword ||
                  password !== repeatpassword
                }
              >
                Next
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="h-20" />
      </div>
    </main>
  );
}
