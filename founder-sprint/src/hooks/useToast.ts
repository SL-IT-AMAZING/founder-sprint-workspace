import { useContext } from 'react';
import { ToastContext } from '../components/ui/ToastProvider';
import { ToastType } from '../components/ui/Toast';

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast } = context;

  const toast = {
    show: (message: string, options?: { type?: ToastType; title?: string; duration?: number }) => {
      addToast({
        message,
        type: options?.type || 'info',
        title: options?.title,
        duration: options?.duration,
      });
    },
    success: (message: string, title?: string) => {
      addToast({ message, title, type: 'success' });
    },
    error: (message: string, title?: string) => {
      addToast({ message, title, type: 'error' });
    },
    warning: (message: string, title?: string) => {
      addToast({ message, title, type: 'warning' });
    },
    info: (message: string, title?: string) => {
      addToast({ message, title, type: 'info' });
    },
  };

  return toast;
};
