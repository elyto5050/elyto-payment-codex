import { Suspense } from "react";
import TransferOwnerClient from "./transferowner-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function TransferOwnerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black px-4 py-10 text-white">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-8">Loading ownership console...</div>
          </div>
        </div>
      }
    >
      <TransferOwnerClient />
    </Suspense>
  );
}
