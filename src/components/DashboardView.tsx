import React from 'react';
import {
  Member,
  CrewEvent,
  AttendanceRecord,
  JournalEntry,
  SyllabusRequirement,
  MemberRequirementProgress,
  SubCrew,
  DisciplinaryIncident,
  PortalSettings,
} from '../types';
import {
  Users,
  Award,
  Calendar,
  BookOpen,
  UserPlus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  PlusCircle,
  FileText,
  Zap,
  CheckSquare,
  Crown,
  ShieldCheck,
} from 'lucide-react';
import { TabType } from './Header';
import { CrewProgressionChart } from './CrewProgressionChart';
import { DueRemindersWidget } from './DueRemindersWidget';

interface DashboardViewProps {
  members?: Member[];
  events?: CrewEvent[];
  attendance?: AttendanceRecord[];
  journals?: JournalEntry[];
  syllabus?: SyllabusRequirement[];
  progressList?: MemberRequirementProgress[];
  crews?: SubCrew[];
  disciplinaryLogs?: DisciplinaryIncident[];
  incidents?: DisciplinaryIncident[];
  currentMember: Member | null;
  settings?: PortalSettings;
  onNavigateTab?: (tab: TabType) => void;
  setActiveTab?: (tab: any) => void;
  onOpenNewMemberModal?: () => void;
  onOpenNewJournalModal?: () => void;
  onOpenNewEventModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  members = [],
  events = [],
  attendance = [],
  journals = [],
  syllabus = [],
  progressList = [],
  crews = [],
  disciplinaryLogs,
  incidents = [],
  currentMember,
  settings,
  onNavigateTab,
  setActiveTab,
  onOpenNewMemberModal = () => {},
  onOpenNewJournalModal = () => {},
  onOpenNewEventModal = () => {},
}) => {
  const actualDisciplinaryLogs = disciplinaryLogs || incidents || [];
  const onNavigateTabActual = onNavigateTab || (setActiveTab as unknown as (tab: TabType) => void) || (() => {});
  const isAdvisor = currentMember?.councilRole === 'Rover Advisor';
  const isCouncil = !!currentMember && currentMember.councilRole !== 'Member';

  const activeMembers = members.filter((m) => m.status === 'Active' && !m.isSuperAdmin && m.councilRole !== 'Superadmin' && m.councilRole !== 'Rover Advisor');
  const explorers = members.filter((m) => m.section === 'Explorer' && m.status === 'Active' && !m.isSuperAdmin && m.councilRole !== 'Superadmin' && m.councilRole !== 'Rover Advisor');
  const rovers = members.filter((m) => m.section === 'Rover' && m.status === 'Active' && !m.isSuperAdmin && m.councilRole !== 'Superadmin' && m.councilRole !== 'Rover Advisor');
  const onboardingMembers = members.filter((m) => m.status === 'Onboarding' && !m.isSuperAdmin && m.councilRole !== 'Superadmin' && m.councilRole !== 'Rover Advisor');

  // Find members turning 18 or recently turned 18 for transition alert
  const transitionCandidates = members.filter(
    (m) => m.age >= 18 && m.section === 'Explorer'
  );

  const upcomingEvents = events
    .filter((e) => new Date(e.startDate) >= new Date('2026-08-01'))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  const recentJournals = [...journals]
    .filter((j) => isCouncil || j.memberId === currentMember.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const openDisciplinaryCount = actualDisciplinaryLogs.filter(
    (d) => d.status === 'Open' || d.status === 'Under Review'
  ).length;

  // Near Completion Syllabus Alerts Calculation
  const nearCompletionItems = React.useMemo(() => {
    return progressList
      .map((prog) => {
        const member = members.find((m) => m.id === prog.memberId);
        const req = syllabus.find((s) => s.id === prog.requirementId);
        if (!member || !req) return null;

        const totalTasks = req.tasks.length || 1;
        const completedTasksCount = prog.completedTasks.length;
        const pct = Math.round((completedTasksCount / totalTasks) * 100);

        const isSubmitted = prog.status === 'Submitted';
        const isCompleted = prog.status === 'Completed' || prog.status === 'Verified';

        // Near completion criteria: Submitted OR (In Progress and >= 50% completed or 1 task away)
        const isNearCompletion =
          isSubmitted ||
          (!isCompleted && (pct >= 50 || completedTasksCount >= totalTasks - 1) && completedTasksCount > 0);

        if (!isNearCompletion) return null;

        const remainingTasks = req.tasks.filter((t) => !prog.completedTasks.includes(t.id));

        return {
          progressId: prog.id,
          prog,
          member,
          req,
          totalTasks,
          completedTasksCount,
          pct: isSubmitted ? 100 : pct,
          remainingTasks,
          statusLabel: isSubmitted ? 'Pending Review' : 'Near Completion',
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [progressList, members, syllabus]);

  // Filter near completion items based on Council vs Non-Council view
  const displayedNearCompletionItems = React.useMemo(() => {
    if (isCouncil) return nearCompletionItems;
    // For non-council members, show their own near-completion or active requirements
    const userItems = nearCompletionItems.filter((i) => i.member.id === currentMember.id);
    if (userItems.length > 0) return userItems;

    // Fallback for non-council user: show their active progressList items
    return progressList
      .filter((p) => p.memberId === currentMember.id)
      .map((prog) => {
        const member = currentMember;
        const req = syllabus.find((s) => s.id === prog.requirementId);
        if (!req) return null;
        const totalTasks = req.tasks.length || 1;
        const completedTasksCount = prog.completedTasks.length;
        const pct = Math.round((completedTasksCount / totalTasks) * 100);
        return {
          progressId: prog.id,
          prog,
          member,
          req,
          totalTasks,
          completedTasksCount,
          pct,
          remainingTasks: req.tasks.filter((t) => !prog.completedTasks.includes(t.id)),
          statusLabel: prog.status,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [isCouncil, nearCompletionItems, progressList, currentMember, syllabus]);

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[#006B3F] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-[#006B3F] animate-ping" />
              {isAdvisor
                ? 'Rover Advisor • Network & Crew Administration'
                : isCouncil
                ? 'Rover Operational Command Portal'
                : 'My Rover & Explorer Workspace'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Welcome back, {currentMember ? currentMember.name : 'Scout'}</span>
              {isAdvisor && (
                <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-purple-700" />
                  <span>Rover Advisor</span>
                </span>
              )}
            </h2>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl">
              {isAdvisor ? (
                <>Operating with supreme authority over <span className="text-purple-700 font-semibold">{settings?.networkName || 'Meyvaa Scouting Network'}</span>. Administering scout group decisions, executive council governance, and overall Scout operations through Meyvaa Portal across {crews.length} decentralized crews.</>
              ) : isCouncil ? (
                <>Operating via <span className="text-[#002B7F] font-semibold">Meyvaa Portal</span> for <span className="text-[#006B3F] font-semibold">{settings?.networkName || 'Scout Network'}</span>. Managing {activeMembers.length} active Rovers & Explorers across {crews.length} decentralized crews.</>
              ) : (
                <>Operating via <span className="text-[#002B7F] font-semibold">Meyvaa Portal</span> for <span className="text-[#006B3F] font-semibold">{currentMember?.crewName || settings?.crewName || 'Scout Group Crew'}</span>. Managing {activeMembers.length} active Rovers & Explorers across {crews.length} decentralized crews.</>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isCouncil && (
              <button
                id="dashboard-new-member-btn"
                onClick={onOpenNewMemberModal}
                className="bg-[#800000] hover:bg-[#660000] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer !text-white"
              >
                <UserPlus className="w-4 h-4 text-white" />
                <span className="text-white font-semibold !text-white">Onboard Member</span>
              </button>
            )}
            <button
              id="dashboard-new-journal-btn"
              onClick={onOpenNewJournalModal}
              className="bg-[#FFF0F0] hover:bg-[#FFE5E5] text-[#800000] text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#FF9999] shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#800000]" />
              <span>Log Journal</span>
            </button>
            {isCouncil && (
              <button
                id="dashboard-new-event-btn"
                onClick={onOpenNewEventModal}
                className="bg-[#800000] hover:bg-[#660000] text-white border border-[#800000] text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer shadow-xs !text-white"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span className="text-white font-semibold !text-white">Schedule Event</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Progression Coach Banner */}
      <div className="bg-[#FFF0F0] border border-[#FF9999] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white border border-[#FFB3B3] rounded-xl text-[#800000] shrink-0">
            <Sparkles className="w-5 h-5 text-[#800000]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#800000] flex items-center gap-2">
              AI Progression & Award Assistant
              <span className="text-[10px] font-semibold uppercase bg-white text-[#800000] border border-[#FFB3B3] px-2 py-0.5 rounded-full">
                Grounded on User Logs
              </span>
            </h4>
            <p className="text-xs text-slate-700 mt-0.5">
              Analyzes portfolio journals, attended events, and active badges to suggest next award requirements & identify progress gaps.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTabActual('syllabus')}
          className="bg-[#800000] hover:bg-[#660000] text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer !text-white"
        >
          <span className="text-white font-semibold !text-white">Launch AI Coach</span>
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

      {/* Transition Alert Banner (If any members turn 18 and council or user is involved) */}
      {transitionCandidates.length > 0 && (isCouncil || transitionCandidates.some(c => c.id === currentMember?.id)) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4 text-amber-900 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-amber-900">
                Automated Section Transition Alert ({transitionCandidates.length} Member)
              </p>
              <p className="text-amber-700">
                {transitionCandidates.map((c) => `${c.name} (Age ${c.age})`).join(', ')} has turned 18 and is eligible to transition from Explorer (President Scout) to Rover Section (Baden-Powell BP Award).
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTabActual('members')}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 flex-shrink-0 transition cursor-pointer"
          >
            <span>Review Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Key Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Members */}
        <div
          onClick={() => onNavigateTabActual('members')}
          className="bg-white border border-slate-200 hover:border-[#002B7F]/40 p-5 rounded-2xl cursor-pointer transition shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Active Crew</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006B3F] border border-emerald-200 flex items-center justify-center group-hover:scale-105 transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{activeMembers.length}</span>
            <span className="text-xs text-[#006B3F] font-mono font-medium">Target: 150</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>{explorers.length} Explorers</span>
            <span>{rovers.length} Rovers</span>
          </div>
        </div>

        {/* Multi-Crews Count */}
        <div
          onClick={() => onNavigateTabActual('settings')}
          className="bg-white border border-slate-200 hover:border-[#002B7F]/40 p-5 rounded-2xl cursor-pointer transition shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Sub-Crew Units</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#002B7F] border border-blue-200 flex items-center justify-center group-hover:scale-105 transition">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{crews.length}</span>
            <span className="text-xs text-[#002B7F] font-mono">Decentralized</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>Male • Hulhumale • Villimale</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Awards Progression */}
        <div
          onClick={() => onNavigateTabActual('syllabus')}
          className="bg-white border border-slate-200 hover:border-[#002B7F]/40 p-5 rounded-2xl cursor-pointer transition shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {isCouncil ? 'Award Milestones' : 'My Active Syllabus'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center group-hover:scale-105 transition">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">
              {isCouncil ? syllabus.length : progressList.filter((p) => p.memberId === currentMember?.id && p.status !== 'Not Started').length}
            </span>
            <span className="text-xs text-amber-700 font-mono">
              {displayedNearCompletionItems.length > 0 ? `${displayedNearCompletionItems.length} Active Requirements` : 'President & BP'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>
              {progressList.filter((p) => (isCouncil ? true : p.memberId === currentMember?.id) && (p.status === 'Completed' || p.status === 'Verified')).length} Verified
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Governance & Review Card */}
        <div
          onClick={() => onNavigateTabActual(isCouncil ? 'disciplinary' : 'attendance')}
          className="bg-white border border-slate-200 hover:border-[#002B7F]/40 p-5 rounded-2xl cursor-pointer transition shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {isCouncil ? 'Governance & Review' : 'My Standing & Roll'}
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-105 transition ${
              isCouncil ? 'bg-rose-50 text-[#800020] border border-rose-200' : 'bg-emerald-50 text-[#006B3F] border border-emerald-200'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">
              {isCouncil ? onboardingMembers.length + openDisciplinaryCount : currentMember?.attendanceUnexcused || 0}
            </span>
            <span className={`text-xs font-mono ${isCouncil ? 'text-[#800020]' : 'text-[#006B3F]'}`}>
              {isCouncil ? 'Action Items' : 'Unexcused Absences'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>{isCouncil ? `${onboardingMembers.length} Onboarding • ${openDisciplinaryCount} Cases` : 'Good Standing • Active Status'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Due Reminders & Action Center Widget for All Members */}
      <DueRemindersWidget
        currentMember={currentMember}
        members={members}
        syllabus={syllabus}
        progressList={progressList}
        events={events}
        attendance={attendance}
        incidents={incidents}
        journals={journals}
        settings={settings}
        onNavigateTab={onNavigateTabActual}
      />

      {/* Sub-Crew Progression Analytics Recharts Visualization */}
      <CrewProgressionChart
        crews={crews}
        members={members}
        syllabus={syllabus}
        progressList={progressList}
        onNavigateTab={onNavigateTabActual}
      />

      {/* Near Completion Syllabus Notification Block */}
      <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 shadow-xs">
              <Zap className="w-5 h-5 fill-amber-500/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isCouncil ? "Syllabus 'Near Completion' Notifications" : "My Active Syllabus & Award Progress"}
                </h3>
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full">
                  {displayedNearCompletionItems.length} {isCouncil ? `Member${displayedNearCompletionItems.length !== 1 ? 's' : ''} Flagged` : 'Active Item'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isCouncil
                  ? "Rovers & Explorers with high requirement progress or pending Council award verification."
                  : "Track your assigned requirements, completion percentages, and verification status."}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTabActual('syllabus')}
            className="text-xs text-amber-800 hover:text-amber-900 font-medium flex items-center gap-1.5 self-start sm:self-auto bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl border border-amber-200 transition shadow-xs cursor-pointer"
          >
            <span>Review in Syllabus Engine</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {displayedNearCompletionItems.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4 text-center">
            {isCouncil ? "No active members are currently flagged as near completion." : "You have no active requirements registered yet."}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
            {displayedNearCompletionItems.map((item) => (
              <div
                key={item.progressId}
                className="bg-slate-50 border border-slate-200 hover:border-amber-300 p-4 rounded-xl flex flex-col justify-between space-y-3 transition shadow-xs group"
              >
                <div>
                  {/* Member Info Header */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.member.avatar ? (
                        <img
                          src={item.member.avatar}
                          alt={item.member.name}
                          className="w-8 h-8 rounded-full object-cover border border-amber-300 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                          {item.member.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-800 transition">
                          {item.member.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {item.member.section} • {item.member.crewName}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono flex-shrink-0 ${
                        item.prog.status === 'Submitted'
                          ? 'bg-blue-50 text-[#002B7F] border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                      }`}
                    >
                      {item.statusLabel}
                    </span>
                  </div>

                  {/* Requirement Title */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#006B3F]">
                      {item.req.awardType}
                    </span>
                    <h5 className="text-xs font-bold text-slate-800 line-clamp-1">
                      {item.req.title}
                    </h5>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">
                        {item.completedTasksCount} / {item.totalTasks} Tasks Done
                      </span>
                      <span className="font-bold font-mono text-amber-700">
                        {item.pct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden p-0.5 border border-slate-300">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.prog.status === 'Submitted'
                            ? 'bg-[#002B7F]'
                            : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                        }`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Remaining Task Note */}
                  {item.remainingTasks.length > 0 ? (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-start gap-1.5 text-[11px] text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1 italic text-slate-500">
                        Pending: {item.remainingTasks[0].text}
                      </span>
                    </div>
                  ) : item.prog.notes ? (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] text-slate-500 italic line-clamp-1">
                      "{item.prog.notes}"
                    </div>
                  ) : null}
                </div>

                {/* Quick Action Button */}
                <button
                  onClick={() => onNavigateTabActual('syllabus')}
                  className="w-full mt-2 bg-white hover:bg-amber-50 hover:border-amber-300 text-slate-700 hover:text-amber-800 border border-slate-200 text-[11px] font-medium py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                  <span>Verify Progress in Syllabus</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upcoming Camps & Events (2 cols on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Events Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#006B3F]" />
                <h3 className="text-base font-bold text-slate-900">
                  Upcoming Crew Camps & Events
                </h3>
              </div>
              <button
                onClick={() => onNavigateTabActual('events')}
                className="text-xs text-[#002B7F] hover:text-blue-800 font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <span>Master Calendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">No upcoming events scheduled.</p>
              ) : (
                upcomingEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                            ev.type === 'Camp'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : ev.type === 'Meeting'
                              ? 'bg-blue-50 text-[#002B7F] border border-blue-200'
                              : 'bg-emerald-50 text-[#006B3F] border border-emerald-200'
                          }`}
                        >
                          {ev.type}
                        </span>
                        {ev.isCompulsory && (
                          <span className="bg-rose-50 text-[#800020] border border-rose-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                            Compulsory
                          </span>
                        )}
                        <span className="text-slate-500 text-xs">{ev.crewName}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{ev.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-1">{ev.description}</p>
                    </div>

                    <div className="text-right flex sm:flex-col justify-between items-end gap-1 text-xs text-slate-500 border-t sm:border-t-0 border-slate-200 pt-2 sm:pt-0">
                      <div className="flex items-center gap-1 text-[#006B3F] font-semibold">
                        <Clock className="w-3.5 h-3.5 text-[#006B3F]" />
                        <span>{new Date(ev.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[140px]">{ev.location}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section Progression Summary (Explorers vs Rovers) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Section Progression & Syllabus Overview
                </h3>
              </div>
              <button
                onClick={() => onNavigateTabActual('syllabus')}
                className="text-xs text-[#002B7F] hover:text-blue-800 font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <span>Manage Syllabus</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Explorer Section Block */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-50 text-[#006B3F] border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                    Explorer Section (&lt;18)
                  </span>
                  <span className="text-xs font-semibold text-slate-700">{explorers.length} Active Members</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">President's Scout Award</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Focus: Leadership Patrols, Wilderness Navigation, Island Community Projects.</p>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Core Modules:</span>
                  <span className="font-mono text-[#006B3F] font-bold">
                    {syllabus.filter((s) => s.awardType === "President's Scout Award").length} Requirements
                  </span>
                </div>
              </div>

              {/* Rover Section Block */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-blue-50 text-[#002B7F] border border-blue-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                    Rover Section (Ages 18-26)
                  </span>
                  <span className="text-xs font-semibold text-slate-700">{rovers.length} Active Members</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Baden-Powell Award</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Focus: Rover Crew Administration, 100km Maritime Expedition, Sustainable Community Service.</p>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Core Modules:</span>
                  <span className="font-mono text-[#002B7F] font-bold">
                    {syllabus.filter((s) => s.awardType === 'Baden-Powell Award').length} Requirements
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Journals & Sub-Crew Stats */}
        <div className="space-y-6">
          {/* Recent Member Journal Logs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#006B3F]" />
                <h3 className="text-base font-bold text-slate-900">
                  Member Activity Journals
                </h3>
              </div>
              <button
                onClick={() => onNavigateTabActual('journals')}
                className="text-xs text-[#002B7F] hover:text-blue-800 font-semibold transition cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {recentJournals.map((j) => {
                const author = members.find((m) => m.id === j.memberId);
                return (
                  <div key={j.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#006B3F]">{author?.name || 'Rover Member'}</span>
                      <span className="text-slate-400">{j.date}</span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{j.title}</h5>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{j.content}</p>
                    {j.aiPolished && (
                      <div className="pt-1 flex items-center gap-1 text-[10px] text-[#006B3F] font-semibold">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Formatted Log</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sub-Crews Overview Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Sub-Crew Deployment</h3>
              <span className="text-xs font-mono text-[#006B3F] font-bold">Multi-Location</span>
            </div>

            <div className="space-y-2.5">
              {crews.map((c) => {
                const crewMemberCount = members.filter((m) => m.crewId === c.id && m.status === 'Active' && !m.isSuperAdmin && m.councilRole !== 'Superadmin' && m.councilRole !== 'Rover Advisor').length;
                return (
                  <div key={c.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{c.name}</p>
                      <p className="text-[10px] text-slate-500">{c.location} • Leader: {c.crewLeaderName || 'Unassigned'}</p>
                    </div>
                    <span className="bg-emerald-50 text-[#006B3F] border border-emerald-200 font-mono text-xs font-bold px-2.5 py-1 rounded-lg">
                      {crewMemberCount} Members
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
