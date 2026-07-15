import { Body, Container, Head, Html, Img, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

const logoUrl = process.env.NEXT_PUBLIC_EMAIL_LOGO_URL ?? "https://i.ibb.co/RpVR1WTg/logo.png";

export function EmailLayout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ background: "#0A0A0A", color: "#ffffff", fontFamily: "Inter, Arial, sans-serif", margin: 0 }}>
        <Container style={{ padding: "40px 24px", maxWidth: "560px" }}>
          <Section style={{ marginBottom: "32px" }}>
            <Img src={logoUrl} width="40" height="40" alt="Elyto" />
          </Section>
          {children}
          <Text style={{ color: "#71717a", fontSize: "12px", marginTop: "40px" }}>
            Elyto · Payment verification infrastructure · elyto.in
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
