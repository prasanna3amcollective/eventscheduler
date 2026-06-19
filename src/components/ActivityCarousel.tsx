'use client';
import EmptyState from './EmptyState';

import { useState, useEffect, useMemo, useRef } from 'react';
import { format, startOfDay, addDays } from 'date-fns';
import { Clock, CalendarDays, Users, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from '@/components/Icons';
import { secureFetch } from '@/lib/fetch';

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
  refreshTrigger: number;
  onActivityClick?: (activity: any) => void;
  isLoggedIn?: boolean;
  headerRight?: React.ReactNode;
}

const CARDS_PER_PAGE = 9;

const CARD_COLORS = [
  '#FF00C8', // electric magenta
  '#00FFFF', // harsh cyan
  '#FF6B00', // construction orange
  '#7B00FF', // violent violet
  '#00FF41', // terminal green
  '#BFFF00', // radioactive lime
  '#FF0055', // neon crimson
  '#00FF9F', // chemical mint
  '#FF3000', // aggression red
  '#CCFF00', // toxic chartreuse
  '#FF0080', // hot pink
];

/**
 * Fisher-Yates shuffle (returns a new array).
 */
function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ActivityCarousel({ refreshTrigger, onActivityClick, isLoggedIn, headerRight }: ActivityCarouselProps) {
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Shuffled colour order for the current set of visible cards.
  // Regenerated whenever the data, filter, or page changes.
  const colorOrderRef = useRef<string[]>(shuffle(CARD_COLORS));
  const [colorSeed, setColorSeed] = useState(0);

  // Reshuffle colours when data changes or page changes
  useEffect(() => {
    colorOrderRef.current = shuffle(CARD_COLORS);
    setColorSeed((s) => s + 1);
  }, [upcomingActivities, filterCategory, currentPage]);

  const activitiesNext12Months = useMemo(
    () => upcomingActivities.filter((a) => {
      const date = new Date(a.startDateTime);
      return date <= addDays(new Date(), 365);
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
    setCurrentPage(0);
  }, [filterCategory, upcomingActivities]);

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / CARDS_PER_PAGE));
  const pageStart = currentPage * CARDS_PER_PAGE;
  const pageActivities = filteredActivities.slice(pageStart, pageStart + CARDS_PER_PAGE);
  const gridSlots = Array.from({ length: CARDS_PER_PAGE }, (_, i) => pageActivities[i] ?? null);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await secureFetch('/api/activities');
        if (res.ok) {
          const data = await res.json();
          const today = startOfDay(new Date());
          const sevenDaysFromNow = addDays(today, 7);

          const thisWeek = data
            .filter((e: any) => {
              const eventDate = new Date(e.startDateTime);
              return eventDate >= today && eventDate <= sevenDaysFromNow;
            })
            .sort((a: any, b: any) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
          setUpcomingActivities(thisWeek);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = colorSeed; // re-render when colours reshuffle

  const renderCard = (activity: Activity | null, idx: number) => {
    if (!activity) {
      return <div key={`empty-${idx}`} className="neo-card neo-card-empty" />;
    }

    const colors = colorOrderRef.current;
    const bg = colors[idx % colors.length];

    // Quirky deterministic random placement and shape
    const SHAPES = [
      '/shapes/star-burst.svg',
      '/shapes/pill.svg',
      '/shapes/polygon.svg',
      '/shapes/circle.svg',
    ];
    const shapeUrl = SHAPES[(idx * 3) % SHAPES.length];
    const rot = [-15, 25, -45, 60, -10, 180][(idx * 5) % 6];
    const positions = [
      { top: '-30px', right: '-30px' },
      { bottom: '-20px', left: '-20px' },
      { top: '30%', right: '-40px' },
      { bottom: '-40px', right: '-10px' },
    ];
    const pos = positions[(idx * 7) % positions.length];

    return (
      <div
        key={activity.id}
        className="neo-card clickable"
        style={{ backgroundColor: bg }}
        onClick={() => onActivityClick?.(activity)}
      >
        <div className="neo-card-bg-shape" style={{
          '--bg-shape-url': `url(${shapeUrl})`,
          transform: `rotate(${rot}deg)`,
          ...pos
        } as any} />
        
        <div className="neo-card-accent" />
        <div className="neo-card-date">
          <span className="neo-card-day">{format(new Date(activity.startDateTime), 'dd')}</span>
          <span className="neo-card-month">{format(new Date(activity.startDateTime), 'MMM')}</span>
        </div>
        <div className="neo-card-body">
          <h4 className="neo-card-title">{activity.name}</h4>
          <div className="neo-card-meta">
            <span className="neo-meta-item">
              <Clock size={11} /> {format(new Date(activity.startDateTime), 'hh:mm aa')}
            </span>
            {isLoggedIn && activity.category && (
              <span className="neo-category-tag">{activity.category}</span>
            )}
          </div>
          {activity.participantCount !== undefined && (
            <div className="neo-card-footer">
              <Users size={12} />
              <span>{activity.participantCount} registered</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="carousel-container">
        <div className="neo-grid-loading">Loading highlights...</div>
      </div>
    );
  }

  return (
    <div className="carousel-container fade-in">
      <div className="carousel-header">
        <div className="carousel-title">
          <span className="carousel-dot pulse-icon" />
          <h3>Upcoming Activities — This Week</h3>

          {isLoggedIn && (
            <button
              className="carousel-toggle-btn"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Show Highlights' : 'Hide Highlights'}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                borderRadius: '50%',
                transition: 'all 0.2s',
                marginLeft: '4px',
              }}
            >
              {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          )}

          <span className="carousel-count">{filteredActivities.length} activities</span>
        </div>

        {headerRight && (
          <div className="carousel-header-right">{headerRight}</div>
        )}
      </div>

      {categoryList.length > 1 && (
        <div className="carousel-category-strip">
          {categoryList.map((cat) => (
            <button
              key={cat}
              className={`category-pill${cat === filterCategory ? ' active' : ''}`}
              onClick={() => setFilterCategory(cat === filterCategory ? null : cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className={`carousel-strip-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
        {filteredActivities.length > 0 ? (
          <>
            <div className="neo-card-grid">
              {gridSlots.map((activity, idx) => renderCard(activity, idx))}
            </div>

            {totalPages > 1 && (
              <div className="neo-pagination">
                <button
                  className="neo-page-btn"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="neo-page-dots">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      className={`neo-page-dot${i === currentPage ? ' active' : ''}`}
                      onClick={() => setCurrentPage(i)}
                      aria-label={`Page ${i + 1}`}
                    />
                  ))}
                </div>

                <button
                  className="neo-page-btn"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>

                <span className="neo-page-label">
                  {currentPage + 1} / {totalPages}
                </span>
              </div>
            )}
          </>
        ) : (
          <EmptyState message="No upcoming activities" />
        )}
      </div>
    </div>
  );
}