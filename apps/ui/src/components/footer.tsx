"use client";

import Link from "next/link";

export function Footer() {
  const version = process.env.NEXT_PUBLIC_CHIEF_VERSION;

  return (
    <footer className="w-full px-8 py-4">
      <div className="flex flex-row font-mono gap-2 w-full text-sm justify-between opacity-50">
        <span>chief ({version})</span>
        <div>
          <Link
            href="https://chiefdeploy.com"
            className="hover:underline"
            target="_blank"
          >
            chiefdeploy.com
          </Link>
          <span className="mx-2">·</span>
          <Link
            href="https://chiefdeploy.com/docs"
            className="hover:underline"
            target="_blank"
          >
            docs
          </Link>
          <span className="mx-2">·</span>
          <Link
            href="https://chiefdeploy.com/discord"
            className="hover:underline"
            target="_blank"
          >
            discord
          </Link>
        </div>
      </div>
    </footer>
  );
}
