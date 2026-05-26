import { z } from 'zod';

export const identifyRequestSchema = z.object({
  email: z.string().email(),
  fingerprintToken: z.string().uuid(),
  extraMeta: z.record(z.unknown()).optional(),
});

export const refreshRequestSchema = z.object({});

export type IdentifyRequest = z.infer<typeof identifyRequestSchema>;
