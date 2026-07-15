import { Resend } from "resend";
import { render } from "@react-email/components";
import WelcomeEmail from "@/emails/welcome";
import TeamInviteEmail from "@/emails/team-invite";
import PaymentSuccessEmail from "@/emails/payment-success";
import PaymentFailedEmail from "@/emails/payment-failed";
import SecurityAlertEmail from "@/emails/security-alert";
import WebhookFailureEmail from "@/emails/webhook-failure";
import PlatformOwnerTransferEmail from "@/emails/platform-owner-transfer";
import SubscriptionActivatedEmail from "@/emails/subscription-activated";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.RESEND_FROM_EMAIL ?? "Elyto <hello@elyto.in>";

export async function sendWelcomeEmail(to: string, name?: string | null) {
  if (!resend) return;
  const html = await render(WelcomeEmail({ name: name ?? undefined }));
  await resend.emails.send({ from, to, subject: "Welcome to Elyto", html });
}

export async function sendTeamInviteEmail(to: string, organizationName: string, inviteUrl: string, role: string) {
  if (!resend) return;
  const html = await render(TeamInviteEmail({ organizationName, inviteUrl, role }));
  await resend.emails.send({ from, to, subject: `Join ${organizationName} on Elyto`, html });
}

export async function sendPaymentSuccessEmail(to: string, orderId: string, amount: string) {
  if (!resend) return;
  const html = await render(PaymentSuccessEmail({ orderId, amount }));
  await resend.emails.send({ from, to, subject: "Payment verified", html });
}

export async function sendPaymentFailedEmail(to: string, orderId: string, reason: string) {
  if (!resend) return;
  const html = await render(PaymentFailedEmail({ orderId, reason }));
  await resend.emails.send({ from, to, subject: "Payment verification failed", html });
}

export async function sendSecurityAlertEmail(to: string, message: string) {
  if (!resend) return;
  const html = await render(SecurityAlertEmail({ message }));
  await resend.emails.send({ from, to, subject: "Security alert — Elyto", html });
}

export async function sendWebhookFailureEmail(to: string, endpoint: string) {
  if (!resend) return;
  const html = await render(WebhookFailureEmail({ endpoint }));
  await resend.emails.send({ from, to, subject: "Webhook delivery failed", html });
}

export async function sendPlatformOwnerTransferEmail(input: {
  to: string;
  currentOwnerEmail: string;
  targetEmail: string;
  verificationUrl: string;
  expiresAt: Date;
}) {
  if (!resend) return;
  const html = await render(PlatformOwnerTransferEmail(input));
  await resend.emails.send({
    from,
    to: input.to,
    subject: "Confirm Elyto platform ownership transfer",
    html
  });
}

export async function sendSubscriptionActivatedEmail(to: string, planName: string, limits: string, renewalDate?: string | null) {
  if (!resend) return;
  const html = await render(SubscriptionActivatedEmail({ planName, limits, renewalDate }));
  await resend.emails.send({ from, to, subject: "Subscription activated", html });
}
