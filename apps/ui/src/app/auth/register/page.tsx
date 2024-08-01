"use client";
import { useSession } from "@/lib/session-provider";

import Link from "next/link";

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

export default function Login() {
  const user = useSession();

  if (user) {
    return <div>Already authenticated.</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-2 py-5">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Register</CardTitle>
        </CardHeader>
        <CardContent>
          <div>Registration is disabled.</div>
        </CardContent>
      </Card>
    </main>
  );
}
