import { useEffect, useCallback } from 'react';

/**
 * Hook customizado que fecha uma interface (Modal, Drawer, etc.) ao pressionar a tecla Escape.
 * @param isOpen Indica se a interface está ativa/aberta para registrar o listener
 * @param onClose Callback chamado quando Escape é pressionado
 */
export function useEscapeToClose(isOpen: boolean, onClose: () => void) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);
}

export default useEscapeToClose;
