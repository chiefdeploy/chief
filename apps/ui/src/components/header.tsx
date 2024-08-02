"use client";

import { Session } from "@/lib/session-type";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "./ui/dropdown-menu";
import { OrganizationPicker } from "./organization-picker";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DropdownMenuGroup } from "@radix-ui/react-dropdown-menu";
import { Button } from "./ui/button";
import {
  Cog,
  CogIcon,
  MoonIcon,
  Settings,
  SunIcon,
  UserCircle
} from "lucide-react";
import { useTheme } from "next-themes";

export function Header({ user }: { user: Session }) {
  const currentPath = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <header className="w-full px-4 py-4 pr-8">
      <div className="flex flex-row gap-2 w-full text-sm justify-between">
        <div className="flex flex-row gap-2 w-full text-sm justify-start items-center pb-4">
          <div className="flex-1">
            <OrganizationPicker user={user} />
          </div>
          <div className="flex flex-row gap-2 items-center pl-4">
            <Link
              href="/projects"
              className={cn(
                "text-sm text-muted-foreground hover:underline hover:text-accent-foreground cursor-pointer",
                currentPath === "/projects" && "underline"
              )}
            >
              Projects
            </Link>
            <Link
              href="/services"
              className={cn(
                "text-sm text-muted-foreground hover:underline hover:text-accent-foreground cursor-pointer",
                currentPath === "/services" && "underline"
              )}
            >
              Services
            </Link>
            <Link
              href="/sources"
              className={cn(
                "text-sm text-muted-foreground hover:underline hover:text-accent-foreground cursor-pointer",
                currentPath === "/sources" && "underline"
              )}
            >
              Sources
            </Link>
          </div>

          <div className="flex-1 flex flex-row justify-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 px-0">
                  <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 px-0">
                  <Settings className="h-[1.2rem] w-[1.2rem] hover:rotate-12 rotate-0 scale-100 transition-all" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" alignOffset={-8}>
                <Link href="/profile">
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                </Link>

                <Link href="/orgs/edit">
                  <DropdownMenuItem>Organization</DropdownMenuItem>
                </Link>

                <Link href="/admin">
                  <DropdownMenuItem>Admin Panel</DropdownMenuItem>
                </Link>

                <DropdownMenuSeparator />
                <a href="/logout">
                  <DropdownMenuItem>Logout</DropdownMenuItem>
                </a>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* <a
          href="/logout"
          className="text-sm text-muted-foreground underline hover:text-accent-foreground cursor-pointer"
        >
          Logout
        </a> */}
      </div>
    </header>
  );
}
