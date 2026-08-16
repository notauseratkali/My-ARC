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
      description: 'Ensure your crew roster credentials and active term registrations are up to date.',
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
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 transition-all">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FFF0F0] border border-[#FF9999] flex items-center justify-center text-[#800000] relative">
            <Bell className="w-5 h-5 text-[#800000]" />
            {highPriorityCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#800000] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {highPriorityCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Due Reminders & Action Center</span>
              <span className="text-xs font-mono font-semibold bg-[#FFF0F0] text-[#800000] border border-[#FF9999] px-2 py-0.5 rounded-full">
                {reminders.length} Active Reminders
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Action items, award verifications, upcoming event RSVPs, and council notices.
            </p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-[#FFF0F0] border border-[#FF9999] p-1 rounded-xl text-xs">
          {(['All', 'My Items', 'Council Review', 'High Priority'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                filterCategory === cat
                  ? 'bg-[#800000] text-white font-semibold shadow-xs !text-white'
                  : 'text-[#800000] hover:bg-[#FFE5E5]'
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
          <div className="col-span-full py-8 text-center bg-[#FFF0F0] border border-[#FF9999] rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-[#800000] mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-800">All Reminders Cleared</p>
            <p className="text-xs text-slate-500 mt-1">No pending action items found for this filter.</p>
          </div>
        ) : (
          filteredReminders.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition flex flex-col justify-between space-y-2 group ${
                item.isOverdue || item.priority === 'High'
                  ? 'bg-[#FFF0F0]/70 border-[#FF9999] hover:border-[#800000]'
                  : 'bg-white border-[#FFD0D0] hover:border-[#FF9999]'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold">
                    {item.category === 'Syllabus' && (
                      <span className="text-[#800000] bg-[#FFF0F0] px-2 py-0.5 rounded border border-[#FF9999] flex items-center gap-1">
                        <Award className="w-3 h-3 text-[#800000]" /> Syllabus
                      </span>
                    )}
                    {item.category === 'Event' && (
                      <span className="text-[#800000] bg-[#FFF0F0] px-2 py-0.5 rounded border border-[#FF9999] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#800000]" /> Event
                      </span>
                    )}
                    {item.category === 'Attendance' && (
                      <span className="text-[#800000] bg-[#FFF0F0] px-2 py-0.5 rounded border border-[#FF9999] flex items-center gap-1">
                        <CheckSquare className="w-3 h-3 text-[#800000]" /> Attendance
                      </span>
                    )}
                    {item.category === 'Disciplinary' && (
                      <span className="text-[#800000] bg-[#FFF0F0] px-2 py-0.5 rounded border border-[#FF9999] flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-[#800000]" /> Disciplinary
                      </span>
                    )}
                    {item.category === 'Journal' && (
                      <span className="text-[#800000] bg-[#FFF0F0] px-2 py-0.5 rounded border border-[#FF9999] flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-[#800000]" /> Notebook
                      </span>
                    )}
                    {item.category === 'Administrative' && (
                      <span className="text-[#800000] bg-[#FFF0F0] px-2 py-0.5 rounded border border-[#FF9999] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#800000]" /> Policy
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      item.isOverdue
                        ? 'bg-[#800000] text-white border-[#800000]'
                        : item.priority === 'High'
                        ? 'bg-[#FFF0F0] text-[#800000] border-[#FF9999]'
                        : 'bg-white text-[#800000] border-[#FFD0D0]'
                    }`}
                  >
                    {item.dueDateLabel}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#800000] transition leading-snug">
                  {item.title}
                </h4>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#FFD0D0] flex items-center justify-between">
                {item.targetMemberName ? (
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-[#800000]" /> {item.targetMemberName}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">
                    Rover Policy Task
                  </span>
                )}

                <button
                  onClick={() => onNavigateTab(item.targetTab)}
                  className="flex items-center gap-1 text-xs font-bold text-[#800000] hover:text-white bg-[#FFF0F0] hover:bg-[#800000] border border-[#FF9999] px-2.5 py-1 rounded-lg transition cursor-pointer shadow-xs"
                >
                  <span>{item.actionText}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#800000] group-hover:text-white" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
