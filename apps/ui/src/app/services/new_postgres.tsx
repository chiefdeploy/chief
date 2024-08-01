import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import generate_name from "@/lib/name-generator";
import { Session } from "@/lib/session-type";
import { useEffect, useState } from "react";

export function NewPostgresModal({
  user,
  showModal,
  onClose,
}: {
  user: Session;
  showModal: boolean;
  onClose: () => void;
}) {
  const [randomDatabaseName, setRandomDatabaseName] = useState("");

  const [serviceName, setServiceName] = useState("");
  const [databaseName, setDatabaseName] = useState("");
  const [version, setVersion] = useState("16");
  const [invalid_db_name, setInvalid_db_name] = useState(false);

  useEffect(() => {
    setRandomDatabaseName(generate_name(1));
  }, [showModal]);

  useEffect(() => {
    if (databaseName.length > 0) {
      if (!databaseName.match(/^[a-z0-9_-]+$/) || databaseName.length > 60) {
        setInvalid_db_name(true);
      } else {
        setInvalid_db_name(false);
      }
    } else {
      setInvalid_db_name(false);
    }
  }, [databaseName]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      service_name: HTMLInputElement;
      database_name: HTMLInputElement;
      version: HTMLSelectElement;
    };

    const name = target.service_name.value;
    let db = target.database_name.value;
    const ver = target.version.value;

    if (!name) {
      toast("Please give the service a name!", {
        dismissible: true,
        duration: 2000,
      });
      return;
    }

    if (!db) {
      db = randomDatabaseName;
    }

    if (db.length > 60) {
      toast("Database name must be less than 60 characters!", {
        dismissible: true,
        duration: 2000,
      });
      return;
    }

    if (name.length > 64) {
      toast("Service name must be less than 64 characters!", {
        dismissible: true,
        duration: 2000,
      });
      return;
    }

    // db name can only contain lowercase letters, numbers, and hyphens
    if (!db.match(/^[a-z0-9_-]+$/)) {
      toast(
        "Database name can only contain lowercase letters, numbers, underscores, and hyphens!",
        {
          dismissible: true,
          duration: 2000,
        },
      );
      return;
    }

    onClose();

    fetch(`/api/service/${user.selected_org}/postgres`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        db_name: db,
        image: ver.toString(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast("Error creating Postgres instance!", {
            description: "Please try again.",
            dismissible: true,
            duration: 2000,
          });
          return;
        }

        toast("Creating Postgres instance...", {
          description: "This may take a few minutes.",
          dismissible: true,
          duration: 2000,
          onAutoClose: () => {
            window.location.reload();
          },
        });
      })
      .catch((err) => {
        toast("Error creating Postgres instance!", {
          description: "Please try again.",
          dismissible: true,
          duration: 2000,
        });
      });

    // window.location.reload();
  }

  return (
    <Dialog open={showModal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Creating a Postgres Instance</DialogTitle>
          <DialogDescription>
            This will create a new Postgres instance in your organization.
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
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                required
                className="w-full rounded-md border-2 border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">Database Name</label>
              <input
                type="text"
                maxLength={60}
                name="database_name"
                placeholder={randomDatabaseName}
                className="w-full rounded-md border-2 border-gray-300 px-3 py-2 text-sm"
                value={databaseName}
                onChange={(e) => setDatabaseName(e.target.value)}
              />
              <div>
                {invalid_db_name && (
                  <span className="text-red-500 font-bold text-sm">
                    Database name can only contain lowercase letters, numbers,
                    underscores, and hyphens!
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">Postgres Version</label>
              <select
                className="w-full rounded-md border-2 border-gray-300 px-3 py-2 text-sm"
                name="version"
                required
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              >
                <option value="16">16</option>
                <option value="15">15</option>
                <option value="14">14</option>
              </select>
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-2 pt-4">
            <Button type="submit" disabled={invalid_db_name || !serviceName}>
              Create
            </Button>

            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
