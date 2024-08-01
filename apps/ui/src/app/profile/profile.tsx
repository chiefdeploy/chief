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

export default function Profile({ user }: { user: Session }) {
  function ChangePasswordHandler(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // e.target.reset();
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center">
      <Header user={user} />
      <div className="flex-1" />
      <div className="flex flex-col gap-4 w-[500px] items-start">
        <div className="font-bold">{user.email}</div>
        <Card className="p-4 w-full flex flex-col items-start">
          <CardTitle>Change Password</CardTitle>
          <CardDescription>You can change your password here.</CardDescription>
          <CardContent className="p-0 w-full">
            <form
              onSubmit={ChangePasswordHandler}
              className="flex flex-col gap-4 pt-4 w-full"
            >
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="old_password">Old Password</Label>
                <Input
                  type="password"
                  id="old_password"
                  placeholder="Old Password"
                  required
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  type="password"
                  id="new_password"
                  placeholder="New Password"
                  required
                />
              </div>

              <div>
                <Button type="submit">Change Password</Button>
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
