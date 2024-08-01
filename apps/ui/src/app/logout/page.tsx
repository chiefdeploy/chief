"use client";

export default function Logout() {
  fetch("/api/auth/logout")
    .then(() => {
      window.location.href = "/";
    })
    .catch((err) => {
      window.location.href = "/";
    });

  return <div className="p-2">Logging you out...</div>;
}
