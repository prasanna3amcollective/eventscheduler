'use client';

import { Calendar, dateFnsLocalizer, type ToolbarProps, type View, type ViewsProps, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, isAfter, isBefore, startOfDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useEffect, useState, useCallback, useMemo, type JSX } from 'react';
import { type Holiday, getHolidays } from '@/lib/holidays';
import { Umbrella, CalendarFill as CalendarIcon, ChevronLeft, ChevronRight, PlusCircle } from '@/components/Icons';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOCALES = { 'en-US': enUS };

/** Hard-coded date range to fetch. */
const FETCH_WINDOW = {
  start: '2025-12-01T00:00:00Z',
  end: '2027-01-31T23:59:59Z',
} as const;

const AGENDA_PAGE_SIZE = 6;

// ---------------------------------------------------------------------------
// Localiser
// ---------------------------------------------------------------------------

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: LOCALES,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The shape of an activity returned by the API (before formatting). */
interface ApiActivity {
  id: string;
  name: string;
  startDateTime: string;
  endDateTime: string;
  leader?: string;
  guide?: string;
  observer?: string;
  participantCount?: number;
  participants?: { userId: string }[];
}

/** The shape used internall by react-big-calendar. */
interface CalendarActivity {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  isHoliday: boolean;
  leader?: string;
  guide?: string;
  observer?: string;
  participants?: { userId: string }[];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// ── Toolbar ───────────────────────────────────────────────────────────────

function CustomToolbar(props: ToolbarProps<CalendarActivity, object> & { onCreate?: () => void; canCreate?: boolean }): JSX.Element {
  const { label, onNavigate, onView, view, onCreate, canCreate } = props;

  return (
    <div className="calendar-toolbar">
      <div className="toolbar-navigation">
        <button className="nav-btn" onClick={() => onNavigate('PREV')}>
          <ChevronLeft size={20} />
        </button>
        <button className="nav-btn-today" onClick={() => onNavigate('TODAY')}>
          Today
        </button>
        <button className="nav-btn" onClick={() => onNavigate('NEXT')}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="toolbar-label">{label}</div>

      <div className="toolbar-views">
        {canCreate && onCreate && (
          <button 
            className="rbc-create-btn"
            onClick={onCreate}
            style={{ 
              marginRight: '12px', 
              background: 'var(--primary-color)', 
              color: 'white',
              border: 'none',
              padding: '0 12px',
              height: '34px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <PlusCircle size={16} /> Create Activity
          </button>
        )}
        {(['month', 'week', 'day'] as View[]).map((v) => (
          <button
            key={v}
            className={view === v ? 'rbc-active' : ''}
            onClick={() => onView(v)}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Agenda table (paginated, with leader/guide/observer) ────────────────

interface CustomAgendaProps {
  activities: CalendarActivity[];
  onSelectActivity: (activity: CalendarActivity) => void;
}

function CustomAgenda({ activities, onSelectActivity }: CustomAgendaProps): JSX.Element {
  const [currentPage, setCurrentPage] = useState(0);

  const now = useMemo(() => startOfDay(new Date()), []);
  const sixMonthsFromNow = useMemo(() => addMonths(now, 6), [now]);

  const filteredActivities = useMemo(
    () =>
      activities
        .filter((e) => {
          const d = e.start;
          return isAfter(d, now) && isBefore(d, sixMonthsFromNow);
        })
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    [activities, now, sixMonthsFromNow],
  );

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / AGENDA_PAGE_SIZE));
  const paginatedActivities = useMemo(
    () =>
      filteredActivities.slice(
        currentPage * AGENDA_PAGE_SIZE,
        (currentPage + 1) * AGENDA_PAGE_SIZE,
      ),
    [filteredActivities, currentPage],
  );

  const goBack = useCallback(
    () => setCurrentPage((p) => Math.max(0, p - 1)),
    [],
  );
  const goForward = useCallback(
    () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1)),
    [totalPages],
  );

  return (
    <div className="rbc-agenda-view-side">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Agenda
        </h3>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            className="nav-btn"
            disabled={currentPage === 0}
            onClick={goBack}
            style={{ width: '28px', height: '28px', opacity: currentPage === 0 ? 0.3 : 1 }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            className="nav-btn"
            disabled={currentPage >= totalPages - 1}
            onClick={goForward}
            style={{ width: '28px', height: '28px', opacity: currentPage >= totalPages - 1 ? 0.3 : 1 }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ---------- Table ---------- */}
      <table
        className="rbc-agenda-table"
        style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: '0 8px',
        }}
      >
        <thead>
          <tr
            className="admin-table-header"
            style={{
              textAlign: 'left',
              borderBottom: '1px solid var(--border-color)',
              fontSize: '12px'
            }}
          >
            <th style={{ padding: '8px' }}>Event</th>
          </tr>
        </thead>
        <tbody>
          {paginatedActivities.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'var(--text-secondary)',
                }}
              >
                No upcoming activities found within the next 6 months
              </td>
            </tr>
          ) : (
            paginatedActivities.map((activity) => (
              <tr
                key={activity.id}
                className="agenda-row clickable-row"
                onClick={() => onSelectActivity(activity)}
                style={{
                  background: 'var(--surface-color)',
                  borderRadius: '8px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <td
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary-color)' }}>
                    {activity.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {format(activity.start, 'MMM dd · hh:mm aa')}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Calendar activity renderer (used by react-big-calendar component prop) ─

function CalendarEventRenderer({ event: activity }: { event: CalendarActivity }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {activity.isHoliday ? <Umbrella size={14} /> : <CalendarIcon size={14} />}
      <span>{activity.title}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface CalendarViewProps {
  refreshTrigger: number;
  onSelectActivity: (activity: CalendarActivity) => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
  onCreateActivity?: () => void;
  userRoles?: string[];
}

export default function CalendarView({
  refreshTrigger,
  onSelectActivity,
  onSelectSlot,
  onCreateActivity,
  userRoles = [],
}: CalendarViewProps) {
  // -- State --
  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(() => new Date());

  // -- Navigation --
  const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);
  const onView = useCallback((newView: View) => setView(newView), []);

  // -- Fetch activities --
  useEffect(() => {
    let cancelled = false;

    const fetchActivities = async () => {
      try {
        const res = await fetch(
          `/api/activities?start=${FETCH_WINDOW.start}&end=${FETCH_WINDOW.end}`,
        );
        if (!res.ok) return;
        const data: ApiActivity[] = await res.json();
        if (cancelled) return;

        const formatted: CalendarActivity[] = data.map((e) => ({
          id: e.id,
          title: e.name,
          start: new Date(e.startDateTime),
          end: new Date(e.endDateTime),
          isHoliday: false,
          leader: e.leader,
          guide: e.guide,
          observer: e.observer,
          participants: e.participants,
        }));
        setActivities(formatted);
      } catch (err) {
        console.error('Failed to fetch activities', err);
      }
    };

    fetchActivities();
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  // -- Fetch holidays --
  useEffect(() => {
    let cancelled = false;

    const fetchHolidays = async () => {
      const data = await getHolidays();
      if (!cancelled) setHolidays(data);
    };

    fetchHolidays();
    return () => { cancelled = true; };
  }, []);

  // -- Derived: combined calendar activities --
  const calendarActivities = useMemo<CalendarActivity[]>(
    () => [
      ...activities,
      ...holidays.map((h) => ({
        id: h.id,
        title: h.name,
        start: new Date(h.date),
        end: new Date(h.date),
        allDay: true,
        isHoliday: true,
      })),
    ],
    [activities, holidays],
  );

  // -- Day styling --
  const dayPropGetter = useCallback(
    (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const day = date.getDay();
      const isHoliday = holidays.some(
        (h) => format(new Date(h.date), 'yyyy-MM-dd') === dateStr,
      );
      const isWeekend = day === 0 || day === 6;

      if (isHoliday || isWeekend) {
        return {
          style: {
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
          } as const,
        };
      }
      return {};
    },
    [holidays],
  );

  // -- Activity styling --
  const eventPropGetter = useCallback((activity: CalendarActivity) => {
    if (activity.isHoliday) {
      return {
        style: {
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          color: 'white',
          border: 'none',
          fontWeight: 600,
        } as const,
      };
    }
    return {
      style: {
        backgroundColor: 'var(--primary-color)',
        color: 'white',
        border: 'none',
      } as const,
    };
  }, []);

  // -- Drill-down handler: clicking a day goes to day view --
  const handleDrillDown = useCallback((clickedDate: Date) => {
    setDate(clickedDate);
    setView(Views.DAY);
  }, []);

  // -- View options --
  const views: ViewsProps<CalendarActivity> = useMemo(
    () => ({
      month: true,
      week: true,
      day: true,
      agenda: false,
    }),
    [],
  );

  const canCreate = userRoles.includes('core') || userRoles.includes('inhouse');

  // -- Calendar component overrides --
  const components = useMemo(
    () => ({
      toolbar: (props: any) => <CustomToolbar {...props} onCreate={onCreateActivity} canCreate={canCreate} />,
      event: CalendarEventRenderer,
    }),
    [onCreateActivity, canCreate],
  );

  // ---- Render ----
  return (
    <div className="calendar-page-layout">
      <div className="calendar-main-column">
        <div className="calendar-wrapper">
          <Calendar<CalendarActivity>
            localizer={localizer}
            events={calendarActivities}
            startAccessor="start"
            endAccessor="end"
            selectable
            onSelectSlot={onSelectSlot}
            onSelectEvent={onSelectActivity}
            view={view}
            onView={onView}
            date={date}
            onNavigate={onNavigate}
            onDrillDown={handleDrillDown}
            style={{ height: 600 }}
            views={views}
            components={components}
            dayPropGetter={dayPropGetter}
            eventPropGetter={eventPropGetter}
          />
        </div>
      </div>

      <div className="calendar-side-column">
        <CustomAgenda
          activities={calendarActivities.filter((e) => !e.isHoliday)}
          onSelectActivity={onSelectActivity}
        />
      </div>
    </div>
  );
}