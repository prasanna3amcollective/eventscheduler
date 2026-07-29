'use client';

import { useState, useEffect, useCallback } from 'react';
import AnnouncementModal from './AnnouncementModal';
import EventBannerModal from './EventBannerModal';
import './BannerSlideshow.css';

export default function BannerSlideshow() {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const [annRes, evRes] = await Promise.all([
        fetch('/api/announcements'),
        fetch('/api/events')
      ]);

      const announcements = annRes.ok ? await annRes.json() : [];
      const events = evRes.ok ? await evRes.json() : [];

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      // Active events: happening on current day, not already past (endDateTime >= now), not cancelled
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
        type: 'Activity',
        content: ev.description || ev.eventPlace,
        isEvent: true,
        rawEvent: ev
      }));

      const formattedAnnouncements = Array.isArray(announcements)
        ? announcements.map((ann: any) => ({
            ...ann,
            isEvent: false
          }))
        : [];

      setSlides([...formattedEvents, ...formattedAnnouncements]);
    } catch (err) {
      console.error('Error fetching banner slideshow data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const defaultBanners = [
    { 
      id: 'default-1', 
      title: 'WELCOME TO THE COMMUNITY', 
      type: 'General Info',
      content: 'A horizontal space for co-creating gatherings and sharing mutual care.',
      bgClass: 'banner-bg-yellow',
      isEvent: false
    },
    { 
      id: 'default-2', 
      title: 'CO-CREATE HAPPENINGS', 
      type: 'Participate',
      content: 'Join the circle and help weave our community tapestry.',
      bgClass: 'banner-bg-cyan',
      isEvent: false
    }
  ];

  // Use fetched slides if available, else fallback to default banners
  const items = slides.length > 0 ? slides : defaultBanners;

  const bgClasses = ['banner-bg-cyan', 'banner-bg-magenta', 'banner-bg-yellow'];

  const handleCardClick = (item: any) => {
    if (item.isEvent && item.rawEvent) {
      setSelectedEvent(item.rawEvent);
    } else {
      setSelectedAnnouncement(item);
    }
  };

  return (
    <div className="banner-slideshow-container">
      <div className="banner-slideshow-track">
        {items.map((item, index) => {
          const bgClass = item.bgClass || bgClasses[index % bgClasses.length];
          return (
            <div 
              key={item.id} 
              className={`banner-slideshow-slide ${bgClass}`}
              onClick={() => handleCardClick(item)}
              style={{ cursor: 'pointer' }}
            >
              <div className="banner-slide-content">
                <h2>{item.title}</h2>
                <p>{item.type || (item.isEvent ? 'Activity' : 'Announcement')}</p>
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
