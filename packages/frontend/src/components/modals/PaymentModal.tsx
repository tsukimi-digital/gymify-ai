import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { usePayment } from '../../api/hooks/usePayment';
import { setAccessToken } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../ui/primitives';
import { luhnCheck } from '../../lib/luhn';

// Validate expiry is in future
function isExpiryFuture(val: string): boolean {
  const match = val.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = parseInt(match[1], 10);
  const year = 2000 + parseInt(match[2], 10);
  const now = new Date();
  const expDate = new Date(year, month - 1, 1);
  return expDate >= new Date(now.getFullYear(), now.getMonth(), 1);
}

const schema = z.object({
  cardNumber: z
    .string()
    .regex(/^\d{16}$/, 'Must be 16 digits')
    .refine((v) => luhnCheck(v), 'Invalid card number'),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format: MM/YY')
    .refine(isExpiryFuture, 'Card has expired'),
  cardHolder: z.string().min(2, 'Required').max(100),
  cvv: z.string().regex(/^\d{3,4}$/, '3-4 digits'),
});

type FormData = z.infer<typeof schema>;

interface PaymentModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function PaymentModal({ onSuccess, onClose }: PaymentModalProps) {
  const { t } = useTranslation();
  const { setIsPremium } = useAuth();
  const payment = usePayment();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const result = await payment.mutateAsync(data);
    setAccessToken(result.accessToken);
    setIsPremium(true);
    onClose();
    onSuccess();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="heading-2 text-zinc-100 mb-1">{t('payment.title')}</h2>
        <p className="text-sm text-zinc-400 mb-6">{t('payment.sub')}</p>

        {payment.error && (
          <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/30 text-sm text-red-400">
            {(payment.error as Error).message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label={t('payment.cardNumber')}
            type="text"
            inputMode="numeric"
            maxLength={16}
            placeholder="1234567890123456"
            error={errors.cardNumber?.message}
            {...register('cardNumber')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('payment.expiry')}
              type="text"
              placeholder="MM/YY"
              maxLength={5}
              error={errors.expiry?.message}
              {...register('expiry')}
            />
            <Input
              label={t('payment.cvv')}
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="123"
              error={errors.cvv?.message}
              {...register('cvv')}
            />
          </div>
          <Input
            label={t('payment.holder')}
            type="text"
            placeholder="Jan Kowalski"
            error={errors.cardHolder?.message}
            {...register('cardHolder')}
          />

          <Button
            type="submit"
            size="lg"
            variant="primary"
            loading={isSubmitting}
            className="w-full mt-2"
          >
            {t('payment.cta')}
          </Button>

          <p className="text-center text-xs text-zinc-600 flex items-center justify-center gap-1">
            <LockIcon />
            {t('payment.secure')}
          </p>
        </form>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}
