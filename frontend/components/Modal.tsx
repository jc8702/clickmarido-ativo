'use client';

import React, { useRef, useEffect, useCallback } from 'react';
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
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // P0-8: Focus trap
  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return [];
    return Array.from(
      modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
  }, []);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      // Focar no primeiro elemento focável dentro do modal
      const timer = setTimeout(() => {
        const focusable = getFocusableElements();
        if (focusable.length > 0) {
          focusable[0].focus();
        } else if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
          return;
        }

        // P0-8: Focus trap com Tab
        if (e.key === 'Tab') {
          const focusable = getFocusableElements();
          if (focusable.length === 0) return;

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
        // Restaurar foco ao elemento anterior
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose, getFocusableElements]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1060]">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className="relative flex items-center justify-center min-h-screen p-4 sm:p-6 pointer-events-none">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          className={`
            bg-white dark:bg-neutral-800 rounded-xl shadow-2xl
            ${sizeMap[size]} w-full
            animate-scale-in
            max-h-[90vh] overflow-y-auto
            pointer-events-auto
            outline-none
          `}
        >
          {title && (
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 p-4 sm:p-6">
              <h3 id="modal-title" className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                aria-label="Fechar modal"
              >
                ✕
              </button>
            </div>
          )}
          <div className="p-4 sm:p-6">{children}</div>
          {footer && <div className="border-t border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 bg-neutral-50 dark:bg-neutral-700/50">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
