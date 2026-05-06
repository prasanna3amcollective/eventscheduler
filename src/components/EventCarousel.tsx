'use client';

import { useState, useEffect, useRef } from 'react';
import { format, startOfDay } from 'date-fns';
import { Clock, CalendarDays, Users } from '@/components/Icons';
import { secureFetch } from '@/lib/fetch';

interface Event {
  id: string;
  name: string;
  startDateTime: string;
  participantCount?: number;
}

interface EventCarouselProps {
  refreshTrigger: number;
  onEventClick?: (event: Event) => void;
}

export default function EventCarousel({ refreshTrigger, onEventClick }: EventCarouselProps) {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await secureFetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          const today = startOfDay(new Date());

          const future = data
            .filter((e: any) => {
              const eventDate = new Date(e.startDateTime);
              return eventDate.getTime() >= today.getTime();
            })
            .sort((a: any, b: any) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
            .slice(0, 12);
          setUpcomingEvents(future);
        }
      } catch (err) {
        console.error('Failed to fetch upcoming events', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUpcoming();
  }, [refreshTrigger]);

  if (loading) return <div className="carousel-container"><div className="carousel-card empty">Loading highlights...</div></div>;

  return (
    <div className="carousel-container fade-in">
      <div className="carousel-header">
        <div className="carousel-title">
          <span className="carousel-dot pulse-icon" />
          <h3>Upcoming Events</h3>
        </div>
        <span className="carousel-count">{upcomingEvents.length} events</span>
      </div>

      <div className="carousel-strip-wrapper">
        <div className="carousel-strip" ref={scrollRef}>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="carousel-card clickable"
                onClick={() => onEventClick?.(event)}
              >
                <div className="card-accent"></div>
                <div className="card-content">
                  <div className="card-date-badge">
                    <span className="day">{format(new Date(event.startDateTime), 'dd')}</span>
                    <span className="month">{format(new Date(event.startDateTime), 'MMM')}</span>
                  </div>
                  <div className="card-info">
                    <h4>{event.name}</h4>
                    <div className="card-meta">
                      <span><Clock size={12} /> {format(new Date(event.startDateTime), 'hh:mm aa')}</span>
                    </div>
                  </div>
                  {event.participantCount !== undefined && (
                    <div className="participant-count">
                      <Users size={14} />
                      <span>{event.participantCount}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="carousel-empty-state">
              <CalendarDays size={32} />
              <p>No highlights scheduled for today or later.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}