'use client';

import React from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1060]">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className="relative flex items-center justify-center min-h-screen p-6">
        <div
          className={`
            bg-white rounded-xl shadow-2xl
            ${sizeMap[size]} w-full
            animate-scale-in
            max-h-[90vh] overflow-y-auto
          `}
        >
          {title && (
            <div className="flex items-center justify-between border-b border-neutral-200 p-6">
              <h3 className="text-xl font-semibold text-neutral-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-neutral-500 hover:text-neutral-700 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          )}
          <div className="p-6">{children}</div>
          {footer && <div className="border-t border-neutral-200 p-6 bg-neutral-50">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
