import { useMutation } from '@tanstack/react-query';
import { apiFetch, setAccessToken } from '../client';
import type { PaymentSubmit } from '@gymify/shared';

export function usePayment() {
  return useMutation({
    mutationFn: (data: PaymentSubmit) =>
      apiFetch<{ success: boolean; accessToken: string }>('/payment/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}
