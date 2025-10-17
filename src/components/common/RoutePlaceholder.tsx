import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Construction, AlertTriangle, Home } from 'lucide-react';

interface RoutePlaceholderProps {
  title: string;
  description: string;
  status: 'under-construction' | 'not-found' | 'coming-soon';
  actionLabel?: string;
  actionTo?: string;
  actionOnClick?: () => void;
}

export const RoutePlaceholder: React.FC<RoutePlaceholderProps> = ({
  title,
  description,
  status,
  actionLabel,
  actionTo,
  actionOnClick
}) => {
  const getIcon = () => {
    switch (status) {
      case 'under-construction':
        return <Construction className="h-16 w-16 text-yellow-500" />;
      case 'not-found':
        return <AlertTriangle className="h-16 w-16 text-red-500" />;
      case 'coming-soon':
        return <Home className="h-16 w-16 text-blue-500" />;
      default:
        return <Construction className="h-16 w-16 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'under-construction':
        return 'text-yellow-600';
      case 'not-found':
        return 'text-red-600';
      case 'coming-soon':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white shadow-xl rounded-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            {getIcon()}
          </div>

          <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
            {title}
          </h1>

          <p className="text-gray-600 mb-8 leading-relaxed">
            {description}
          </p>

          {actionLabel && (actionTo || actionOnClick) && (
            <div className="space-y-4">
              {actionTo ? (
                <Link to={actionTo}>
                  <Button className="w-full">
                    {actionLabel}
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={actionOnClick}
                  className="w-full"
                >
                  {actionLabel}
                </Button>
              )}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              to="/"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
