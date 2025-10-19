import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/Spinner';

import { useAuth } from '../../AuthContext';

const loginSchema = z.object({
  email: z
    .string({ required_error: 'El email es obligatorio.' })
    .min(1, 'El email es obligatorio.')
    .email('Ingresa un email válido.'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const state = location.state as { from?: string } | undefined;
      const redirectPath = state?.from || '/app';
      await login(values.email, values.password);
      toast.success('Sesión iniciada correctamente.');
      navigate(redirectPath, { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo iniciar sesión. Intenta nuevamente.';
      setServerError(message);
      toast.error(message);
    }
  });

  const {
    formState: { errors, isSubmitting },
    register,
  } = form;

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
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

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          disabled={isSubmitting}
          {...register('password')}
        />
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            Iniciando sesión...
          </span>
        ) : (
          'Iniciar sesión'
        )}
      </Button>
    </form>
  );
}
