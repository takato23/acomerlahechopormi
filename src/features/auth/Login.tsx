import { Link } from 'react-router-dom';
import { AuthLayout } from './components/AuthForm/AuthLayout';
import { LoginForm } from './components/AuthForm/LoginForm';

export default function Login() {
  return (
    <AuthLayout
      title="Inicia sesión"
      description="Accede para planificar tus comidas y gestionar tu despensa."
      footer={
        <div className="w-full space-y-2 text-center text-sm">
          <Link to="/forgot-password" className="text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
          <p>
            ¿Aún no tienes cuenta?{' '}
            <Link to="/signup" className="text-primary hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
