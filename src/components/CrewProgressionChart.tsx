import React, { useState, useMemo } from 'react';
import {
  SubCrew,
  Member,
  SyllabusRequirement,
  MemberRequirementProgress,
} from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Award,
  TrendingUp,
  Users,
  CheckCircle2,
  BarChart2,
  PieChart as PieIcon,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface CrewProgressionChartProps {
  crews: SubCrew[];
  members: Member[];
  syllabus: SyllabusRequirement[];
  progressList: MemberRequirementProgress[];
  onNavigateTab?: (tab: string) => void;
}

export const CrewProgressionChart: React.FC<CrewProgressionChartProps> = ({
  crews,
  members,
  syllabus,
  progressList,
  onNavigateTab,
}) => {
  const [activeView, setActiveView] = useState<'bar' | 'grouped' | 'distribution'>('bar');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<'All' | 'Explorer' | 'Rover'>('All');

  // Compute detailed statistics per sub-crew
  const crewStats = useMemo(() => {
    // Make sure we account for all crews in `crews` list, plus any default crew names found in members
    const allCrewMap = new Map<string, { id: string; name: string; location: string }>();

    crews.forEach((c) => {
      allCrewMap.set(c.id, { id: c.id, name: c.name, location: c.location });
    });

    members.forEach((m) => {
      if (!m.isSuperAdmin && m.councilRole !== 'Superadmin' && m.councilRole !== 'Rover Advisor' && m.crewId && m.crewId !== 'portal-admin' && !allCrewMap.has(m.crewId)) {
        allCrewMap.set(m.crewId, {
          id: m.crewId,
          name: m.crewName || 'Sub-Crew',
          location: 'Scout Unit',
        });
      }
    });

    const result = Array.from(allCrewMap.values()).map((crew) => {
      const crewMembers = members.filter(
        (m) => !m.isSuperAdmin && m.councilRole !== 'Superadmin' && m.councilRole !== 'Rover Advisor' && (m.crewId === crew.id || m.crewName === crew.name) && m.status === 'Active'
      );

      const explorerMembers = crewMembers.filter((m) => m.section === 'Explorer');
      const roverMembers = crewMembers.filter((m) => m.section === 'Rover');

      // Filter members based on section selection
      const filteredMembers =
        selectedSectionFilter === 'Explorer'
          ? explorerMembers
          : selectedSectionFilter === 'Rover'
          ? roverMembers
          : crewMembers;

      let totalTasksPossible = 0;
      let totalTasksCompleted = 0;

      let explorerTasksPossible = 0;
      let explorerTasksCompleted = 0;

      let roverTasksPossible = 0;
      let roverTasksCompleted = 0;

      let verifiedRequirements = 0;
      let submittedRequirements = 0;
      let inProgressRequirements = 0;

      crewMembers.forEach((m) => {
        const mProgress = progressList.filter((p) => p.memberId === m.id);

        mProgress.forEach((p) => {
          const req = syllabus.find((s) => s.id === p.requirementId);
          const reqTasks = req?.tasks.length || 1;
          const completedCount = p.completedTasks.length;

          if (p.status === 'Verified' || p.status === 'Completed') {
            verifiedRequirements++;
          } else if (p.status === 'Submitted') {
            submittedRequirements++;
          } else if (p.status === 'In Progress') {
            inProgressRequirements++;
          }

          totalTasksPossible += reqTasks;
          totalTasksCompleted += completedCount;

          if (m.section === 'Explorer') {
            explorerTasksPossible += reqTasks;
            explorerTasksCompleted += completedCount;
          } else {
            roverTasksPossible += reqTasks;
            roverTasksCompleted += completedCount;
          }
        });
      });

      const overallCompletionPct =
        totalTasksPossible > 0
          ? Math.round((totalTasksCompleted / totalTasksPossible) * 100)
          : 0;

      const explorerCompletionPct =
        explorerTasksPossible > 0
          ? Math.round((explorerTasksCompleted / explorerTasksPossible) * 100)
          : 0;

      const roverCompletionPct =
        roverTasksPossible > 0
          ? Math.round((roverTasksCompleted / roverTasksPossible) * 100)
          : 0;

      return {
        id: crew.id,
        name: crew.name.replace(' City Crew', '').replace(' Crew', ''),
        fullName: crew.name,
        location: crew.location,
        totalMembers: crewMembers.length,
        explorerCount: explorerMembers.length,
        roverCount: roverMembers.length,
        overallCompletionPct,
        explorerCompletionPct,
        roverCompletionPct,
        totalTasksCompleted,
        totalTasksPossible,
        verifiedRequirements,
        submittedRequirements,
        inProgressRequirements,
      };
    });

    return result;
  }, [crews, members, syllabus, progressList, selectedSectionFilter]);

  // Distribution chart data across overall status
  const distributionData = useMemo(() => {
    let verified = 0;
    let submitted = 0;
    let inProgress = 0;
    let notStarted = 0;

    progressList.forEach((p) => {
      if (p.status === 'Verified' || p.status === 'Completed') verified++;
      else if (p.status === 'Submitted') submitted++;
      else if (p.status === 'In Progress') inProgress++;
      else notStarted++;
    });

    return [
      { name: 'Verified / Completed', value: verified, color: '#10B981' }, // Emerald
      { name: 'Pending Review', value: submitted, color: '#F59E0B' }, // Amber
      { name: 'In Progress', value: inProgress, color: '#3B82F6' }, // Blue
      { name: 'Not Started', value: notStarted, color: '#64748B' }, // Slate
    ];
  }, [progressList]);

  // Overall average completion rate across network
  const averageCompletionPct = useMemo(() => {
    if (crewStats.length === 0) return 0;
    const sum = crewStats.reduce((acc, c) => acc + c.overallCompletionPct, 0);
    return Math.round(sum / crewStats.length);
  }, [crewStats]);

  const COLORS = ['#10B981', '#F59E0B', '#0EA5E9', '#8B5CF6', '#EC4899'];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[#006B3F] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4 text-[#006B3F]" />
            <span>Sub-Crew Progression Analytics</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Progression Award Completion Rates</span>
            <span className="text-xs font-mono font-medium bg-emerald-50 text-[#006B3F] border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Avg {averageCompletionPct}% Network Rate
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            President's Scout & Baden-Powell Award syllabus completion rates across sub-crews.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Section Filter */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 flex items-center text-xs">
            {(['All', 'Explorer', 'Rover'] as const).map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSectionFilter(sec)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  selectedSectionFilter === sec
                    ? 'bg-[#002B7F] text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sec === 'All' ? 'All Sections' : sec}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 flex items-center text-xs">
            <button
              onClick={() => setActiveView('bar')}
              title="Overall Completion %"
              className={`p-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                activeView === 'bar'
                  ? 'bg-white text-[#002B7F] font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </button>
            <button
              onClick={() => setActiveView('grouped')}
              title="Explorer vs Rover Section Breakdown"
              className={`p-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                activeView === 'grouped'
                  ? 'bg-white text-[#002B7F] font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">By Section</span>
            </button>
            <button
              onClick={() => setActiveView('distribution')}
              title="Overall Status Distribution"
              className={`p-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                activeView === 'distribution'
                  ? 'bg-white text-[#002B7F] font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {activeView === 'bar' ? (
            <BarChart
              data={crewStats}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.7} />
              <XAxis
                dataKey="name"
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                domain={[0, 100]}
                unit="%"
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-xs space-y-1.5">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#006B3F]" />
                          {data.fullName}
                        </p>
                        <p className="text-slate-700">
                          Overall Award Completion:{' '}
                          <span className="font-mono font-bold text-[#006B3F]">
                            {data.overallCompletionPct}%
                          </span>
                        </p>
                        <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-1 space-y-0.5 font-mono">
                          <p>Active Rovers & Explorers: {data.totalMembers}</p>
                          <p>
                            Tasks Completed: {data.totalTasksCompleted} / {data.totalTasksPossible}
                          </p>
                          <p>Verified Requirements: {data.verifiedRequirements}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="overallCompletionPct" radius={[8, 8, 0, 0]} name="Award Completion %">
                {crewStats.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : activeView === 'grouped' ? (
            <BarChart
              data={crewStats}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.7} />
              <XAxis
                dataKey="name"
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                domain={[0, 100]}
                unit="%"
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-xs space-y-1.5">
                        <p className="font-bold text-slate-900">{data.fullName}</p>
                        <p className="text-amber-700 font-mono">
                          Explorer Section Rate: <span className="font-bold">{data.explorerCompletionPct}%</span> ({data.explorerCount} members)
                        </p>
                        <p className="text-[#002B7F] font-mono">
                          Rover Section Rate: <span className="font-bold">{data.roverCompletionPct}%</span> ({data.roverCount} members)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-slate-700 font-medium">{value}</span>
                )}
              />
              <Bar
                dataKey="explorerCompletionPct"
                name="Explorer Section (President's Scout)"
                fill="#D97706"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="roverCompletionPct"
                name="Rover Section (BP Award)"
                fill="#002B7F"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg text-xs">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: data.color }}
                          />
                          {data.name}
                        </p>
                        <p className="text-slate-700 font-mono mt-1">
                          {data.value} Requirements ({Math.round((data.value / (progressList.length || 1)) * 100)}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-slate-700 font-medium">{value}</span>
                )}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Sub-Crew Metric Pills Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
        {crewStats.map((c) => (
          <div
            key={c.id}
            onClick={() => onNavigateTab && onNavigateTab('syllabus')}
            className="bg-slate-50 border border-slate-200 hover:border-[#002B7F]/40 p-3 rounded-xl cursor-pointer transition flex items-center justify-between group shadow-2xs"
          >
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-[#002B7F] transition">
                {c.fullName}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                {c.totalMembers} Members • {c.verifiedRequirements} Verified
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-bold font-mono text-[#006B3F]">
                {c.overallCompletionPct}%
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Completed</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
