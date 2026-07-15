import React from "react";
import OrganizationInvitation from "@/emails/templates/organization-invitation";

export default function Preview() {
  return (
    <OrganizationInvitation
      inviterName="Carlos"
      organizationName="Elyto Labs"
      role="Owner"
      invitationUrl="https://example.com/organization/accept?token=org123"
      expiresAt="2026-07-01"
    />
  );
}
