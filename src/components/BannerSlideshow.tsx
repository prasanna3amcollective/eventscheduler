'use client';

import { useState, useEffect } from 'react';
import AnnouncementModal from './AnnouncementModal';
import './BannerSlideshow.css';

export default function BannerSlideshow() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  useEffect(() => {
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAnnouncements(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const defaultBanners = [
    { 
      id: 'default-1', 
      title: 'WELCOME TO THE COMMUNITY', 
      type: 'General Info',
      content: 'A horizontal space for co-creating gatherings and sharing mutual care.',
      bgClass: 'banner-bg-yellow' 
    },
    { 
      id: 'default-2', 
      title: 'CO-CREATE HAPPENINGS', 
      type: 'Participate',
      content: 'Join the circle and help weave our community tapestry.',
      bgClass: 'banner-bg-cyan' 
    }
  ];

  // Use announcements if available, else fallback to default banners
  const items = announcements.length > 0 ? announcements : defaultBanners;

  const bgClasses = ['banner-bg-cyan', 'banner-bg-magenta', 'banner-bg-yellow'];

  return (
    <div className="banner-slideshow-container">
      <div className="banner-slideshow-track">
        {items.map((item, index) => {
          const bgClass = item.bgClass || bgClasses[index % bgClasses.length];
          return (
            <div 
              key={item.id} 
              className={`banner-slideshow-slide ${bgClass}`}
              onClick={() => setSelectedAnnouncement(item)}
              style={{ cursor: 'pointer' }}
            >
              <div className="banner-slide-content">
                <h2>{item.title}</h2>
                <p>{item.type || 'Announcement'}</p>
              </div>
              <div className="banner-slide-deco-star"></div>
            </div>
          );
        })}
      </div>
      
      {selectedAnnouncement && (
        <AnnouncementModal
          announcement={selectedAnnouncement}
          isOpen={true}
          onClose={() => setSelectedAnnouncement(null)}
        />
      )}
    </div>
  );
}
