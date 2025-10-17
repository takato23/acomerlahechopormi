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

const registerSchema = z
  .object({
    email: z
      .string({ required_error: 'El email es obligatorio.' })
      .min(1, 'El email es obligatorio.')
      .email('Ingresa un email válido.'),
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

export type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const {
    formState: { errors, isSubmitting },
    register,
    reset,
    handleSubmit,
  } = form;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSuccessMessage(null);

    try {
      await registerUser(values.email, values.password, {
        username: values.email.split('@')[0],
      });
      setSuccessMessage('Registro exitoso. Revisa tu correo para confirmar la cuenta.');
      toast.success('Revisa tu correo para confirmar tu cuenta.');
      reset({ email: values.email, password: '', confirmPassword: '' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo completar el registro.';
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

      {successMessage ? (
        <Alert>
          <AlertDescription>{successMessage}</AlertDescription>
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
        {errors.email ? (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
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
            Registrando...
          </span>
        ) : (
          'Crear cuenta'
        )}
      </Button>
    </form>
  );
}
