"use client";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Session } from "@/lib/session-type";
import { useSession } from "@/lib/session-provider";
import { useEffect, useState } from "react";

export function OrganizationPicker({ user }: { user: Session }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<any>(user.selected_org);

  const organizations = user.organizations.map((organization) => ({
    ...organization.organization
  }));

  function handleSelect(organization_id: string) {
    fetch(`/api/organization/select`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: organization_id
      })
    })
      .then((res) => res.json())
      .then((data) => {
        window.location.reload();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between px-[10px]"
        >
          <div className="flex flex-row gap-1.5 items-center">
            <Building2 className="size-4" />
            <span className="truncate max-w-[180px]">
              {value
                ? organizations.find((orgnization) => orgnization.id === value)
                    ?.name
                : ""}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search organizations..." />
          <CommandList>
            <CommandEmpty>No organizations found.</CommandEmpty>
            <CommandGroup>
              {organizations &&
                organizations.length > 0 &&
                organizations.map((organization) => (
                  <CommandItem
                    key={organization.id}
                    value={organization.id}
                    onSelect={(currentValue) => {
                      handleSelect(currentValue);
                      setValue(currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === organization.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate max-w-[200px]">
                      {organization.name}
                    </span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="p-1 w-full">
          <Button
            className="w-full h-8 flex flex-row justify-between px-2"
            variant="outline"
            onClick={() => {
              window.location.href = "/orgs/create";
            }}
          >
            <span>New Organization</span>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
