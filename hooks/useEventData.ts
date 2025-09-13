"use client";

import { useState, useEffect } from 'react';
import { getPublicEvents } from '../app/actions/admin';
import { getAllEventsWithRegistrationCounts } from '../app/actions/eventRegistration';
import { Event } from '../types/event';
import { logger } from '@/lib/logger';

interface UseEventDataReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEventData(): UseEventDataReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch events and registration counts in parallel
      const [eventsResult, registrationResult] = await Promise.all([
        getPublicEvents(),
        getAllEventsWithRegistrationCounts()
      ]);

      if (eventsResult.error) {
        throw new Error(eventsResult.error);
      }

      if (!eventsResult.events) {
        throw new Error('No events data received');
      }

      // Combine events with registration counts
      const eventsWithCounts = eventsResult.events.map(event => ({
        ...event,
        registered: registrationResult.registrationCounts?.[event.id]?.total || 0
      }));

      setEvents(eventsWithCounts);
    } catch (err) {
      logger.error('Error fetching events:', { error: err instanceof Error ? err.message : 'Unknown error' }, err as Error);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents
  };
}
