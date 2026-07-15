import { z } from "zod";

export const createOrderSchema = z.object({
  projectId: z.string().min(1),
  productId: z.string().min(1).optional(),
  customerName: z.string().max(120).optional(),
  customerEmail: z.string().email().optional(),
  amount: z.coerce.number().positive(),
  currency: z.string().default("INR")
});

export const verifyOrderSchema = z.object({
  orderId: z.string().min(1),
  utr: z.string().min(8).max(32)
});
