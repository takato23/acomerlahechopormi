import type { SeverityLevel } from '@sentry/react';
import { debugLogger } from './utils';
import { captureException, isErrorTrackingEnabled } from './errorTracking';
import { notify, type NotificationIntent } from './notifications';

// Logger específico para errores
const errorLog = debugLogger('[ErrorHandler]');

// Tipos para diferentes tipos de errores
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  severity?: ErrorSeverity;
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface AppError extends Error {
  code?: string;
  severity?: ErrorSeverity;
  context?: ErrorContext;
}

// Función principal para manejar errores
interface HandleErrorOptions {
  skipCapture?: boolean;
}

export const handleError = (
  error: unknown,
  context?: ErrorContext,
  options?: HandleErrorOptions
): void => {
  // Normalizar el error
  const normalizedError = normalizeError(error);

  const severity = context?.severity ?? normalizedError.severity ?? 'medium';
  normalizedError.severity = severity;
  normalizedError.context = { ...normalizedError.context, ...context };

  logStructuredError(normalizedError, context);

  // Aquí se integraría con servicios externos como Sentry
  if (isErrorTrackingEnabled() && !options?.skipCapture) {
    captureException(normalizedError, {
      tags: {
        component: context?.component ?? 'unknown',
        action: context?.action ?? 'unspecified',
        severity,
        code: normalizedError.code ?? 'UNKNOWN_ERROR',
      },
      extra: {
        ...context?.metadata,
        stack: normalizedError.stack,
      },
      user: context?.userId ? { id: context.userId } : undefined,
      level: mapSeverityToLevel(severity),
    });
  }

  // Mostrar toast al usuario si es apropiado
  if (shouldShowUserNotification(normalizedError, context)) {
    showUserNotification(normalizedError);
  }
};

// Normalizar diferentes tipos de errores a un formato estándar
const normalizeError = (error: unknown): AppError => {
  if (error instanceof Error) {
    return error as AppError;
  }

  if (typeof error === 'string') {
    const appError: AppError = new Error(error);
    appError.code = 'STRING_ERROR';
    return appError;
  }

  if (error && typeof error === 'object') {
    const appError: AppError = new Error((error as any).message || 'Unknown error');
    appError.code = (error as any).code || 'OBJECT_ERROR';
    appError.context = (error as any).context;
    return appError;
  }

  const appError: AppError = new Error('Unknown error occurred');
  appError.code = 'UNKNOWN_ERROR';
  return appError;
};

const logStructuredError = (error: AppError, context?: ErrorContext) => {
  const payload = {
    timestamp: new Date().toISOString(),
    name: error.name,
    message: error.message,
    code: error.code ?? 'UNKNOWN_ERROR',
    severity: error.severity ?? context?.severity ?? 'medium',
    component: context?.component,
    action: context?.action,
    userId: context?.userId,
    metadata: context?.metadata,
  };

  errorLog('Error capturado', payload);

  if (process.env.NODE_ENV !== 'development') {
    console.error(JSON.stringify(payload));
  } else {
    console.error('[ErrorHandler]', payload, error.stack);
  }
};

const mapSeverityToLevel = (severity: ErrorSeverity): SeverityLevel => {
  switch (severity) {
    case 'low':
      return 'info';
    case 'medium':
      return 'warning';
    case 'high':
      return 'error';
    case 'critical':
      return 'fatal';
    default:
      return 'error';
  }
};

const mapSeverityToIntent = (severity: ErrorSeverity): NotificationIntent => {
  switch (severity) {
    case 'low':
      return 'info';
    case 'medium':
      return 'warning';
    case 'high':
    case 'critical':
      return 'error';
    default:
      return 'error';
  }
};

// Determinar si mostrar notificación al usuario
const shouldShowUserNotification = (
  error: AppError,
  context?: ErrorContext
): boolean => {
  // No mostrar notificaciones para errores de bajo nivel
  if (context?.severity === 'low') {
    return false;
  }

  // Siempre mostrar para errores críticos
  if (context?.severity === 'critical') {
    return true;
  }

  // Mostrar para errores de red, autenticación, etc.
  const showForCodes = ['NETWORK_ERROR', 'AUTH_ERROR', 'VALIDATION_ERROR'];
  if (error.code && showForCodes.includes(error.code)) {
    return true;
  }

  // Por defecto, mostrar notificaciones
  return true;
};

// Mostrar notificación amigable al usuario
const showUserNotification = (error: AppError): void => {
  const userMessage = getUserFriendlyMessage(error);

  const intent = mapSeverityToIntent(error.severity ?? 'medium');
  notify(intent, userMessage);
};

// Convertir errores técnicos a mensajes amigables para el usuario
export const getUserFriendlyMessage = (error: AppError): string => {
  // Mapeo de códigos de error a mensajes amigables
  const errorMessages: Record<string, string> = {
    NETWORK_ERROR: 'Problema de conexión. Verifica tu internet e intenta de nuevo.',
    AUTH_ERROR: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
    VALIDATION_ERROR: 'Los datos ingresados no son válidos. Revisa e intenta de nuevo.',
    PERMISSION_ERROR: 'No tienes permisos para realizar esta acción.',
    NOT_FOUND_ERROR: 'El elemento solicitado no fue encontrado.',
    RATE_LIMIT_ERROR: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.',
    SERVER_ERROR: 'Error del servidor. Estamos trabajando para solucionarlo.',
    QUOTA_EXCEEDED: 'Has alcanzado el límite de uso. Contacta soporte.',
    STRING_ERROR: 'Ha ocurrido un error inesperado.',
    OBJECT_ERROR: 'Ha ocurrido un error inesperado.',
    UNKNOWN_ERROR: 'Ha ocurrido un error inesperado.',
  };

  return errorMessages[error.code || 'UNKNOWN_ERROR'] || error.message || 'Ha ocurrido un error inesperado.';
};

// Crear errores tipados
export const createError = (
  message: string,
  code?: string,
  severity: ErrorSeverity = 'medium',
  context?: ErrorContext
): AppError => {
  const error = new Error(message) as AppError;
  error.code = code;
  error.severity = severity;
  error.context = context;
  return error;
};

// Wrapper para try-catch con manejo automático de errores
export const withErrorHandler = async <T>(
  operation: () => Promise<T>,
  context?: ErrorContext,
  options?: HandleErrorOptions
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context, options);
    throw error;
  }
};

// Hook para usar en componentes React
export const useErrorHandler = () => {
  return (error: unknown, context?: ErrorContext, options?: HandleErrorOptions) => {
    handleError(error, context, options);
  };
};
