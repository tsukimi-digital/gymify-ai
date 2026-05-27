import { z } from 'zod';
export declare const identifyRequestSchema: z.ZodObject<{
    email: z.ZodString;
    fingerprintToken: z.ZodString;
    extraMeta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    fingerprintToken: string;
    extraMeta?: Record<string, unknown> | undefined;
}, {
    email: string;
    fingerprintToken: string;
    extraMeta?: Record<string, unknown> | undefined;
}>;
export declare const refreshRequestSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export type IdentifyRequest = z.infer<typeof identifyRequestSchema>;
