'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'max-w-[330px]',
  md: 'max-w-[448px]',
  lg: 'max-w-[684px]',
};

export function Modal({ isOpen, onClose, children, title, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[5px]" />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`
          relative z-10
          w-full ${sizeStyles[size]}
          flex flex-col gap-6
          p-6
          border border-[#fff6]
          rounded-[6px]
          bg-[#fefaf3]
          shadow-[0_4px_18px_0_#0000001f]
          animate-[modalFadeIn_0.2s_ease-out]
        `}
      >
        {title && (
          <div className="flex items-center justify-between">
            <h2 id="modal-title" className="text-[22px] leading-[1.25] tracking-[-0.02em] font-normal">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="
                w-8 h-8
                flex items-center justify-center
                rounded-full
                hover:bg-[#2f2c250f]
                transition-colors
              "
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="
              absolute top-4 right-4
              w-8 h-8
              flex items-center justify-center
              rounded-full
              hover:bg-[#2f2c250f]
              transition-colors
            "
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;

  return createPortal(modalContent, document.body);
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-6">
        <p className="text-sm leading-[1.4]">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="
              h-[42px] px-[18px]
              rounded-[9px]
              bg-[#2f2c250f]
              text-sm font-medium
              hover:bg-[#2f2c251f]
              transition-colors
            "
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`
              h-[42px] px-[18px]
              rounded-[9px]
              text-sm font-medium
              transition-colors
              ${variant === 'danger' 
                ? 'bg-[#ea384c] text-white hover:bg-[#d63040]' 
                : 'bg-[#000] text-[#fefaf3] hover:bg-[#333]'
              }
            `}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default Modal;
