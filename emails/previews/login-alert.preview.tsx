import React from "react";
import LoginAlert from "@/emails/templates/login-alert";

export default function Preview() {
  return (
    <LoginAlert
      userName="Sofia"
      ip="198.51.100.23"
      location="Lisbon, Portugal"
      device="Safari on iOS"
      time={new Date().toISOString()}
      signInUrl="https://example.com/account/sessions"
    />
  );
}
