import { z } from "zod";

const urlLike = z.string().min(1);

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
    DATABASE_URL: urlLike,
    DIRECT_URL: z.string().optional(),
    REDIS_URL: urlLike,
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    NEXTAUTH_SECRET: z.string().min(16).optional(),
    AUTH_SECRET: z.string().min(16).optional(),
    WEBHOOK_SECRET: z.string().min(1).optional(),
    WEBHOOK_SECRET_PEPPER: z.string().min(1).optional(),
    ENCRYPTION_KEY: z.string().min(1),
    PORT: z.coerce.number().int().positive().optional(),
    WORKER_PORT: z.coerce.number().int().positive().optional(),
    SCHEDULER_PORT: z.coerce.number().int().positive().optional(),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info")
  })
  .superRefine((env, ctx) => {
    if (!env.NEXTAUTH_SECRET && !env.AUTH_SECRET) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["NEXTAUTH_SECRET"], message: "NEXTAUTH_SECRET or AUTH_SECRET is required." });
    }

    if (!env.WEBHOOK_SECRET && !env.WEBHOOK_SECRET_PEPPER) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["WEBHOOK_SECRET"], message: "WEBHOOK_SECRET or WEBHOOK_SECRET_PEPPER is required." });
    }
  });

type ParsedWorkerEnv = z.infer<typeof envSchema>;
export type WorkerEnv = ParsedWorkerEnv & {
  WORKER_PORT: number;
  SCHEDULER_PORT: number;
};

export function validateWorkerEnv(): WorkerEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid worker environment: ${details}`);
  }

  return {
    ...parsed.data,
    WORKER_PORT: parsed.data.WORKER_PORT ?? parsed.data.PORT ?? 3001,
    SCHEDULER_PORT: parsed.data.SCHEDULER_PORT ?? parsed.data.PORT ?? 3002
  };
}
