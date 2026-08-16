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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-2 border-[#FF9999] p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#800000] flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[#800000]" />
            Unified Master Calendar & Event Command
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Schedule camps, community projects, courses, and assemblies with automated SMS & Email notification logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="calendar-add-event-btn"
            onClick={handleOpenAdd}
            className="bg-[#800000] hover:bg-[#6b0000] text-white !text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Schedule Activity</span>
          </button>
        </div>
      </div>

      {/* Filter & View Switcher */}
      <div className="bg-[#FFF0F0] border border-[#FF9999] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <Filter className="w-3.5 h-3.5 text-[#800000]" />
            <span className="text-slate-800 font-semibold">Event Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-white border border-[#FF9999] rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-[#800000] cursor-pointer"
            >
              <option value="All">All Event Categories</option>
              {eventTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-slate-800 font-semibold">Crew Scope:</span>
            <select
              value={crewFilter}
              onChange={(e) => setCrewFilter(e.target.value)}
              className="bg-white border border-[#FF9999] rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-[#800000] cursor-pointer"
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

        <span className="text-[11px] font-mono text-[#800000] font-bold bg-white px-2.5 py-1 rounded-lg border border-[#FF9999]">
          Showing {filteredEvents.length} Scheduled Events
        </span>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-600 text-xs bg-white border border-[#FF9999] rounded-2xl">
            No crew events match the selected category filters.
          </div>
        ) : (
          filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="bg-white border border-[#FF9999] hover:border-[#800000] rounded-2xl p-5 shadow-sm space-y-4 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono bg-[#FFF0F0] text-[#800000] border border-[#FF9999]"
                    >
                      {ev.type}
                    </span>

                    {ev.isCompulsory ? (
                      <span className="bg-[#FFF0F0] text-[#FF3333] border border-[#FF9999] text-[10px] font-bold px-2.5 py-0.5 rounded font-mono">
                        Compulsory Attendance
                      </span>
                    ) : (
                      <span className="bg-[#FFF0F0] text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-[#FF9999]">
                        Optional
                      </span>
                    )}

                    <span className="text-xs text-[#800000] font-bold">{ev.crewName}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{ev.title}</h3>
                  <p className="text-xs text-slate-700 leading-relaxed">{ev.description}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleOpenEdit(ev)}
                    className="p-1.5 text-[#800000] hover:bg-[#FFF0F0] transition rounded-lg text-xs font-semibold flex items-center gap-1 border border-[#FF9999] cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4 text-[#800000]" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Cancel event "${ev.title}"?`)) {
                        onDeleteEvent(ev.id);
                      }
                    }}
                    className="p-1.5 text-[#FF3333] hover:bg-[#FFF0F0] transition rounded-lg text-xs font-semibold flex items-center gap-1 border border-[#FF9999] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-[#FF3333]" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* Event Metadata Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#FFF0F0] p-3 rounded-xl border border-[#FF9999]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#800000] flex-shrink-0" />
                  <div>
                    <span className="text-slate-600 text-[10px] block font-medium">Schedule</span>
                    <span className="font-bold text-slate-900">
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
                  <MapPin className="w-4 h-4 text-[#800000] flex-shrink-0" />
                  <div>
                    <span className="text-slate-600 text-[10px] block font-medium">Location</span>
                    <span className="font-bold text-slate-900 truncate">{ev.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#800000] flex-shrink-0" />
                  <div>
                    <span className="text-slate-600 text-[10px] block font-medium">Target Audience Scope</span>
                    <span className="font-bold text-slate-900">{ev.targetAudience}</span>
                  </div>
                </div>
              </div>

              {/* Automated SMS & Email Notification Triggering Panel */}
              <div className="border-t border-[#FF9999]/40 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#800000]" />
                  <span className="text-slate-700 font-medium">Notifications Status:</span>
                  {ev.notificationSent ? (
                    <span className="text-[#800000] font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-[#800000]" /> SMS & Email Dispatched
                    </span>
                  ) : (
                    <span className="text-[#FF3333] font-bold">Pending Notification Dispatch</span>
                  )}
                </div>

                {isCouncil && (
                  <button
                    onClick={() => onSendNotifications(ev.id)}
                    className="bg-[#800000] hover:bg-[#6b0000] text-white !text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                    <span>Trigger SMS & Email Alert</span>
                  </button>
                )}
              </div>

              {/* Notification Logs */}
              {ev.notificationLogs && ev.notificationLogs.length > 0 && (
                <div className="bg-[#FFF0F0] border border-[#FF9999] p-2.5 rounded-lg text-[11px] text-slate-700 space-y-1">
                  <span className="font-mono text-[#800000] font-bold block">Dispatch Logs:</span>
                  {ev.notificationLogs.map((log, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span>
                        Channel: <strong>{log.channel}</strong> via Google Integration
                      </span>
                      <span className="font-mono text-slate-600">
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white border-2 border-[#FF9999] rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-900 space-y-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-[#FF9999]/40 pb-3">
              <h3 className="text-lg font-bold font-serif text-[#800000]">
                {editingEvent ? 'Edit Activity Schedule' : 'Schedule New Crew Activity'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-[#FFF0F0] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="col-span-full">
                <label className="block text-slate-800 font-bold mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baa Atoll Survival Expedition"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white border border-[#FF9999] rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#800000]"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Event Category</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
                  className="w-full bg-white border border-[#FF9999] rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#800000] cursor-pointer"
                >
                  {eventTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">{crews.length > 1 ? 'Network Scope' : 'Crew Scope'}</label>
                <select
                  value={formData.crewId}
                  onChange={(e) => setFormData({ ...formData, crewId: e.target.value })}
                  className="w-full bg-white border border-[#FF9999] rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#800000] cursor-pointer"
                >
                  <option value="all">{crews.length > 1 ? 'All Network Crews (Global Event)' : 'All Crews (Global Event)'}</option>
                  {crews.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-white border border-[#FF9999] rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#800000]"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full bg-white border border-[#FF9999] rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#800000]"
                />
              </div>

              <div className="col-span-full">
                <label className="block text-slate-800 font-bold mb-1">Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scout HQ / Uninhabited Island"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-white border border-[#FF9999] rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#800000]"
                />
              </div>

              <div className="col-span-full">
                <label className="block text-slate-800 font-bold mb-1">Target Audience Summary</label>
                <input
                  type="text"
                  placeholder="e.g. Male City Rovers, Female Explorers"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="w-full bg-white border border-[#FF9999] rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#800000]"
                />
              </div>

              <div className="col-span-full">
                <label className="block text-slate-800 font-bold mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  placeholder="Activity goals, gear requirements, syllabus milestones..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border border-[#FF9999] rounded-lg p-3 text-slate-900 focus:outline-none focus:border-[#800000]"
                />
              </div>

              <div className="col-span-full flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isCompulsory"
                  checked={formData.isCompulsory}
                  onChange={(e) => setFormData({ ...formData, isCompulsory: e.target.checked })}
                  className="w-4 h-4 rounded text-[#800000] bg-white border-[#FF9999] focus:ring-[#800000] cursor-pointer"
                />
                <label htmlFor="isCompulsory" className="text-slate-800 font-bold text-xs cursor-pointer">
                  Mark as Compulsory Assembly (Triggers absence tracking for unexcused members)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#FF9999]/40">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-[#FFF0F0] hover:bg-[#FF9999]/30 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#800000] hover:bg-[#6b0000] text-white !text-white text-xs font-bold px-5 py-2 rounded-xl transition shadow-sm cursor-pointer"
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
