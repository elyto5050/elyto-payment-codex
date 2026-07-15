import React from "react";
import TeamInvitation from "@/emails/templates/team-invitation";

export default function Preview() {
  return (
    <TeamInvitation
      inviterName="Priya"
      teamName="Elyto Creators"
      role="Admin"
      invitationUrl="https://example.com/team/accept?token=abc123"
      expiresAt="2026-07-12"
    />
  );
}
