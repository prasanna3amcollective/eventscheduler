'use client';

import { useState, useEffect, useCallback } from 'react';
import AnnouncementModal from './AnnouncementModal';
import EventBannerModal from './EventBannerModal';
import './BannerSlideshow_mobile.css';

export default function BannerSlideshow_mobile() {
  const [slides, setSlides] = useState<any[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const fetchItems = useCallback(async () => {
    try {
      const [annRes, evRes] = await Promise.all([
        fetch('/api/announcements'),
        fetch('/api/events')
      ]);

      const announcements = annRes.ok ? await annRes.json() : [];
      const events = evRes.ok ? await evRes.json() : [];

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const activeEvents = Array.isArray(events) ? events.filter((ev: any) => {
        if (ev.state === 'Cancelled') return false;
        const start = new Date(ev.startDateTime);
        const end = new Date(ev.endDateTime);
        const overlapsToday = start <= endOfDay && end >= startOfDay;
        const notPast = end >= now;
        return overlapsToday && notPast;
      }) : [];

      const formattedEvents = activeEvents.map((ev: any) => ({
        id: `event-${ev.id}`,
        title: ev.name,
        subtitle: ev.description || ev.eventPlace,
        type: 'Activity',
        isEvent: true,
        rawEvent: ev
      }));

      const formattedAnnouncements = Array.isArray(announcements)
        ? announcements.map((ann: any) => ({
            id: `ann-${ann.id}`,
            title: ann.title,
            subtitle: ann.type || 'Announcement',
            content: ann.content,
            isEvent: false
          }))
        : [];

      setSlides([...formattedEvents, ...formattedAnnouncements]);
    } catch (err) {
      console.error('Error fetching mobile banner slideshow data:', err);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const defaultBanners = [
    { 
      id: 1, 
      title: 'CREATORS COLLECTIVE', 
      subtitle: 'Join our next meetup', 
      bgClass: 'banner-bg-cyan',
      isEvent: false
    },
    { 
      id: 2, 
      title: 'FILM SCREENING', 
      subtitle: 'This Friday at 8PM', 
      bgClass: 'banner-bg-magenta',
      isEvent: false
    },
    { 
      id: 3, 
      title: 'WORKSHOP', 
      subtitle: 'Learn cinematography', 
      bgClass: 'banner-bg-yellow',
      isEvent: false
    }
  ];

  const items = slides.length > 0 ? slides : defaultBanners;
  const bgClasses = ['banner-bg-cyan', 'banner-bg-magenta', 'banner-bg-yellow'];

  const handleCardClick = (item: any) => {
    if (item.isEvent && item.rawEvent) {
      setSelectedEvent(item.rawEvent);
    } else if (!item.isEvent && item.content) {
      setSelectedAnnouncement(item);
    }
  };

  return (
    <div className="banner-slideshow-mobile-container">
      <div className="banner-slideshow-mobile-track">
        {items.map((banner, index) => {
          const bgClass = banner.bgClass || bgClasses[index % bgClasses.length];
          return (
            <div 
              key={banner.id} 
              className={`banner-slideshow-mobile-slide ${bgClass}`}
              onClick={() => handleCardClick(banner)}
              style={{ cursor: 'pointer' }}
            >
              <div className="banner-slide-content">
                <h2>{banner.title}</h2>
                <p>{banner.subtitle}</p>
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

      {selectedEvent && (
        <EventBannerModal
          event={selectedEvent}
          isOpen={true}
          onClose={() => setSelectedEvent(null)}
          onRefresh={fetchItems}
        />
      )}
    </div>
  );
}
