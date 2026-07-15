import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elyto - UPI Payment Verification Automation",
  description: "Automate UPI payment verification using Gmail transaction notifications, APIs, and webhooks.",
  metadataBase: new URL("https://elyto.in"),
  icons: { icon: "/logo.png", apple: "/logo.png" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
