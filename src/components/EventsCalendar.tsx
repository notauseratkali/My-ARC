import React, { useState } from 'react';
import {
  CrewEvent,
  EventType,
  Member,
  SubCrew,
  Section,
  Gender,
  PortalSettings,
} from '../types';
import {
  Calendar as CalendarIcon,
  Plus,
  MapPin,
  Clock,
  Send,
  Mail,
  MessageSquare,
  Users,
  Filter,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Bell,
  Check,
} from 'lucide-react';

interface EventsCalendarProps {
  events: CrewEvent[];
  crews: SubCrew[];
  members: Member[];
  currentMember: Member;
  settings?: PortalSettings;
  onAddEvent: (event: Omit<CrewEvent, 'id' | 'notificationSent' | 'notificationLogs'>) => void;
  onUpdateEvent: (event: CrewEvent) => void;
  onDeleteEvent: (id: string) => void;
  onSendNotifications: (eventId: string) => void;
}

export const EventsCalendar: React.FC<EventsCalendarProps> = ({
  events = [],
  crews = [],
  members = [],
  currentMember,
  settings = { aiEnabled: true, smsNotificationsEnabled: true, emailNotificationsEnabled: true, activeTerm: '1' },
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onSendNotifications,
}) => {
  const [typeFilter, setTypeFilter] = useState<EventType | 'All'>('All');
  const [crewFilter, setCrewFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Modal State for New / Edit Event
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CrewEvent | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    type: EventType;
    crewId: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
    targetAudience: string;
    isCompulsory: boolean;
    genderFilter: Gender | 'All';
    sectionFilter: Section | 'All';
  }>({
    title: '',
    type: 'Camp',
    crewId: 'all',
    location: '',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    description: '',
    targetAudience: 'All Crew Members',
    isCompulsory: true,
    genderFilter: 'All',
    sectionFilter: 'All',
  });

  const isCouncil = currentMember.councilRole !== 'Member';

  const eventTypes: EventType[] = [
    'Camp',
    'Community Service',
    'Meeting',
    'Course',
    'Special Activity',
    'Holiday/Deadline',
  ];

  const filteredEvents = events.filter((e) => {
    if (typeFilter !== 'All' && e.type !== typeFilter) return false;
    if (crewFilter !== 'All' && e.crewId !== 'all' && e.crewId !== crewFilter) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      type: 'Camp',
      crewId: 'all',
      location: '',
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      description: '',
      targetAudience: 'All Crew Members',
      isCompulsory: true,
      genderFilter: 'All',
      sectionFilter: 'All',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ev: CrewEvent) => {
    setEditingEvent(ev);
    setFormData({
      title: ev.title,
      type: ev.type,
      crewId: ev.crewId,
      location: ev.location,
      startDate: ev.startDate,
      endDate: ev.endDate,
      description: ev.description,
      targetAudience: ev.targetAudience,
      isCompulsory: ev.isCompulsory,
      genderFilter: ev.scopeFilters?.gender || 'All',
      sectionFilter: ev.scopeFilters?.section || 'All',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.location.trim()) {
      alert('Event title and location are required.');
      return;
    }

    const crewObj = crews.find((c) => c.id === formData.crewId);
    const crewName = formData.crewId === 'all' ? 'All Crews' : crewObj ? crewObj.name : 'Sub-Crew';

    if (editingEvent) {
      onUpdateEvent({
        ...editingEvent,
        title: formData.title,
        type: formData.type,
        crewId: formData.crewId,
        crewName,
        location: formData.location,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
        targetAudience: formData.targetAudience,
        isCompulsory: formData.isCompulsory,
        scopeFilters: {
          gender: formData.genderFilter,
          section: formData.sectionFilter,
          crewId: formData.crewId,
        },
      });
      alert('Event updated successfully!');
    } else {
      onAddEvent({
        title: formData.title,
        type: formData.type,
        crewId: formData.crewId,
        crewName,
        location: formData.location,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
        targetAudience: formData.targetAudience,
        isCompulsory: formData.isCompulsory,
        scopeFilters: {
          gender: formData.genderFilter,
          section: formData.sectionFilter,
          crewId: formData.crewId,
        },
        createdBy: currentMember.name,
      });
      alert(`Event "${formData.title}" scheduled! Automated SMS/Email notifications ready to trigger.`);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1A1E26] border border-slate-800 p-5 rounded-2xl shadow-md">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-emerald-400" />
            Unified Master Calendar & Event Command
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Schedule camps, community projects, courses, and assemblies with automated SMS & Email notification logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="calendar-add-event-btn"
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Activity</span>
          </button>
        </div>
      </div>

      {/* Filter & View Switcher */}
      <div className="bg-[#1A1E26] border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>Event Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-[#161920] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Event Categories</option>
              {eventTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Crew Scope:</span>
            <select
              value={crewFilter}
              onChange={(e) => setCrewFilter(e.target.value)}
              className="bg-[#161920] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Crews</option>
              {crews.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-[11px] font-mono text-emerald-400 font-semibold">
          Showing {filteredEvents.length} Scheduled Events
        </span>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-[#1A1E26] border border-slate-800 rounded-2xl">
            No crew events match the selected category filters.
          </div>
        ) : (
          filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="bg-[#1A1E26] border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 shadow-lg space-y-4 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono ${
                        ev.type === 'Camp'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : ev.type === 'Meeting'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {ev.type}
                    </span>

                    {ev.isCompulsory ? (
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded font-mono">
                        Compulsory Attendance
                      </span>
                    ) : (
                      <span className="bg-[#161920] text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-800">
                        Optional
                      </span>
                    )}

                    <span className="text-xs text-emerald-400 font-semibold">{ev.crewName}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100">{ev.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{ev.description}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleOpenEdit(ev)}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 transition rounded-lg hover:bg-slate-800 text-xs flex items-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Cancel event "${ev.title}"?`)) {
                        onDeleteEvent(ev.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-slate-800 text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* Event Metadata Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="text-slate-500 text-[10px] block">Schedule</span>
                    <span className="font-medium text-slate-200">
                      {new Date(ev.startDate).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="text-slate-500 text-[10px] block">Location</span>
                    <span className="font-medium text-slate-200 truncate">{ev.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="text-slate-500 text-[10px] block">Target Audience Scope</span>
                    <span className="font-medium text-slate-200">{ev.targetAudience}</span>
                  </div>
                </div>
              </div>

              {/* Automated SMS & Email Notification Triggering Panel */}
              <div className="border-t border-slate-800/80 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-400">Notifications Status:</span>
                  {ev.notificationSent ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> SMS & Email Dispatched
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold">Pending Notification Dispatch</span>
                  )}
                </div>

                {isCouncil && (
                  <button
                    onClick={() => onSendNotifications(ev.id)}
                    className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Trigger SMS & Email Alert</span>
                  </button>
                )}
              </div>

              {/* Notification Logs */}
              {ev.notificationLogs && ev.notificationLogs.length > 0 && (
                <div className="bg-slate-950/90 border border-slate-800/60 p-2.5 rounded-lg text-[11px] text-slate-400 space-y-1">
                  <span className="font-mono text-emerald-400 font-bold block">Dispatch Logs:</span>
                  {ev.notificationLogs.map((log, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span>
                        Channel: <strong>{log.channel}</strong> via Google Integration
                      </span>
                      <span>
                        Sent to {log.recipientCount} Members at {log.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New / Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-100 space-y-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold font-serif text-slate-100">
                {editingEvent ? 'Edit Activity Schedule' : 'Schedule New Crew Activity'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="col-span-full">
                <label className="block text-slate-300 font-medium mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baa Atoll Survival Expedition"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Event Category</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                >
                  {eventTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Sub-Crew Scope</label>
                <select
                  value={formData.crewId}
                  onChange={(e) => setFormData({ ...formData, crewId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                >
                  <option value="all">All Crews (Global Event)</option>
                  {crews.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="col-span-full">
                <label className="block text-slate-300 font-medium mb-1">Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scout HQ / Uninhabited Island"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="col-span-full">
                <label className="block text-slate-300 font-medium mb-1">Target Audience Summary</label>
                <input
                  type="text"
                  placeholder="e.g. Male City Rovers, Female Explorers"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="col-span-full">
                <label className="block text-slate-300 font-medium mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  placeholder="Activity goals, gear requirements, syllabus milestones..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="col-span-full flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isCompulsory"
                  checked={formData.isCompulsory}
                  onChange={(e) => setFormData({ ...formData, isCompulsory: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-800 focus:ring-emerald-500"
                />
                <label htmlFor="isCompulsory" className="text-slate-200 font-medium text-xs">
                  Mark as Compulsory Assembly (Triggers absence tracking for unexcused members)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2 rounded-xl transition shadow-md"
              >
                Schedule & Dispatch Notice
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
