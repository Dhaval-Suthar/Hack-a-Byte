"use client";

import React, { useState, useEffect } from 'react';
import styles from './Calendar.module.css';

interface CalendarProps {
  time: Date;
}

const Calendar: React.FC<CalendarProps> = ({ time }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(time);
  const [view, setView] = useState<'month' | 'list' | 'day'>('month');
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({});
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'iPhone Live! Podcast',
      date: new Date(2025, 7, 16),
      startTime: '8:00 PM'
    }
  ]);

  interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    startTime?: string;
    endTime?: string;
    description?: string;
  }
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days: Array<{ date: Date | null; isCurrentMonth: boolean }> = [];
    
    // Add days from previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      const prevDate = new Date(year, month, -i);
      days.unshift({ date: prevDate, isCurrentMonth: false });
    }
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + (direction === 'next' ? 1 : -1),
      1
    ));
  };

  const handleNewEvent = () => {
    if (newEvent.title && newEvent.date) {
      setEvents(prev => [...prev, {
        id: crypto.randomUUID(),
        title: newEvent.title!,
        date: newEvent.date!,
        startTime: newEvent.startTime || '12:00 PM'
      }]);
      setShowNewEventModal(false);
      setNewEvent({});
    }
  };

  const goToToday = () => {
    setSelectedDate(time);
    setView('day');
  };

  const handleDownload = () => {
    // Create iCal format string
    let iCalString = "BEGIN:VCALENDAR\nVERSION:2.0\n";
    events.forEach(event => {
      iCalString += "BEGIN:VEVENT\n";
      iCalString += `DTSTART:${formatDateToICal(event.date)}\n`;
      iCalString += `SUMMARY:${event.title}\n`;
      iCalString += "END:VEVENT\n";
    });
    iCalString += "END:VCALENDAR";

    // Create and trigger download
    const blob = new Blob([iCalString], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calendar.ics';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const isToday = (date: Date) => {
    return date.getDate() === time.getDate() &&
           date.getMonth() === time.getMonth() &&
           date.getFullYear() === time.getFullYear();
  };

  const renderView = () => {
    switch (view) {
      case 'list':
        return (
          <div className={styles.listView}>
            {events
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map((event, i) => (
                <div key={event.id} className={styles.listEvent}>
                  <div className={styles.eventDate}>
                    {event.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                  <div className={styles.eventDot} />
                  <span>{event.startTime} {event.title}</span>
                </div>
              ))
            }
          </div>
        );
      case 'day':
        const todayEvents = events.filter(event => 
          event.date.getDate() === selectedDate.getDate() &&
          event.date.getMonth() === selectedDate.getMonth() &&
          event.date.getFullYear() === selectedDate.getFullYear()
        );
        return (
          <div className={styles.dayView}>
            <div className={styles.dayHeader}>
              {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            {todayEvents.map((event, i) => (
            {todayEvents.map((event) => (
              <div key={event.id} className={styles.dayEvent}>
                <div className={styles.eventDot} />
                <span>{event.startTime} {event.title}</span>
              </div>
            ))}
          </div>
        );
      default:
        return (
          <>
            <div className={styles.weekDays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className={styles.weekDay}>{day}</div>
              ))}
            </div>
            <div className={styles.daysGrid}>
              {getDaysInMonth(selectedDate).map((dayInfo, index) => (
                <div
                  key={index}
                  className={`${styles.day} 
                    ${!dayInfo.isCurrentMonth ? styles.otherMonth : ''}
                    ${isToday(dayInfo.date!) ? styles.today : ''}
                    ${
                      dayInfo.date!.getDate() === selectedDate.getDate() &&
                      dayInfo.date!.getMonth() === selectedDate.getMonth()
                        ? styles.selected
                        : ''
                    }
                  `}
                  onClick={() => setSelectedDate(dayInfo.date!)}
                >
                  {dayInfo.date!.getDate()}
                  {events.some(event => 
                    event.date.getDate() === dayInfo.date!.getDate() &&
                    event.date.getMonth() === dayInfo.date!.getMonth() &&
                    event.date.getFullYear() === dayInfo.date!.getFullYear()
                  ) && <div className={styles.eventIndicator} />}
                </div>
              ))}
            </div>
          </>
        );
    }
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span>Calendars</span>
          <span>All Calendars</span>
        </div>
        <button 
          className={styles.addButton}
          onClick={() => setShowNewEventModal(true)}
          aria-label="Add Calendar Event"
        >+</button>
      </div>

      {view === 'month' && (
        <div className={styles.monthHeader}>
          <button onClick={() => navigateMonth('prev')}>&lt;</button>
          <h2>{monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}</h2>
          <button onClick={() => navigateMonth('next')}>&gt;</button>
        </div>
      )}

      {renderView()}

      {view === 'month' && events
        .filter(event => 
          event.date.getDate() === selectedDate.getDate() &&
          event.date.getMonth() === selectedDate.getMonth() &&
          event.date.getFullYear() === selectedDate.getFullYear()
        )
        .map((event, i) => (
        .map((event) => (
          <div key={event.id} className={styles.event}>
            <div className={styles.eventDot} />
            <span>{event.startTime} {event.title}</span>
          </div>
        ))
      }

      <div className={styles.toolbar}>
        <button
          className={`${styles.toolButton}`}
          onClick={goToToday}
        >
          Today
        </button>
        <button
          className={`${styles.toolButton} ${view === 'list' ? styles.active : ''}`}
          onClick={() => setView('list')}
        >
          List
        </button>
        <button
          className={`${styles.toolButton} ${view === 'day' ? styles.active : ''}`}
          onClick={() => setView('day')}
        >
          Day
        </button>
        <button
          className={`${styles.toolButton} ${view === 'month' ? styles.active : ''}`}
          onClick={() => setView('month')}
        >
          Month
        </button>
        <button 
          className={styles.toolButton}
          onClick={handleDownload}
        >
          <span style={{ fontSize: '16px' }}>↓</span>
        </button>
      </div>

      {showNewEventModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>New Event</h3>
            <input
              type="text"
              placeholder="Event Title"
              value={newEvent.title || ''}
              onChange={e => setNewEvent({...newEvent, title: e.target.value})}
              className={styles.input}
            />
            <input
              type="date"
              value={newEvent.date ? newEvent.date.toISOString().split('T')[0] : ''}
              onChange={e => setNewEvent({...newEvent, date: new Date(e.target.value)})}
              className={styles.input}
            />
            <input
              type="time"
              value={newEvent.startTime || ''}
              onChange={e => setNewEvent({...newEvent, startTime: e.target.value})}
              className={styles.input}
            />
            <div className={styles.modalButtons}>
              <button 
                className={styles.modalButton}
                onClick={() => setShowNewEventModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.modalButton}
                onClick={handleNewEvent}
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
