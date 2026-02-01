import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

const icons = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type = 'info',
  title,
  message,
  duration = 4000,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsRemoving(true);
    setTimeout(() => {
      onDismiss(id);
    }, 300);
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success)]';
      case 'error':
        return 'bg-[var(--color-error-bg)] text-[var(--color-error)] border-[var(--color-error)]';
      case 'warning':
        return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning)]';
      case 'info':
      default:
        return 'bg-[var(--color-background-secondary)] text-[var(--color-accent)] border-[var(--color-accent)]';
    }
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        pointer-events-auto
        flex w-full max-w-sm overflow-hidden rounded-lg border shadow-lg
        transition-all duration-300 ease-in-out
        ${getColors()}
        ${isVisible && !isRemoving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        mb-3
      `}
      style={{
        marginBottom: '0.75rem',
      }}
    >
      <div className="flex w-full p-4">
        <div className="flex-shrink-0 mr-3 pt-0.5">
          {icons[type]}
        </div>
        <div className="flex-1">
          {title && (
            <h4 className="mb-1 text-sm font-semibold opacity-90">
              {title}
            </h4>
          )}
          <p className="text-sm font-medium opacity-90">
            {message}
          </p>
        </div>
        <div className="flex-shrink-0 ml-3 pt-0.5">
          <button
            onClick={handleDismiss}
            className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 opacity-70 hover:opacity-100 hover:bg-black/5 transition-opacity"
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <Image
              src="/images/icon-interface-cross.svg"
              alt=""
              width={16}
              height={16}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
