import React from "react";
import WelcomeEmail from "@/emails/templates/welcome";

export default function Preview() {
  return (
    <WelcomeEmail
      name="Alex"
      dashboardUrl="https://example.com/dashboard"
      docsUrl="https://example.com/docs"
      createProjectUrl="https://example.com/dashboard/projects/new"
      connectGmailUrl="https://example.com/dashboard/gmail/connect"
    />
  );
}
