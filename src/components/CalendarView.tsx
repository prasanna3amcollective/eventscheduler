'use client';

import { useState, useEffect, useCallback, useMemo, type JSX } from 'react';
import { Calendar, dateFnsLocalizer, type ToolbarProps, type View, type ViewsProps, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, isAfter, isBefore, startOfDay, isToday, addYears } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { type Holiday, getHolidays } from '@/lib/holidays';
import { Umbrella, CalendarFill as CalendarIcon, ChevronLeft, ChevronRight, PlusCircle } from '@/components/Icons';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOCALES = { 'en-US': enUS };

/** Dynamic date range to fetch activities from the API */
const FETCH_WINDOW = {
  start: '2025-12-01T00:00:00Z',
  end: addYears(new Date(), 1).toISOString(),
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

/** The shape of an activity returned by the API (before formatting) */
interface ApiActivity {
  id: string;
  name: string;
  startDateTime: string;
  endDateTime: string;
  leaders?: string[];
  guides?: string[];
  observers?: string[];
  participantCount?: number;
  participants?: { userId: string }[];
  category?: string;
  state?: string;
}

/** The shape used internally by react-big-calendar */
interface CalendarActivity {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  isHoliday: boolean;
  leaders?: string[];
  guides?: string[];
  observers?: string[];
  participants?: { userId: string }[];
  category?: string;
  state?: string;
  isResponsibility?: boolean;
  owner?: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Custom toolbar with navigation arrows, "Today" button, view switcher,
 * and an optional "Create Activity" button for authorized users.
 */
function CustomToolbar(props: ToolbarProps<CalendarActivity, object> & { onCreate?: () => void; onOwnResponsibility?: () => void; canCreate?: boolean }): JSX.Element {
  const { label, onNavigate, onView, view, onCreate, onOwnResponsibility, canCreate } = props;

  return (
    <div className="calendar-toolbar">
      <div className="toolbar-navigation">
        <button
          className="nav-btn"
          onClick={() => onNavigate('PREV')}
          aria-label="Go to previous period"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button className="nav-btn-today" onClick={() => onNavigate('TODAY')}>
          Today
        </button>
        <button
          className="nav-btn"
          onClick={() => onNavigate('NEXT')}
          aria-label="Go to next period"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="toolbar-label">{label}</div>

      <div className="toolbar-views">
         {canCreate && onCreate && (
           <>
              <button
                onClick={onOwnResponsibility}
                style={{
                  marginRight: '12px',
                  background: 'var(--responsibility-color)',
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
                <PlusCircle size={16} /> Own Responsibility
              </button>
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
           </>
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

/**
 * Paginated agenda sidebar panel.
 * Displays upcoming activities in a table with columns:
 * Activity | Time (start–end in 12h format) | Date ("Today" or date string).
 */
interface CustomAgendaProps {
  /** List of calendar activities to display */
  activities: CalendarActivity[];
  /** Called when an activity row is clicked */
  onSelectActivity: (activity: CalendarActivity) => void;
}

function CustomAgenda({ activities, onSelectActivity }: CustomAgendaProps): JSX.Element {
  const [currentPage, setCurrentPage] = useState(0);

  const now = useMemo(() => startOfDay(new Date()), []);
  const sixMonthsFromNow = useMemo(() => addMonths(now, 6), [now]);

  // Filter to activities within the next 6 months, sorted chronologically
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

  // Navigate to previous/next page
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
      {/* Header with pagination controls */}
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
            aria-disabled={currentPage === 0}
            onClick={goBack}
            aria-label="Previous page"
            style={{ width: '28px', height: '28px', opacity: currentPage === 0 ? 0.3 : 1 }}
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
          <button
            className="nav-btn"
            disabled={currentPage >= totalPages - 1}
            aria-disabled={currentPage >= totalPages - 1}
            onClick={goForward}
            aria-label="Next page"
            style={{ width: '28px', height: '28px', opacity: currentPage >= totalPages - 1 ? 0.3 : 1 }}
          >
            <ChevronRight size={14} aria-hidden="true" />
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
            <th style={{ padding: '8px' }}>Activity</th>
            <th style={{ padding: '8px' }}>Time</th>
            <th style={{ padding: '8px' }}>Date</th>
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
                role="button"
                tabIndex={0}
                onClick={() => onSelectActivity(activity)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectActivity(activity);
                  }
                }}
                aria-label={`${activity.title} from ${format(activity.start, 'hh:mm aa')} to ${format(activity.end, 'hh:mm aa')}`}
                style={{
                  background: 'var(--surface-color)',
                  borderRadius: '8px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <td style={{ padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary-color)' }}>
                    {activity.title}
                  </div>
                </td>
                <td style={{ padding: '8px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    {format(activity.start, 'hh:mm aa')} - {format(activity.end, 'hh:mm aa')}
                  </div>
                </td>
                <td style={{ padding: '8px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    {isToday(activity.start) ? 'Today' : format(activity.start, 'MMM dd, yyyy')}
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface CalendarViewProps {
  refreshTrigger: number;
  onSelectActivity: (activity: CalendarActivity) => void;
  onSelectSlot: (slotInfo: any) => void;
  onCreateActivity: () => void;
  onOwnResponsibility?: () => void;
  userRoles: string[];
}

/**
 * Full calendar page with month/week/day views and a sidebar agenda.
 * Fetches activities and holidays, renders them on a react-big-calendar,
 * and handles activity selection, slot creation, and navigation.
 */
export default function CalendarView({
  refreshTrigger,
  onSelectActivity,
  onSelectSlot,
  onCreateActivity,
  onOwnResponsibility,
  userRoles = [],
}: CalendarViewProps) {
  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [responsibilities, setResponsibilities] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(() => new Date());

  // Fetch activities from the API within a wide date window
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
          leaders: e.leaders || (e as any).leader || [],
          guides: e.guides || (e as any).guide || [],
          observers: e.observers || (e as any).observer || [],
          participants: e.participants,
          category: e.category,
          state: e.state,
        }));
        setActivities(formatted);
      } catch (err) {
        console.error('Failed to fetch activities', err);
      }
    };

    fetchActivities();
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  // Fetch responsibilities
  useEffect(() => {
    let cancelled = false;
    const fetchResponsibilities = async () => {
      try {
        const res = await fetch('/api/responsibilities');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setResponsibilities(data);
      } catch (err) {
        console.error('Failed to fetch responsibilities', err);
      }
    };
    fetchResponsibilities();
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  // Fetch holiday data once on mount
  useEffect(() => {
    let cancelled = false;

    const fetchHolidays = async () => {
      const data = await getHolidays();
      if (!cancelled) setHolidays(data);
    };

    fetchHolidays();
    return () => { cancelled = true; };
  }, []);

  // Combine regular activities with holiday events
  const calendarActivities = useMemo<CalendarActivity[]>(
    () => [
      ...activities,
      ...responsibilities.map((r) => ({
        id: r.id,
        title: r.name,
        start: new Date(r.startDateTime),
        end: new Date(r.endDateTime),
        isHoliday: false,
        isResponsibility: true,
        owner: r.owner,
        category: r.category,
        state: r.state,
      })),
      ...holidays.map((h) => ({
        id: h.id,
        title: h.name,
        start: new Date(h.date),
        end: new Date(h.date),
        allDay: true,
        isHoliday: true,
        category: 'Holiday'
      })),
    ],
    [activities, responsibilities, holidays],
  );

  const onView = useCallback((newView: View) => setView(newView), []);
  const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);

  // style individual day cells (holidays + weekends get a green tint)
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

  // style individual activity event blocks on the calendar grid
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
    if (activity.isResponsibility) {
      return {
        style: {
          backgroundColor: 'var(--responsibility-color)',
          color: 'white',
          border: 'none',
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

  // Navigate to a specific date and switch to day view
  const handleDrillDown = useCallback((clickedDate: Date) => {
    setDate(clickedDate);
    setView(Views.DAY);
  }, []);

  // Available views: month, week, day (agenda disabled — handled by sidebar)
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

  const CalendarEventRenderer = useCallback(({ event }: { event: CalendarActivity }) => {
    if (event.isHoliday) {
      return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Umbrella size={14} aria-hidden="true" />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</span>
      </div>
      );
    }
    return <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</span>;
  }, []);

  // Custom components override for toolbar and event rendering
  const components = useMemo(
    () => ({
      toolbar: (props: any) => <CustomToolbar {...props} onCreate={onCreateActivity} onOwnResponsibility={onOwnResponsibility} canCreate={canCreate} />,
      event: CalendarEventRenderer,
    }),
    [onCreateActivity, canCreate, CalendarEventRenderer, onOwnResponsibility],
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