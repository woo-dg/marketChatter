import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  category: z.string().optional(),
  provider: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const analyticsEventSchema = z.object({
  eventType: z.string(),
  payload: z.record(z.any()),
});

