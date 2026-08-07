import React, { useState, useMemo } from 'react';
import {
  Member,
  SyllabusRequirement,
  MemberRequirementProgress,
  CrewEvent,
  AttendanceRecord,
  DisciplinaryIncident,
  JournalEntry,
  PortalSettings,
} from '../types';
import {
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Award,
  BookOpen,
  ShieldAlert,
  CheckSquare,
  ArrowRight,
  Filter,
  Sparkles,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

export interface DueReminderItem {
  id: string;
  category: 'Syllabus' | 'Event' | 'Attendance' | 'Disciplinary' | 'Journal' | 'Administrative';
  title: string;
  description: string;
  dueDateLabel: string;
  priority: 'High' | 'Medium' | 'Normal';
  isOverdue?: boolean;
  targetTab: 'syllabus' | 'events' | 'attendance' | 'disciplinary' | 'journals' | 'settings';
  targetMemberName?: string;
  actionText: string;
}

interface DueRemindersWidgetProps {
  currentMember: Member;
  members: Member[];
  syllabus: SyllabusRequirement[];
  progressList: MemberRequirementProgress[];
  events: CrewEvent[];
  attendance: AttendanceRecord[];
  incidents: DisciplinaryIncident[];
  journals: JournalEntry[];
  settings?: PortalSettings;
  onNavigateTab: (tab: any) => void;
  compact?: boolean;
}

export const DueRemindersWidget: React.FC<DueRemindersWidgetProps> = ({
  currentMember,
  members,
  syllabus,
  progressList,
  events,
  attendance,
  incidents,
  journals,
  settings,
  onNavigateTab,
  compact = false,
}) => {
  const [filterCategory, setFilterCategory] = useState<'All' | 'My Items' | 'Council Review' | 'High Priority'>('All');
  const isCouncil = currentMember.councilRole !== 'Member';

  // Compute active due reminders for current user and council scope
  const reminders = useMemo(() => {
    const list: DueReminderItem[] = [];

    // 1. Syllabus Submissions Pending Review (Council Action)
    if (isCouncil) {
      const pendingSubmissions = progressList.filter((p) => p.status === 'Submitted');
      pendingSubmissions.forEach((p) => {
        const req = syllabus.find((s) => s.id === p.requirementId);
        const m = members.find((mem) => mem.id === p.memberId);
        if (req && m) {
          list.push({
            id: `syl-review-${p.id}`,
            category: 'Syllabus',
            title: `Verify Award: ${req.title}`,
            description: `${m.name} (${m.crewName}) submitted requirement for council verification.`,
            dueDateLabel: 'Awaiting Verification',
            priority: 'High',
            targetTab: 'syllabus',
            targetMemberName: m.name,
            actionText: 'Review Submission',
          });
        }
      });
    }

    // 2. Personal In-Progress Syllabus Requirements (For Current Member)
    const myProgress = progressList.filter(
      (p) => p.memberId === currentMember.id && p.status === 'In Progress'
    );
    myProgress.forEach((p) => {
      const req = syllabus.find((s) => s.id === p.requirementId);
      if (req) {
        const completedTasks = p.completedTasks.length;
        const totalTasks = req.tasks.length || 1;
        list.push({
          id: `my-syl-${p.id}`,
          category: 'Syllabus',
          title: `In Progress: ${req.title}`,
          description: `You have completed ${completedTasks}/${totalTasks} tasks. Complete remaining tasks to submit.`,
          dueDateLabel: `${Math.round((completedTasks / totalTasks) * 100)}% Completed`,
          priority: 'Medium',
          targetTab: 'syllabus',
          actionText: 'Continue Requirement',
        });
      }
    });

    // 3. Upcoming Events in Next 14 Days Requiring RSVP / Attendance
    const now = new Date();
    const fourteenDaysAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    events.forEach((evt) => {
      const evtDate = new Date(evt.date);
      if (evtDate >= now && evtDate <= fourteenDaysAhead) {
        const daysRemaining = Math.ceil((evtDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        const hasAttended = evt.attendeeIds?.includes(currentMember.id);

        list.push({
          id: `evt-due-${evt.id}`,
          category: 'Event',
          title: `Upcoming: ${evt.title}`,
          description: `Scheduled at ${evt.location} on ${evt.date}. ${evt.requiredSection} section mandatory.`,
          dueDateLabel: daysRemaining === 0 ? 'Due Today' : `In ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`,
          priority: daysRemaining <= 3 ? 'High' : 'Medium',
          targetTab: 'events',
          actionText: 'View Event & RSVP',
        });
      }

      // Past Events without logged attendance (For Council/Leaders)
      if (isCouncil && evtDate < now) {
        const hasLog = attendance.some((a) => a.eventId === evt.id);
        if (!hasLog) {
          list.push({
            id: `att-missing-${evt.id}`,
            category: 'Attendance',
            title: `Missing Attendance: ${evt.title}`,
            description: `Event took place on ${evt.date}. Attendance roster has not been finalized.`,
            dueDateLabel: 'Past Event - Unlogged',
            priority: 'High',
            isOverdue: true,
            targetTab: 'attendance',
            actionText: 'Log Attendance Roster',
          });
        }
      }
    });

    // 4. Open Disciplinary Incidents (For Council)
    if (isCouncil) {
      const openIncidents = incidents.filter((i) => i.status !== 'Resolved');
      openIncidents.forEach((inc) => {
        const m = members.find((mem) => mem.id === inc.memberId);
        list.push({
          id: `disc-${inc.id}`,
          category: 'Disciplinary',
          title: `Disciplinary Action: ${inc.title}`,
          description: `Incident involving ${m ? m.name : 'Member'} currently marked as ${inc.status}.`,
          dueDateLabel: `${inc.severity} Severity`,
          priority: inc.severity === 'Critical' || inc.severity === 'High' ? 'High' : 'Medium',
          isOverdue: inc.status === 'Open',
          targetTab: 'disciplinary',
          actionText: 'Review Incident',
        });
      });
    }

    // 5. Portfolio Journals Draft / Review
    const myDrafts = journals.filter((j) => j.authorId === currentMember.id && j.status === 'Draft');
    myDrafts.forEach((j) => {
      list.push({
        id: `journal-draft-${j.id}`,
        category: 'Journal',
        title: `Draft Entry: ${j.title}`,
        description: `Your portfolio notebook entry from ${j.date} is saved as draft.`,
        dueDateLabel: 'Draft Pending Publish',
        priority: 'Normal',
        targetTab: 'journals',
        actionText: 'Edit Journal',
      });
    });

    // 6. Annual Term Membership Reminder
    list.push({
      id: 'term-reminder',
      category: 'Administrative',
      title: `Rover Policy Compliance (${settings?.activeTerm || '2025-2026'})`,
      description: 'Ensure your sub-crew roster credentials and active term registrations are up to date.',
      dueDateLabel: 'Term Policy Active',
      priority: 'Normal',
      targetTab: 'settings',
      actionText: 'Verify Settings',
    });

    return list;
  }, [currentMember, isCouncil, members, syllabus, progressList, events, attendance, incidents, journals, settings]);

  // Filtered reminders based on tab toggle
  const filteredReminders = useMemo(() => {
    if (filterCategory === 'My Items') {
      return reminders.filter((r) => !r.targetMemberName || r.category === 'Journal' || r.id.startsWith('my-'));
    }
    if (filterCategory === 'Council Review') {
      return reminders.filter((r) => r.category === 'Syllabus' || r.category === 'Attendance' || r.category === 'Disciplinary');
    }
    if (filterCategory === 'High Priority') {
      return reminders.filter((r) => r.priority === 'High' || r.isOverdue);
    }
    return reminders;
  }, [reminders, filterCategory]);

  const highPriorityCount = reminders.filter((r) => r.priority === 'High' || r.isOverdue).length;

  return (
    <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 transition-all">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 relative">
            <Bell className="w-5 h-5" />
            {highPriorityCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {highPriorityCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Due Reminders & Action Center</span>
              <span className="text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {reminders.length} Active Reminders
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Action items, award verifications, upcoming event RSVPs, and council notices.
            </p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          {(['All', 'My Items', 'Council Review', 'High Priority'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                filterCategory === cat
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Reminder List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
        {filteredReminders.length === 0 ? (
          <div className="col-span-full py-8 text-center bg-slate-900/50 border border-slate-800 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-300">All Reminders Cleared</p>
            <p className="text-xs text-slate-500 mt-1">No pending action items found for this filter.</p>
          </div>
        ) : (
          filteredReminders.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition flex flex-col justify-between space-y-2 group ${
                item.isOverdue || item.priority === 'High'
                  ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold">
                    {item.category === 'Syllabus' && (
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                        <Award className="w-3 h-3" /> Syllabus
                      </span>
                    )}
                    {item.category === 'Event' && (
                      <span className="text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Event
                      </span>
                    )}
                    {item.category === 'Attendance' && (
                      <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" /> Attendance
                      </span>
                    )}
                    {item.category === 'Disciplinary' && (
                      <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Disciplinary
                      </span>
                    )}
                    {item.category === 'Journal' && (
                      <span className="text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Notebook
                      </span>
                    )}
                    {item.category === 'Administrative' && (
                      <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Policy
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      item.isOverdue
                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                        : item.priority === 'High'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {item.dueDateLabel}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition leading-snug">
                  {item.title}
                </h4>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                {item.targetMemberName ? (
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-slate-400" /> {item.targetMemberName}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Rover Policy Task
                  </span>
                )}

                <button
                  onClick={() => onNavigateTab(item.targetTab)}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition"
                >
                  <span>{item.actionText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
