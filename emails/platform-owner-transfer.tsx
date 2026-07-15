import { Heading, Link, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export default function PlatformOwnerTransferEmail({
  currentOwnerEmail,
  targetEmail,
  verificationUrl,
  expiresAt
}: {
  currentOwnerEmail: string;
  targetEmail: string;
  verificationUrl: string;
  expiresAt: Date;
}) {
  return (
    <EmailLayout preview="Confirm Elyto platform ownership transfer">
      <Heading style={{ color: "#fff", fontSize: "24px" }}>Confirm ownership transfer</Heading>
      <Text style={{ color: "#d4d4d8", lineHeight: "24px" }}>
        {currentOwnerEmail} requested to transfer Elyto platform ownership to {targetEmail}.
      </Text>
      <Text style={{ color: "#d4d4d8", lineHeight: "24px" }}>
        Open the secure confirmation link below while signed in as {targetEmail}. The link expires at{" "}
        {expiresAt.toISOString()}.
      </Text>
      <Link
        href={verificationUrl}
        style={{
          display: "inline-block",
          marginTop: "12px",
          borderRadius: "12px",
          background: "#7C3AED",
          color: "#ffffff",
          padding: "12px 18px",
          textDecoration: "none",
          fontWeight: 600
        }}
      >
        Confirm transfer
      </Link>
      <Text style={{ color: "#a1a1aa", fontSize: "13px", lineHeight: "20px" }}>
        If you did not expect this transfer, do not open the link and contact the current platform owner.
      </Text>
    </EmailLayout>
  );
}
