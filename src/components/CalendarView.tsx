'use client';

import { Calendar, dateFnsLocalizer, ToolbarProps, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useEffect, useState, useCallback } from 'react';
import { Holiday, getHolidays } from '@/lib/holidays';
import { Umbrella, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const locales = {
  'en-US': enUS,
};

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
}

export default function CalendarView({ refreshTrigger, onSelectEvent }: CalendarViewProps) {
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
            isHoliday: false
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
      isHoliday: true
    }))
  ];

  return (
    <div className="calendar-wrapper">
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        onSelectEvent={onSelectEvent}
        view={view}
        onView={onView}
        date={date}
        onNavigate={onNavigate}
        onDrillDown={(clickedDate) => {
          setDate(clickedDate);
          setView(Views.DAY);
        }}
        style={{ height: '100%' }}
        components={{
          toolbar: CustomToolbar,
          event: ({ event }: any) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {event.isHoliday ? <Umbrella size={14} /> : <CalendarIcon size={14} />}
              <span>{event.title}</span>
            </div>
          )
        }}
        eventPropGetter={(event: any) => {
          if (event.isHoliday) {
            return {
              style: {
                backgroundColor: 'var(--holiday-color)',
                color: 'white',
                border: 'none',
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
  );
}
