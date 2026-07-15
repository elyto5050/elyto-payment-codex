import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Emails from "@/emails";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

type TemplateName = keyof typeof Emails;

export async function renderTemplate(name: TemplateName, props: any) {
  const Component = (Emails as any)[name];
  if (!Component) throw new Error(`Unknown email template: ${name}`);
  const element = React.createElement(Component, props);
  const html = renderToStaticMarkup(element);
  return `<!doctype html>${html}`;
}

export async function sendEmail({
  to,
  subject,
  template,
  props,
  dryRun = true
}: {
  to: string;
  subject: string;
  template: TemplateName;
  props: any;
  dryRun?: boolean;
}) {
  const html = await renderTemplate(template, props);
  if (dryRun) return { ok: true, html };

  if (!resend) throw new Error("RESEND_API_KEY not configured");

  const result = await resend.emails.send({
    from: "Elyto <no-reply@elyto.com>",
    to,
    subject,
    html
  });

  return { ok: true, result };
}
