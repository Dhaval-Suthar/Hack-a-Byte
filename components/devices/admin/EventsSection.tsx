"use client";
import React, { useState } from "react";
import { EventItem } from "./shared-types";

interface EventsSectionProps {
  evts: EventItem[];
  q: string;
  setQ: (query: string) => void;
  onCreateEvent?: (eventData: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    category: string;
    isPublic: boolean;
    capacity: number;
    requiredDeviceTypes: { mobile: boolean; desktop: boolean };
    requiredDevices: { mobile: string[]; desktop: string[] };
    minTeamMembers: number;
    maxTeamMembers: number;
    pricingNormal: number;
    pricingExtended?: number;
  }) => Promise<void>;
  onUpdateEvent?: (id: string, updates: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    category?: string;
    isPublic?: boolean;
    capacity?: number;
    requiredDeviceTypes?: { mobile: boolean; desktop: boolean };
    requiredDevices?: { mobile: string[]; desktop: string[] };
    minTeamMembers?: number;
    maxTeamMembers?: number;
    pricingNormal?: number;
    pricingExtended?: number;
  }) => Promise<void>;
  onDeleteEvent?: (id: string) => Promise<void>;
  onToggleRegistration?: (id: string) => Promise<void>;
}

export default function EventsSection({
  evts,
  q,
  setQ,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onToggleRegistration,
}: EventsSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    category: "",
    isPublic: true,
    capacity: "" as string | number,
    requiredDeviceTypes: { mobile: false, desktop: false },
    requiredDevices: { mobile: [] as string[], desktop: [] as string[] },
    minTeamMembers: 1,
    maxTeamMembers: 4,
    pricingNormal: 0,
    pricingExtended: undefined as number | undefined,
  });

  // Helper function to format dates for datetime-local input
  const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    // Convert to local timezone for display in datetime-local input
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const filtered = evts.filter((event) =>
    event.title.toLowerCase().includes(q.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.title.trim() || !onCreateEvent) return;

    try {
      await onCreateEvent({
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: formData.location,
        category: formData.category,
        isPublic: formData.isPublic,
        capacity: typeof formData.capacity === 'string' && formData.capacity === '' ? 0 : Number(formData.capacity),
        requiredDeviceTypes: formData.requiredDeviceTypes,
        requiredDevices: formData.requiredDevices,
        minTeamMembers: formData.minTeamMembers,
        maxTeamMembers: formData.maxTeamMembers,
        pricingNormal: formData.pricingNormal,
        pricingExtended: formData.pricingExtended,
      });
      setFormData({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        location: "",
        category: "",
        isPublic: true,
        capacity: "",
        requiredDeviceTypes: { mobile: false, desktop: false },
        requiredDevices: { mobile: [], desktop: [] },
        minTeamMembers: 1,
        maxTeamMembers: 4,
        pricingNormal: 0,
        pricingExtended: undefined,
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  const handleUpdate = async () => {
    if (!editingEvent || !formData.title.trim() || !onUpdateEvent) return;

    try {
      await onUpdateEvent(editingEvent._id, {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: formData.location,
        category: formData.category,
        isPublic: formData.isPublic,
        capacity: typeof formData.capacity === 'string' && formData.capacity === '' ? undefined : Number(formData.capacity),
        requiredDeviceTypes: formData.requiredDeviceTypes,
        requiredDevices: formData.requiredDevices,
        minTeamMembers: formData.minTeamMembers,
        maxTeamMembers: formData.maxTeamMembers,
        pricingNormal: formData.pricingNormal,
        pricingExtended: formData.pricingExtended,
      });
      setEditingEvent(null);
      setFormData({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        location: "",
        category: "",
        isPublic: true,
        capacity: "",
        requiredDeviceTypes: { mobile: false, desktop: false },
        requiredDevices: { mobile: [], desktop: [] },
        minTeamMembers: 1,
        maxTeamMembers: 4,
        pricingNormal: 0,
        pricingExtended: undefined,
      });
    } catch (error) {
      console.error("Failed to update event:", error);
    }
  };

  const startEdit = (event: EventItem) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      startDate: formatDateForInput(event.startDate),
      endDate: formatDateForInput(event.endDate),
      location: event.location || "",
      category: event.category || "",
      isPublic: event.isPublic ?? true,
      capacity: event.capacity || "",
      requiredDeviceTypes: event.requiredDeviceTypes || { mobile: false, desktop: false },
      requiredDevices: event.requiredDevices || { mobile: [], desktop: [] },
      minTeamMembers: event.minTeamMembers || 1,
      maxTeamMembers: event.maxTeamMembers || 4,
      pricingNormal: event.pricing?.normal || 0,
      pricingExtended: event.pricing?.extended,
    });
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      location: "",
      category: "",
      isPublic: true,
      capacity: "",
      requiredDeviceTypes: { mobile: false, desktop: false },
      requiredDevices: { mobile: [], desktop: [] },
      minTeamMembers: 1,
      maxTeamMembers: 4,
      pricingNormal: 0,
      pricingExtended: undefined,
    });
  };

  const eventCategories = [
    "Competition",
    "Workshop",
    "Seminar",
    "Conference",
    "Hackathon",
    "CTF",
    "Training",
    "Other"
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {onCreateEvent && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-1 bg-green-600 text-white rounded text-xs"
          >
            {showCreateForm ? "Cancel" : "New Event"}
          </button>
        )}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search events"
          className="ml-auto px-2 py-1 bg-neutral-800 rounded text-xs"
        />
      </div>

      {showCreateForm && (
        <div className="p-3 bg-neutral-800 rounded space-y-3">
          <h3 className="text-sm font-semibold">Create New Event</h3>
          <input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Event title"
            className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
          />
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description"
            rows={3}
            className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="px-2 py-1 bg-neutral-700 rounded text-xs"
            />
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="px-2 py-1 bg-neutral-700 rounded text-xs"
            />
          </div>
          <input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Location"
            className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
          >
            <option value="">Select category</option>
            {eventCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, capacity: value === '' ? '' : parseInt(value) || 0 });
              }}
              placeholder="Capacity (optional)"
              min="0"
              className="flex-1 px-2 py-1 bg-neutral-700 rounded text-xs"
            />
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              />
              Public
            </label>
          </div>

          {/* New fields for enhanced event configuration */}
          <div className="space-y-2">
            <label className="text-xs text-neutral-400">Required Device Types:</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={formData.requiredDeviceTypes.mobile}
                  onChange={(e) => setFormData({
                    ...formData,
                    requiredDeviceTypes: { ...formData.requiredDeviceTypes, mobile: e.target.checked }
                  })}
                />
                Mobile
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={formData.requiredDeviceTypes.desktop}
                  onChange={(e) => setFormData({
                    ...formData,
                    requiredDeviceTypes: { ...formData.requiredDeviceTypes, desktop: e.target.checked }
                  })}
                />
                Desktop
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-neutral-400">Required Devices in Playspace:</label>
            
            <div className="space-y-2">
              <div>
                <label className="text-xs text-neutral-300 font-medium">Mobile Devices:</label>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {['hackphone', 'hackdroid'].map(device => (
                    <label key={device} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={formData.requiredDevices.mobile.includes(device)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData({
                            ...formData,
                            requiredDevices: {
                              ...formData.requiredDevices,
                              mobile: checked
                                ? [...formData.requiredDevices.mobile, device]
                                : formData.requiredDevices.mobile.filter(d => d !== device)
                            }
                          });
                        }}
                      />
                      {device === 'hackphone' ? 'HackPhone' : 'HackDroid'}
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs text-neutral-300 font-medium">Desktop Devices:</label>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {['hackbook-w95'].map(device => (
                    <label key={device} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={formData.requiredDevices.desktop.includes(device)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData({
                            ...formData,
                            requiredDevices: {
                              ...formData.requiredDevices,
                              desktop: checked
                                ? [...formData.requiredDevices.desktop, device]
                                : formData.requiredDevices.desktop.filter(d => d !== device)
                            }
                          });
                        }}
                      />
                      'HackBook W95'
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-neutral-400">Min Team Members:</label>
              <input
                type="number"
                min="1"
                value={formData.minTeamMembers}
                onChange={(e) => setFormData({ ...formData, minTeamMembers: parseInt(e.target.value) || 1 })}
                className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400">Max Team Members:</label>
              <input
                type="number"
                min="1"
                value={formData.maxTeamMembers}
                onChange={(e) => setFormData({ ...formData, maxTeamMembers: parseInt(e.target.value) || 4 })}
                className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-neutral-400">Normal Pricing (₹):</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.pricingNormal}
                onChange={(e) => setFormData({ ...formData, pricingNormal: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400">Extended Pricing (₹) - Optional:</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.pricingExtended || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ 
                    ...formData, 
                    pricingExtended: value === "" ? undefined : parseFloat(value) || undefined 
                  });
                }}
                placeholder="Leave empty if not applicable"
                className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1 bg-neutral-600 rounded text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {editingEvent && (
        <div className="p-3 bg-neutral-800 rounded space-y-3">
          <h3 className="text-sm font-semibold">Edit Event</h3>
          <input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Event title"
            className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
          />
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description"
            rows={3}
            className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="px-2 py-1 bg-neutral-700 rounded text-xs"
            />
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="px-2 py-1 bg-neutral-700 rounded text-xs"
            />
          </div>
          <input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Location"
            className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
          >
            <option value="">Select category</option>
            {eventCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <div className="space-y-2">
            <label className="text-xs text-neutral-400">Required Device Types:</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={formData.requiredDeviceTypes.mobile}
                  onChange={(e) => setFormData({
                    ...formData,
                    requiredDeviceTypes: { ...formData.requiredDeviceTypes, mobile: e.target.checked }
                  })}
                />
                Mobile
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={formData.requiredDeviceTypes.desktop}
                  onChange={(e) => setFormData({
                    ...formData,
                    requiredDeviceTypes: { ...formData.requiredDeviceTypes, desktop: e.target.checked }
                  })}
                />
                Desktop
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-neutral-400">Required Devices in Playspace:</label>
            
            <div className="space-y-2">
              <div>
                <label className="text-xs text-neutral-300 font-medium">Mobile Devices:</label>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {['hackphone', 'hackdroid'].map(device => (
                    <label key={device} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={formData.requiredDevices.mobile.includes(device)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData({
                            ...formData,
                            requiredDevices: {
                              ...formData.requiredDevices,
                              mobile: checked
                                ? [...formData.requiredDevices.mobile, device]
                                : formData.requiredDevices.mobile.filter(d => d !== device)
                            }
                          });
                        }}
                      />
                      {device === 'hackphone' ? 'HackPhone' : 'HackDroid'}
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs text-neutral-300 font-medium">Desktop Devices:</label>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {['hackbook-w95'].map(device => (
                    <label key={device} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={formData.requiredDevices.desktop.includes(device)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData({
                            ...formData,
                            requiredDevices: {
                              ...formData.requiredDevices,
                              desktop: checked
                                ? [...formData.requiredDevices.desktop, device]
                                : formData.requiredDevices.desktop.filter(d => d !== device)
                            }
                          });
                        }}
                      />
                      'HackBook W95'
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-neutral-400">Min Team Members:</label>
              <input
                type="number"
                min="1"
                value={formData.minTeamMembers}
                onChange={(e) => setFormData({ ...formData, minTeamMembers: parseInt(e.target.value) || 1 })}
                className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400">Max Team Members:</label>
              <input
                type="number"
                min="1"
                value={formData.maxTeamMembers}
                onChange={(e) => setFormData({ ...formData, maxTeamMembers: parseInt(e.target.value) || 4 })}
                className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-neutral-400">Normal Pricing (₹):</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.pricingNormal}
                onChange={(e) => setFormData({ ...formData, pricingNormal: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400">Extended Pricing (₹) - Optional:</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.pricingExtended || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ 
                    ...formData, 
                    pricingExtended: value === "" ? undefined : parseFloat(value) || undefined 
                  });
                }}
                placeholder="Leave empty if not applicable"
                className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
              />
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, capacity: value === '' ? '' : parseInt(value) || 0 });
              }}
              placeholder="Capacity (optional)"
              min="0"
              className="flex-1 px-2 py-1 bg-neutral-700 rounded text-xs"
            />
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              />
              Public
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="px-3 py-1 bg-green-600 text-white rounded text-xs"
            >
              Update
            </button>
            <button
              onClick={cancelEdit}
              className="px-3 py-1 bg-neutral-600 rounded text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <table className="w-full text-xs">
        <thead className="bg-neutral-800">
          <tr>
            <th className="p-2 text-left">Title</th>
            <th className="p-2 text-left">Category</th>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Location</th>
            <th className="p-2 text-left">Capacity</th>
            <th className="p-2 text-left">Registration</th>
            {(onUpdateEvent || onDeleteEvent || onToggleRegistration) && <th className="p-2 text-left">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filtered.map((event) => (
            <tr key={event._id} className="border-b border-neutral-700">
              <td className="p-2 font-semibold">{event.title}</td>
              <td className="p-2">{event.category || "Event"}</td>
              <td className="p-2">{event.startDate ? new Date(event.startDate).toLocaleString() : "TBD"}</td>
              <td className="p-2">{event.location || "TBD"}</td>
              <td className="p-2">{event.capacity || "Unlimited"}</td>
              <td className="p-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  event.registrationEnabled !== false 
                    ? 'bg-green-600 text-white' 
                    : 'bg-red-600 text-white'
                }`}>
                  {event.registrationEnabled !== false ? 'Enabled' : 'Disabled'}
                </span>
              </td>
              {(onUpdateEvent || onDeleteEvent || onToggleRegistration) && (
                <td className="p-2">
                  <div className="flex gap-1">
                    {onToggleRegistration && (
                      <button
                        onClick={() => onToggleRegistration(event._id)}
                        className={`px-2 py-1 rounded text-xs ${
                          event.registrationEnabled !== false 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                        title={event.registrationEnabled !== false ? 'Disable Registration' : 'Enable Registration'}
                      >
                        {event.registrationEnabled !== false ? 'Disable' : 'Enable'}
                      </button>
                    )}
                    {onUpdateEvent && (
                      <button
                        onClick={() => startEdit(event)}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                      >
                        Edit
                      </button>
                    )}
                    {onDeleteEvent && (
                      <button
                        onClick={() => onDeleteEvent(event._id)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
