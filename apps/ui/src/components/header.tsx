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
import { UserCircle } from "lucide-react";
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
                <Button variant="ghost" size="icon">
                  <UserCircle className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
                  <span className="sr-only">Profile</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" alignOffset={-8}>
                <Link href="/profile">
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                </Link>
                <DropdownMenuItem>Organizations</DropdownMenuItem>
                <Link href="/admin">
                  <DropdownMenuItem>Admin Panel</DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Theme</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={setTheme}
                  >
                    <DropdownMenuRadioItem value="light">
                      Light
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                      Dark
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                      System
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>

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
