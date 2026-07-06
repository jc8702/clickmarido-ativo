'use client';

import { useState, useCallback } from 'react';

// ==========================================
// HOOK - useChat
// Controla estado do chat com IA
// ==========================================

interface UseChatOptions {
  initialOpen?: boolean;
}

interface UseChatReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useChat(options?: UseChatOptions): UseChatReturn {
  const [isOpen, setIsOpen] = useState(options?.initialOpen ?? false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
