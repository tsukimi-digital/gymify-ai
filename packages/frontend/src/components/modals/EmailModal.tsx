import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../ui/primitives';

const schema = z.object({ email: z.string().email() });
type FormData = z.infer<typeof schema>;

interface EmailModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function EmailModal({ onSuccess, onClose }: EmailModalProps) {
  const { t } = useTranslation();
  const { identify } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    await identify(data.email);
    onSuccess();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="heading-2 text-zinc-100 mb-1">{t('email.title')}</h2>
        <p className="text-sm text-zinc-400 mb-6">{t('email.sub')}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label={t('email.label')}
            type="email"
            placeholder={t('email.placeholder')}
            error={errors.email?.message}
            {...register('email')}
          />
          <Button
            type="submit"
            size="lg"
            variant="primary"
            loading={isSubmitting}
            className="w-full"
          >
            {t('email.cta')}
          </Button>
          <p className="text-center text-xs text-zinc-600">{t('email.note')}</p>
        </form>
      </div>
    </div>
  );
}
