import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/Spinner';

import { useAuth } from '../../AuthContext';

const resetSchema = z
  .object({
    password: z
      .string({ required_error: 'La contraseña es obligatoria.' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .max(72, 'La contraseña es demasiado larga.'),
    confirmPassword: z.string({ required_error: 'Debes confirmar la contraseña.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetSchema>;

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }
      if (!data.session) {
        throw new Error('El enlace de recuperación es inválido o expiró. Solicita uno nuevo.');
      }

      await updatePassword(values.password);
      reset({ password: '', confirmPassword: '' });
      const success = 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.';
      setMessage(success);
      toast.success(success);
      navigate('/login', { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo actualizar la contraseña.';
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
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          disabled={isSubmitting}
          {...register('password')}
        />
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          disabled={isSubmitting}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword ? (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            Guardando...
          </span>
        ) : (
          'Actualizar contraseña'
        )}
      </Button>
    </form>
  );
}
