import { useAuth } from '@/features/auth/AuthContext'
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import React from 'react'; // Importar React

// Aceptar children
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation();



  // Podríamos añadir un spinner aquí si loading es true
  // if (loading) return <Spinner />;

  if (!user && !loading) { // Solo redirigir si no está cargando y no hay usuario
    // Redirigir al login, guardando la ubicación actual para volver después
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si hay usuario, renderizar el contenido de la ruta anidada
  // Si hay usuario, renderizar los children (que contendrán el Outlet)
  return children;
}