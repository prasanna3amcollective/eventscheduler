'use client';

import { X } from '@/components/Icons';
import { ReactNode, useEffect } from 'react';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
}

export default function ActivityModal({ isOpen, onClose, children, title }: ActivityModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header-actions">
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '40px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
