import React from "react";
import MagicLinkEmail from "@/emails/templates/magic-link";

export default function Preview() {
  return (
    <MagicLinkEmail
      name="Alex"
      link="https://example.com/magic?token=abcdef"
      expiresAt={new Date(Date.now() + 1000 * 60 * 15).toISOString()}
      fallbackUrl="https://example.com/magic/manual/abcdef"
    />
  );
}
