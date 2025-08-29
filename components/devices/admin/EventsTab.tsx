"use client";

interface Event {
  _id: string;
  title: string;
  description: string;
  type: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface EventsTabProps {
  events: Event[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  isLoading: boolean;
  onCreateEvent: () => void;
  onToggleEvent: (eventId: string, currentStatus: boolean) => void;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
  onViewParticipants: (event: Event) => void;
  onToggleRegistration: (eventId: string, currentStatus: boolean) => void;
}

export default function EventsTab({
  events,
  searchQuery,
  setSearchQuery,
  isLoading,
  onDeleteEvent
}: EventsTabProps) {
  return (
    <div>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-cyber-primary"
        />
        <button className="px-4 py-2 bg-cyber-primary hover:bg-cyber-primary/90 rounded-md text-white transition-colors">
          Create Event
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-gray-300">Event Title</th>
              <th className="px-4 py-3 text-left text-gray-300">Type</th>
              <th className="px-4 py-3 text-left text-gray-300">Start Time</th>
              <th className="px-4 py-3 text-left text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {events.map((event) => (
              <tr key={event._id} className="hover:bg-gray-700">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-white">{event.title}</div>
                    <div className="text-sm text-gray-400">{event.description}</div>
                  </div>
                </td>
                <td className="px-4 py-3">{event.type}</td>
                <td className="px-4 py-3">{new Date(event.startTime).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onDeleteEvent(event._id)}
                    className="bg-red-900/50 hover:bg-red-800/50 text-red-200 px-2 py-1 rounded text-xs transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-3 text-center text-gray-400">
                  {isLoading ? "Loading events..." : "No events found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}