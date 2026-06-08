'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { format, startOfDay, addMonths } from 'date-fns';
import { Clock, CalendarDays, Users, ChevronDown, ChevronUp } from '@/components/Icons';
import { secureFetch } from '@/lib/fetch';
import './ActivityCarousel_mobile.css';

interface Activity {
  id: string;
  name: string;
  startDateTime: string;
  participantCount?: number;
  category?: string;
  recurrenceTemplateId?: string | null;
  generatedFromTemplateId?: string | null;
  detachReason?: string;
}

interface ActivityCarouselProps {
  /** Number of milliseconds since epoch; triggers a re-fetch when changed */
  refreshTrigger: number;
  /** Called when a carousel card is clicked; receives the activity object */
  onActivityClick?: (activity: any) => void;
  /** Whether the user is logged in; controls collapse toggle visibility */
  isLoggedIn?: boolean;
  /** Optional content to render on the right side of the carousel header (e.g. Sign In / Sign Up buttons) */
  headerRight?: React.ReactNode;
}

export default function ActivityCarousel_mobile({ refreshTrigger, onActivityClick, isLoggedIn, headerRight }: ActivityCarouselProps) {
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const activitiesNext12Months = useMemo(
    () => upcomingActivities.filter((a) => {
      const date = new Date(a.startDateTime);
      return date <= addMonths(new Date(), 12);
    }),
    [upcomingActivities],
  );

  const categoryList = useMemo(
    () => [...new Set(activitiesNext12Months.map((a) => a.category).filter(Boolean) as string[])].sort(),
    [activitiesNext12Months],
  );

  const filteredActivities = useMemo(
    () => filterCategory
      ? upcomingActivities.filter((a) => a.category === filterCategory)
      : upcomingActivities,
    [filterCategory, upcomingActivities],
  );

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
          setFilterCategory(null);
        }
      } catch (err) {
        console.error('Failed to fetch upcoming activities', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUpcoming();
  }, [refreshTrigger]);

  if (loading) return <div className="carousel-mobile-container"><div className="carousel-mobile-card empty">Loading activities...</div></div>;

  return (
    <div className="carousel-mobile-container fade-in">
      <div className="carousel-mobile-header">
        <div className="carousel-mobile-title">
          <span className="carousel-mobile-dot pulse-icon" />
          <h3>Upcoming Activities</h3>

          {isLoggedIn && (
            <button
              className="carousel-mobile-toggle-btn"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Show Activities" : "Hide Activities"}
            >
              {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          )}
        </div>

        {headerRight && (
          <div className="carousel-mobile-header-right">
            {headerRight}
          </div>
        )}
      </div>

      {categoryList.length > 1 && (
        <div className="carousel-mobile-category-strip">
          {categoryList.map((cat) => (
            <button
              key={cat}
              className={`category-mobile-pill${cat === filterCategory ? ' active' : ''}`}
              onClick={() => setFilterCategory(cat === filterCategory ? null : cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className={`carousel-mobile-strip-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="carousel-mobile-strip" ref={scrollRef}>
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="carousel-mobile-card clickable"
                onClick={() => onActivityClick?.(activity)}
              >
                <div className="card-mobile-accent"></div>
                <div className="card-mobile-content">
                  <div className="card-mobile-date-badge">
                    <span className="day">{format(new Date(activity.startDateTime), 'dd')}</span>
                    <span className="month">{format(new Date(activity.startDateTime), 'MMM')}</span>
                  </div>
                  <div className="card-mobile-info">
                    <h4>{activity.name}</h4>
                    <div className="card-mobile-meta">
                      <span><Clock size={12} /> {format(new Date(activity.startDateTime), 'hh:mm aa')}</span>
                      {isLoggedIn && activity.category && <span className="carousel-mobile-category-tag">{activity.category}</span>}
                    </div>
                  </div>
                  {activity.participantCount !== undefined && (
                    <div className="participant-mobile-count">
                      <Users size={14} />
                      <span>{activity.participantCount}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="carousel-mobile-empty-state">
              <CalendarDays size={32} />
              <p>No activities scheduled.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
