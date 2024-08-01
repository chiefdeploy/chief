import { useServerSession } from "@/lib/use-server-session";
import { redirect } from "next/navigation";
import { Source } from "./source";
import { prisma } from "@chief/db";

export const dynamic = "force-dynamic";

export default async function SourcePage({
  params
}: {
  params: { id: string };
}) {
  const user = await useServerSession();

  if (!user) {
    return redirect("/auth/login");
  }

  const source = await prisma.organizationGithubSource.findFirst({
    where: {
      id: params.id,
      organization: {
        members: {
          some: {
            user_id: user.id
          }
        }
      }
    }
  });

  if (!source) {
    return redirect("/sources");
  }

  const domain = process.env.DOMAIN!;

  const manifest_string = JSON.stringify({
    name: source.name,
    url: `https://${domain}`,
    hook_attributes: {
      url: `https://${domain}/api/github/events`,
      active: true
    },
    redirect_url: `https://${domain}/api/github/redirect`,
    callback_urls: [`https://${domain}/api/github/callback`],
    public: false,
    request_oauth_on_install: false,
    setup_url: `https://${domain}/api/github/install`,
    setup_on_update: true,
    default_permissions: {
      contents: "read",
      metadata: "read",
      emails: "read",
      administration: "read",
      pull_requests: "write",
      statuses: "write"
    },
    default_events: ["pull_request", "push"]
  });

  return (
    <Source
      user={user as any}
      source={{
        id: source.id,
        name: source.name,
        owner_login: source.owner_login,
        owner_avatar: source.owner_avatar,
        html_url: source.html_url,
        manifest_string: manifest_string,
        is_created: Boolean(
          source.app_id &&
            source.app_id &&
            source.client_secret &&
            source.client_id &&
            source.pem
        ),
        is_installed: Boolean(source.installation_id)
      }}
      domain={domain}
    />
  );
}
