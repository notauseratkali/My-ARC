import React, { useState } from 'react';
import { CertificateModal } from './CertificateModal';
import { AdvisorGovernanceModal } from './AdvisorGovernanceModal';
import { Member, Section, MemberStatus, Gender, SubCrew, MemberRequirementProgress, SyllabusRequirement, PortalSettings, AuditLogCategory } from '../types';
import { PRESET_AVATARS, getPlaceholderAvatar } from '../utils/avatarUtils';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  MessageCircle,
  Instagram,
  Send,
  Sparkles,
  Award,
  Image as ImageIcon,
  CheckCircle2,
  Crown,
  Layers,
  RotateCcw,
  Upload,
  Camera,
} from 'lucide-react';

interface MemberDirectoryProps {
  members: Member[];
  crews: SubCrew[];
  currentMember: Member;
  settings?: PortalSettings;
  onUpdateSettings?: (settings: PortalSettings) => void;
  progressList?: MemberRequirementProgress[];
  syllabus?: SyllabusRequirement[];
  onAddMember: (newMember: Omit<Member, 'id'>) => void;
  onUpdateMember: (updatedMember: Member) => void;
  onDeleteMember?: (id: string) => void;
  onLogAudit?: (action: string, category: AuditLogCategory, details: string, targetId?: string, targetName?: string) => void;
}

export const MemberDirectory: React.FC<MemberDirectoryProps> = ({
  members = [],
  crews = [],
  currentMember,
  settings,
  onUpdateSettings,
  progressList = [],
  syllabus = [],
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onLogAudit,
}) => {
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<Section | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'All'>('All');
  const [crewFilter, setCrewFilter] = useState<string>('All');
  const [awardStatusFilter, setAwardStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [drawerPhotoInput, setDrawerPhotoInput] = useState('');

  // Certificate Modal State
  const [certModal, setCertModal] = useState<{
    isOpen: boolean;
    member: Member | null;
    awardTier: string;
    completedCount: number;
    totalCount: number;
  }>({
    isOpen: false,
    member: null,
    awardTier: "President's Scout Award",
    completedCount: 0,
    totalCount: 0,
  });

  // Helper for reading image file upload
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, onRead: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        onRead(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Modal State for New Member Creation
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    idCard: '',
    dob: '',
    gender: 'Male' as Gender,
    section: 'Explorer' as Section,
    crewId: crews[0]?.id || 'male-city',
    councilRole: 'Member',
    investitureDate: new Date().toISOString().split('T')[0],
    status: 'Onboarding' as MemberStatus,
    term: '2025-2026',
    email: '',
    mobile: '',
    phone: '',
    permAddress: '',
    currAddress: '',
    telegram: '',
    whatsapp: '',
    instagram: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    avatar: '',
    photoUrl: '',
  });

  // Modal State for Council Editing Member Details
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [editMemberData, setEditMemberData] = useState<Member | null>(null);

  const handleOpenEditMember = (memberToEdit: Member) => {
    setEditMemberData({ ...memberToEdit });
    setIsEditMemberModalOpen(true);
  };

  const handleSaveEditMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMemberData) return;

    if (!editMemberData.name || !editMemberData.idCard || !editMemberData.dob) {
      alert('Name, ID Card Number, and Date of Birth are required fields.');
      return;
    }

    // Recalculate age from DOB
    const birthDate = new Date(editMemberData.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const crewObj = crews.find((c) => c.id === editMemberData.crewId);
    const updated: Member = {
      ...editMemberData,
      age,
      crewName: crewObj ? crewObj.name : editMemberData.crewName,
    };

    // Find original member to produce diff for audit log
    const oldMember = members.find((m) => m.id === updated.id);
    const diffs: string[] = [];
    if (oldMember) {
      if (oldMember.name !== updated.name) diffs.push(`Name ("${oldMember.name}" → "${updated.name}")`);
      if (oldMember.idCard !== updated.idCard) diffs.push(`ID Card ("${oldMember.idCard}" → "${updated.idCard}")`);
      if (oldMember.dob !== updated.dob) diffs.push(`DOB ("${oldMember.dob}" → "${updated.dob}")`);
      if (oldMember.section !== updated.section) diffs.push(`Section ("${oldMember.section}" → "${updated.section}")`);
      if (oldMember.councilRole !== updated.councilRole) diffs.push(`Council Role ("${oldMember.councilRole}" → "${updated.councilRole}")`);
      if (oldMember.crewId !== updated.crewId) diffs.push(`Sub-Crew ("${oldMember.crewName}" → "${updated.crewName}")`);
      if (oldMember.status !== updated.status) diffs.push(`Status ("${oldMember.status}" → "${updated.status}")`);
      if (oldMember.mobile !== updated.mobile) diffs.push(`Mobile ("${oldMember.mobile}" → "${updated.mobile}")`);
      if (oldMember.email !== updated.email) diffs.push(`Email ("${oldMember.email}" → "${updated.email}")`);
      if (oldMember.permAddress !== updated.permAddress) diffs.push(`Perm Address ("${oldMember.permAddress}" → "${updated.permAddress}")`);
      if (oldMember.currAddress !== updated.currAddress) diffs.push(`Current Address ("${oldMember.currAddress}" → "${updated.currAddress}")`);
      if (oldMember.emergencyContactName !== updated.emergencyContactName) diffs.push(`Emergency Contact ("${oldMember.emergencyContactName}" → "${updated.emergencyContactName}")`);
      if (oldMember.emergencyContactNumber !== updated.emergencyContactNumber) diffs.push(`Emergency Phone ("${oldMember.emergencyContactNumber}" → "${updated.emergencyContactNumber}")`);
    }

    const diffSummary = diffs.length > 0 ? diffs.join(', ') : 'Updated profile photo or minor details';

    onUpdateMember(updated);
    if (selectedMember && selectedMember.id === updated.id) {
      setSelectedMember(updated);
    }

    if (onLogAudit) {
      onLogAudit(
        'Updated Member Profile Details',
        'Member Management',
        `Edited member record for ${updated.name} (${updated.councilRole}): ${diffSummary}`,
        updated.id,
        updated.name
      );
    }

    setIsEditMemberModalOpen(false);
    alert(`Member details for "${updated.name}" updated successfully and logged to council audit trail.`);
  };

  const isCouncil = currentMember.councilRole !== 'Member';

  // Helper to compute progression award stats for a member
  const getMemberAwardStats = (member: Member) => {
    const relevantAward = member.section === 'Explorer' ? "President's Scout Award" : 'Baden-Powell (BP) Award';
    const memberReqs = syllabus.filter((s) => s.awardType === relevantAward || s.awardType === 'Auxiliary Badge');
    const memberProgs = progressList.filter((p) => p.memberId === member.id);

    const completedCount = memberProgs.filter((p) => p.status === 'Completed' || p.status === 'Verified').length;
    const submittedCount = memberProgs.filter((p) => p.status === 'Submitted').length;
    const inProgressCount = memberProgs.filter((p) => p.status === 'In Progress').length;
    const totalCount = memberReqs.length || 1;

    return {
      awardName: member.section === 'Explorer' ? "President's Scout" : 'BP Award',
      fullAwardType: relevantAward,
      completedCount,
      submittedCount,
      inProgressCount,
      totalCount,
      percentage: Math.min(100, Math.round((completedCount / totalCount) * 100)),
    };
  };

  // Update default avatar when section, councilRole or name changes
  const handleSectionOrRoleChange = (updated: Partial<typeof formData>) => {
    const nextFormData = { ...formData, ...updated };
    const autoAvatar = getPlaceholderAvatar(nextFormData.section, nextFormData.councilRole, nextFormData.name);
    setFormData({
      ...nextFormData,
      avatar: autoAvatar,
    });
  };

  // Members accessible based on role: Council sees all, Members see only themselves
  const accessibleMembers = isCouncil
    ? members
    : members.filter((m) => m.id === currentMember.id);

  // Filter Members based on global search query, section, status, crew sub-group & progression award status
  const filteredMembers = accessibleMembers.filter((m) => {
    // 1. Section Filter
    if (sectionFilter !== 'All' && m.section !== sectionFilter) return false;

    // 2. Lifecycle Status Filter
    if (statusFilter !== 'All' && m.status !== statusFilter) return false;

    // 3. Crew Sub-Group Filter
    if (crewFilter !== 'All' && m.crewId !== crewFilter) return false;

    // Progression Stats for Member m
    const stats = getMemberAwardStats(m);
    const mProgress = progressList.filter((p) => p.memberId === m.id);

    // 4. Progression Award Status Filter Dropdown
    if (awardStatusFilter !== 'All') {
      if (awardStatusFilter === 'PSA' && m.section !== 'Explorer') return false;
      if (awardStatusFilter === 'BP' && m.section !== 'Rover') return false;
      if (awardStatusFilter === 'Completed' && stats.completedCount === 0) return false;
      if (awardStatusFilter === 'Submitted' && stats.submittedCount === 0) return false;
      if (awardStatusFilter === 'In_Progress' && stats.inProgressCount === 0) return false;
      if (awardStatusFilter === 'Not_Started' && mProgress.length > 0) return false;
    }

    // 5. Global Search Input matching across Name, Crew Sub-Group, and Progression Award Status
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();

      // Name & Contact details match
      const matchName = (m.name || '').toLowerCase().includes(q);
      const matchId = (m.idCard || '').toLowerCase().includes(q);
      const matchEmail = (m.email || '').toLowerCase().includes(q);
      const matchMobile = (m.mobile || '').toLowerCase().includes(q);
      const matchRole = (m.councilRole || '').toLowerCase().includes(q);

      // Crew Sub-Group match
      const crewObj = crews.find((c) => c.id === m.crewId);
      const matchCrew =
        (m.crewName || '').toLowerCase().includes(q) ||
        (m.crewId || '').toLowerCase().includes(q) ||
        (crewObj && ((crewObj.name || '').toLowerCase().includes(q) || (crewObj.location || '').toLowerCase().includes(q)));

      // Progression Award Status & Title match
      const matchAwardName =
        (stats.awardName || '').toLowerCase().includes(q) ||
        (stats.fullAwardType || '').toLowerCase().includes(q) ||
        (q.includes('psa') && m.section === 'Explorer') ||
        (q.includes('bp') && m.section === 'Rover') ||
        (q.includes('president') && m.section === 'Explorer');

      // Status text match (e.g. "completed", "in progress", "submitted", "verified")
      const hasMatchingStatusText =
        (q.includes('complete') && stats.completedCount > 0) ||
        (q.includes('submit') && stats.submittedCount > 0) ||
        (q.includes('progress') && stats.inProgressCount > 0);

      // Requirement title or category match
      const hasMatchingRequirementTitle = mProgress.some((p) => {
        const req = syllabus.find((s) => s.id === p.requirementId);
        return req
          ? req.title.toLowerCase().includes(q) ||
              req.category.toLowerCase().includes(q) ||
              p.status.toLowerCase().includes(q)
          : false;
      });

      return (
        matchName ||
        matchId ||
        matchEmail ||
        matchMobile ||
        matchRole ||
        matchCrew ||
        matchAwardName ||
        hasMatchingStatusText ||
        hasMatchingRequirementTitle
      );
    }

    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.idCard || !formData.dob) {
      alert('Please fill in required fields (Name, ID Card Number, Date of Birth).');
      return;
    }

    // Calculate age from DOB
    const birthDate = new Date(formData.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const crewObj = crews.find((c) => c.id === formData.crewId);
    const finalPhoto = formData.photoUrl || formData.avatar || getPlaceholderAvatar(formData.section, formData.councilRole, formData.name);

    onAddMember({
      ...formData,
      avatar: finalPhoto,
      photoUrl: finalPhoto,
      age,
      crewName: crewObj ? crewObj.name : 'Male City Crew',
      attendanceUnexcused: 0,
      attendanceExcused: 0,
    });

    setIsNewMemberModalOpen(false);
    alert(`Member "${formData.name}" successfully onboarded into the portal!`);
  };

  const handleStatusChange = (member: Member, newStatus: MemberStatus) => {
    let updatedSection = member.section;
    // Auto transition to Rover if turning 18
    if (member.age >= 18 && member.section === 'Explorer' && newStatus === 'Active') {
      updatedSection = 'Rover';
    }

    const updated = {
      ...member,
      status: newStatus,
      section: updatedSection,
    };
    onUpdateMember(updated);
    if (selectedMember && selectedMember.id === member.id) {
      setSelectedMember(updated);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1A1E26] border border-slate-800 p-5 rounded-2xl shadow-md">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Rover & Explorer Directory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Unified member registry separated into Explorer (&lt;18) and Rover (18-26) age brackets.
          </p>
        </div>

        {isCouncil && (
          <div className="flex items-center gap-2">
            {currentMember.councilRole === 'Rover Advisor' && (
              <button
                onClick={() => setIsAdvisorModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2"
                title="Execute Rover Advisor Supreme Governance: Replace Chairperson or Overhaul Leadership"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                <span>Replace Chairperson / Overhaul</span>
              </button>
            )}

            <button
              id="directory-add-member-btn"
              onClick={() => setIsNewMemberModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Onboard New Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Non-Council Privacy Banner */}
      {!isCouncil && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs p-4 rounded-2xl flex items-center gap-3">
          <Shield className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <span className="font-bold">Personal Directory Record:</span> As a standard Member, you can only view your own directory profile. Full troop directory access is restricted to Executive Council Officers.
          </div>
        </div>
      )}

      {/* Section Switcher Tabs (Explorers vs Rovers) */}
      {isCouncil ? (
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setSectionFilter('All')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition ${
              sectionFilter === 'All'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'bg-[#1A1E26] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Members ({members.length})
          </button>
          <button
            onClick={() => setSectionFilter('Explorer')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
              sectionFilter === 'Explorer'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'bg-[#1A1E26] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Explorer Section (&lt;18)</span>
            <span className="bg-[#161920] px-1.5 py-0.2 rounded font-mono text-[10px]">
              {members.filter((m) => m.section === 'Explorer').length}
            </span>
          </button>
          <button
            onClick={() => setSectionFilter('Rover')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
              sectionFilter === 'Rover'
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold'
                : 'bg-[#1A1E26] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-sky-400" />
            <span>Rover Section (18-26)</span>
            <span className="bg-[#161920] px-1.5 py-0.2 rounded font-mono text-[10px]">
              {members.filter((m) => m.section === 'Rover').length}
            </span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <div className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            <span>My Personal Registry Profile</span>
          </div>
        </div>
      )}

      {/* Search & Filters Bar */}
      {isCouncil && (
        <div className="bg-[#1A1E26] border border-slate-800 p-4 rounded-xl space-y-3 shadow-md">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Global Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Global search by name, crew sub-group (e.g. Male City), or progression award status (e.g. BP Award, Completed)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161920] border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-slate-800 transition"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Selectors Group */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Crew Sub-Group Filter */}
              <div className="flex items-center gap-1.5 bg-[#161920] border border-slate-800 px-3 py-1.5 rounded-xl">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400 font-medium hidden sm:inline">Crew:</span>
                <select
                  value={crewFilter}
                  onChange={(e) => setCrewFilter(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer font-medium"
                >
                  <option value="All" className="bg-[#161920]">All Sub-Crews</option>
                  {crews.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#161920]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Progression Award Status Filter */}
              <div className="flex items-center gap-1.5 bg-[#161920] border border-slate-800 px-3 py-1.5 rounded-xl">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400 font-medium hidden sm:inline">Award Status:</span>
                <select
                  value={awardStatusFilter}
                  onChange={(e) => setAwardStatusFilter(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer font-medium"
                >
                  <option value="All" className="bg-[#161920]">All Award Statuses</option>
                  <option value="PSA" className="bg-[#161920]">President's Scout (Explorers)</option>
                  <option value="BP" className="bg-[#161920]">Baden-Powell (Rovers)</option>
                  <option value="Completed" className="bg-[#161920]">Requirements Completed</option>
                  <option value="Submitted" className="bg-[#161920]">Evidence Submitted (Pending)</option>
                  <option value="In_Progress" className="bg-[#161920]">In Progress</option>
                  <option value="Not_Started" className="bg-[#161920]">Not Started</option>
                </select>
              </div>

              {/* Lifecycle Status Filter */}
              <div className="flex items-center gap-1.5 bg-[#161920] border border-slate-800 px-3 py-1.5 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-slate-400 font-medium hidden sm:inline">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer font-medium"
                >
                  <option value="All" className="bg-[#161920]">All Lifecycle Statuses</option>
                  <option value="Active" className="bg-[#161920]">Active</option>
                  <option value="Onboarding" className="bg-[#161920]">Onboarding</option>
                  <option value="Suspended" className="bg-[#161920]">Suspended</option>
                  <option value="Terminated" className="bg-[#161920]">Terminated</option>
                  <option value="Resigned" className="bg-[#161920]">Resigned</option>
                  <option value="Rejected" className="bg-[#161920]">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Badges & Reset */}
          {(searchQuery || crewFilter !== 'All' || awardStatusFilter !== 'All' || statusFilter !== 'All' || sectionFilter !== 'All') && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-500 font-medium">Active Filters:</span>
              {searchQuery && (
                <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono">
                  Query: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {sectionFilter !== 'All' && (
                <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  Section: {sectionFilter}
                  <button onClick={() => setSectionFilter('All')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {crewFilter !== 'All' && (
                <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  Crew: {crews.find((c) => c.id === crewFilter)?.name || crewFilter}
                  <button onClick={() => setCrewFilter('All')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {awardStatusFilter !== 'All' && (
                <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  Award Status: {awardStatusFilter}
                  <button onClick={() => setAwardStatusFilter('All')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {statusFilter !== 'All' && (
                <span className="bg-sky-500/10 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  Lifecycle: {statusFilter}
                  <button onClick={() => setStatusFilter('All')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCrewFilter('All');
                  setAwardStatusFilter('All');
                  setStatusFilter('All');
                  setSectionFilter('All');
                }}
                className="text-xs text-rose-400 hover:text-rose-300 ml-auto flex items-center gap-1 font-semibold transition"
              >
                <RotateCcw className="w-3 h-3" />
                Reset All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Directory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-[#1A1E26] border border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-2">
            <Search className="w-8 h-8 text-slate-600" />
            <p className="font-semibold text-slate-300">No member records match the specified search parameters.</p>
            <p className="text-[11px] text-slate-500">Try searching by member name, crew sub-group (e.g. Male City), or progression status.</p>
            {(searchQuery || crewFilter !== 'All' || awardStatusFilter !== 'All' || statusFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCrewFilter('All');
                  setAwardStatusFilter('All');
                  setStatusFilter('All');
                }}
                className="mt-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs px-3 py-1.5 rounded-xl font-medium transition"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          filteredMembers.map((m) => {
            const stats = getMemberAwardStats(m);

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className="bg-[#1A1E26] border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 cursor-pointer transition shadow-md flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#161920] border border-slate-700 flex items-center justify-center font-bold text-sm text-emerald-400 overflow-hidden flex-shrink-0 shadow-inner">
                        {m.photoUrl || m.avatar ? (
                          <img src={m.photoUrl || m.avatar} alt={m.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                          m.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-100 group-hover:text-emerald-400 transition line-clamp-1">
                          {m.name}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-400">ID: {m.idCard}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Lifecycle Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono ${
                          m.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : m.status === 'Onboarding'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : m.status === 'Suspended'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {m.status}
                      </span>
                      {onDeleteMember && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete member "${m.name}"?`)) {
                              onDeleteMember(m.id);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition"
                          title="Delete Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Section, Council Role & Crew Sub-group */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-[#161920] p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 text-[10px] block font-mono">Section & Age</span>
                      <span className="font-semibold text-emerald-400">
                        {m.section} ({m.age} yrs)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block font-mono">Crew Sub-Group</span>
                      <span className="font-semibold text-slate-200 truncate block" title={m.isSuperAdmin || m.councilRole === 'Superadmin' ? 'N/A (Superadmin)' : (m.crewName || 'Unassigned Crew')}>
                        {m.isSuperAdmin || m.councilRole === 'Superadmin' ? 'N/A (Superadmin)' : (m.crewName || 'Unassigned Crew')}
                      </span>
                    </div>
                  </div>

                  {/* Progression Award Status Badge Bar */}
                  <div className="bg-[#161920]/80 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[11px] text-slate-300">{stats.awardName}</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        {stats.completedCount}/{stats.totalCount} Req ({stats.percentage}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400">
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{m.mobile}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{m.email}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Invested: {m.investitureDate}</span>
                  <span className="text-emerald-400 font-semibold group-hover:translate-x-1 transition flex items-center gap-0.5">
                    Full Profile &rarr;
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Member Details Drawer Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-6 text-slate-100 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                <div className="relative group flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-700/50 flex items-center justify-center font-bold text-xl text-emerald-300 overflow-hidden shadow-inner">
                    {selectedMember.photoUrl || selectedMember.avatar ? (
                      <img
                        src={selectedMember.photoUrl || selectedMember.avatar}
                        alt={selectedMember.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedMember.name.charAt(0)
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPhoto(!isEditingPhoto);
                      setDrawerPhotoInput(selectedMember.photoUrl || selectedMember.avatar || '');
                    }}
                    className="absolute -bottom-1 -right-1 bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-full shadow-lg border border-slate-900 transition"
                    title="Upload or Update Profile Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <h3 className="text-xl font-bold font-serif text-slate-100">{selectedMember.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">ID: {selectedMember.idCard}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{selectedMember.section} Section</span>
                    <span>•</span>
                    <span>{selectedMember.isSuperAdmin || selectedMember.councilRole === 'Superadmin' ? 'N/A (Superadmin)' : (selectedMember.crewName || 'Unassigned Crew')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPhoto(!isEditingPhoto);
                      setDrawerPhotoInput(selectedMember.photoUrl || selectedMember.avatar || '');
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-1 font-medium transition"
                  >
                    <Camera className="w-3 h-3" />
                    <span>{isEditingPhoto ? 'Close Photo Editor' : 'Upload / Update Profile Photo'}</span>
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedMember(null);
                  setIsEditingPhoto(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Photo Upload / Edit Section */}
            {isEditingPhoto && (
              <div className="bg-slate-950/90 border border-emerald-500/30 p-4 rounded-xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs text-slate-200 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Upload or Set Profile Photo</span>
                  </span>
                  <span className="text-[10px] text-slate-400">JPG, PNG, WEBP or Image URL</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="cursor-pointer bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition w-full sm:w-auto justify-center">
                    <Upload className="w-4 h-4" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleImageFileUpload(e, (dataUrl) => setDrawerPhotoInput(dataUrl))
                      }
                    />
                  </label>

                  <span className="text-xs text-slate-500">or</span>

                  <input
                    type="text"
                    placeholder="Paste image URL (https://...)"
                    value={drawerPhotoInput}
                    onChange={(e) => setDrawerPhotoInput(e.target.value)}
                    className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {drawerPhotoInput && (
                  <div className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex-shrink-0">
                      <img src={drawerPhotoInput} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs text-emerald-400 font-medium truncate flex-1">New profile photo preview ready</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...selectedMember,
                          photoUrl: drawerPhotoInput,
                          avatar: drawerPhotoInput,
                        };
                        onUpdateMember(updated);
                        setSelectedMember(updated);
                        setIsEditingPhoto(false);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow"
                    >
                      Save Profile Photo
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Lifecycle Status & Council Control */}
            {isCouncil && (
              <div className="bg-slate-950/80 border border-emerald-900/50 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Lifecycle Status Control (Council Access)</span>
                  <span className="text-emerald-300 text-[11px]">Manage onboarding, active status, or suspensions.</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMember.status}
                    onChange={(e) => handleStatusChange(selectedMember, e.target.value as MemberStatus)}
                    className="bg-slate-900 border border-emerald-700 text-emerald-200 font-semibold rounded-lg px-3 py-1.5 focus:outline-none"
                  >
                    <option value="Onboarding">Onboarding</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            )}

            {/* Detailed Information Tabs / Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Personal & Identity */}
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] font-mono border-b border-slate-800/80 pb-1.5">
                  1. Personal & Identity
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-400">Full Name:</span><span className="font-medium">{selectedMember.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">ID Card Number:</span><span className="font-mono text-emerald-300">{selectedMember.idCard}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Date of Birth:</span><span>{selectedMember.dob} ({selectedMember.age} yrs)</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Gender:</span><span>{selectedMember.gender}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Section:</span><span className="font-semibold text-emerald-400">{selectedMember.section}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Investiture Date:</span><span>{selectedMember.investitureDate}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Council Position:</span><span className="font-medium text-amber-300">{selectedMember.councilRole}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Active Term:</span><span>{selectedMember.term}</span></div>
                </div>
              </div>

              {/* Contact & Location */}
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] font-mono border-b border-slate-800/80 pb-1.5">
                  2. Contact & Addresses
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-400">Email Address:</span><span className="font-medium text-slate-200 truncate">{selectedMember.email}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Mobile Number:</span><span>{selectedMember.mobile}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Phone Number:</span><span>{selectedMember.phone || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Permanent Address:</span><span className="text-right truncate">{selectedMember.permAddress}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Current Address:</span><span className="text-right truncate">{selectedMember.currAddress}</span></div>
                </div>
              </div>

              {/* Messaging & Socials */}
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] font-mono border-b border-slate-800/80 pb-1.5">
                  3. Messaging & Social Tags
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center"><span className="text-slate-400 flex items-center gap-1"><Send className="w-3 h-3 text-blue-400" /> Telegram:</span><span>{selectedMember.telegram || 'N/A'}</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-400 flex items-center gap-1"><MessageCircle className="w-3 h-3 text-emerald-400" /> WhatsApp:</span><span>{selectedMember.whatsapp || 'N/A'}</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-400 flex items-center gap-1"><Instagram className="w-3 h-3 text-pink-400" /> Instagram:</span><span>{selectedMember.instagram || 'N/A'}</span></div>
                </div>
              </div>

              {/* Emergency & Attendance Stats */}
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] font-mono border-b border-slate-800/80 pb-1.5">
                  4. Emergency & Attendance Metrics
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-400">Emergency Contact:</span><span className="font-medium">{selectedMember.emergencyContactName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Emergency Phone:</span><span className="font-mono text-amber-300">{selectedMember.emergencyContactNumber}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Unexcused Absences:</span><span className="font-bold text-rose-400">{selectedMember.attendanceUnexcused} Sessions</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Excused Absences:</span><span className="font-medium text-blue-300">{selectedMember.attendanceExcused} Sessions</span></div>
                </div>
              </div>
            </div>

            {/* Crew Sub-Group & Progression Award Status Summary */}
            {(() => {
              const stats = getMemberAwardStats(selectedMember);
              return (
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] font-mono border-b border-slate-800/80 pb-1.5 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>5. Crew Sub-Group & Progression Award Status</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-slate-400 text-[10px] block font-mono">Assigned Crew Sub-Group</span>
                      <span className="font-bold text-slate-100 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        {selectedMember.isSuperAdmin || selectedMember.councilRole === 'Superadmin' ? 'N/A (Superadmin)' : (selectedMember.crewName || 'Unassigned Crew')}
                      </span>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-slate-400 text-[10px] block font-mono">Target Award Track</span>
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        {stats.fullAwardType}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-300">Award Progress Status</span>
                      <span className="text-emerald-400 font-mono">
                        {stats.completedCount}/{stats.totalCount} Requirements Verified ({stats.percentage}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>In Progress: <strong className="text-amber-300">{stats.inProgressCount}</strong></span>
                      <span>Submitted Evidence: <strong className="text-sky-300">{stats.submittedCount}</strong></span>
                      <span>Verified/Completed: <strong className="text-emerald-300">{stats.completedCount}</strong></span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setCertModal({
                            isOpen: true,
                            member: selectedMember,
                            awardTier: stats.fullAwardType,
                            completedCount: stats.completedCount,
                            totalCount: stats.totalCount,
                          });
                        }}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow"
                      >
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>Generate Official Award Certificate (PDF)</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {onDeleteMember && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete member "${selectedMember.name}"?`)) {
                        onDeleteMember(selectedMember.id);
                        setSelectedMember(null);
                      }
                    }}
                    className="bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Record</span>
                  </button>
                )}

                {isCouncil && (
                  <button
                    type="button"
                    onClick={() => handleOpenEditMember(selectedMember)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Member Details</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedMember(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-5 py-2 rounded-xl transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Member Creation Modal */}
      {isNewMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-100 space-y-5 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold font-serif text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                Council Onboarding: Add New Explorer / Rover
              </h3>
              <button
                type="button"
                onClick={() => setIsNewMemberModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Photo / Avatar Upload Section */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Member Profile Photo / Avatar</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  Upload Photo or Select Preset
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-lg text-emerald-400 overflow-hidden flex-shrink-0 shadow-inner">
                  {formData.photoUrl || formData.avatar ? (
                    <img
                      src={formData.photoUrl || formData.avatar}
                      alt="Avatar Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{formData.name ? formData.name.charAt(0) : 'S'}</span>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="text-[11px] text-slate-400">Choose a generated avatar preset:</div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_AVATARS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, avatar: preset.url, photoUrl: preset.url })}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                          (formData.photoUrl || formData.avatar) === preset.url
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{preset.category}</span>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const seedUrl = `https://picsum.photos/seed/${encodeURIComponent(formData.name || 'scout')}/200/200`;
                        setFormData({
                          ...formData,
                          avatar: seedUrl,
                          photoUrl: seedUrl,
                        });
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg border bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 transition"
                    >
                      🎲 Dynamic Seed Avatar
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <label className="cursor-pointer bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Local Photo File</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleImageFileUpload(e, (dataUrl) =>
                        setFormData({ ...formData, photoUrl: dataUrl, avatar: dataUrl })
                      )
                    }
                  />
                </label>
                <input
                  type="text"
                  placeholder="Or paste custom profile photo URL (https://...)"
                  value={formData.photoUrl || formData.avatar}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value, avatar: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hassan Mohamed"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoAvatar = formData.avatar ? formData.avatar : getPlaceholderAvatar(formData.section, formData.councilRole, name);
                    setFormData({ ...formData, name, avatar: autoAvatar });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">ID Card Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A298112"
                  value={formData.idCard}
                  onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-600"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Section Assignment</label>
                <select
                  value={formData.section}
                  onChange={(e) => handleSectionOrRoleChange({ section: e.target.value as Section })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-600"
                >
                  <option value="Explorer">Explorer Section (&lt;18 - President's Scout)</option>
                  <option value="Rover">Rover Section (18-26 - BP Award)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Sub-Crew Assignment</label>
                <select
                  value={formData.crewId}
                  onChange={(e) => setFormData({ ...formData, crewId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-600"
                >
                  {crews.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Mobile Number</label>
                <input
                  type="text"
                  placeholder="+960 7712345"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Permanent Address</label>
                <input
                  type="text"
                  placeholder="e.g. G. Sunshine, Male City"
                  value={formData.permAddress}
                  onChange={(e) => setFormData({ ...formData, permAddress: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Current Address</label>
                <input
                  type="text"
                  placeholder="e.g. Flat 4-2-08, Hulhumale"
                  value={formData.currAddress}
                  onChange={(e) => setFormData({ ...formData, currAddress: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Emergency Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. Parent / Guardian Name"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Emergency Contact Phone</label>
                <input
                  type="text"
                  placeholder="+960 7799000"
                  value={formData.emergencyContactNumber}
                  onChange={(e) => setFormData({ ...formData, emergencyContactNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewMemberModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2 rounded-xl transition shadow-md"
              >
                Onboard Member into System
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Certificate Modal */}
      {certModal.isOpen && certModal.member && (
        <CertificateModal
          isOpen={certModal.isOpen}
          onClose={() => setCertModal((prev) => ({ ...prev, isOpen: false }))}
          member={certModal.member}
          awardTier={certModal.awardTier}
          completedItemsCount={certModal.completedCount}
          totalItemsCount={certModal.totalCount}
          signedByLeader={`${currentMember.name} (${currentMember.councilRole})`}
        />
      )}

      {/* Rover Advisor Executive Overhaul Modal */}
      <AdvisorGovernanceModal
        isOpen={isAdvisorModalOpen}
        onClose={() => setIsAdvisorModalOpen(false)}
        currentMember={currentMember}
        members={members}
        onUpdateMember={onUpdateMember}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />

      {/* Council Edit Member Details Modal */}
      {isEditMemberModalOpen && editMemberData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveEditMember}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 text-slate-100 space-y-5 animate-fadeIn my-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold font-serif text-slate-100">
                  Council Control: Edit Member Profile Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditMemberModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs p-3 rounded-xl flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Audit Compliance:</strong> All changes made to this member's profile will be recorded automatically in the Council Audit Log with your timestamp and member ID.
              </span>
            </div>

            {/* 1. Identity & Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-1">
                1. Personal Identity & Scouting Section
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editMemberData.name}
                    onChange={(e) => setEditMemberData({ ...editMemberData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">ID Card Number (NID) *</label>
                  <input
                    type="text"
                    required
                    value={editMemberData.idCard}
                    onChange={(e) => setEditMemberData({ ...editMemberData, idCard: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={editMemberData.dob}
                    onChange={(e) => setEditMemberData({ ...editMemberData, dob: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Gender</label>
                  <select
                    value={editMemberData.gender}
                    onChange={(e) => setEditMemberData({ ...editMemberData, gender: e.target.value as Gender })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Scouting Section</label>
                  <select
                    value={editMemberData.section}
                    onChange={(e) => setEditMemberData({ ...editMemberData, section: e.target.value as Section })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Explorer">Explorer Section (&lt;18)</option>
                    <option value="Rover">Rover Section (18-26)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assigned Sub-Crew</label>
                  {editMemberData.isSuperAdmin || editMemberData.councilRole === 'Superadmin' ? (
                    <input
                      type="text"
                      disabled
                      value="N/A (Superadmin)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 cursor-not-allowed text-xs"
                    />
                  ) : (
                    <select
                      value={editMemberData.crewId}
                      onChange={(e) => {
                        const selectedCrew = crews.find((c) => c.id === e.target.value);
                        setEditMemberData({
                          ...editMemberData,
                          crewId: e.target.value,
                          crewName: selectedCrew ? selectedCrew.name : editMemberData.crewName,
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      {crews.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.location})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Governance Role & Status */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-1">
                2. Governance Role & Lifecycle Status
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Council Role / Position</label>
                  <select
                    value={editMemberData.councilRole}
                    onChange={(e) => setEditMemberData({ ...editMemberData, councilRole: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Member">Member (General)</option>
                    <option value="Chairperson">Chairperson</option>
                    <option value="Vice Chairperson">Vice Chairperson</option>
                    <option value="Secretary">Secretary</option>
                    <option value="Treasurer">Treasurer</option>
                    <option value="Event Coordinator">Event Coordinator</option>
                    <option value="Progress Coordinator">Progress Coordinator</option>
                    <option value="Media Coordinator">Media Coordinator</option>
                    <option value="Rover Advisor">Rover Advisor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Lifecycle Status</label>
                  <select
                    value={editMemberData.status}
                    onChange={(e) => setEditMemberData({ ...editMemberData, status: e.target.value as MemberStatus })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Onboarding">Onboarding</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Active Term / Year</label>
                  <input
                    type="text"
                    value={editMemberData.term}
                    onChange={(e) => setEditMemberData({ ...editMemberData, term: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 3. Contact Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-1">
                3. Contact Information & Addresses
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editMemberData.email}
                    onChange={(e) => setEditMemberData({ ...editMemberData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Mobile Phone Number</label>
                  <input
                    type="text"
                    value={editMemberData.mobile}
                    onChange={(e) => setEditMemberData({ ...editMemberData, mobile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Permanent Address</label>
                  <input
                    type="text"
                    value={editMemberData.permAddress}
                    onChange={(e) => setEditMemberData({ ...editMemberData, permAddress: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Current Residence Address</label>
                  <input
                    type="text"
                    value={editMemberData.currAddress}
                    onChange={(e) => setEditMemberData({ ...editMemberData, currAddress: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. Emergency Contacts & Socials */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-1">
                4. Emergency Contacts & Messaging Accounts
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Emergency Contact Person Name</label>
                  <input
                    type="text"
                    value={editMemberData.emergencyContactName}
                    onChange={(e) => setEditMemberData({ ...editMemberData, emergencyContactName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Emergency Contact Phone Number</label>
                  <input
                    type="text"
                    value={editMemberData.emergencyContactNumber}
                    onChange={(e) => setEditMemberData({ ...editMemberData, emergencyContactNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500 text-amber-300"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Telegram Username</label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={editMemberData.telegram || ''}
                    onChange={(e) => setEditMemberData({ ...editMemberData, telegram: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">WhatsApp Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+960..."
                    value={editMemberData.whatsapp || ''}
                    onChange={(e) => setEditMemberData({ ...editMemberData, whatsapp: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditMemberModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Member Profile Updates</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
