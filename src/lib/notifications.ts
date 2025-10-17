import { toast, type ExternalToast } from 'sonner';

export type NotificationIntent = 'success' | 'info' | 'error' | 'warning';

export interface NotificationOptions extends Partial<ExternalToast> {
  description?: string;
  actionLabel?: string;
  onActionClick?: () => void;
}

const BASE_OPTIONS: Partial<ExternalToast> = {
  duration: 4000,
  closeButton: true,
  className: 'text-sm font-medium',
};

const intentToEmitter: Record<NotificationIntent, typeof toast.success> = {
  success: toast.success,
  info: toast.info,
  error: toast.error,
  warning: toast.warning,
};

const buildOptions = (options?: NotificationOptions): Partial<ExternalToast> => {
  const { actionLabel, onActionClick, ...rest } = options ?? {};

  const action =
    actionLabel && onActionClick
      ? {
          label: actionLabel,
          onClick: onActionClick,
        }
      : undefined;

  return {
    ...BASE_OPTIONS,
    ...rest,
    action,
  };
};

export const notify = (
  intent: NotificationIntent,
  title: string,
  options?: NotificationOptions
): string | number => {
  const emitter = intentToEmitter[intent];
  return emitter(title, buildOptions(options));
};

export const notifySuccess = (title: string, options?: NotificationOptions) =>
  notify('success', title, options);

export const notifyError = (title: string, options?: NotificationOptions) =>
  notify('error', title, options);

export const notifyInfo = (title: string, options?: NotificationOptions) =>
  notify('info', title, options);

export const notifyWarning = (title: string, options?: NotificationOptions) =>
  notify('warning', title, options);

interface AsyncMessages {
  loading: string;
  success: string;
  error: string;
  description?: string;
}

export const notifyAsync = <T>(
  promise: Promise<T>,
  messages: AsyncMessages,
  options?: NotificationOptions
) => {
  const { actionLabel, onActionClick, description: fallbackDescription, ...rest } = options ?? {};

  const action =
    actionLabel && onActionClick
      ? {
          label: actionLabel,
          onClick: onActionClick,
        }
      : undefined;

  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    description: messages.description ?? fallbackDescription,
    ...BASE_OPTIONS,
    ...rest,
    action,
  });
};
