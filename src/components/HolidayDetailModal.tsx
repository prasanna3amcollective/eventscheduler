'use client';

import { X } from '@/components/Icons';
import { format } from 'date-fns';

interface HolidayData {
  id: string;
  name: string;
  date: string;
}

interface HolidayDetailModalProps {
  holiday: HolidayData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function HolidayDetailModal({ holiday, isOpen, onClose }: HolidayDetailModalProps) {
  if (!isOpen || !holiday) return null;

  const holidayDate = new Date(holiday.date);

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div className="modal-content activity-detail-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header-actions">
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="detail-header-flat">
          <h2 className="detail-title" style={{ margin: 0 }}>{holiday.name}</h2>
        </div>
        <div className="detail-body-flat">
          <div className="detail-datetime-row">
            <span className="detail-label">{format(holidayDate, 'EEEE')}</span>
            <span className="detail-value">{format(holidayDate, 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}