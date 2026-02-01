'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastProps, ToastType } from './Toast';

interface ToastContextType {
  addToast: (props: Omit<ToastProps, 'id' | 'onDismiss'>) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((props: Omit<ToastProps, 'id' | 'onDismiss'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      const newToasts = [...prev, { ...props, id, onDismiss: removeToast }];
      if (newToasts.length > 3) {
        return newToasts.slice(newToasts.length - 3);
      }
      return newToasts;
    });
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
