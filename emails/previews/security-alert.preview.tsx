import React from "react";
import SecurityAlert from "@/emails/templates/security-alert";

export default function Preview() {
  return (
    <SecurityAlert
      userName="Alex"
      eventDescription="New login from a new device"
      time={new Date().toISOString()}
      ip="203.0.113.42"
      location="Bengaluru, India (approx)"
      device="Chrome on Windows"
      reviewUrl="https://example.com/dashboard/security"
      secureAccountUrl="https://example.com/account/security"
    />
  );
}
