import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/Spinner';

import { useAuth } from '../../AuthContext';

const recoverySchema = z.object({
  email: z
    .string({ required_error: 'El email es obligatorio.' })
    .min(1, 'El email es obligatorio.')
    .email('Ingresa un email válido.'),
});

export type RecoveryFormValues = z.infer<typeof recoverySchema>;

export function RecoveryForm() {
  const { sendPasswordReset } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RecoveryFormValues>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      email: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    setServerError(null);

    try {
      await sendPasswordReset(values.email);
      const success = 'Te enviamos un enlace de recuperación. Revísalo en los próximos minutos.';
      setMessage(success);
      toast.success(success);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo iniciar la recuperación.';
      setServerError(message);
      toast.error(message);
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          disabled={isSubmitting}
          {...register('email')}
        />
        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            Enviando...
          </span>
        ) : (
          'Enviar enlace de recuperación'
        )}
      </Button>
    </form>
  );
}
