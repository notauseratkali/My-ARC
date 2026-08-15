import React, { useState, useEffect } from 'react';
import {
  Member,
  SyllabusRequirement,
  MemberRequirementProgress,
  JournalEntry,
  CrewEvent,
  AttendanceRecord,
} from '../types';
import {
  Sparkles,
  Bot,
  User,
  BookOpen,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Compass,
  FileText,
  ShieldCheck,
  TrendingUp,
  Target,
  Info,
} from 'lucide-react';

export interface ProgressionAnalysisResult {
  executiveSummary: string;
  suggestedRequirements: {
    requirementId: string;
    title: string;
    awardType: string;
    category: string;
    matchingRationale: string;
    recommendedNextSteps: string;
  }[];
  progressGaps: {
    category: string;
    gapDescription: string;
    guidance: string;
  }[];
  actionableMilestones: string[];
}

interface AIProgressionAssistantProps {
  members: Member[];
  currentMember: Member;
  syllabus: SyllabusRequirement[];
  progressList: MemberRequirementProgress[];
  journals: JournalEntry[];
  events: CrewEvent[];
  attendance: AttendanceRecord[];
  aiEnabled?: boolean;
  onSelectRequirement?: (reqId: string) => void;
}

export const AIProgressionAssistant: React.FC<AIProgressionAssistantProps> = ({
  members = [],
  currentMember,
  syllabus = [],
  progressList = [],
  journals = [],
  events = [],
  attendance = [],
  aiEnabled = true,
  onSelectRequirement,
}) => {
  const isLeadership = [
    'Superadmin',
    'Rover Advisor',
    'Chairperson',
    'Vice Chairperson',
    'Progress Coordinator',
    'Secretary',
    'Crew Leader',
  ].includes(currentMember?.councilRole || '');

  const [selectedMemberId, setSelectedMemberId] = useState<string>(currentMember?.id || '');
  const [analysis, setAnalysis] = useState<ProgressionAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [completedMilestones, setCompletedMilestones] = useState<Record<number, boolean>>({});

  const activeMember = members.find((m) => m.id === selectedMemberId) || currentMember;

  // Filter journals for active member
  const memberJournals = journals.filter((j) => j.memberId === activeMember.id);

  // Filter attended events for active member (Attendance marked "Present")
  const memberAttendanceMap = new Set(
    attendance
      .filter((a) => a.memberId === activeMember.id && a.status === 'Present')
      .map((a) => a.eventId)
  );
  const memberAttendedEvents = events.filter((e) => memberAttendanceMap.has(e.id));

  // Filter progress records for active member
  const memberProgressList = progressList.filter((p) => p.memberId === activeMember.id);

  const runAnalysis = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setCompletedMilestones({});

    try {
      const response = await fetch('/api/ai/analyze-progression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberName: activeMember.name,
          memberRole: activeMember.councilRole,
          journals: memberJournals,
          attendedEvents: memberAttendedEvents,
          progressList: memberProgressList,
          syllabusList: syllabus,
          aiEnabled,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate progression analysis.');
      }

      const data = await response.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        throw new Error('Invalid response structure from progression assistant server.');
      }
    } catch (err: any) {
      console.error('AI Progression Assistant Error:', err);
      setErrorMsg(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMemberId) {
      runAnalysis();
    }
  }, [selectedMemberId]);

  const handleCopySummary = () => {
    if (!analysis) return;
    const textToCopy = `=== SCOUT PROGRESSION AI ANALYSIS: ${activeMember.name} ===\n\nEXECUTIVE SUMMARY:\n${analysis.executiveSummary}\n\nSUGGESTED NEXT REQUIREMENTS:\n${analysis.suggestedRequirements.map((s) => `- ${s.title} (${s.awardType}): ${s.matchingRationale}`).join('\n')}\n\nPROGRESS GAPS IDENTIFIED:\n${analysis.progressGaps.map((g) => `- [${g.category}] ${g.gapDescription} -> ${g.guidance}`).join('\n')}\n\nACTIONABLE MILESTONES:\n${analysis.actionableMilestones.map((m, i) => `${i + 1}. ${m}`).join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleMilestone = (idx: number) => {
    setCompletedMilestones((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-blue-50 border border-emerald-200 rounded-2xl p-6 relative overflow-hidden shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white border border-emerald-200 rounded-xl text-[#006B3F] shrink-0 shadow-2xs">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#006B3F] bg-emerald-100/80 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  AI Scout Progression Coach
                </span>
                <span className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#006B3F]" /> Grounded on Real Member Data
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">Smart Award & Progression Assistant</h2>
              <p className="text-slate-600 text-sm mt-1 max-w-2xl">
                Analyzes portfolio journals, attended events, and current progress logs to suggest next focus badges, pinpoint gaps, and recommend clear next steps.
              </p>
            </div>
          </div>

          <button
            onClick={runAnalysis}
            disabled={isLoading}
            className="self-start md:self-auto px-4 py-2.5 bg-[#800000] hover:bg-[#6b0000] disabled:bg-[#FFD0D0] disabled:text-[#800000]/60 text-white !text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analyzing Member Logs...' : 'Re-Run Analysis'}
          </button>
        </div>
      </div>

      {/* Member Selection Controls (for Leadership) & Data Scope Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Selector Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <User className="w-4 h-4 text-[#006B3F]" />
            {isLeadership ? 'Select Member to Analyze' : 'Analyzing Scout Member'}
          </label>
          {isLeadership ? (
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#002B7F] focus:outline-none"
            >
              {members
                .filter((m) => !m.isSuperAdmin && m.councilRole !== 'Superadmin' && m.councilRole !== 'Rover Advisor')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.section} • {m.crewName || 'General Crew'})
                  </option>
                ))}
            </select>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 text-sm font-medium flex items-center justify-between">
              <span>{activeMember.name}</span>
              <span className="text-xs bg-emerald-50 text-[#006B3F] border border-emerald-200 px-2 py-0.5 rounded font-bold">
                {activeMember.councilRole}
              </span>
            </div>
          )}
        </div>

        {/* Real Data Evidence Snapshot */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-3 gap-3 shadow-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-600 text-xs mb-1 font-medium">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Journals Analyzed
            </div>
            <div className="text-xl font-bold text-slate-900">{memberJournals.length}</div>
            <div className="text-[10px] text-slate-500">Portfolio log entries</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-600 text-xs mb-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#006B3F]" /> Attended Events
            </div>
            <div className="text-xl font-bold text-slate-900">{memberAttendedEvents.length}</div>
            <div className="text-[10px] text-slate-500">Present status records</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-600 text-xs mb-1 font-medium">
              <Award className="w-3.5 h-3.5 text-amber-600" /> Active Progresses
            </div>
            <div className="text-xl font-bold text-slate-900">{memberProgressList.length}</div>
            <div className="text-[10px] text-slate-500">Logged requirements</div>
          </div>
        </div>
      </div>

      {/* Policy Notice: Strict Non-Hallucination Policy */}
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-slate-700">
        <Info className="w-4 h-4 text-[#006B3F] shrink-0" />
        <span>
          <strong className="text-slate-900">Strict Data Grounding Policy:</strong> AI recommendations are generated by analyzing real journals, attendance records, and active syllabus items. Unverified data or fake badges are strictly prohibited.
        </span>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-xl" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
          <div className="h-20 bg-slate-100 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-36 bg-slate-100 rounded-xl" />
            <div className="h-36 bg-slate-100 rounded-xl" />
          </div>
        </div>
      )}

      {/* Error View */}
      {errorMsg && !isLoading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-[#800020] space-y-3">
          <div className="flex items-center gap-2 text-lg font-semibold text-[#800020]">
            <AlertTriangle className="w-5 h-5 text-[#800020]" />
            Progression Analysis Interrupted
          </div>
          <p className="text-sm text-slate-700">{errorMsg}</p>
          <button
            onClick={runAnalysis}
            className="px-3.5 py-1.5 bg-[#800020] hover:bg-rose-900 text-white text-xs font-medium rounded-lg transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Analysis Results View */}
      {analysis && !isLoading && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 relative shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#006B3F]" />
                Member Progression Trajectory Summary
              </h3>
              <button
                onClick={handleCopySummary}
                className="px-3 py-1.5 bg-[#FFF0F0] hover:bg-white text-[#800000] text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border border-[#FF9999] cursor-pointer shadow-xs"
                title="Copy Full Analysis"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#800000]" /> : <Copy className="w-3.5 h-3.5 text-[#800000]" />}
                {copied ? 'Copied to Clipboard' : 'Copy Summary'}
              </button>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 border border-slate-200 p-4 rounded-xl">
              {analysis.executiveSummary}
            </p>
          </div>

          {/* Section 1: Suggested Award Requirements */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#006B3F]" />
                Suggested Next Award Requirements
              </h3>
              <span className="text-xs text-slate-500">
                Matched against member's past experiences
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.suggestedRequirements.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#002B7F]/40 transition-all rounded-2xl p-5 flex flex-col justify-between space-y-4 group shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#006B3F] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          {item.awardType}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 group-hover:text-[#002B7F] transition-colors">
                          {item.title}
                        </h4>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 shrink-0 font-medium">
                        {item.category}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#006B3F]" /> Why Suggested (Data Rationale):
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.matchingRationale}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" /> Recommended Action:
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.recommendedNextSteps}
                      </p>
                    </div>
                  </div>

                  {onSelectRequirement && (
                    <button
                      onClick={() => onSelectRequirement(item.requirementId)}
                      className="w-full py-2 bg-[#FFF0F0] hover:bg-[#800000] text-[#800000] hover:text-white border border-[#FF9999] hover:border-[#800000] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                    >
                      Focus on Requirement <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Progress Gaps & Documentation Needs */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Identified Progression Gaps & Guidance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.progressGaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      {gap.category}
                    </span>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {gap.gapDescription}
                    </h4>
                  </div>

                  <div className="bg-white border border-amber-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed">
                    <strong className="text-amber-800 block mb-1">Fulfillment Guidance:</strong>
                    {gap.guidance}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Actionable Milestones Checklist */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#006B3F]" />
              Immediate Term Milestones Checklist
            </h3>

            <div className="space-y-2.5">
              {analysis.actionableMilestones.map((milestone, idx) => {
                const isChecked = !!completedMilestones[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleMilestone(idx)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isChecked
                        ? 'bg-emerald-50 border-emerald-200 text-slate-500 line-through'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isChecked
                          ? 'bg-[#006B3F] text-white'
                          : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-medium leading-snug">
                      {milestone}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
