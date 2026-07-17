'use client';

import { useState, useEffect } from 'react';
import AnnouncementForm from './AnnouncementForm';

interface AnnouncementModalProps {
  announcement: any;
  isOpen: boolean;
  onClose: () => void;
  allowEdit?: boolean;
  onRefresh?: () => void;
}

export default function AnnouncementModal({ announcement, isOpen, onClose, allowEdit, onRefresh }: AnnouncementModalProps) {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
    }
  }, [isOpen]);

  if (!isOpen || !announcement) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '600px', width: '90%', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {isEditing ? (
          <div>
            <h2 style={{ fontFamily: 'var(--heading-font)', marginBottom: '24px' }}>Edit Announcement</h2>
            <AnnouncementForm 
              initialData={announcement}
              onSuccess={(updated) => {
                setIsEditing(false);
                if (onRefresh) onRefresh();
                onClose();
              }}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ 
                  fontSize: '12px', 
                  fontFamily: 'var(--mono-font)', 
                  background: 'var(--primary-color)', 
                  color: '#000', 
                  padding: '3px 10px', 
                  fontWeight: 'bold', 
                  border: '1px solid #000', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px',
                  display: 'inline-block',
                  marginBottom: '12px'
                }}>
                  {announcement.type || 'Announcement'}
                </span>
                <h2 style={{ color: 'var(--text-color)', margin: 0, fontFamily: 'var(--heading-font)', fontSize: '28px' }}>
                  {announcement.title}
                </h2>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: 'var(--text-color)' }}>×</button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: 'var(--text-color-muted)', fontSize: '14px', marginBottom: '20px' }}>
                Published: {new Date(announcement.publishAt).toLocaleString()}
                {announcement.expiresAt && ` • Expires: ${new Date(announcement.expiresAt).toLocaleDateString()}`}
              </p>
              <div style={{ color: 'var(--text-color)', fontSize: '16px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {announcement.content}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              {allowEdit && (
                <button className="yellow-btn" onClick={() => setIsEditing(true)}>
                  Edit
                </button>
              )}
              <button className="btn-outline" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
