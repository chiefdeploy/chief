import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Session } from "@/lib/session-type";
import { useEffect, useState } from "react";

export function NewRedisModal({
  user,
  showModal,
  onClose
}: {
  user: Session;
  showModal: boolean;
  onClose: () => void;
}) {
  const [serviceName, setServiceName] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      service_name: HTMLInputElement;
    };

    const name = target.service_name.value;

    if (!name) {
      toast("Please give the service a name!", {
        dismissible: true,
        duration: 2000
      });
      return;
    }

    if (name.length > 64) {
      toast("Service name must be less than 64 characters!", {
        dismissible: true,
        duration: 2000
      });
      return;
    }

    onClose();

    fetch(`/api/service/${user.selected_org}/redis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: name
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast("Error creating Redis instance!", {
            description: "Please try again.",
            dismissible: true,
            duration: 2000
          });
          return;
        }

        toast("Creating Redis instance...", {
          description: "This may take a few minutes.",
          dismissible: true,
          duration: 2000,
          onAutoClose: () => {
            window.location.reload();
          }
        });
      })
      .catch((err) => {
        toast("Error creating Redis instance!", {
          description: "Please try again.",
          dismissible: true,
          duration: 2000
        });
      });

    // window.location.reload();
  }

  return (
    <Dialog open={showModal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Creating a Valkey (Redis) Instance</DialogTitle>
          <DialogDescription>
            This will create a new Valkey instance in your organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">Service Name</label>
              <input
                type="text"
                placeholder="Service Name"
                autoComplete="off"
                maxLength={64}
                name="service_name"
                required
                className="w-full rounded-md border-2 border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-2 pt-4">
            <Button type="submit">Create</Button>

            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
