"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Session } from "./session-type";
import useLocalStorage from "./use-local-storage";

export const SessionContext = createContext<Session>({} as Session);

export function SessionProvider({ children }: { children: any }) {
  "use client";

  const [session, setSession] = useLocalStorage("session", {} as Session);

  useEffect(() => {
    fetch("/api/auth", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-cache"
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setSession(data.user);
        } else {
          setSession({});
        }
      })
      .catch((error) => {
        setSession({});
      });
  }, []);

  return (
    <SessionContext.Provider value={session as Session}>
      {/* {session && (
        <div className="text-white p-1 pl-5 w-full bg-red-900 text-center">
          {session.firstName} {session.lastName} – {session.email} –{" "}
          {session.id} – {session.permissions} —{" "}
          <a href="/logout" className="font-bold underline hover:opacity-80">
            Logout
          </a>
        </div>
      )} */}
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
