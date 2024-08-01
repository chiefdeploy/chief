/* eslint-disable react/no-unescaped-entities */
"use client";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Session } from "@/lib/session-type";
import { relative_time } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function Source({
  user,
  source,
  domain,
}: {
  user: any;
  source: any;
  domain: string;
}) {
  const [installationType, setInstallationType] = useState<string>();
  const [orgSlug, setOrgSlug] = useState<string>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const github_manifest = {
    name: source.name,
    url: `https://${domain}`,
    hook_attributes: {
      url: `https://${domain}/api/github/events`,
      active: true,
    },
    redirect_url: `http://${domain}/api/github/redirect`,
    callback_urls: [`http://${domain}/api/github/callback`],
    public: false,
    request_oauth_on_install: false,
    setup_url: `http://${domain}/api/github/install`,
    setup_on_update: true,
    default_permissions: {
      contents: "read",
      metadata: "read",
      emails: "read",
      administration: "read",
      pull_requests: "write",
      statuses: "write",
    },
    default_events: ["pull_request", "push"],
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center">
      <Header user={user} />

      <div className="px-8 flex flex-col items-start w-full max-w-[800px]">
        <div className="flex flex-row gap-4 w-full text-sm justify-between items-center pb-4">
          <h1 className="text-2xl font-bold">{source.name} (GitHub)</h1>

          <div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Source
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full py-2">
          {!source.is_created && (
            <div className="flex flex-col gap-4">
              <p className="max-w-md">
                You need to create a GitHub App to get started, the app can
                either be in your GitHub Account or in a GitHub Organization.
              </p>

              <div className="flex flex-col gap-2">
                <p className="font-bold">Select the installation type:</p>
                <RadioGroup
                  value={installationType}
                  onValueChange={(value) => setInstallationType(value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="account" id="radio-account" />
                    <Label htmlFor="radio-account">GitHub Account</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="org" id="radio-org" />
                    <Label htmlFor="radio-org">GitHub Organization</Label>
                  </div>
                </RadioGroup>
              </div>

              {installationType === "account" && (
                <form
                  action={`https://github.com/settings/apps/new`}
                  method="POST"
                >
                  <input
                    type="hidden"
                    name="manifest"
                    value={JSON.stringify(github_manifest)}
                  />
                  <Button size="sm" variant="default" type="submit">
                    Create a personal GitHub app
                  </Button>
                </form>
              )}

              {installationType === "org" && (
                <>
                  <p>
                    The slug will be the same as the last part of your github
                    organization URL. So for example, if the url is
                    <pre className="inline bg-muted px-1 py-0.5 rounded-md">
                      https://github.com/chiefdeploy
                    </pre>{" "}
                    the slug will be{" "}
                    <pre className="inline bg-muted px-1 py-0.5 rounded-md">
                      chiefdeploy
                    </pre>
                    .
                  </p>
                  <Label htmlFor="org-slug">Organization Slug</Label>
                  <Input
                    type="text"
                    placeholder="e.g. 'chiefdeploy'"
                    id="org-slug"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                  />

                  <form
                    action={`https://github.com/organizations/${orgSlug}/settings/apps/new`}
                    method="POST"
                  >
                    <input
                      type="hidden"
                      name="manifest"
                      value={JSON.stringify(github_manifest)}
                    />
                    <Button
                      size="sm"
                      variant="default"
                      disabled={!orgSlug}
                      type="submit"
                    >
                      Create a GitHub app for your organization
                    </Button>
                  </form>
                </>
              )}
            </div>
          )}

          {source.is_created && !source.is_installed && (
            <div>
              Click{" "}
              <a
                href={`${source.html_url}/installations/new`}
                className="underline"
              >
                here
              </a>{" "}
              to install the GitHub App to get started.
            </div>
          )}

          {source.is_installed && source.is_created && (
            <div>
              <p>You can now start building and deploying your projects.</p>
              <p>URL: {source.html_url}</p>
              <DisplayRepositories source_id={source.id} />
            </div>
          )}

          <DeleteSourceDialog
            source={source}
            user={user}
            isShowing={showDeleteDialog}
            onClose={() => setShowDeleteDialog(false)}
          />
        </div>
      </div>

      <div className="flex-1" />

      <Footer />
    </main>
  );
}

function DisplayRepositories({ source_id }: { source_id: string }) {
  const [repositories, setRepositories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (source_id) {
      fetch(`/api/github/${source_id}/repos`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setRepositories(data.repositories);
          }
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [source_id]);

  return (
    <div className="flex flex-col gap-2 w-full py-2">
      <h3 className="text-md font-bold">
        Repositories
        {repositories && repositories.length > 0 && ` (${repositories.length})`}
        :
      </h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="flex flex-col w-full">
          {repositories && repositories.length > 0 ? (
            repositories
              .sort(
                (a, b) =>
                  new Date(b.pushed_at).getTime() -
                  new Date(a.pushed_at).getTime(),
              )
              .map((repo: any) => (
                <div key={repo.id}>
                  <a className="text-md hover:underline" href={repo.html_url}>
                    {repo.full_name} - {relative_time(repo.pushed_at)}
                  </a>
                </div>
              ))
          ) : (
            <div>No repositories found.</div>
          )}
        </div>
      )}
    </div>
  );
}

function DeleteSourceDialog({
  source,
  user,
  isShowing,
  onClose,
}: {
  source: any;
  user: Session;
  isShowing: boolean;
  onClose: () => void;
}) {
  function handleDelete() {
    fetch(`/api/github/${source.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast("Error deleting source!", {
            description: "Please try again.",
            dismissible: true,
            duration: 2000,
          });
          return;
        }

        onClose();

        toast("Source deleted!");

        window.location.reload();
      })
      .catch((err) => {
        toast("Error deleting source!", {
          description: "Please try again.",
          dismissible: true,
          duration: 2000,
        });
      });
  }

  return (
    <AlertDialog open={isShowing} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the{" "}
            <span className="bg-muted px-1 py-0.5 rounded-sm whitespace-nowrap">
              {source.name}
            </span>{" "}
            source. <br />
            <br />
            This operation will fail if there are any projects using this
            source.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
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
