"use client";

import { UploadButton } from "@/lib/uploadthing";
import Image from "next/image";

export function ProjectLogoUpload({ currentUrl, onUploaded }: { currentUrl?: string | null; onUploaded: (url: string) => void }) {
  return (
    <div className="space-y-3">
      {currentUrl ? (
        <Image src={currentUrl} alt="Project logo" width={64} height={64} className="rounded-md border border-border" unoptimized />
      ) : null}
      <UploadButton
        endpoint="projectLogo"
        onClientUploadComplete={(res) => {
          const url = res[0]?.url;
          if (url) onUploaded(url);
        }}
        appearance={{
          button: "bg-primary text-white text-sm px-4 py-2 rounded-md ut-ready:bg-primary",
          allowedContent: "text-zinc-500 text-xs"
        }}
      />
    </div>
  );
}
