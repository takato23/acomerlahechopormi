import { Link } from 'react-router-dom';
import { AuthLayout } from './components/AuthForm/AuthLayout';
import { RecoveryForm } from './components/AuthForm/RecoveryForm';

export default function ForgotPassword() {
  return (
    <AuthLayout
      title="Recupera tu acceso"
      description="Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña."
      footer={
        <p className="text-sm text-center">
          ¿Recordaste tu contraseña?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Vuelve a iniciar sesión
          </Link>
        </p>
      }
    >
      <RecoveryForm />
    </AuthLayout>
  );
}
