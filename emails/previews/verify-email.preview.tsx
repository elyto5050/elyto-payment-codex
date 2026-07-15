import React from "react";
import VerifyEmail from "@/emails/templates/verify-email";

export default function Preview() {
  return (
    <VerifyEmail
      name="Alex"
      verifyUrl="https://example.com/verify?token=abcdef"
      expiresAt={new Date(Date.now() + 1000 * 60 * 30).toISOString()}
      fallbackUrl="https://example.com/verify/manual/abcdef"
    />
  );
}
