import { Suspense } from "react";
import AcceptInviteClient from "./client";

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center text-zinc-400">Loading…</main>}>
      <AcceptInviteClient />
    </Suspense>
  );
}
