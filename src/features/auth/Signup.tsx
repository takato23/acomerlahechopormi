import { Link } from 'react-router-dom';
import { AuthLayout } from './components/AuthForm/AuthLayout';
import { RegisterForm } from './components/AuthForm/RegisterForm';

export default function Signup() {
  return (
    <AuthLayout
      title="Crea tu cuenta"
      description="Únete para planificar menús personalizados y aprovechar tu despensa."
      footer={
        <p className="text-sm text-center">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}