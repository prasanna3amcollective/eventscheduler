'use client';

import { Calendar, dateFnsLocalizer, type ToolbarProps, type View, type ViewsProps, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, isAfter, isBefore } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useEffect, useState, useCallback, useMemo, type JSX } from 'react';
import { type Holiday, getHolidays } from '@/lib/holidays';
import { Umbrella, CalendarFill as CalendarIcon, ChevronLeft, ChevronRight } from '@/components/Icons';

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

/** The shape of an event returned by the API (before formatting). */
interface ApiEvent {
  id: string;
  name: string;
  startDateTime: string;
  endDateTime: string;
  leader?: string;
  guide?: string;
  observer?: string;
  participantCount?: number;
}

/** The shape used internall by react-big-calendar. */
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  isHoliday: boolean;
  leader?: string;
  guide?: string;
  observer?: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// ── Toolbar ───────────────────────────────────────────────────────────────

function CustomToolbar(props: ToolbarProps<CalendarEvent, object>): JSX.Element {
  const { label, onNavigate, onView, view } = props;

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
        {(['month', 'week', 'day', 'agenda'] as View[]).map((v) => (
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
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

function CustomAgenda({ events, onSelectEvent }: CustomAgendaProps): JSX.Element {
  const [currentPage, setCurrentPage] = useState(0);

  const now = useMemo(() => new Date(), []);
  const sixMonthsFromNow = useMemo(() => addMonths(now, 6), [now]);

  const filteredEvents = useMemo(
    () =>
      events
        .filter((e) => {
          const d = e.start;
          return isAfter(d, now) && isBefore(d, sixMonthsFromNow);
        })
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    [events, now, sixMonthsFromNow],
  );

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / AGENDA_PAGE_SIZE));
  const paginatedEvents = useMemo(
    () =>
      filteredEvents.slice(
        currentPage * AGENDA_PAGE_SIZE,
        (currentPage + 1) * AGENDA_PAGE_SIZE,
      ),
    [filteredEvents, currentPage],
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
    <div className="rbc-agenda-view" style={{ padding: '0 20px' }}>
      {/* ---------- Header row ---------- */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '16px',
            color: 'var(--text-secondary)',
          }}
        >
          Upcoming Schedule (Next 6 Months)
        </h3>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="nav-btn"
            disabled={currentPage === 0}
            onClick={goBack}
            style={{ opacity: currentPage === 0 ? 0.5 : 1 }}
          >
            <ChevronLeft size={18} />
          </button>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              minWidth: '80px',
              textAlign: 'center',
            }}
          >
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            className="nav-btn"
            disabled={currentPage >= totalPages - 1}
            onClick={goForward}
            style={{ opacity: currentPage >= totalPages - 1 ? 0.5 : 1 }}
          >
            <ChevronRight size={18} />
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
            }}
          >
            <th style={{ padding: '12px' }}>Date</th>
            <th style={{ padding: '12px' }}>Time</th>
            <th style={{ padding: '12px' }}>Event</th>
            <th style={{ padding: '12px' }}>Leader</th>
            <th style={{ padding: '12px' }}>Guide</th>
            <th style={{ padding: '12px' }}>Observer</th>
          </tr>
        </thead>
        <tbody>
          {paginatedEvents.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'var(--text-secondary)',
                }}
              >
                No upcoming events found within the next 6 months
              </td>
            </tr>
          ) : (
            paginatedEvents.map((event) => (
              <tr
                key={event.id}
                className="agenda-row clickable-row"
                onClick={() => onSelectEvent(event)}
                style={{
                  background: 'var(--surface-color)',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <td
                  style={{
                    padding: '12px',
                    borderTopLeftRadius: '8px',
                    borderBottomLeftRadius: '8px',
                    fontWeight: 600,
                  }}
                >
                  {format(event.start, 'MMM dd, yyyy')}
                </td>
                <td
                  style={{
                    padding: '12px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {format(event.start, 'hh:mm aa')}
                </td>
                <td
                  style={{
                    padding: '12px',
                    fontWeight: 700,
                    color: 'var(--primary-color)',
                  }}
                >
                  {event.title}
                </td>
                <td style={{ padding: '12px' }}>
                  <span
                    className="role-badge"
                    style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: 'var(--primary-color)',
                    }}
                  >
                    {event.leader ?? '-'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span
                    className="role-badge"
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                    }}
                  >
                    {event.guide ?? '-'}
                  </span>
                </td>
                <td
                  style={{
                    padding: '12px',
                    borderTopRightRadius: '8px',
                    borderBottomRightRadius: '8px',
                  }}
                >
                  <span
                    className="role-badge"
                    style={{
                      background: 'rgba(107, 114, 128, 0.1)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {event.observer ?? '-'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Calendar event renderer (used by react-big-calendar component prop) ─

function CalendarEventRenderer({ event }: { event: CalendarEvent }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {event.isHoliday ? <Umbrella size={14} /> : <CalendarIcon size={14} />}
      <span>{event.title}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface CalendarViewProps {
  refreshTrigger: number;
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
}

export default function CalendarView({
  refreshTrigger,
  onSelectEvent,
  onSelectSlot,
}: CalendarViewProps) {
  // -- State --
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(() => new Date());

  // -- Navigation --
  const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);
  const onView = useCallback((newView: View) => setView(newView), []);

  // -- Fetch events --
  useEffect(() => {
    let cancelled = false;

    const fetchEvents = async () => {
      try {
        const res = await fetch(
          `/api/events?start=${FETCH_WINDOW.start}&end=${FETCH_WINDOW.end}`,
        );
        if (!res.ok) return;
        const data: ApiEvent[] = await res.json();
        if (cancelled) return;

        const formatted: CalendarEvent[] = data.map((e) => ({
          id: e.id,
          title: e.name,
          start: new Date(e.startDateTime),
          end: new Date(e.endDateTime),
          isHoliday: false,
          leader: e.leader,
          guide: e.guide,
          observer: e.observer,
        }));
        setEvents(formatted);
      } catch (err) {
        console.error('Failed to fetch events', err);
      }
    };

    fetchEvents();
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

  // -- Derived: combined calendar events --
  const calendarEvents = useMemo<CalendarEvent[]>(
    () => [
      ...events,
      ...holidays.map((h) => ({
        id: h.id,
        title: h.name,
        start: new Date(h.date),
        end: new Date(h.date),
        allDay: true,
        isHoliday: true,
      })),
    ],
    [events, holidays],
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

  // -- Event styling --
  const eventPropGetter = useCallback((event: CalendarEvent) => {
    if (event.isHoliday) {
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
  const views: ViewsProps<CalendarEvent> = useMemo(
    () => ({
      month: true,
      week: true,
      day: true,
      agenda: true,
    }),
    [],
  );

  // -- Calendar component overrides --
  const components = useMemo(
    () => ({
      toolbar: CustomToolbar,
      event: CalendarEventRenderer,
    }),
    [],
  );

  // ---- Render ----
  return (
    <div className="calendar-wrapper">
      <div className={view === Views.AGENDA ? 'hidden-calendar-view' : ''}>
        <Calendar<CalendarEvent>
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectSlot={onSelectSlot}
          onSelectEvent={onSelectEvent}
          view={view}
          onView={onView}
          date={date}
          onNavigate={onNavigate}
          onDrillDown={handleDrillDown}
          style={{ height: view === Views.AGENDA ? 'auto' : 600 }}
          views={views}
          components={components}
          dayPropGetter={dayPropGetter}
          eventPropGetter={eventPropGetter}
        />
      </div>

      {view === Views.AGENDA && (
        <div className="custom-agenda-container fade-in">
          <CustomAgenda
            events={calendarEvents.filter((e) => !e.isHoliday)}
            onSelectEvent={onSelectEvent}
          />
        </div>
      )}
    </div>
  );
}