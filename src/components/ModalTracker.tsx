import { useEffect } from 'react';
import { useUI } from '../contexts/UIContext';

export function ModalTracker({ isOpen }: { isOpen: boolean }) {
  const { setModalOpen } = useUI();
  
  useEffect(() => {
    if (isOpen) {
      setModalOpen(true);
      return () => setModalOpen(false);
    }
  }, [isOpen, setModalOpen]);

  return null;
}
