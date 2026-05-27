import { z } from 'zod';
export declare const paymentSubmitSchema: z.ZodObject<{
    cardNumber: z.ZodString;
    expiry: z.ZodString;
    cardHolder: z.ZodString;
    cvv: z.ZodString;
}, "strip", z.ZodTypeAny, {
    cardNumber: string;
    expiry: string;
    cardHolder: string;
    cvv: string;
}, {
    cardNumber: string;
    expiry: string;
    cardHolder: string;
    cvv: string;
}>;
export type PaymentSubmit = z.infer<typeof paymentSubmitSchema>;
