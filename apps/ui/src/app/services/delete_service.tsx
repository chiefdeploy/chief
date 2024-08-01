import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertDialogAction } from "@radix-ui/react-alert-dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function DeleteServiceDialog({
  service,
  type,
  open,
  onClose
}: {
  service: any;
  type: "redis" | "postgres";
  open: boolean;
  onClose: () => void;
}) {
  function handleDelete() {
    fetch(`/api/service/${service.type}/${service.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include"
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast("Error deleting service!", {
            description: "Please try again.",
            dismissible: true,
            duration: 2000
          });
          return;
        }

        onClose();

        toast("Service deleting...", {
          description: "This may take around a minute.",
          dismissible: true,
          duration: 2000
        });
      })
      .catch((err) => {
        toast("Error deleting service!", {
          description: "Please try again.",
          dismissible: true,
          duration: 2000
        });
      });

    // window.location.reload();
  }

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the{" "}
            <span className="bg-muted px-1 py-0.5 rounded-sm whitespace-nowrap">
              {service.name}
            </span>{" "}
            service and the remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction style={{}} asChild>
            <Button
              variant="destructive"
              onClick={() => {
                handleDelete();
              }}
            >
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
