import TutorialsClient from "@/components/tutorials/tutorials-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tutorials — Elyto",
  description: "Learn how to use Elyto with guided tutorials, videos and walkthroughs."
};

// Client component is imported directly; it contains `"use client"` and will hydrate on the client.

export default function TutorialsPage() {
  return (
    <div>
      <TutorialsClient />
    </div>
  );
}
