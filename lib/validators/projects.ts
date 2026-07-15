import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  upiId: z.string().min(3).max(120).optional()
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  upiId: z.string().min(3).max(120).optional(),
  logoUrl: z.string().url().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "DISABLED"]).optional()
});

export const createProductSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().positive(),
  currency: z.string().default("INR"),
  category: z.string().max(80).optional(),
  planType: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "LIFETIME"]).optional()
});

export const updateProductSchema = createProductSchema.partial().omit({ projectId: true });
