import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  CrewEvent,
  AttendanceRecord,
  AttendanceStatus,
  Member,
  SubCrew,
} from '../types';
import {
  CheckSquare,
  Shield,
  Filter,
  Save,
  BarChart2,
  Calendar,
  Users,
  FileText,
  Download,
  Search,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Printer,
  Copy,
  Check,
  Flag,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Zap,
  Eye,
  FileCheck,
  X,
} from 'lucide-react';

export interface CouncilFlagRecord {
  memberId: string;
  flaggedAt: string;
  flaggedBy: string;
  status: 'Pending Council Review' | 'Formal Notice Issued' | 'Counseled & Resolved' | 'Exempted';
  notes: string;
  attendancePct: number;
  unexcusedCount: number;
}

interface AttendancePortalProps {
  events: CrewEvent[];
  attendance: AttendanceRecord[];
  members: Member[];
  crews: SubCrew[];
  currentMember: Member;
  onSaveAttendance: (records: AttendanceRecord[]) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5">
        <p className="font-bold text-slate-100">{dataItem.eventTitle}</p>
        <p className="text-[10px] text-slate-400 font-mono">Assembly Date: {dataItem.date}</p>
        <div className="pt-1.5 border-t border-slate-800 space-y-1">
          <div className="text-emerald-400 font-semibold flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              Present:
            </span>
            <span className="font-mono">{dataItem.Present}</span>
          </div>
          <div className="text-blue-400 font-semibold flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
              Excused:
            </span>
            <span className="font-mono">{dataItem.Excused}</span>
          </div>
          <div className="text-rose-400 font-semibold flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
              Unexcused:
            </span>
            <span className="font-mono">{dataItem.Unexcused}</span>
          </div>
          <div className="text-amber-400 font-semibold flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              Exempt:
            </span>
            <span className="font-mono">{dataItem.Exempt}</span>
          </div>
          <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center gap-6 font-mono font-bold text-emerald-300 text-[11px]">
            <span>Turnout Rate:</span> <span>{dataItem.AttendanceRate}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const AttendancePortal: React.FC<AttendancePortalProps> = ({
  events = [],
  attendance = [],
  members = [],
  crews = [],
  currentMember,
  onSaveAttendance,
}) => {
  const isCouncil = currentMember.councilRole !== 'Member';

  // Active View Tab: 'mark' or 'reports'
  const [activePortalTab, setActivePortalTab] = useState<'mark' | 'reports'>('mark');

  // Attendance Sheet state
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [filterCrewId, setFilterCrewId] = useState<string>('All');
  const [filterSection, setFilterSection] = useState<'All' | 'Explorer' | 'Rover'>('All');

  // Chart state
  const [chartCrewId, setChartCrewId] = useState<string>(currentMember.crewId || 'All');
  const [timePeriod, setTimePeriod] = useState<'30days' | '90days' | '6months' | 'all' | 'custom'>('90days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [chartType, setChartType] = useState<'stacked' | 'grouped'>('stacked');

  // CUSTOM REPORT MODULE STATE
  const [reportPeriod, setReportPeriod] = useState<'30days' | '90days' | 'term' | 'all' | 'custom'>('all');
  const [reportCrewId, setReportCrewId] = useState<string>('All');
  const [reportSection, setReportSection] = useState<'All' | 'Explorer' | 'Rover'>('All');
  const [reportEventType, setReportEventType] = useState<string>('All');
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');
  const [reportSortBy, setReportSortBy] = useState<
    'absent_desc' | 'excused_desc' | 'present_desc' | 'name_asc' | 'rate_asc'
  >('absent_desc');
  const [reportCustomStart, setReportCustomStart] = useState<string>('');
  const [reportCustomEnd, setReportCustomEnd] = useState<string>('');

  // Expanded member detailed drilldown state
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  // Selected Event for "Who Came vs Who Didn't" Drilldown
  const [drilldownEventId, setDrilldownEventId] = useState<string>(events[0]?.id || '');

  // Copy report feedback
  const [copiedReport, setCopiedReport] = useState(false);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  // Local state for attendance edits before saving
  const [localAttendanceMap, setLocalAttendanceMap] = useState<
    Record<string, { status: AttendanceStatus; reason?: string }>
  >({});

  // Compute chart data and period analytics
  const { chartData, periodStats } = useMemo(() => {
    let startBound: Date | null = null;
    let endBound: Date | null = null;

    const now = new Date();

    if (timePeriod === '30days') {
      startBound = new Date();
      startBound.setDate(now.getDate() - 30);
    } else if (timePeriod === '90days') {
      startBound = new Date();
      startBound.setDate(now.getDate() - 90);
    } else if (timePeriod === '6months') {
      startBound = new Date();
      startBound.setMonth(now.getMonth() - 6);
    } else if (timePeriod === 'custom') {
      if (customStartDate) startBound = new Date(customStartDate);
      if (customEndDate) {
        endBound = new Date(customEndDate);
        endBound.setHours(23, 59, 59, 999);
      }
    }

    const relevantMemberIds = new Set(
      members
        .filter((m) => {
          if (m.status !== 'Active') return false;
          if (chartCrewId !== 'All' && m.crewId !== chartCrewId) return false;
          return true;
        })
        .map((m) => m.id)
    );

    const filteredEvents = events
      .filter((ev) => {
        const evDate = new Date(ev.startDate);
        if (startBound && evDate < startBound) return false;
        if (endBound && evDate > endBound) return false;

        if (chartCrewId !== 'All') {
          if (ev.crewId !== 'all' && ev.crewId !== chartCrewId) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    let totalPresentCount = 0;
    let totalExcusedCount = 0;
    let totalUnexcusedCount = 0;
    let totalExemptCount = 0;

    const data = filteredEvents.map((ev) => {
      const evRecords = attendance.filter(
        (a) => a.eventId === ev.id && relevantMemberIds.has(a.memberId)
      );

      let present = 0;
      let excused = 0;
      let unexcused = 0;
      let exempt = 0;

      evRecords.forEach((rec) => {
        if (rec.status === 'Present') present++;
        else if (rec.status === 'Excused') excused++;
        else if (rec.status === 'Unexcused') unexcused++;
        else if (rec.status === 'Exempt') exempt++;
      });

      if (evRecords.length === 0 && ev.id === selectedEventId) {
        (Object.entries(localAttendanceMap) as Array<[string, { status: AttendanceStatus; reason?: string }]>).forEach(([mId, d]) => {
          if (relevantMemberIds.has(mId)) {
            if (d.status === 'Present') present++;
            else if (d.status === 'Excused') excused++;
            else if (d.status === 'Unexcused') unexcused++;
            else if (d.status === 'Exempt') exempt++;
          }
        });
      }

      totalPresentCount += present;
      totalExcusedCount += excused;
      totalUnexcusedCount += unexcused;
      totalExemptCount += exempt;

      const totalRecorded = present + excused + unexcused + exempt;
      const rate = totalRecorded > 0 ? Math.round((present / totalRecorded) * 100) : 0;

      const dateObj = new Date(ev.startDate);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      return {
        eventId: ev.id,
        eventTitle: ev.title,
        displayLabel: `${formattedDate}: ${ev.title.length > 12 ? ev.title.slice(0, 12) + '…' : ev.title}`,
        date: formattedDate,
        Present: present,
        Excused: excused,
        Unexcused: unexcused,
        Exempt: exempt,
        AttendanceRate: rate,
        totalRecorded,
      };
    });

    const grandTotal = totalPresentCount + totalExcusedCount + totalUnexcusedCount + totalExemptCount;
    const overallPresentRate = grandTotal > 0 ? Math.round((totalPresentCount / grandTotal) * 100) : 0;
    const overallUnexcusedRate = grandTotal > 0 ? Math.round((totalUnexcusedCount / grandTotal) * 100) : 0;
    const avgAttendancePerEvent =
      filteredEvents.length > 0 ? (totalPresentCount / filteredEvents.length).toFixed(1) : '0';

    return {
      chartData: data,
      periodStats: {
        totalEvents: filteredEvents.length,
        overallPresentRate,
        overallUnexcusedRate,
        avgAttendancePerEvent,
      },
    };
  }, [
    events,
    attendance,
    members,
    timePeriod,
    customStartDate,
    customEndDate,
    chartCrewId,
    selectedEventId,
    localAttendanceMap,
  ]);

  // Initialize local map whenever selected event changes
  React.useEffect(() => {
    if (!selectedEventId) return;

    const initialMap: Record<string, { status: AttendanceStatus; reason?: string }> = {};

    members.forEach((m) => {
      const existing = attendance.find(
        (a) => a.eventId === selectedEventId && a.memberId === m.id
      );

      if (existing) {
        initialMap[m.id] = { status: existing.status, reason: existing.exemptionReason };
      } else {
        const isExemptRole = Boolean(m.isSuperAdmin || m.councilRole === 'Superadmin' || m.councilRole === 'Rover Advisor');
        if (isExemptRole) {
          initialMap[m.id] = {
            status: 'Exempt',
            reason: m.isSuperAdmin || m.councilRole === 'Superadmin' ? 'Exempt: National Superadmin' : 'Exempt: Rover Advisor Governance',
          };
        } else if (
          selectedEvent &&
          selectedEvent.crewId !== 'all' &&
          selectedEvent.crewId !== m.crewId
        ) {
          initialMap[m.id] = {
            status: 'Exempt',
            reason: `Out-of-region: Member assigned to ${m.crewName}`,
          };
        } else {
          initialMap[m.id] = { status: 'Present' };
        }
      }
    });

    setLocalAttendanceMap(initialMap);
  }, [selectedEventId, attendance, members]);

  const handleStatusChange = (memberId: string, status: AttendanceStatus) => {
    let reason = localAttendanceMap[memberId]?.reason;
    if (status === 'Excused' && !reason) {
      const input = prompt('Enter official excuse reason (e.g. University exam, Illness):');
      reason = input || 'Official Excuse';
    }

    setLocalAttendanceMap((prev) => ({
      ...prev,
      [memberId]: { status, reason },
    }));
  };

  const handleSave = () => {
    if (!selectedEventId) return;

    const now = new Date().toISOString();
    const updatedRecords: AttendanceRecord[] = (
      Object.entries(localAttendanceMap) as Array<[string, { status: AttendanceStatus; reason?: string }]>
    ).map(([memberId, data]) => {
      const existing = attendance.find(
        (a) => a.eventId === selectedEventId && a.memberId === memberId
      );

      return {
        id: existing ? existing.id : `att-${Date.now()}-${memberId}`,
        eventId: selectedEventId,
        memberId,
        status: data.status,
        exemptionReason: data.reason,
        markedAt: now,
        markedBy: currentMember.name,
      };
    });

    onSaveAttendance(updatedRecords);
    alert('Attendance records saved and member stats updated successfully!');
  };

  // Filter members for attendance sheet
  const displayMembers = members.filter((m) => {
    if (m.status !== 'Active') return false;
    if (filterCrewId !== 'All' && m.crewId !== filterCrewId) return false;
    if (filterSection !== 'All' && m.section !== filterSection) return false;
    return true;
  });

  // =========================================================================
  // CUSTOM ATTENDANCE REPORT CALCULATION & FILTERING ENGINE
  // =========================================================================
  const { memberReportList, reportScopeStats, scopeFilteredEvents } = useMemo(() => {
    let startBound: Date | null = null;
    let endBound: Date | null = null;
    const now = new Date();

    if (reportPeriod === '30days') {
      startBound = new Date();
      startBound.setDate(now.getDate() - 30);
    } else if (reportPeriod === '90days') {
      startBound = new Date();
      startBound.setDate(now.getDate() - 90);
    } else if (reportPeriod === 'term') {
      startBound = new Date('2025-01-01');
    } else if (reportPeriod === 'custom') {
      if (reportCustomStart) startBound = new Date(reportCustomStart);
      if (reportCustomEnd) {
        endBound = new Date(reportCustomEnd);
        endBound.setHours(23, 59, 59, 999);
      }
    }

    // Filter relevant events for this report scope
    const relEvents = events.filter((ev) => {
      const evDate = new Date(ev.startDate);
      if (startBound && evDate < startBound) return false;
      if (endBound && evDate > endBound) return false;

      if (reportCrewId !== 'All' && ev.crewId !== 'all' && ev.crewId !== reportCrewId) {
        return false;
      }
      if (reportEventType !== 'All' && ev.type !== reportEventType) {
        return false;
      }
      return true;
    });

    const relEventIds = new Set(relEvents.map((e) => e.id));

    // Filter members for report
    const targetMembers = members.filter((m) => {
      if (reportCrewId !== 'All' && m.crewId !== reportCrewId) return false;
      if (reportSection !== 'All' && m.section !== reportSection) return false;
      if (reportSearchQuery.trim()) {
        const q = reportSearchQuery.toLowerCase();
        const matchName = (m.name || '').toLowerCase().includes(q);
        const matchId = (m.idCard || '').toLowerCase().includes(q);
        const matchEmail = (m.email || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchEmail) return false;
      }
      return true;
    });

    let globalPresentCount = 0;
    let globalUnexcusedCount = 0;
    let globalExcusedCount = 0;
    let globalExemptCount = 0;

    const list = targetMembers.map((m) => {
      const isExemptRole = Boolean(m.isSuperAdmin || m.councilRole === 'Superadmin' || m.councilRole === 'Rover Advisor');

      // Find all records for this member in relEvents
      const mRecords = attendance.filter(
        (a) => a.memberId === m.id && relEventIds.has(a.eventId)
      );

      let presentCount = 0;
      let excusedCount = 0;
      let unexcusedCount = 0;
      let exemptCount = 0;

      const recordMap: Record<string, { status: AttendanceStatus; reason?: string }> = {};

      relEvents.forEach((ev) => {
        const rec = mRecords.find((r) => r.eventId === ev.id);
        if (rec) {
          recordMap[ev.id] = { status: rec.status, reason: rec.exemptionReason };
          if (rec.status === 'Present') presentCount++;
          else if (rec.status === 'Excused') excusedCount++;
          else if (rec.status === 'Unexcused') unexcusedCount++;
          else if (rec.status === 'Exempt') exemptCount++;
        } else {
          if (isExemptRole) {
            recordMap[ev.id] = {
              status: 'Exempt',
              reason: m.isSuperAdmin || m.councilRole === 'Superadmin' ? 'Exempt: National Superadmin' : 'Exempt: Rover Advisor Governance',
            };
            exemptCount++;
          } else if (ev.crewId !== 'all' && ev.crewId !== m.crewId) {
            recordMap[ev.id] = { status: 'Exempt', reason: 'Out-of-region default' };
            exemptCount++;
          } else {
            recordMap[ev.id] = { status: 'Present' }; // default benchmark or unrecorded
            presentCount++;
          }
        }
      });

      const totalAssemblies = relEvents.length;
      // Evaluate percentage against non-exempt or total assemblies
      const evaluatedAssemblies = totalAssemblies - exemptCount;
      const effectiveTotal = evaluatedAssemblies > 0 ? evaluatedAssemblies : 1;

      const presentPct = isExemptRole ? 100 : (totalAssemblies > 0 ? Math.round((presentCount / effectiveTotal) * 100) : 0);
      const unexcusedPct = isExemptRole ? 0 : (totalAssemblies > 0 ? Math.round((unexcusedCount / effectiveTotal) * 100) : 0);
      const excusedPct = isExemptRole ? 0 : (totalAssemblies > 0 ? Math.round((excusedCount / effectiveTotal) * 100) : 0);
      const exemptPct = isExemptRole ? 100 : (totalAssemblies > 0 ? Math.round((exemptCount / (totalAssemblies || 1)) * 100) : 0);

      globalPresentCount += presentCount;
      globalUnexcusedCount += unexcusedCount;
      globalExcusedCount += excusedCount;
      globalExemptCount += exemptCount;

      let turnoutRating: 'Exemplary' | 'Satisfactory' | 'Needs Review' | 'At Risk' = 'Satisfactory';
      if (isExemptRole) {
        turnoutRating = 'Exemplary';
      } else if (unexcusedCount >= 3 || presentPct < 50) {
        turnoutRating = 'At Risk';
      } else if (presentPct >= 85) {
        turnoutRating = 'Exemplary';
      } else if (presentPct >= 70) {
        turnoutRating = 'Satisfactory';
      } else {
        turnoutRating = 'Needs Review';
      }

      return {
        member: m,
        isExemptRole,
        totalAssemblies,
        presentCount,
        presentPct,
        unexcusedCount,
        unexcusedPct,
        excusedCount,
        excusedPct,
        exemptCount,
        exemptPct,
        turnoutRating,
        eventRecordMap: recordMap,
      };
    });

    // Sort list based on selected sort criteria
    list.sort((a, b) => {
      if (reportSortBy === 'absent_desc') {
        if (b.unexcusedCount !== a.unexcusedCount) return b.unexcusedCount - a.unexcusedCount;
        return b.unexcusedPct - a.unexcusedPct;
      }
      if (reportSortBy === 'excused_desc') {
        if (b.excusedCount !== a.excusedCount) return b.excusedCount - a.excusedCount;
        return b.excusedPct - a.excusedPct;
      }
      if (reportSortBy === 'present_desc') {
        return b.presentPct - a.presentPct;
      }
      if (reportSortBy === 'rate_asc') {
        return a.presentPct - b.presentPct;
      }
      if (reportSortBy === 'name_asc') {
        return a.member.name.localeCompare(b.member.name);
      }
      return 0;
    });

    const totalEvaluations = globalPresentCount + globalUnexcusedCount + globalExcusedCount + globalExemptCount;
    const avgPresentRate = totalEvaluations > 0 ? Math.round((globalPresentCount / (totalEvaluations - globalExemptCount || 1)) * 100) : 0;

    return {
      memberReportList: list,
      scopeFilteredEvents: relEvents,
      reportScopeStats: {
        totalEvents: relEvents.length,
        totalMembers: targetMembers.length,
        avgPresentRate,
        totalUnexcused: globalUnexcusedCount,
        totalExcused: globalExcusedCount,
      },
    };
  }, [
    members,
    events,
    attendance,
    reportPeriod,
    reportCrewId,
    reportSection,
    reportEventType,
    reportSearchQuery,
    reportSortBy,
    reportCustomStart,
    reportCustomEnd,
  ]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (memberReportList.length === 0) {
      alert('No member records found for the current report filter.');
      return;
    }

    const headers = [
      'Member ID',
      'Full Name',
      'ID Card',
      'Sub-Crew',
      'Section',
      'Council Role',
      'Total Assemblies',
      'Present Count',
      'Present %',
      'Absent (Unexcused) Count',
      'Absent (Unexcused) %',
      'Excused Count',
      'Excused %',
      'Exempt Count',
      'Exempt %',
      'Turnout Rating',
    ];

    const rows = memberReportList.map((item) => [
      item.member.id,
      `"${item.member.name}"`,
      item.member.idCard,
      `"${item.member.crewName}"`,
      item.member.section,
      `"${item.member.councilRole}"`,
      item.totalAssemblies,
      item.presentCount,
      `${item.presentPct}%`,
      item.unexcusedCount,
      `${item.unexcusedPct}%`,
      item.excusedCount,
      `${item.excusedPct}%`,
      item.exemptCount,
      `${item.exemptPct}%`,
      item.turnoutRating,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Crew_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Executive Report Text Handler
  const handleCopySummary = () => {
    const text = `=== CREW ATTENDANCE & ABSENTEE REPORT ===
Generated Date: ${new Date().toLocaleDateString()}
Evaluated Assemblies: ${reportScopeStats.totalEvents} Events
Target Members: ${reportScopeStats.totalMembers} Members
Average Turnout Rate: ${reportScopeStats.avgPresentRate}%
Total Unexcused Absences: ${reportScopeStats.totalUnexcused}
Total Excused Absences: ${reportScopeStats.totalExcused}

--- MEMBER PERCENTAGE BREAKDOWN ---
${memberReportList
  .map(
    (item) =>
      `• ${item.member.name} (${item.member.crewName}) | Present: ${item.presentCount} (${item.presentPct}%) | Absent/Unexcused: ${item.unexcusedCount} (${item.unexcusedPct}%) | Excused: ${item.excusedCount} (${item.excusedPct}%) | Rating: ${item.turnoutRating}`
  )
  .join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  // AUTOMATED LOW ATTENDANCE GENERATOR & COUNCIL REVIEW STATE
  const [attendanceThreshold, setAttendanceThreshold] = useState<number>(50);
  const [reportViewFilter, setReportViewFilter] = useState<'all' | 'low_attendance' | 'flagged_only' | 'pending_review'>('all');

  const [flaggedMap, setFlaggedMap] = useState<Record<string, CouncilFlagRecord>>(() => {
    try {
      const saved = localStorage.getItem('kushafah_flagged_attendance');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load flagged attendance map', e);
    }
    return {};
  });

  const saveFlaggedMap = (newMap: Record<string, CouncilFlagRecord>) => {
    setFlaggedMap(newMap);
    try {
      localStorage.setItem('kushafah_flagged_attendance', JSON.stringify(newMap));
    } catch (e) {
      console.error('Failed to save flagged attendance map', e);
    }
  };

  // Council Notice Modal State
  const [noticeMember, setNoticeMember] = useState<{
    member: Member;
    presentPct: number;
    unexcusedCount: number;
    totalAssemblies: number;
    presentCount: number;
  } | null>(null);
  const [noticeNotes, setNoticeNotes] = useState<string>('');
  const [noticeStatus, setNoticeStatus] = useState<'Pending Council Review' | 'Formal Notice Issued' | 'Counseled & Resolved' | 'Exempted'>('Pending Council Review');
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Filtered member report list based on low attendance view filter
  const filteredReportList = useMemo(() => {
    return memberReportList.filter((item) => {
      const isLow = !item.isExemptRole && item.presentPct < attendanceThreshold;
      const flag = flaggedMap[item.member.id];
      const isFlagged = Boolean(flag);

      if (reportViewFilter === 'low_attendance' && !isLow) return false;
      if (reportViewFilter === 'flagged_only' && !isFlagged) return false;
      if (reportViewFilter === 'pending_review' && flag?.status !== 'Pending Council Review') return false;

      return true;
    });
  }, [memberReportList, attendanceThreshold, flaggedMap, reportViewFilter]);

  // Low attendance & Council Governance Counts
  const lowAttendanceCount = useMemo(() => {
    return memberReportList.filter((m) => !m.isExemptRole && m.presentPct < attendanceThreshold).length;
  }, [memberReportList, attendanceThreshold]);

  const flaggedCount = useMemo(() => {
    return Object.keys(flaggedMap).length;
  }, [flaggedMap]);

  const pendingActionCount = useMemo(() => {
    return (Object.values(flaggedMap) as CouncilFlagRecord[]).filter((f) => f.status === 'Pending Council Review').length;
  }, [flaggedMap]);

  const counseledCount = useMemo(() => {
    return (Object.values(flaggedMap) as CouncilFlagRecord[]).filter((f) => f.status === 'Counseled & Resolved' || f.status === 'Exempted').length;
  }, [flaggedMap]);

  // Automated Batch Flagging
  const handleBatchFlagLowAttendance = () => {
    const lowMembers = memberReportList.filter((m) => !m.isExemptRole && m.presentPct < attendanceThreshold);
    if (lowMembers.length === 0) {
      alert(`No members identified with attendance below ${attendanceThreshold}%.`);
      return;
    }

    const updated = { ...flaggedMap };
    let newFlagCount = 0;

    lowMembers.forEach((item) => {
      if (!updated[item.member.id]) {
        updated[item.member.id] = {
          memberId: item.member.id,
          flaggedAt: new Date().toISOString().split('T')[0],
          flaggedBy: currentMember.name,
          status: 'Pending Council Review',
          notes: `Automated Flag: Recorded ${item.presentPct}% turnout (<${attendanceThreshold}% cutoff) with ${item.unexcusedCount} unexcused absence(s).`,
          attendancePct: item.presentPct,
          unexcusedCount: item.unexcusedCount,
        };
        newFlagCount++;
      }
    });

    saveFlaggedMap(updated);
    alert(`Automated Generator flagged ${newFlagCount} member(s) for Council review!`);
  };

  // Toggle single member flag
  const handleToggleFlagMember = (item: typeof memberReportList[0]) => {
    const existing = flaggedMap[item.member.id];
    const updated = { ...flaggedMap };

    if (existing) {
      if (confirm(`Remove Council Review flag for ${item.member.name}?`)) {
        delete updated[item.member.id];
        saveFlaggedMap(updated);
      }
    } else {
      updated[item.member.id] = {
        memberId: item.member.id,
        flaggedAt: new Date().toISOString().split('T')[0],
        flaggedBy: currentMember.name,
        status: 'Pending Council Review',
        notes: `Identified with low attendance (${item.presentPct}%) across ${item.totalAssemblies} assemblies.`,
        attendancePct: item.presentPct,
        unexcusedCount: item.unexcusedCount,
      };
      saveFlaggedMap(updated);
    }
  };

  // Open Council Review Notice Modal
  const handleOpenNoticeModal = (item: typeof memberReportList[0]) => {
    const existingFlag = flaggedMap[item.member.id];
    setNoticeMember({
      member: item.member,
      presentPct: item.presentPct,
      unexcusedCount: item.unexcusedCount,
      totalAssemblies: item.totalAssemblies,
      presentCount: item.presentCount,
    });
    setNoticeStatus(existingFlag?.status || 'Pending Council Review');
    setNoticeNotes(
      existingFlag?.notes ||
        `Automated Low Attendance Flag: ${item.member.name} recorded ${item.presentPct}% attendance across ${item.totalAssemblies} assemblies (<${attendanceThreshold}% threshold) with ${item.unexcusedCount} unexcused absence(s). Recommended for Council counseling and crew advisor review.`
    );
    setCopiedNotice(false);
  };

  // Save notice updates
  const handleSaveNotice = () => {
    if (!noticeMember) return;
    const updated = { ...flaggedMap };
    updated[noticeMember.member.id] = {
      memberId: noticeMember.member.id,
      flaggedAt: flaggedMap[noticeMember.member.id]?.flaggedAt || new Date().toISOString().split('T')[0],
      flaggedBy: flaggedMap[noticeMember.member.id]?.flaggedBy || currentMember.name,
      status: noticeStatus,
      notes: noticeNotes,
      attendancePct: noticeMember.presentPct,
      unexcusedCount: noticeMember.unexcusedCount,
    };
    saveFlaggedMap(updated);
    setNoticeMember(null);
    alert(`Council review record saved for ${noticeMember.member.name}!`);
  };

  // Copy notice text to clipboard
  const handleCopyNoticeText = () => {
    if (!noticeMember) return;
    const text = `=====================================================
KUSHAFAH ROVER CREW - COUNCIL ATTENDANCE REVIEW NOTICE
=====================================================
Date Generated: ${new Date().toLocaleDateString()}
Issued By: ${currentMember.name} (${currentMember.councilRole})

MEMBER DETAILS:
- Name: ${noticeMember.member.name}
- ID Card: ${noticeMember.member.idCard}
- Sub-Crew: ${noticeMember.member.crewName} (${noticeMember.member.section})
- Council Role: ${noticeMember.member.councilRole}

ATTENDANCE PERFORMANCE ANALYTICS:
- Assemblies Evaluated: ${noticeMember.totalAssemblies}
- Present Assemblies: ${noticeMember.presentCount}
- Overall Turnout Rate: ${noticeMember.presentPct}% (Threshold Cutoff: <${attendanceThreshold}%)
- Unexcused Absences: ${noticeMember.unexcusedCount}

COUNCIL REVIEW STATUS: ${noticeStatus}

COUNCIL NOTES & RECOMMENDATIONS:
${noticeNotes}

GOVERNANCE REFERENCE: Rover Operating Policy Article 14 (Attendance Compliance)
=====================================================`;

    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  // Export Low Attendance & Council Review CSV
  const handleExportLowAttendanceCSV = () => {
    const lowOrFlagged = memberReportList.filter(
      (item) => item.presentPct < attendanceThreshold || flaggedMap[item.member.id]
    );

    if (lowOrFlagged.length === 0) {
      alert(`No members currently meet the low attendance (<${attendanceThreshold}%) or flagged criteria.`);
      return;
    }

    const headers = [
      'Member ID',
      'Full Name',
      'ID Card',
      'Sub-Crew',
      'Section',
      'Attendance %',
      'Evaluated Assemblies',
      'Present Count',
      'Unexcused Absences',
      'Council Flagged Status',
      'Flagged Date',
      'Flagged By',
      'Council Review Notes',
    ];

    const rows = lowOrFlagged.map((item) => {
      const flag = flaggedMap[item.member.id];
      return [
        item.member.id,
        `"${item.member.name.replace(/"/g, '""')}"`,
        item.member.idCard,
        `"${item.member.crewName.replace(/"/g, '""')}"`,
        item.member.section,
        `${item.presentPct}%`,
        item.totalAssemblies,
        item.presentCount,
        item.unexcusedCount,
        flag ? flag.status : 'Below Cutoff (Unflagged)',
        flag ? flag.flaggedAt : '--',
        flag ? `"${flag.flaggedBy.replace(/"/g, '""')}"` : '--',
        flag ? `"${flag.notes.replace(/"/g, '""')}"` : '--',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kushafah_Low_Attendance_Council_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Council Governance Summary
  const handleCopyCouncilGovernanceReport = () => {
    const lowAttendanceList = memberReportList.filter(
      (m) => m.presentPct < attendanceThreshold || flaggedMap[m.member.id]
    );

    const reportLines = [
      `=====================================================`,
      `KUSHAFAH ROVER CREW - LOW ATTENDANCE & COUNCIL REVIEW SUMMARY`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Evaluated Threshold: <${attendanceThreshold}% Attendance`,
      `=====================================================`,
      `Total Members Evaluated: ${memberReportList.length}`,
      `Members Below Cutoff (<${attendanceThreshold}%): ${lowAttendanceCount}`,
      `Total Members Flagged for Council Review: ${flaggedCount}`,
      `Pending Council Actions: ${pendingActionCount}`,
      `=====================================================`,
      `LOW ATTENDANCE & FLAGGED ROSTER:`,
      ...lowAttendanceList.map((item, idx) => {
        const flag = flaggedMap[item.member.id];
        return `${idx + 1}. ${item.member.name} (${item.member.crewName} - ${item.member.section})
   - Turnout Rate: ${item.presentPct}% | Unexcused Absences: ${item.unexcusedCount}
   - Council Flag Status: ${flag ? flag.status : 'Below Cutoff (Unflagged)'}
   - Notes: ${flag?.notes || 'Requires initial review'}`;
      }),
      `=====================================================`,
      `Report Generated via Attendance Governance Portal`,
    ];

    navigator.clipboard.writeText(reportLines.join('\n'));
    alert('Council Low Attendance Summary copied to clipboard!');
  };

  // Drilldown event details for "Who Came vs Who Didn't"
  const currentDrilldownEvent = events.find((e) => e.id === drilldownEventId) || events[0];
  const drilldownData = useMemo(() => {
    if (!currentDrilldownEvent) return { present: [], unexcused: [], excused: [], exempt: [] };

    const eventRecords = attendance.filter((a) => a.eventId === currentDrilldownEvent.id);

    const present: { member: Member; record?: AttendanceRecord }[] = [];
    const unexcused: { member: Member; record?: AttendanceRecord }[] = [];
    const excused: { member: Member; record?: AttendanceRecord }[] = [];
    const exempt: { member: Member; record?: AttendanceRecord }[] = [];

    members.forEach((m) => {
      if (m.status !== 'Active') return;
      const rec = eventRecords.find((r) => r.memberId === m.id);
      if (rec) {
        if (rec.status === 'Present') present.push({ member: m, record: rec });
        else if (rec.status === 'Unexcused') unexcused.push({ member: m, record: rec });
        else if (rec.status === 'Excused') excused.push({ member: m, record: rec });
        else if (rec.status === 'Exempt') exempt.push({ member: m, record: rec });
      } else {
        if (
          currentDrilldownEvent.crewId !== 'all' &&
          currentDrilldownEvent.crewId !== m.crewId
        ) {
          exempt.push({ member: m });
        } else {
          present.push({ member: m });
        }
      }
    });

    return { present, unexcused, excused, exempt };
  }, [currentDrilldownEvent, attendance, members]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Main Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1A1E26] border border-slate-800 p-5 rounded-2xl shadow-md">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-emerald-400" />
            Attendance & Custom Absentee Reports Portal
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mark live assembly attendance sheets and compute custom percentage reports on absent and excused members.
          </p>
        </div>

        {/* Tab Switcher: Mark Sheet vs Custom Reports */}
        <div className="flex items-center gap-2 bg-[#12151C] p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActivePortalTab('mark')}
            className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
              activePortalTab === 'mark'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Mark Attendance Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePortalTab('reports')}
            className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 relative ${
              activePortalTab === 'reports'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Custom Absentee Reports</span>
            <span className="bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full uppercase">
              Roster %
            </span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: MARK ATTENDANCE SHEET & TRENDS
         ========================================================================= */}
      {activePortalTab === 'mark' && (
        <div className="space-y-6">
          {/* Header Action */}
          <div className="flex justify-between items-center bg-[#1A1E26] border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-slate-300 font-medium">
              Editing Assembly: <span className="font-bold text-emerald-400">{selectedEvent?.title}</span>
            </div>

            {isCouncil ? (
              <button
                id="attendance-save-btn"
                onClick={handleSave}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Attendance & Update Roster Metrics</span>
              </button>
            ) : (
              <span className="bg-slate-800 text-slate-300 border border-slate-700 text-xs px-3.5 py-1.5 rounded-xl font-medium inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Read-Only Roll</span>
              </span>
            )}
          </div>

          {/* Active Crew Trends */}
          <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-emerald-400" />
                  Active Crew Turnout Visualizer
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Analyze attendance breakdown over custom time frames.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <div className="flex items-center gap-1.5 bg-[#161920] border border-slate-800 px-3 py-1.5 rounded-xl">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 hidden sm:inline">Crew:</span>
                  <select
                    value={chartCrewId}
                    onChange={(e) => setChartCrewId(e.target.value)}
                    className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Crews</option>
                    {crews.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-[#161920] border border-slate-800 px-3 py-1.5 rounded-xl">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 hidden sm:inline">Period:</span>
                  <select
                    value={timePeriod}
                    onChange={(e) => setTimePeriod(e.target.value as any)}
                    className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                    <option value="6months">Last 6 Months</option>
                    <option value="all">All Time</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setChartType(chartType === 'stacked' ? 'grouped' : 'stacked')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition text-xs border border-slate-700 cursor-pointer"
                >
                  {chartType === 'stacked' ? 'Stacked Bars' : 'Grouped Bars'}
                </button>
              </div>
            </div>

            {timePeriod === 'custom' && (
              <div className="bg-[#161920] border border-slate-800 p-3 rounded-xl flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <label className="text-slate-400 font-medium">Start Date:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-[#1A1E26] border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-slate-400 font-medium">End Date:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-[#1A1E26] border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#161920] border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Assemblies in Scope</span>
                <span className="text-lg font-bold text-slate-100 font-mono">{periodStats.totalEvents}</span>
              </div>
              <div className="bg-[#161920] border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Overall Turnout</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">{periodStats.overallPresentRate}%</span>
              </div>
              <div className="bg-[#161920] border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Avg Present / Event</span>
                <span className="text-lg font-bold text-sky-400 font-mono">{periodStats.avgAttendancePerEvent}</span>
              </div>
              <div className="bg-[#161920] border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Unexcused Rate</span>
                <span className="text-lg font-bold text-rose-400 font-mono">{periodStats.overallUnexcusedRate}%</span>
              </div>
            </div>

            <div className="w-full h-[260px] bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 pt-5">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis
                      dataKey="displayLabel"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                      angle={-12}
                      textAnchor="end"
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar
                      dataKey="Present"
                      name="Present"
                      fill="#10b981"
                      stackId={chartType === 'stacked' ? 'a' : undefined}
                    />
                    <Bar
                      dataKey="Excused"
                      name="Excused"
                      fill="#3b82f6"
                      stackId={chartType === 'stacked' ? 'a' : undefined}
                    />
                    <Bar
                      dataKey="Unexcused"
                      name="Unexcused"
                      fill="#f43f5e"
                      stackId={chartType === 'stacked' ? 'a' : undefined}
                    />
                    <Bar
                      dataKey="Exempt"
                      name="Exempt"
                      fill="#f59e0b"
                      stackId={chartType === 'stacked' ? 'a' : undefined}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                  <Calendar className="w-8 h-8 mb-2 opacity-50 text-slate-400" />
                  <p className="font-semibold text-slate-400">No event records found for the selected filter.</p>
                </div>
              )}
            </div>
          </div>

          {/* Event Selector & Filter Bar */}
          <div className="bg-[#1A1E26] border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Event / Assembly *</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-[#161920] border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.crewName} - {ev.startDate.split('T')[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Filter Sheet by Sub-Crew</label>
                <select
                  value={filterCrewId}
                  onChange={(e) => setFilterCrewId(e.target.value)}
                  className="w-full bg-[#161920] border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="All">All Crews</option>
                  {crews.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Filter Sheet by Section</label>
                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value as any)}
                  className="w-full bg-[#161920] border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="All">All Age Sections</option>
                  <option value="Explorer">Explorer Section (&lt;18)</option>
                  <option value="Rover">Rover Section (18-26)</option>
                </select>
              </div>
            </div>

            {selectedEvent && (
              <div className="bg-[#161920] border border-slate-800 p-3 rounded-lg text-xs flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-emerald-400">{selectedEvent.title}</span>
                  <span className="text-slate-400 ml-2">Location: {selectedEvent.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#1A1E26] text-slate-300 px-2 py-0.5 rounded font-mono text-[10px] border border-slate-800">
                    Target: {selectedEvent.targetAudience}
                  </span>
                  {selectedEvent.isCompulsory && (
                    <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded">
                      Compulsory Assembly
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Attendance Roll Sheet Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Member Name</th>
                    <th className="py-3.5 px-4 font-semibold">Sub-Crew & Section</th>
                    <th className="py-3.5 px-4 font-semibold">Attendance Status</th>
                    <th className="py-3.5 px-4 font-semibold">Exemption / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {displayMembers.map((m) => {
                    const currentData = localAttendanceMap[m.id] || { status: 'Present' };

                    return (
                      <tr key={m.id} className="hover:bg-slate-950/60 transition">
                        <td className="py-3 px-4 font-medium text-slate-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-800 border border-emerald-700/50 flex items-center justify-center font-bold text-xs text-emerald-300">
                              {m.name.charAt(0)}
                            </div>
                            <div>
                              <div>{m.name}</div>
                              <div className="text-[10px] font-mono text-slate-400">ID: {m.idCard}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-300">
                          <div>{m.crewName}</div>
                          <div className="text-[10px] text-emerald-400 font-semibold">{m.section}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={!isCouncil && m.id !== currentMember.id}
                              onClick={() => handleStatusChange(m.id, 'Present')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                                currentData.status === 'Present'
                                  ? 'bg-emerald-600 text-white font-bold shadow'
                                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                              } ${!isCouncil && m.id !== currentMember.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              Present
                            </button>

                            <button
                              type="button"
                              disabled={!isCouncil && m.id !== currentMember.id}
                              onClick={() => handleStatusChange(m.id, 'Excused')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                                currentData.status === 'Excused'
                                  ? 'bg-blue-600 text-white font-bold shadow'
                                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                              } ${!isCouncil && m.id !== currentMember.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              Excused
                            </button>

                            <button
                              type="button"
                              disabled={!isCouncil && m.id !== currentMember.id}
                              onClick={() => handleStatusChange(m.id, 'Unexcused')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                                currentData.status === 'Unexcused'
                                  ? 'bg-rose-600 text-white font-bold shadow'
                                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                              } ${!isCouncil && m.id !== currentMember.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              Unexcused
                            </button>

                            <button
                              type="button"
                              disabled={!isCouncil && m.id !== currentMember.id}
                              onClick={() => handleStatusChange(m.id, 'Exempt')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                                currentData.status === 'Exempt'
                                  ? 'bg-amber-600 text-slate-950 font-bold shadow'
                                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                              } ${!isCouncil && m.id !== currentMember.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              Exempt
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {currentData.reason ? (
                            <span className="italic text-amber-300">{currentData.reason}</span>
                          ) : (
                            <span className="text-slate-600">--</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CUSTOM MEMBER ATTENDANCE & ABSENTEE REPORTS (% BREAKDOWN)
         ========================================================================= */}
      {activePortalTab === 'reports' && (
        <div className="space-y-6">
          {/* =========================================================================
              AUTOMATED LOW ATTENDANCE GENERATOR & COUNCIL GOVERNANCE HUB
             ========================================================================= */}
          <div className="bg-[#181B22] border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Automated Generator
                  </span>
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Council Governance
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  Low Attendance Automated Flagging & Council Review Generator
                </h3>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Scans all assembly turnout records, automatically flags members whose attendance drops below the configurable threshold (<span className="text-amber-400 font-bold">&lt;{attendanceThreshold}%</span>), and routes them to the Council Review queue for counseling or formal notices.
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleBatchFlagLowAttendance}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Batch Flag All (&lt;{attendanceThreshold}%)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportLowAttendanceCSV}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Low Attendance CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyCouncilGovernanceReport}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>Copy Council Summary</span>
                </button>
              </div>
            </div>

            {/* Threshold Controls & View Filter Mode Tabs */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-1">
              {/* Cutoff Threshold Selector */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  Attendance Cutoff Threshold:
                </span>
                <div className="flex items-center gap-1.5 bg-[#12151B] p-1 rounded-xl border border-slate-800">
                  {[30, 50, 60, 75].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAttendanceThreshold(val)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        attendanceThreshold === val
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      &lt;{val}%
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <label className="text-slate-400 font-mono text-[11px]">Custom %:</label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    value={attendanceThreshold}
                    onChange={(e) => setAttendanceThreshold(Math.max(10, Math.min(90, Number(e.target.value) || 50)))}
                    className="w-16 bg-[#12151B] border border-slate-800 text-amber-400 font-mono font-bold text-center text-xs rounded-lg py-1 px-1 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* View Filter Mode Tabs */}
              <div className="flex items-center gap-1 bg-[#12151B] p-1 rounded-xl border border-slate-800 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setReportViewFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    reportViewFilter === 'all'
                      ? 'bg-slate-800 text-slate-100 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({memberReportList.length})
                </button>

                <button
                  type="button"
                  onClick={() => setReportViewFilter('low_attendance')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    reportViewFilter === 'low_attendance'
                      ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                      : 'text-slate-400 hover:text-rose-300'
                  }`}
                >
                  <span>Low Attendance (&lt;{attendanceThreshold}%)</span>
                  <span className="bg-rose-500/20 text-rose-300 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                    {lowAttendanceCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportViewFilter('flagged_only')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    reportViewFilter === 'flagged_only'
                      ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30'
                      : 'text-slate-400 hover:text-purple-300'
                  }`}
                >
                  <span>Flagged for Council</span>
                  <span className="bg-purple-500/20 text-purple-300 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                    {flaggedCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportViewFilter('pending_review')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    reportViewFilter === 'pending_review'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                >
                  <span>Pending Action</span>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                    {pendingActionCount}
                  </span>
                </button>
              </div>
            </div>

            {/* Governance Analytics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-[#12151B] border border-rose-900/40 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Below Cutoff (&lt;{attendanceThreshold}%)</span>
                  <span className="text-xl font-bold text-rose-400 font-mono">{lowAttendanceCount}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#12151B] border border-purple-900/40 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Total Council Flagged</span>
                  <span className="text-xl font-bold text-purple-400 font-mono">{flaggedCount}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Flag className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#12151B] border border-amber-900/40 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Pending Action</span>
                  <span className="text-xl font-bold text-amber-400 font-mono">{pendingActionCount}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#12151B] border border-emerald-900/40 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Resolved / Counseled</span>
                  <span className="text-xl font-bold text-emerald-400 font-mono">{counseledCount}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Report Control Header & Export Actions */}
          <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Custom Member Attendance & Absentee Report
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Analyze individual member percentages for Present, Absent (Unexcused), and Excused status across assemblies.
                </p>
              </div>

              {/* Action Buttons: Export CSV & Copy Summary */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV Report</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
                >
                  {copiedReport ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedReport ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
                </button>
              </div>
            </div>

            {/* Filter Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {/* Search Box */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Search Member</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Name or ID card..."
                    value={reportSearchQuery}
                    onChange={(e) => setReportSearchQuery(e.target.value)}
                    className="w-full bg-[#161920] border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Period Filter */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Time Horizon</label>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value as any)}
                  className="w-full bg-[#161920] border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">All Time History</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="term">Current Term (2025-2026)</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {/* Sub-Crew Scope */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Sub-Crew Scope</label>
                <select
                  value={reportCrewId}
                  onChange={(e) => setReportCrewId(e.target.value)}
                  className="w-full bg-[#161920] border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="All">All Sub-Crews</option>
                  {crews.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Type Filter */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Event Category</label>
                <select
                  value={reportEventType}
                  onChange={(e) => setReportEventType(e.target.value)}
                  className="w-full bg-[#161920] border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="All">All Event Types</option>
                  <option value="Camp">Camps & Expeditions</option>
                  <option value="Meeting">Council Meetings</option>
                  <option value="Community Service">Community Service</option>
                  <option value="Course">Courses & Workshops</option>
                </select>
              </div>

              {/* Sort By Option */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Sort Members By</label>
                <select
                  value={reportSortBy}
                  onChange={(e) => setReportSortBy(e.target.value as any)}
                  className="w-full bg-[#161920] border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer text-emerald-400"
                >
                  <option value="absent_desc">Highest Absent % (Unexcused)</option>
                  <option value="excused_desc">Highest Excused %</option>
                  <option value="present_desc">Highest Present %</option>
                  <option value="rate_asc">Lowest Turnout Rate</option>
                  <option value="name_asc">Member Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Custom Dates if custom selected */}
            {reportPeriod === 'custom' && (
              <div className="bg-[#161920] border border-slate-800 p-3 rounded-xl flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <label className="text-slate-400 font-medium">Start Date:</label>
                  <input
                    type="date"
                    value={reportCustomStart}
                    onChange={(e) => setReportCustomStart(e.target.value)}
                    className="bg-[#1A1E26] border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-slate-400 font-medium">End Date:</label>
                  <input
                    type="date"
                    value={reportCustomEnd}
                    onChange={(e) => setReportCustomEnd(e.target.value)}
                    className="bg-[#1A1E26] border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>
            )}

            {/* KPI Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div className="bg-[#161920] border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Assemblies Evaluated</span>
                <span className="text-lg font-bold text-slate-100 font-mono">{reportScopeStats.totalEvents}</span>
              </div>
              <div className="bg-[#161920] border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Members Evaluated</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">{reportScopeStats.totalMembers}</span>
              </div>
              <div className="bg-[#161920] border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Avg Present Rate</span>
                <span className="text-lg font-bold text-sky-400 font-mono">{reportScopeStats.avgPresentRate}%</span>
              </div>
              <div className="bg-[#161920] border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Unexcused Absences</span>
                <span className="text-lg font-bold text-rose-400 font-mono">{reportScopeStats.totalUnexcused}</span>
              </div>
              <div className="bg-[#161920] border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Official Excuses</span>
                <span className="text-lg font-bold text-blue-400 font-mono">{reportScopeStats.totalExcused}</span>
              </div>
            </div>
          </div>

          {/* Member Percentage Breakdown Report Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Member Percentage & Absentee Breakdown Roster ({filteredReportList.length} Members)
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                Showing percentages calculated against {reportScopeStats.totalEvents} assemblies
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-[#12151C] text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Member</th>
                    <th className="py-3.5 px-4 font-semibold">Sub-Crew</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Assemblies</th>
                    <th className="py-3.5 px-4 font-semibold text-center text-emerald-400">Present % (Count)</th>
                    <th className="py-3.5 px-4 font-semibold text-center text-rose-400">Absent / Unexcused %</th>
                    <th className="py-3.5 px-4 font-semibold text-center text-blue-400">Excused %</th>
                    <th className="py-3.5 px-4 font-semibold text-center text-amber-400">Exempt</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Turnout Rating</th>
                    <th className="py-3.5 px-4 font-semibold text-center text-purple-400">Council Flag / Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions & Notice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredReportList.map((item) => {
                    const isExpanded = expandedMemberId === item.member.id;
                    const isLowAttendance = item.presentPct < attendanceThreshold;
                    const flagData = flaggedMap[item.member.id];

                    return (
                      <React.Fragment key={item.member.id}>
                        <tr className="hover:bg-slate-950/60 transition">
                          <td className="py-3 px-4 font-medium text-slate-100">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-800 border border-emerald-700/50 flex items-center justify-center font-bold text-xs text-emerald-300">
                                {item.member.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-100">{item.member.name}</div>
                                <div className="text-[10px] font-mono text-slate-400">{item.member.councilRole} • {item.member.idCard}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-300">
                            <div>{item.member.crewName}</div>
                            <div className="text-[10px] text-emerald-400 font-semibold">{item.member.section}</div>
                          </td>

                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                            {item.totalAssemblies}
                          </td>

                          {/* Present % */}
                          <td className="py-3 px-4 text-center">
                            <div className="font-mono font-bold text-emerald-400 text-sm">
                              {item.presentPct}%
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ({item.presentCount} events)
                            </div>
                          </td>

                          {/* Unexcused Absent % */}
                          <td className="py-3 px-4 text-center">
                            <div className={`font-mono font-bold text-sm ${
                              item.unexcusedCount > 0 ? 'text-rose-400 bg-rose-500/10 py-0.5 px-1.5 rounded inline-block' : 'text-slate-400'
                            }`}>
                              {item.unexcusedPct}%
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ({item.unexcusedCount} absent)
                            </div>
                          </td>

                          {/* Excused % */}
                          <td className="py-3 px-4 text-center">
                            <div className="font-mono font-bold text-blue-400 text-sm">
                              {item.excusedPct}%
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ({item.excusedCount} excused)
                            </div>
                          </td>

                          {/* Exempt */}
                          <td className="py-3 px-4 text-center font-mono text-amber-400 text-xs">
                            {item.exemptCount}
                          </td>

                          {/* Rating Badge */}
                          <td className="py-3 px-4 text-center">
                            {item.isExemptRole ? (
                              <span className="bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-mono">
                                <ShieldCheck className="w-3 h-3 text-purple-400" />
                                Exempt ({item.member.isSuperAdmin || item.member.councilRole === 'Superadmin' ? 'Superadmin' : 'Rover Advisor'})
                              </span>
                            ) : item.turnoutRating === 'Exemplary' ? (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Exemplary
                              </span>
                            ) : item.turnoutRating === 'Satisfactory' ? (
                              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Satisfactory
                              </span>
                            ) : item.turnoutRating === 'Needs Review' ? (
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Needs Review
                              </span>
                            ) : (
                              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> At Risk
                              </span>
                            )}
                          </td>

                          {/* Council Review Flag & Status */}
                          <td className="py-3 px-4 text-center">
                            {flagData ? (
                              <div className="space-y-1">
                                <span
                                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border ${
                                    flagData.status === 'Pending Council Review'
                                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                      : flagData.status === 'Formal Notice Issued'
                                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                      : flagData.status === 'Counseled & Resolved'
                                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                      : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                  }`}
                                >
                                  <Flag className="w-3 h-3" />
                                  {flagData.status}
                                </span>
                                <div className="text-[9px] text-slate-400 font-mono">
                                  By {flagData.flaggedBy}
                                </div>
                              </div>
                            ) : isLowAttendance && !item.isExemptRole ? (
                              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 animate-pulse">
                                <AlertTriangle className="w-3 h-3" /> Below Cutoff (&lt;{attendanceThreshold}%)
                              </span>
                            ) : item.isExemptRole ? (
                              <span className="text-purple-300/70 font-mono text-[10px]">Exempt Overseer</span>
                            ) : (
                              <span className="text-slate-600 font-mono text-[10px]">--</span>
                            )}
                          </td>

                          {/* Actions & Notice */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenNoticeModal(item)}
                                className="px-2.5 py-1 rounded bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-700/50 font-semibold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                                title="Open Council Review Notice & Record"
                              >
                                <FileCheck className="w-3 h-3 text-purple-300" />
                                <span>Notice</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleFlagMember(item)}
                                className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer border ${
                                  flagData
                                    ? 'bg-slate-800 hover:bg-rose-950/60 text-rose-300 border-rose-800/50'
                                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                                }`}
                                title={flagData ? 'Remove flag' : 'Flag for Council Review'}
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setExpandedMemberId(isExpanded ? null : item.member.id)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                                title="Toggle assembly timeline"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Individual Member Timeline */}
                        {isExpanded && (
                          <tr className="bg-slate-950/80">
                            <td colSpan={10} className="p-4 border-t border-slate-800">
                              <div className="space-y-3">
                                <h5 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                  Individual Attendance History for {item.member.name}
                                </h5>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                                  {scopeFilteredEvents.map((ev) => {
                                    const recData = item.eventRecordMap[ev.id] || { status: 'Present' };
                                    return (
                                      <div
                                        key={ev.id}
                                        className="bg-[#12151C] border border-slate-800 p-2.5 rounded-lg flex items-center justify-between"
                                      >
                                        <div>
                                          <div className="font-semibold text-slate-200 text-[11px]">
                                            {ev.title}
                                          </div>
                                          <div className="text-[10px] text-slate-400 font-mono">
                                            {ev.startDate.split('T')[0]} • {ev.type}
                                          </div>
                                          {recData.reason && (
                                            <div className="text-[10px] text-amber-300 italic mt-0.5">
                                              Reason: {recData.reason}
                                            </div>
                                          )}
                                        </div>

                                        <div>
                                          {recData.status === 'Present' && (
                                            <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                                              Present
                                            </span>
                                          )}
                                          {recData.status === 'Unexcused' && (
                                            <span className="bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                                              Absent
                                            </span>
                                          )}
                                          {recData.status === 'Excused' && (
                                            <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                                              Excused
                                            </span>
                                          )}
                                          {recData.status === 'Exempt' && (
                                            <span className="bg-amber-600 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded">
                                              Exempt
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* =========================================================================
              "WHO CAME VS WHO DIDN'T" SPECIFIC EVENT DRILLDOWN
             ========================================================================= */}
          <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Specific Assembly Drilldown: "Who Came vs Who Didn't"
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select any assembly or event to inspect side-by-side lists of attendees and absentees.
                </p>
              </div>

              <div className="min-w-[260px]">
                <select
                  value={drilldownEventId}
                  onChange={(e) => setDrilldownEventId(e.target.value)}
                  className="w-full bg-[#161920] border border-slate-800 text-xs text-slate-100 rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.startDate.split('T')[0]})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Side-by-Side Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* WHO CAME (PRESENT) */}
              <div className="bg-slate-950/80 border border-emerald-900/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
                  <h5 className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Who Came ({drilldownData.present.length})
                  </h5>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">
                    PRESENT
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[280px] overflow-y-auto text-xs pr-1">
                  {drilldownData.present.map((item) => (
                    <div
                      key={item.member.id}
                      className="bg-[#12151C] border border-slate-800 p-2 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{item.member.name}</div>
                        <div className="text-[10px] text-slate-400">{item.member.crewName}</div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  ))}
                  {drilldownData.present.length === 0 && (
                    <p className="text-slate-500 text-xs italic py-2">No attendees recorded.</p>
                  )}
                </div>
              </div>

              {/* WHO DIDN'T (UNEXCUSED ABSENCES) */}
              <div className="bg-slate-950/80 border border-rose-900/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-rose-900/40 pb-2">
                  <h5 className="font-bold text-rose-400 text-xs flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Who Didn't ({drilldownData.unexcused.length})
                  </h5>
                  <span className="text-[10px] font-mono bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-bold">
                    UNEXCUSED
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[280px] overflow-y-auto text-xs pr-1">
                  {drilldownData.unexcused.map((item) => (
                    <div
                      key={item.member.id}
                      className="bg-[#12151C] border border-rose-900/40 p-2 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-rose-200">{item.member.name}</div>
                        <div className="text-[10px] text-slate-400">{item.member.crewName}</div>
                      </div>
                      <XCircle className="w-4 h-4 text-rose-500" />
                    </div>
                  ))}
                  {drilldownData.unexcused.length === 0 && (
                    <p className="text-slate-500 text-xs italic py-2">No unexcused absences!</p>
                  )}
                </div>
              </div>

              {/* OFFICIAL EXCUSES */}
              <div className="bg-slate-950/80 border border-blue-900/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-blue-900/40 pb-2">
                  <h5 className="font-bold text-blue-400 text-xs flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Excused ({drilldownData.excused.length})
                  </h5>
                  <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-bold">
                    EXCUSED
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[280px] overflow-y-auto text-xs pr-1">
                  {drilldownData.excused.map((item) => (
                    <div
                      key={item.member.id}
                      className="bg-[#12151C] border border-slate-800 p-2 rounded-lg space-y-0.5"
                    >
                      <div className="font-semibold text-slate-200">{item.member.name}</div>
                      {item.record?.exemptionReason && (
                        <div className="text-[10px] text-amber-300 italic">
                          "{item.record.exemptionReason}"
                        </div>
                      )}
                    </div>
                  ))}
                  {drilldownData.excused.length === 0 && (
                    <p className="text-slate-500 text-xs italic py-2">No official excuses recorded.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          OFFICIAL COUNCIL REVIEW NOTICE MODAL
         ========================================================================= */}
      {noticeMember && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#161920] border border-purple-500/30 rounded-2xl p-6 max-w-2xl w-full space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Council Attendance Warning & Review Record
                  </h3>
                  <p className="text-xs text-slate-400">
                    Official governance record for low attendance counseling & notice issuance.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setNoticeMember(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Profile Summary */}
            <div className="bg-[#12151B] border border-slate-800 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Member Name:</span>
                <span className="font-bold text-slate-100 text-sm">{noticeMember.member.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Sub-Crew:</span>
                <span className="font-semibold text-emerald-400">{noticeMember.member.crewName} ({noticeMember.member.section})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Turnout Rate:</span>
                <span className={`font-mono font-bold ${noticeMember.presentPct < attendanceThreshold ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {noticeMember.presentPct}% (&lt;{attendanceThreshold}% Cutoff)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Unexcused Absences:</span>
                <span className="font-mono font-bold text-rose-400">{noticeMember.unexcusedCount}</span>
              </div>
            </div>

            {/* Status Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="block text-slate-300 font-bold">Update Council Review Status:</label>
              <select
                value={noticeStatus}
                onChange={(e) => setNoticeStatus(e.target.value as any)}
                className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="Pending Council Review">Pending Council Review (Under Observation)</option>
                <option value="Formal Notice Issued">Formal Notice Issued (Official Warning Written)</option>
                <option value="Counseled & Resolved">Counseled & Resolved (Intervention Completed)</option>
                <option value="Exempted">Exempted (Valid Medical / Academic Grounds)</option>
              </select>
            </div>

            {/* Notes Textarea */}
            <div className="space-y-1.5 text-xs">
              <label className="block text-slate-300 font-bold">Council Review Notes & Recommendations:</label>
              <textarea
                rows={4}
                value={noticeNotes}
                onChange={(e) => setNoticeNotes(e.target.value)}
                placeholder="Enter counseling notes, advisor meeting outcome, or attendance plan..."
                className="w-full bg-[#12151B] border border-slate-800 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-purple-500 font-sans"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCopyNoticeText}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedNotice ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
                <span>{copiedNotice ? 'Notice Text Copied!' : 'Copy Formal Notice Text'}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setNoticeMember(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNotice}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Governance Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
