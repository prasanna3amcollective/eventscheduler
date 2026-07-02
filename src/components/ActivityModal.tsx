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
      globalThis.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      globalThis.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div 
        className="modal-overlay" 
        onClick={onClose} 
        style={{ alignItems: 'flex-start', paddingTop: '5vh' }}
      >
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          {children}
        </div>
        <button className="modal-close" onClick={onClose} style={{ position: 'fixed', top: 'calc(5vh - 12px)', right: 'max(16px, calc(50% - 425px - 12px))', zIndex: 1150 }}>
          <X size={20} />
        </button>
      </div>
    </>
  );
}