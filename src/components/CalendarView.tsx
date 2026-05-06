'use client';

import { Calendar, dateFnsLocalizer, ToolbarProps, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, isAfter, isBefore } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Holiday, getHolidays } from '@/lib/holidays';
import { Umbrella, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CustomToolbar = (props: ToolbarProps) => {
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
};

interface CalendarViewProps {
  refreshTrigger: number;
  onSelectEvent: (event: any) => void;
  onSelectSlot: (slotInfo: any) => void;
}

// Custom Agenda component that adds leader/guide/observer columns
const CustomAgenda = ({ events, localizer, onSelectEvent }: any) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;
  const now = new Date();
  const sixMonthsFromNow = addMonths(now, 6);

  const filteredEvents = useMemo(() => {
    return events
      .filter((e: any) => {
        const eventDate = new Date(e.start);
        return isAfter(eventDate, now) && isBefore(eventDate, sixMonthsFromNow);
      })
      .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [events]);

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  return (
    <div className="rbc-agenda-view" style={{ padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-secondary)' }}>
          Upcoming Schedule (Next 6 Months)
        </h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            className="nav-btn" 
            disabled={currentPage === 0} 
            onClick={() => setCurrentPage(p => p - 1)}
            style={{ opacity: currentPage === 0 ? 0.5 : 1 }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '80px', textAlign: 'center' }}>
            Page {currentPage + 1} of {Math.max(1, totalPages)}
          </span>
          <button 
            className="nav-btn" 
            disabled={currentPage >= totalPages - 1} 
            onClick={() => setCurrentPage(p => p + 1)}
            style={{ opacity: currentPage >= totalPages - 1 ? 0.5 : 1 }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <table className="rbc-agenda-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
        <thead>
          <tr className="admin-table-header" style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
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
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No upcoming events found within the next 6 months</td></tr>
          ) : (
            paginatedEvents.map((event: any, idx: number) => (
              <tr 
                key={event.id || idx} 
                className="agenda-row clickable-row"
                onClick={() => onSelectEvent(event)}
                style={{ 
                  background: 'var(--surface-color)',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <td style={{ padding: '12px', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', fontWeight: 600 }}>
                  {format(new Date(event.start), 'MMM dd, yyyy')}
                </td>
                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                  {format(new Date(event.start), 'hh:mm aa')}
                </td>
                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--primary-color)' }}>
                  {event.title}
                </td>
                <td style={{ padding: '12px' }}>
                  <span className="role-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)' }}>
                    {event.leader || '-'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                   <span className="role-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    {event.guide || '-'}
                  </span>
                </td>
                <td style={{ padding: '12px', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                  <span className="role-badge" style={{ background: 'rgba(107, 114, 128, 0.1)', color: 'var(--text-secondary)' }}>
                    {event.observer || '-'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default function CalendarView({ refreshTrigger, onSelectEvent, onSelectSlot }: CalendarViewProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  const onNavigate = useCallback((newDate: Date) => setDate(newDate), [setDate]);
  const onView = useCallback((newView: View) => setView(newView), [setView]);

  useEffect(() => {
    const fetchEvents = async () => {
      const start = '2025-12-01T00:00:00Z';
      const end = '2027-01-31T23:59:59Z';
      try {
        const res = await fetch(`/api/events?start=${start}&end=${end}`);
        if (res.ok) {
          const data = await res.json();
          const formattedEvents = data.map((e: any) => ({
            ...e,
            start: new Date(e.startDateTime),
            end: new Date(e.endDateTime),
            title: e.name,
            isHoliday: false,
          }));
          setEvents(formattedEvents);
        }
      } catch (err) {
        console.error('Failed to fetch events', err);
      }
    };
    fetchEvents();
  }, [refreshTrigger]);

  useEffect(() => {
    const fetchHolidays = async () => {
      const data = await getHolidays();
      setHolidays(data);
    };
    fetchHolidays();
  }, []);

  const calendarEvents = [
    ...events,
    ...holidays.map(h => ({
      id: h.id,
      title: h.name,
      start: new Date(h.date),
      end: new Date(h.date),
      allDay: true,
      isHoliday: true,
    })),
  ];

  return (
    <div className="calendar-wrapper">
      <div className={view === Views.AGENDA ? 'hidden-calendar-view' : ''}>
        <Calendar
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
          onDrillDown={(clickedDate) => {
            setDate(clickedDate);
            setView(Views.DAY);
          }}
          style={{ height: view === Views.AGENDA ? 'auto' : 600 }}
          views={{
            month: true,
            week: true,
            day: true,
            agenda: true,
          }}
          components={{
            toolbar: CustomToolbar,
            event: ({ event }: any) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {event.isHoliday ? <Umbrella size={14} /> : <CalendarIcon size={14} />}
                <span>{event.title}</span>
              </div>
            ),
          }}
          dayPropGetter={(date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const day = date.getDay();
            const isHoliday = holidays.some(h => format(new Date(h.date), 'yyyy-MM-dd') === dateStr);
            const isWeekend = day === 0 || day === 6;

            if (isHoliday || isWeekend) {
              return {
                style: {
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                }
              };
            }
            return {};
          }}
          eventPropGetter={(event: any) => {
            if (event.isHoliday) {
              return {
                style: {
                  backgroundColor: 'rgba(16, 185, 129, 0.6)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600
                }
              };
            }
            return {
              style: {
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
              }
            };
          }}
        />
      </div>

      {view === Views.AGENDA && (
        <div className="custom-agenda-container fade-in">
          <CustomAgenda events={calendarEvents.filter(e => !e.isHoliday)} onSelectEvent={onSelectEvent} />
        </div>
      )}
    </div>
  );
}