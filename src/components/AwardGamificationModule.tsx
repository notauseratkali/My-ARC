import React, { useState, useMemo } from 'react';
import {
  Member,
  SyllabusRequirement,
  MemberRequirementProgress,
  AwardType,
  CategoryType,
  SubCrew,
} from '../types';
import {
  Award,
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  Compass,
  HeartHandshake,
  Users,
  TreePine,
  Brain,
  Globe,
  Flame,
  Star,
  ChevronRight,
  Filter,
  Search,
  Zap,
  PartyPopper,
  ShieldCheck,
  TrendingUp,
  Info,
  Medal,
  ThumbsUp,
  Share2,
} from 'lucide-react';

export interface DigitalBadge {
  id: string;
  name: string;
  category: CategoryType | 'Award Tier' | 'Milestone';
  awardType: AwardType | 'All';
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  icon: string;
  description: string;
  criteria: string;
  minCompletionPercentage: number;
}

export const DIGITAL_BADGES_CATALOG: DigitalBadge[] = [
  {
    id: 'badge-lead-bronze',
    name: 'Leadership Trailblazer',
    category: 'Leadership',
    awardType: 'All',
    tier: 'Bronze',
    icon: '👑',
    description: 'Demonstrated initial initiative and led first patrol assignments.',
    criteria: 'Complete at least 1 Leadership requirement',
    minCompletionPercentage: 25,
  },
  {
    id: 'badge-lead-gold',
    name: 'Patrol Vanguard & Captain',
    category: 'Leadership',
    awardType: 'All',
    tier: 'Gold',
    icon: '⚡',
    description: 'Mastered all required leadership governance and mentorship duties.',
    criteria: '100% completion of Leadership section syllabus',
    minCompletionPercentage: 100,
  },
  {
    id: 'badge-comm-bronze',
    name: 'Community Ally',
    category: 'Community Service',
    awardType: 'All',
    tier: 'Bronze',
    icon: '🤝',
    description: 'Logged impactful service hours aiding the local community.',
    criteria: 'Complete at least 1 Community Service requirement',
    minCompletionPercentage: 25,
  },
  {
    id: 'badge-comm-gold',
    name: 'Civic Champion & Humanitarian',
    category: 'Community Service',
    awardType: 'All',
    tier: 'Gold',
    icon: '💖',
    description: 'Organized and executed verified community service projects.',
    criteria: '100% completion of Community Service section syllabus',
    minCompletionPercentage: 100,
  },
  {
    id: 'badge-out-bronze',
    name: 'Wilderness Scout',
    category: 'Outdoor Skills',
    awardType: 'All',
    tier: 'Bronze',
    icon: '🏕️',
    description: 'Participated in expedition hikes and demonstrated field survival basics.',
    criteria: 'Complete at least 1 Outdoor Skills requirement',
    minCompletionPercentage: 25,
  },
  {
    id: 'badge-out-gold',
    name: 'Expedition Master & Pioneer',
    category: 'Outdoor Skills',
    awardType: 'All',
    tier: 'Gold',
    icon: '🧭',
    description: 'Conquered rigorous outdoor expeditions and bushcraft challenges.',
    criteria: '100% completion of Outdoor Skills section syllabus',
    minCompletionPercentage: 100,
  },
  {
    id: 'badge-pers-silver',
    name: 'Self-Mastery & Reflection',
    category: 'Personal Development',
    awardType: 'All',
    tier: 'Silver',
    icon: '🧠',
    description: 'Consistently logged personal reflections, goals, and development milestones.',
    criteria: 'Complete at least 50% of Personal Development requirements',
    minCompletionPercentage: 50,
  },
  {
    id: 'badge-scout-silver',
    name: 'Master Scoutcraft Artisan',
    category: 'Scoutcraft',
    awardType: 'All',
    tier: 'Silver',
    icon: '🪢',
    description: 'Exemplary mastery of pioneering, knots, signaling, and camp safety.',
    criteria: 'Complete at least 50% of Scoutcraft requirements',
    minCompletionPercentage: 50,
  },
  {
    id: 'badge-glob-silver',
    name: 'Global Citizenship Envoy',
    category: 'Global Citizenship',
    awardType: 'All',
    tier: 'Silver',
    icon: '🌍',
    description: 'Promoted environmental sustainability, SDG goals, and peace projects.',
    criteria: 'Complete at least 50% of Global Citizenship requirements',
    minCompletionPercentage: 50,
  },
  {
    id: 'badge-milestone-halfway',
    name: 'Halfway Summit Milestone',
    category: 'Milestone',
    awardType: 'All',
    tier: 'Silver',
    icon: '⭐',
    description: 'Surpassed 50% overall completion across the entire award curriculum.',
    criteria: '50%+ overall award progression verified',
    minCompletionPercentage: 50,
  },
  {
    id: 'badge-award-laureate',
    name: 'Grand Award Laureate',
    category: 'Award Tier',
    awardType: 'All',
    tier: 'Diamond',
    icon: '🏆',
    description: 'Completed 100% of all syllabus tasks and council verifications.',
    criteria: '100% full syllabus verification achieved',
    minCompletionPercentage: 100,
  },
];

const CATEGORY_ICONS: Record<CategoryType, React.ReactNode> = {
  Leadership: <Users className="w-4 h-4 text-purple-400" />,
  'Community Service': <HeartHandshake className="w-4 h-4 text-rose-400" />,
  'Outdoor Skills': <TreePine className="w-4 h-4 text-emerald-400" />,
  'Personal Development': <Brain className="w-4 h-4 text-blue-400" />,
  Scoutcraft: <Compass className="w-4 h-4 text-amber-400" />,
  'Global Citizenship': <Globe className="w-4 h-4 text-teal-400" />,
};

const CATEGORY_COLORS: Record<CategoryType, { bg: string; border: string; bar: string; text: string }> = {
  Leadership: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    bar: 'bg-gradient-to-r from-[#002B7F] to-blue-600',
    text: 'text-[#002B7F]',
  },
  'Community Service': {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    bar: 'bg-gradient-to-r from-[#800020] to-rose-600',
    text: 'text-[#800020]',
  },
  'Outdoor Skills': {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    bar: 'bg-gradient-to-r from-[#006B3F] to-emerald-600',
    text: 'text-[#006B3F]',
  },
  'Personal Development': {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    bar: 'bg-gradient-to-r from-sky-700 to-blue-600',
    text: 'text-sky-800',
  },
  Scoutcraft: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    bar: 'bg-gradient-to-r from-[#002B7F] to-[#006B3F]',
    text: 'text-[#002B7F]',
  },
  'Global Citizenship': {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    bar: 'bg-gradient-to-r from-[#006B3F] to-teal-600',
    text: 'text-[#006B3F]',
  },
};

interface AwardGamificationModuleProps {
  syllabus: SyllabusRequirement[];
  progressList: MemberRequirementProgress[];
  members: Member[];
  currentMember: Member;
  crews?: SubCrew[];
  onSelectMember?: (memberId: string) => void;
}

export const AwardGamificationModule: React.FC<AwardGamificationModuleProps> = ({
  syllabus,
  progressList,
  members,
  currentMember,
  crews = [],
  onSelectMember,
}) => {
  const [selectedAward, setSelectedAward] = useState<AwardType>("President's Scout Award");
  const [selectedMemberId, setSelectedMemberId] = useState<string>(currentMember.id);
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'celebrations'>('overview');
  const [kudosGiven, setKudosGiven] = useState<Record<string, number>>({});
  const [selectedBadgeModal, setSelectedBadgeModal] = useState<DigitalBadge | null>(null);

  const activeTargetMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || currentMember;
  }, [members, selectedMemberId, currentMember]);

  // Filter requirements for the selected award
  const awardRequirements = useMemo(() => {
    return syllabus.filter((r) => r.awardType === selectedAward);
  }, [syllabus, selectedAward]);

  const categories: CategoryType[] = [
    'Leadership',
    'Community Service',
    'Outdoor Skills',
    'Personal Development',
    'Scoutcraft',
    'Global Citizenship',
  ];

  // Compute Member Section Progress
  const computeMemberAwardProgress = (memberId: string, targetAward: AwardType) => {
    const reqs = syllabus.filter((r) => r.awardType === targetAward);
    if (reqs.length === 0) {
      return {
        overallPercentage: 0,
        completedReqsCount: 0,
        totalReqsCount: 0,
        completedTasksCount: 0,
        totalTasksCount: 0,
        sectionBreakdown: {},
        earnedBadges: [] as DigitalBadge[],
      };
    }

    const memberProg = progressList.filter((p) => p.memberId === memberId);
    let totalTasks = 0;
    let completedTasks = 0;
    let completedReqs = 0;

    const sectionBreakdown: Record<
      string,
      {
        totalReqs: number;
        completedReqs: number;
        totalTasks: number;
        completedTasks: number;
        percentage: number;
        status: string;
      }
    > = {};

    categories.forEach((cat) => {
      const catReqs = reqs.filter((r) => r.category === cat);
      if (catReqs.length === 0) return;

      let catTotalTasks = 0;
      let catCompletedTasks = 0;
      let catCompletedReqs = 0;

      catReqs.forEach((r) => {
        const prog = memberProg.find((p) => p.requirementId === r.id);
        const rTasksCount = r.tasks && r.tasks.length > 0 ? r.tasks.length : 1;
        catTotalTasks += rTasksCount;
        totalTasks += rTasksCount;

        if (prog) {
          const compTasks = (prog.completedTasks || []).length;
          catCompletedTasks += compTasks;
          completedTasks += compTasks;

          if (prog.status === 'Completed' || prog.status === 'Verified') {
            catCompletedReqs += 1;
            completedReqs += 1;
          }
        }
      });

      const catPercentage =
        catTotalTasks > 0 ? Math.min(100, Math.round((catCompletedTasks / catTotalTasks) * 100)) : 0;

      sectionBreakdown[cat] = {
        totalReqs: catReqs.length,
        completedReqs: catCompletedReqs,
        totalTasks: catTotalTasks,
        completedTasks: catCompletedTasks,
        percentage: catPercentage,
        status:
          catPercentage === 100
            ? 'Completed'
            : catPercentage >= 50
            ? 'Halfway'
            : catPercentage > 0
            ? 'In Progress'
            : 'Not Started',
      };
    });

    const overallPercentage =
      totalTasks > 0 ? Math.min(100, Math.round((completedTasks / totalTasks) * 100)) : 0;

    // Check Earned Badges
    const earnedBadges: DigitalBadge[] = [];

    DIGITAL_BADGES_CATALOG.forEach((badge) => {
      if (badge.category === 'Milestone' && overallPercentage >= badge.minCompletionPercentage) {
        earnedBadges.push(badge);
      } else if (badge.category === 'Award Tier' && overallPercentage >= 100) {
        earnedBadges.push(badge);
      } else if (sectionBreakdown[badge.category as CategoryType]) {
        const sec = sectionBreakdown[badge.category as CategoryType];
        if (sec && sec.percentage >= badge.minCompletionPercentage) {
          earnedBadges.push(badge);
        }
      }
    });

    return {
      overallPercentage,
      completedReqsCount: completedReqs,
      totalReqsCount: reqs.length,
      completedTasksCount: completedTasks,
      totalTasksCount: totalTasks,
      sectionBreakdown,
      earnedBadges,
    };
  };

  const currentMemberStats = useMemo(() => {
    return computeMemberAwardProgress(activeTargetMember.id, selectedAward);
  }, [activeTargetMember.id, selectedAward, syllabus, progressList]);

  // Non-competitive Encouraging Leaderboard / Milestone Celebrations
  const milestoneFeed = useMemo(() => {
    const candidates = members.filter(
      (m) => !m.isSuperAdmin && m.councilRole !== 'Superadmin' && m.councilRole !== 'Rover Advisor' && m.status === 'Active'
    );

    const celebrations: {
      member: Member;
      award: AwardType;
      stats: ReturnType<typeof computeMemberAwardProgress>;
      recentHighlight: string;
      badgeCount: number;
      completionRate: number;
    }[] = [];

    candidates.forEach((m) => {
      const statsBP = computeMemberAwardProgress(m.id, 'Baden-Powell Award');
      const statsPSA = computeMemberAwardProgress(m.id, "President's Scout Award");

      const primaryStats = m.section === 'Rover' ? statsBP : statsPSA;
      const targetAward: AwardType = m.section === 'Rover' ? 'Baden-Powell Award' : "President's Scout Award";

      let highlight = 'Active Progress in Scout Training';
      if (primaryStats.overallPercentage >= 100) {
        highlight = `🏆 100% Completed all ${targetAward} Syllabus Requirements!`;
      } else if (primaryStats.overallPercentage >= 75) {
        highlight = `⚡ 75%+ Milestone reached towards ${targetAward}!`;
      } else if (primaryStats.overallPercentage >= 50) {
        highlight = `⭐ Surpassed 50% Summit Milestone in ${targetAward}!`;
      } else if (primaryStats.earnedBadges.length > 0) {
        highlight = `🎖️ Earned ${primaryStats.earnedBadges.length} Digital Milestone Badges!`;
      } else if (primaryStats.completedTasksCount > 0) {
        highlight = `🌿 Cleared ${primaryStats.completedTasksCount} verified tasks on curriculum!`;
      }

      celebrations.push({
        member: m,
        award: targetAward,
        stats: primaryStats,
        recentHighlight: highlight,
        badgeCount: primaryStats.earnedBadges.length,
        completionRate: primaryStats.overallPercentage,
      });
    });

    // Sort encouragingly by highest milestones & activity
    return celebrations.sort((a, b) => b.completionRate - a.completionRate || b.badgeCount - a.badgeCount);
  }, [members, syllabus, progressList]);

  const handleSendKudos = (memberId: string) => {
    setKudosGiven((prev) => ({
      ...prev,
      [memberId]: (prev[memberId] || 0) + 1,
    }));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8 text-slate-900">
      {/* Gamification Top Header */}
      <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-emerald-50 border border-blue-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#002B7F]/10 text-[#002B7F] border border-[#002B7F]/20 text-xs px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#002B7F]" />
                <span>Award Gamification & Badges Engine</span>
              </span>
              <span className="bg-emerald-50 text-[#006B3F] border border-emerald-200 text-xs px-2.5 py-1 rounded-full font-mono font-bold">
                Baden-Powell & President's Scout
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-900 flex items-center gap-3">
              <span>Visual Award Progress & Milestones</span>
              <Trophy className="w-7 h-7 text-[#002B7F] hidden sm:inline-block" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Track progression across key scoutcraft sections, earn verified digital milestone badges for Leadership, Community Service, and Outdoor Skills, and celebrate crew milestones in an encouraging, non-competitive community atmosphere.
            </p>
          </div>

          {/* Member & Award Track Switcher */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 min-w-[280px] shadow-sm">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Award className="w-3.5 h-3.5 text-[#002B7F]" />
                <span>Select Award Track</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedAward("President's Scout Award")}
                  className={`py-1.5 px-2 rounded-lg font-bold transition text-center cursor-pointer ${
                    selectedAward === "President's Scout Award"
                      ? 'bg-[#002B7F] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PSA (Explorers)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAward('Baden-Powell Award')}
                  className={`py-1.5 px-2 rounded-lg font-bold transition text-center cursor-pointer ${
                    selectedAward === 'Baden-Powell Award'
                      ? 'bg-[#002B7F] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  BP (Rovers)
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-[#006B3F]" />
                <span>Viewing Member Progress</span>
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => {
                  setSelectedMemberId(e.target.value);
                  if (onSelectMember) onSelectMember(e.target.value);
                }}
                className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value={currentMember.id}>👤 {currentMember.name} (My Profile)</option>
                {members
                  .filter((m) => m.id !== currentMember.id && !m.isSuperAdmin && m.councilRole !== 'Superadmin' && m.councilRole !== 'Rover Advisor')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.section} - {m.crewName})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#002B7F] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Section-by-Section Progress</span>
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'badges'
                ? 'bg-[#800020] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Medal className="w-4 h-4 text-white" />
            <span>Digital Badges Showcase ({currentMemberStats.earnedBadges.length}/{DIGITAL_BADGES_CATALOG.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('celebrations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'celebrations'
                ? 'bg-[#006B3F] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <PartyPopper className="w-4 h-4 text-white" />
            <span>Milestones & Encouraging Showcase</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span>Active Scout:</span>
          <span className="text-[#002B7F] font-bold">{activeTargetMember.name}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600">{activeTargetMember.crewName}</span>
        </div>
      </div>

      {/* TAB 1: SECTION-BY-SECTION VISUAL PROGRESS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Overall Award Completion Master Progress Bar */}
          <div className="bg-white border border-blue-200 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#002B7F]">
                    Grand Curriculum Progression
                  </span>
                  <span className="bg-blue-50 text-[#002B7F] text-[10px] px-2 py-0.5 rounded-full border border-blue-200 font-mono font-semibold">
                    {selectedAward}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  Overall Award Completion
                </h2>
              </div>

              <div className="flex items-baseline gap-2 text-right">
                <span className="text-3xl font-black text-[#002B7F] font-mono">
                  {currentMemberStats.overallPercentage}%
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({currentMemberStats.completedTasksCount} / {currentMemberStats.totalTasksCount} Tasks)
                </span>
              </div>
            </div>

            {/* Master Progress Bar */}
            <div className="w-full bg-slate-100 rounded-2xl h-5 p-1 border border-slate-200 relative overflow-hidden shadow-inner">
              <div
                className="h-full rounded-xl bg-gradient-to-r from-[#002B7F] via-[#800020] to-[#006B3F] transition-all duration-700 relative"
                style={{ width: `${Math.max(4, currentMemberStats.overallPercentage)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-xl" />
              </div>
            </div>

            {/* Milestone Checkpoints */}
            <div className="grid grid-cols-4 gap-2 pt-4 text-center">
              <div className={`p-2.5 rounded-xl border transition ${
                currentMemberStats.overallPercentage >= 25
                  ? 'bg-blue-50 border-blue-200 text-[#002B7F] font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <div className="text-xs font-bold font-mono">25% Checkpoint</div>
                <div className="text-[10px] mt-0.5">Initiate Scout</div>
              </div>
              <div className={`p-2.5 rounded-xl border transition ${
                currentMemberStats.overallPercentage >= 50
                  ? 'bg-blue-50 border-blue-200 text-[#002B7F] font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <div className="text-xs font-bold font-mono">50% Summit</div>
                <div className="text-[10px] mt-0.5">Halfway Achiever</div>
              </div>
              <div className={`p-2.5 rounded-xl border transition ${
                currentMemberStats.overallPercentage >= 75
                  ? 'bg-rose-50 border-rose-200 text-[#800020] font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <div className="text-xs font-bold font-mono">75% Trailblazer</div>
                <div className="text-[10px] mt-0.5">Penultimate Stage</div>
              </div>
              <div className={`p-2.5 rounded-xl border transition ${
                currentMemberStats.overallPercentage >= 100
                  ? 'bg-emerald-50 border-emerald-200 text-[#006B3F] font-extrabold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <div className="text-xs font-bold font-mono">100% Laureate</div>
                <div className="text-[10px] mt-0.5">Official Award Sign-off</div>
              </div>
            </div>
          </div>

          {/* Section-by-Section Progress Bars Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#002B7F]" />
                <span>Section Syllabus Breakdown ({selectedAward})</span>
              </h3>
              <span className="text-xs text-slate-500">
                Detailed category milestones & task meters
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const info = currentMemberStats.sectionBreakdown[cat];
                const colorConfig = CATEGORY_COLORS[cat];
                const catReqs = awardRequirements.filter((r) => r.category === cat);

                if (catReqs.length === 0) {
                  return null;
                }

                const percentage = info ? info.percentage : 0;
                const completedTasks = info ? info.completedTasks : 0;
                const totalTasks = info ? info.totalTasks : 0;

                return (
                  <div
                    key={cat}
                    className={`bg-white border ${colorConfig.border} rounded-2xl p-5 shadow-xs space-y-4 hover:border-blue-300 transition flex flex-col justify-between`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-xl ${colorConfig.bg}`}>
                            {CATEGORY_ICONS[cat]}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{cat}</h4>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {catReqs.length} Syllabus Modules
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-extrabold px-2.5 py-1 rounded-full font-mono border ${
                            percentage === 100
                              ? 'bg-emerald-50 text-[#006B3F] border-emerald-200'
                              : percentage >= 50
                              ? 'bg-blue-50 text-[#002B7F] border-blue-200'
                              : percentage > 0
                              ? 'bg-slate-100 text-slate-800 border-slate-300'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          {percentage}%
                        </span>
                      </div>

                      {/* Visual Progress Meter */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-100 rounded-full h-3.5 p-0.5 border border-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colorConfig.bar} transition-all duration-500`}
                            style={{ width: `${Math.max(5, percentage)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-1">
                          <span>Verified Tasks</span>
                          <span className="text-slate-800 font-bold">
                            {completedTasks} / {totalTasks}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section Mini Items & Badges preview */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                      {catReqs.slice(0, 2).map((r) => {
                        const p = progressList.find(
                          (x) => x.memberId === activeTargetMember.id && x.requirementId === r.id
                        );
                        const isDone = p && (p.status === 'Completed' || p.status === 'Verified');
                        return (
                          <div key={r.id} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 truncate max-w-[180px]">
                              {r.title}
                            </span>
                            {isDone ? (
                              <span className="text-[#006B3F] flex items-center gap-1 font-mono text-[10px] font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> Done
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-[10px]">
                                {p ? p.status : 'Pending'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIGITAL BADGES SHOWCASE */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Medal className="w-5 h-5 text-[#002B7F]" />
                <span>Earned Digital Badges & Milestone Gallery</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                Digital badges are unlocked automatically as members progress through Leadership, Community Service, Outdoor Skills, Personal Development, and overall award milestones.
              </p>
            </div>

            <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 flex items-center gap-4">
              <div>
                <div className="text-xs text-slate-500">Unlocked Badges</div>
                <div className="text-xl font-extrabold text-[#002B7F] font-mono">
                  {currentMemberStats.earnedBadges.length} / {DIGITAL_BADGES_CATALOG.length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-xl">
                🎖️
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {DIGITAL_BADGES_CATALOG.map((badge) => {
              const isUnlocked = currentMemberStats.earnedBadges.some((b) => b.id === badge.id);

              return (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadgeModal(badge)}
                  className={`border rounded-2xl p-5 relative overflow-hidden transition cursor-pointer flex flex-col justify-between ${
                    isUnlocked
                      ? 'bg-gradient-to-b from-white to-blue-50/40 border-blue-300 shadow-xs hover:border-blue-500 hover:scale-[1.02]'
                      : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                  }`}
                >
                  {isUnlocked && (
                    <div className="absolute top-2 right-2 bg-blue-50 text-[#002B7F] border border-blue-200 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase">
                      Unlocked
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl shadow-xs mx-auto">
                      {badge.icon}
                    </div>

                    <div className="text-center space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm">{badge.name}</h4>
                      <span className="inline-block bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-full border border-slate-200">
                        {badge.category} • {badge.tier}
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200">
                    <div className="text-[10px] text-slate-500 font-mono text-center">
                      Criteria: {badge.criteria}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: NON-COMPETITIVE ENCOURAGING LEADERBOARD & CELEBRATIONS */}
      {activeTab === 'celebrations' && (
        <div className="space-y-6">
          {/* Uplifting Quote Banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-slate-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 text-[#006B3F] flex items-center justify-center text-2xl flex-shrink-0">
              🌱
            </div>
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#006B3F]">
                Scout Community Spirit
              </div>
              <p className="text-xs sm:text-sm text-slate-800 italic mt-0.5">
                &quot;The most worthwhile thing is to try to put happiness into the lives of others.&quot; — Lord Baden-Powell
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PartyPopper className="w-5 h-5 text-[#002B7F]" />
                  <span>Recent Milestone Achievers & Badge Spotlights</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Recognizing personal dedication, section breakthroughs, and award progress across crews.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {milestoneFeed.length} Scouts Active
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {milestoneFeed.map((item, index) => {
                const kudosCount = kudosGiven[item.member.id] || 0;

                return (
                  <div
                    key={item.member.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition shadow-xs"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-[#002B7F] text-sm font-mono flex-shrink-0">
                        #{index + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {item.member.name}
                          </h4>
                          <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-full border border-slate-200 font-mono">
                            {item.member.section} • {item.member.crewName}
                          </span>
                        </div>
                        <p className="text-xs text-[#002B7F] font-medium mt-1 flex items-center gap-1.5">
                          <span>{item.recentHighlight}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-200 pt-2 sm:pt-0">
                      {/* Mini Progress meter */}
                      <div className="w-28 sm:w-36 space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-500">
                          <span>{item.award.includes('Baden') ? 'BP Progress' : 'PSA Progress'}</span>
                          <span className="text-[#002B7F] font-bold">{item.completionRate}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className="bg-gradient-to-r from-[#002B7F] to-[#006B3F] h-full rounded-full"
                            style={{ width: `${Math.max(6, item.completionRate)}%` }}
                          />
                        </div>
                      </div>

                      {/* Earned Badges Row */}
                      <div className="flex items-center -space-x-1">
                        {item.stats.earnedBadges.slice(0, 3).map((b) => (
                          <div
                            key={b.id}
                            title={`${b.name} (${b.category})`}
                            className="w-7 h-7 rounded-full bg-white border border-blue-200 flex items-center justify-center text-xs shadow-xs cursor-pointer"
                          >
                            {b.icon}
                          </div>
                        ))}
                      </div>

                      {/* Non-competitive Cheer / Kudos button */}
                      <button
                        type="button"
                        onClick={() => handleSendKudos(item.member.id)}
                        className="bg-blue-50 hover:bg-blue-100 text-[#002B7F] border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Cheer</span>
                        {kudosCount > 0 && (
                          <span className="bg-[#002B7F] text-white text-[10px] px-1.5 rounded-full font-mono font-extrabold ml-1">
                            +{kudosCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Badge Modal Inspector */}
      {selectedBadgeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-3xl bg-slate-50 border-2 border-blue-200 flex items-center justify-center text-4xl shadow-md mx-auto">
                {selectedBadgeModal.icon}
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {selectedBadgeModal.name}
                </h3>
                <span className="inline-block bg-blue-50 text-[#002B7F] border border-blue-200 text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase font-bold mt-1">
                  {selectedBadgeModal.category} • {selectedBadgeModal.tier} Tier
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
                {selectedBadgeModal.description}
              </p>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 text-left space-y-1 font-mono">
                <div className="text-[#002B7F] font-bold">Unlock Requirement:</div>
                <div>{selectedBadgeModal.criteria}</div>
              </div>
            </div>

            <button
              onClick={() => setSelectedBadgeModal(null)}
              className="w-full bg-[#002B7F] hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              Close Badge Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
