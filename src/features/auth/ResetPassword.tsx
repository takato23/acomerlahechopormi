import { Link } from 'react-router-dom';
import { AuthLayout } from './components/AuthForm/AuthLayout';
import { ResetPasswordForm } from './components/AuthForm/ResetPasswordForm';

export default function ResetPassword() {
  return (
    <AuthLayout
      title="Define una nueva contraseña"
      description="Introduce una nueva contraseña segura para tu cuenta."
      footer={
        <p className="text-sm text-center">
          ¿Listo para volver?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Ir a iniciar sesión
          </Link>
        </p>
      }
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
