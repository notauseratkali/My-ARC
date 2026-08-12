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
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 shrink-0">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  AI Scout Progression Coach
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Grounded on Real Member Data
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">Smart Award & Progression Assistant</h2>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                Analyzes portfolio journals, attended events, and current progress logs to suggest next focus badges, pinpoint gaps, and recommend clear next steps.
              </p>
            </div>
          </div>

          <button
            onClick={runAnalysis}
            disabled={isLoading}
            className="self-start md:self-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-sm font-medium rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 border border-emerald-400/30"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analyzing Member Logs...' : 'Re-Run Analysis'}
          </button>
        </div>
      </div>

      {/* Member Selection Controls (for Leadership) & Data Scope Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Selector Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <User className="w-4 h-4 text-emerald-400" />
            {isLeadership ? 'Select Member to Analyze' : 'Analyzing Scout Member'}
          </label>
          {isLeadership ? (
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.councilRole} • {m.crewName || 'General Crew'})
                </option>
              ))}
            </select>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-sm font-medium flex items-center justify-between">
              <span>{activeMember.name}</span>
              <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                {activeMember.councilRole}
              </span>
            </div>
          )}
        </div>

        {/* Real Data Evidence Snapshot */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-4 grid grid-cols-3 gap-3">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs mb-1">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Journals Analyzed
            </div>
            <div className="text-xl font-bold text-white">{memberJournals.length}</div>
            <div className="text-[10px] text-slate-500">Portfolio log entries</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs mb-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Attended Events
            </div>
            <div className="text-xl font-bold text-white">{memberAttendedEvents.length}</div>
            <div className="text-[10px] text-slate-500">Present status records</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs mb-1">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Active Progresses
            </div>
            <div className="text-xl font-bold text-white">{memberProgressList.length}</div>
            <div className="text-[10px] text-slate-500">Logged requirements</div>
          </div>
        </div>
      </div>

      {/* Policy Notice: Strict Non-Hallucination Policy */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-slate-400">
        <Info className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong className="text-slate-300">Strict Data Grounding Policy:</strong> AI recommendations are generated by analyzing real journals, attendance records, and active syllabus items. Unverified data or fake badges are strictly prohibited.
        </span>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-800 rounded w-1/3" />
              <div className="h-3 bg-slate-800/60 rounded w-1/2" />
            </div>
          </div>
          <div className="h-20 bg-slate-950/80 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-36 bg-slate-950/80 rounded-xl" />
            <div className="h-36 bg-slate-950/80 rounded-xl" />
          </div>
        </div>
      )}

      {/* Error View */}
      {errorMsg && !isLoading && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-6 text-rose-300 space-y-3">
          <div className="flex items-center gap-2 text-lg font-semibold text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Progression Analysis Interrupted
          </div>
          <p className="text-sm text-rose-300">{errorMsg}</p>
          <button
            onClick={runAnalysis}
            className="px-3.5 py-1.5 bg-rose-900/60 hover:bg-rose-800 border border-rose-500/40 text-rose-100 text-xs font-medium rounded-lg transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Analysis Results View */}
      {analysis && !isLoading && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 space-y-3 relative">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Member Progression Trajectory Summary
              </h3>
              <button
                onClick={handleCopySummary}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 border border-slate-700"
                title="Copy Full Analysis"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied to Clipboard' : 'Copy Summary'}
              </button>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
              {analysis.executiveSummary}
            </p>
          </div>

          {/* Section 1: Suggested Award Requirements */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Suggested Next Award Requirements
              </h3>
              <span className="text-xs text-slate-400">
                Matched against member's past experiences
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.suggestedRequirements.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all rounded-2xl p-5 flex flex-col justify-between space-y-4 group shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
                          {item.awardType}
                        </span>
                        <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {item.title}
                        </h4>
                      </div>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 shrink-0">
                        {item.category}
                      </span>
                    </div>

                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" /> Why Suggested (Data Rationale):
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {item.matchingRationale}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Recommended Action:
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {item.recommendedNextSteps}
                      </p>
                    </div>
                  </div>

                  {onSelectRequirement && (
                    <button
                      onClick={() => onSelectRequirement(item.requirementId)}
                      className="w-full py-2 bg-slate-800 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 border border-slate-700 hover:border-emerald-500/50 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 mt-2"
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
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Identified Progression Gaps & Guidance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.progressGaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                      {gap.category}
                    </span>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-100">
                      {gap.gapDescription}
                    </h4>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
                    <strong className="text-amber-300 block mb-1">Fulfillment Guidance:</strong>
                    {gap.guidance}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Actionable Milestones Checklist */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-400" />
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
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-slate-400 line-through'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isChecked
                          ? 'bg-emerald-500 text-slate-950'
                          : 'border border-slate-600 bg-slate-900'
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
