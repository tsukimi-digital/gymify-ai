import { z } from 'zod';

export const paymentSubmitSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/),
  cardHolder: z.string().min(2).max(100),
  cvv: z.string().regex(/^\d{3,4}$/),
});

export type PaymentSubmit = z.infer<typeof paymentSubmitSchema>;
