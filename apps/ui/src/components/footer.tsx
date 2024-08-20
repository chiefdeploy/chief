"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function Footer() {
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    fetch("/api/version")
      .then((res) => res.text())
      .then((data) => {
        setVersion(data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <footer className="w-full px-8 py-4">
      <div className="flex flex-row font-mono gap-2 w-full text-sm justify-between opacity-50">
        <span>chief {version && `(${version})`}</span>
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
