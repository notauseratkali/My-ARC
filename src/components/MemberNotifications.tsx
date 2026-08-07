import React, { useState } from 'react';
import { Member, CalendarEvent, PolicyAmendmentPoll, DisciplinaryIncident } from '../types';
import {
  Bell,
  Calendar,
  Vote,
  ShieldAlert,
  CheckCircle2,
  Clock,
  X,
  ChevronRight,
  AlertCircle,
  FileText,
  Sparkles,
  Info,
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  type: 'event' | 'policy' | 'disciplinary';
  title: string;
  description: string;
  date: string;
  urgent?: boolean;
  read?: boolean;
  actionTab?: string;
}

interface MemberNotificationsProps {
  currentMember: Member;
  events: CalendarEvent[];
  polls: PolicyAmendmentPoll[];
  incidents: DisciplinaryIncident[];
  onNavigateTab?: (tab: string) => void;
  onClose?: () => void;
}

export const MemberNotifications: React.FC<MemberNotificationsProps> = ({
  currentMember,
  events = [],
  polls = [],
  incidents = [],
  onNavigateTab,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'events' | 'policy' | 'disciplinary'>('all');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Build tailored notification list
  const notifications: NotificationItem[] = [];

  // 1. Upcoming Events (for member's crew or crew='all')
  const upcomingEvents = events.filter((e) => {
    if (e.crewId !== 'all' && e.crewId !== currentMember?.crewId) return false;
    const evtDate = new Date(e.date);
    const now = new Date();
    // events in next 14 days or recent
    return true;
  });

  upcomingEvents.forEach((evt) => {
    notifications.push({
      id: `notif-evt-${evt.id}`,
      type: 'event',
      title: `Upcoming Event: ${evt.title}`,
      description: `Scheduled for ${evt.date} at ${evt.time || 'TBA'} (${evt.location}). Type: ${evt.type}`,
      date: evt.date,
      urgent: evt.type === 'Compulsory Drill' || evt.type === 'Camp',
      actionTab: 'events',
    });
  });

  // 2. Policy Amendment Polls (active voting)
  const activePolls = polls.filter((p) => p.status === 'Active Voting');
  activePolls.forEach((poll) => {
    const userVote = poll.votes.find((v) => v.memberId === currentMember?.id);
    notifications.push({
      id: `notif-poll-${poll.id}`,
      type: 'policy',
      title: `Referendum Vote: ${poll.title}`,
      description: userVote
        ? `You voted '${userVote.choice}'. Voting open until ${poll.votingDeadline}.`
        : `Action Required: Cast your vote before ${poll.votingDeadline}! Minimum 1-week voting period.`,
      date: poll.startDate,
      urgent: !userVote,
      actionTab: 'policy',
    });
  });

  // 3. Disciplinary status updates (for member or general council warning)
  const memberIncidents = incidents.filter(
    (inc) => inc.memberId === currentMember?.id || (currentMember?.councilRole !== 'Member' && inc.status === 'Under Investigation')
  );
  memberIncidents.forEach((inc) => {
    notifications.push({
      id: `notif-inc-${inc.id}`,
      type: 'disciplinary',
      title: `Disciplinary Log: ${inc.title}`,
      description: `Category: ${inc.category} • Severity: ${inc.severity} • Status: ${inc.status}. ${inc.actionTaken ? `Action: ${inc.actionTaken}` : ''}`,
      date: inc.date,
      urgent: inc.severity === 'Major' || inc.severity === 'Critical' || inc.status === 'Under Investigation',
      actionTab: 'disciplinary',
    });
  });

  // Sort by date descending
  notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const visibleNotifications = notifications.filter((n) => {
    if (dismissedIds.includes(n.id)) return false;
    if (filter === 'events') return n.type === 'event';
    if (filter === 'policy') return n.type === 'policy';
    if (filter === 'disciplinary') return n.type === 'disciplinary';
    if (filter === 'unread') return n.urgent;
    return true;
  });

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  return (
    <div className="bg-[#161920] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-w-xl w-full relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <span>Member Notification Feed</span>
              {notifications.filter((n) => n.urgent && !dismissedIds.includes(n.id)).length > 0 && (
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                  {notifications.filter((n) => n.urgent && !dismissedIds.includes(n.id)).length} Urgent
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Tailored alerts for {currentMember?.name || 'Scout'} ({currentMember?.crewName})
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            filter === 'all'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-[#12151B] text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          All ({notifications.length - dismissedIds.length})
        </button>

        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            filter === 'unread'
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-[#12151B] text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Urgent Action
        </button>

        <button
          onClick={() => setFilter('events')}
          className={`px-3 py-1 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            filter === 'events'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-[#12151B] text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Events
        </button>

        <button
          onClick={() => setFilter('policy')}
          className={`px-3 py-1 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            filter === 'policy'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-[#12151B] text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Policy Polls
        </button>

        <button
          onClick={() => setFilter('disciplinary')}
          className={`px-3 py-1 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            filter === 'disciplinary'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-[#12151B] text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Disciplinary
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {visibleNotifications.length === 0 ? (
          <div className="text-center py-8 space-y-2 bg-[#12151B] rounded-2xl border border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">No active notifications in this category!</p>
            <p className="text-[10px] text-slate-500">You are all caught up with your crew updates.</p>
          </div>
        ) : (
          visibleNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (notif.actionTab && onNavigateTab) {
                  onNavigateTab(notif.actionTab);
                  if (onClose) onClose();
                }
              }}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 relative group ${
                notif.urgent
                  ? 'bg-gradient-to-r from-amber-950/30 to-[#1A1E26] border-amber-500/40 hover:border-amber-400'
                  : 'bg-[#12151B] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                  notif.type === 'event'
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                    : notif.type === 'policy'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {notif.type === 'event' && <Calendar className="w-4 h-4" />}
                {notif.type === 'policy' && <Vote className="w-4 h-4" />}
                {notif.type === 'disciplinary' && <ShieldAlert className="w-4 h-4" />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                    <span>{notif.title}</span>
                    {notif.urgent && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                    )}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">{notif.date}</span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">{notif.description}</p>

                {notif.actionTab && (
                  <div className="text-[10px] text-purple-400 font-semibold group-hover:underline flex items-center gap-0.5 pt-0.5">
                    <span>Open in {notif.actionTab} module</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => handleDismiss(notif.id, e)}
                className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition rounded"
                title="Dismiss Notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
