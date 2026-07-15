import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  API_KEY_PEPPER: z.string().optional(),
  WEBHOOK_SECRET_PEPPER: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional()
});

export const env = envSchema.parse(process.env);
