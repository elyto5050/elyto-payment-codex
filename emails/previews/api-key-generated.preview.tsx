import React from "react";
import ApiKeyGenerated from "@/emails/templates/api-key-generated";

export default function Preview() {
  return (
    <ApiKeyGenerated
      userName="Jordan"
      keyName="Server Integration"
      createdAt={new Date().toISOString()}
      lastFour="E7A3"
      revokeUrl="https://example.com/account/api-keys"
      docsUrl="https://example.com/docs/api-keys"
    />
  );
}
