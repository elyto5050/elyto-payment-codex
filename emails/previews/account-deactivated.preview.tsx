import React from "react";
import AccountDeactivated from "@/emails/templates/account-deactivated";

export default function Preview() {
  return (
    <AccountDeactivated
      userName="Ravi"
      deactivatedAt="2026-06-12T12:34:56Z"
      reactivationUrl="https://example.com/support/reactivate"
    />
  );
}
