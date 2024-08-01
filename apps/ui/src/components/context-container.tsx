"use client";
import { SessionProvider } from "@/lib/session-provider";
import { TooltipProvider } from "./ui/tooltip";
import { SocketProvider } from "./socket-provider";

export function ContextContainer({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TooltipProvider>
      <SessionProvider>
        <SocketProvider>{children}</SocketProvider>
      </SessionProvider>
    </TooltipProvider>
  );
}
