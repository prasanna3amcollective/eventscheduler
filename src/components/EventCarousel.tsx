'use client';

import { useState, useEffect } from 'react';
import { format, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, User, ArrowRight, CalendarDays } from 'lucide-react';
import { secureFetch } from '@/lib/fetch';

interface Event {
  id: string;
  name: string;
  startDateTime: string;
  leader: string;
}

interface EventCarouselProps {
  refreshTrigger: number;
  onEventClick?: (event: Event) => void;
}

export default function EventCarousel({ refreshTrigger, onEventClick }: EventCarouselProps) {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await secureFetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          const today = startOfDay(new Date());

          // Show everything from the start of today onwards
          const future = data
            .filter((e: any) => {
              const eventDate = new Date(e.startDateTime);
              return eventDate.getTime() >= today.getTime();
            })
            .sort((a: any, b: any) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
            .slice(0, 9); // Support up to 3 slides of 3
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

  const totalSlides = Math.max(1, Math.ceil(upcomingEvents.length / 3));

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);

  if (loading) return <div className="carousel-container"><div className="carousel-card empty">Loading highlights...</div></div>;

  const visibleEvents = upcomingEvents.slice(currentIndex * 3, currentIndex * 3 + 3);

  return (
    <div className="carousel-container fade-in">
      <div className="carousel-header">
        <div className="carousel-title">
          <ArrowRight size={18} className="pulse-icon" />
          <h3>Upcoming Events</h3>
        </div>
        {upcomingEvents.length > 3 && (
          <div className="carousel-controls">
            <button onClick={prevSlide} className="control-btn"><ChevronLeft size={18} /></button>
            <button onClick={nextSlide} className="control-btn"><ChevronRight size={18} /></button>
          </div>
        )}
      </div>

      <div className="carousel-track">
        {upcomingEvents.length > 0 ? (
          <>
            {visibleEvents.map((event) => (
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
                      <span><User size={12} /> {event.leader || 'No leader'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {visibleEvents.length < 3 && Array(3 - visibleEvents.length).fill(0).map((_, i) => (
              <div key={`empty-${i}`} className="carousel-card empty-slot"></div>
            ))}
          </>
        ) : (
          <div className="carousel-empty-state">
            <CalendarDays size={32} />
            <p>No highlights scheduled for today or later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
