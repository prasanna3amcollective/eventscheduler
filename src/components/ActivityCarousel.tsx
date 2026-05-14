'use client';

import { useState, useEffect, useRef } from 'react';
import { format, startOfDay } from 'date-fns';
import { Clock, CalendarDays, Users } from '@/components/Icons';
import { secureFetch } from '@/lib/fetch';

interface Activity {
  id: string;
  name: string;
  startDateTime: string;
  participantCount?: number;
}

interface ActivityCarouselProps {
  refreshTrigger: number;
  onActivityClick?: (activity: any) => void;
}

export default function ActivityCarousel({ refreshTrigger, onActivityClick }: ActivityCarouselProps) {
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await secureFetch('/api/activities');
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
          setUpcomingActivities(future);
        }
      } catch (err) {
        console.error('Failed to fetch upcoming activities', err);
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
          <h3>Upcoming Activities</h3>
        </div>
        <span className="carousel-count">{upcomingActivities.length} activities</span>
      </div>

      <div className="carousel-strip-wrapper">
        <div className="carousel-strip" ref={scrollRef}>
          {upcomingActivities.length > 0 ? (
            upcomingActivities.map((activity) => (
              <div
                key={activity.id}
                className="carousel-card clickable"
                onClick={() => onActivityClick?.(activity)}
              >
                <div className="card-accent"></div>
                <div className="card-content">
                  <div className="card-date-badge">
                    <span className="day">{format(new Date(activity.startDateTime), 'dd')}</span>
                    <span className="month">{format(new Date(activity.startDateTime), 'MMM')}</span>
                  </div>
                  <div className="card-info">
                    <h4>{activity.name}</h4>
                    <div className="card-meta">
                      <span><Clock size={12} /> {format(new Date(activity.startDateTime), 'hh:mm aa')}</span>
                    </div>
                  </div>
                  {activity.participantCount !== undefined && (
                    <div className="participant-count">
                      <Users size={14} />
                      <span>{activity.participantCount}</span>
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