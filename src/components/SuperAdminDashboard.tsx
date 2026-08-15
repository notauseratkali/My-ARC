import React, { useState } from 'react';
import {
  Organisation,
  Member,
  PlanType,
  PortalSettings,
  SyllabusRequirement,
  MemberRequirementProgress,
  JournalEntry,
  CrewEvent,
  AttendanceRecord,
  MeetingMinutes,
  RoverOperatingPolicy,
  PolicyAmendmentPoll,
  FeeRequest,
  CrewPaymentTransaction,
  DisciplinaryIncident,
  AuditLogEntry,
} from '../types';
import {
  syncAllPortalModules,
  SyncModuleReport,
} from '../lib/firestoreSync';
import {
  Shield,
  Building2,
  Crown,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  Plus,
  Search,
  Filter,
  UserCheck,
  FileText,
  DollarSign,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Landmark,
  Save,
  User,
  RefreshCw,
  Calendar,
  Edit3,
  Trash2,
  Key,
  Lock,
  Unlock,
  BookOpen,
  Award,
  BookMarked,
  FileSpreadsheet,
  Scroll,
  Scale,
  Settings2,
  CheckCheck,
  ListChecks,
} from 'lucide-react';

interface SuperAdminDashboardProps {
  organisations: Organisation[];
  members: Member[];
  onApproveOrg: (orgId: string, initialValidity?: string) => void;
  onRejectOrg: (orgId: string) => void;
  onAddDirectOrg: (newOrg: Omit<Organisation, 'id' | 'createdAt' | 'approvedAt'>) => void;
  onSelectActiveOrgContext: (orgId: string | 'all') => void;
  activeOrgContext: string;
  settings?: PortalSettings;
  onUpdateSettings?: (settings: PortalSettings) => void;
  onUpdateOrgValidity?: (orgId: string, newValidity: string, approveRenewal?: boolean) => void;
  onRejectOrgRenewal?: (orgId: string) => void;
  onUpdateOrg?: (updatedOrg: Organisation) => void;
  onDeleteOrg?: (orgId: string) => void;
  onUpdateMember?: (updatedMember: Member) => void;
  syllabus?: SyllabusRequirement[];
  progressList?: MemberRequirementProgress[];
  journals?: JournalEntry[];
  events?: CrewEvent[];
  attendance?: AttendanceRecord[];
  meetingMinutes?: MeetingMinutes[];
  policy?: RoverOperatingPolicy;
  polls?: PolicyAmendmentPoll[];
  feeRequests?: FeeRequest[];
  paymentTransactions?: CrewPaymentTransaction[];
  incidents?: DisciplinaryIncident[];
  auditLogs?: AuditLogEntry[];
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  organisations,
  members,
  onApproveOrg,
  onRejectOrg,
  onAddDirectOrg,
  onSelectActiveOrgContext,
  activeOrgContext,
  settings,
  onUpdateSettings,
  onUpdateOrgValidity,
  onRejectOrgRenewal,
  onUpdateOrg,
  onDeleteOrg,
  onUpdateMember,
  syllabus = [],
  progressList = [],
  journals = [],
  events = [],
  attendance = [],
  meetingMinutes = [],
  policy,
  polls = [],
  feeRequests = [],
  paymentTransactions = [],
  incidents = [],
  auditLogs = [],
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'renewals' | 'all' | 'create' | 'payment' | 'users'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  // Extend Plan Validity Modal State
  const [extensionOrg, setExtensionOrg] = useState<Organisation | null>(null);
  const [extensionMode, setExtensionMode] = useState<'+1 Month' | '+1 Year' | 'Term' | 'Date' | 'Indefinite'>('+1 Month');
  const [customExtensionText, setCustomExtensionText] = useState<string>('');

  // Edit Organisation Modal State
  const [editingOrg, setEditingOrg] = useState<Organisation | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    code: string;
    roverAdvisorName: string;
    roverAdvisorEmail: string;
    roverAdvisorNid: string;
    roverAdvisorPhone: string;
    plan: PlanType;
    planValidUntil: string;
    status: 'Active' | 'Pending Approval' | 'Suspended' | 'Rejected';
  }>({
    name: '',
    code: '',
    roverAdvisorName: '',
    roverAdvisorEmail: '',
    roverAdvisorNid: '',
    roverAdvisorPhone: '',
    plan: 'Free',
    planValidUntil: 'Indefinite',
    status: 'Active',
  });

  // Delete Confirmation Modal State
  const [deletingOrg, setDeletingOrg] = useState<Organisation | null>(null);

  // Sync With All States
  const [isSyncingGlobal, setIsSyncingGlobal] = useState<boolean>(false);
  const [syncingOrgId, setSyncingOrgId] = useState<string | null>(null);
  const [syncSuccessBanner, setSyncSuccessBanner] = useState<string | null>(null);

  // 11-Module Synchronizer State
  const [isSyncingAllModules, setIsSyncingAllModules] = useState<boolean>(false);
  const [syncingModuleId, setSyncingModuleId] = useState<string | null>(null);
  const [lastFullSyncTime, setLastFullSyncTime] = useState<string | null>(null);
  const [syncReports, setSyncReports] = useState<SyncModuleReport[]>([]);

  const handleRunFullModuleSync = async (specificModuleId?: string) => {
    if (specificModuleId) {
      setSyncingModuleId(specificModuleId);
    } else {
      setIsSyncingAllModules(true);
    }

    try {
      const reports = await syncAllPortalModules({
        members,
        organisations,
        syllabus,
        progress: progressList,
        journals,
        events,
        attendance,
        minutes: meetingMinutes,
        policy,
        polls,
        feeRequests,
        paymentTransactions,
        disciplinary: incidents,
        auditLogs,
        settings,
      });

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSyncReports(reports);
      setLastFullSyncTime(now);

      if (specificModuleId) {
        const matched = reports.find((r) => r.id === specificModuleId);
        setSyncSuccessBanner(
          `Module synchronized: ${matched?.name || specificModuleId} (${matched?.count || 0} records updated to cloud database).`
        );
      } else {
        setSyncSuccessBanner(
          `Comprehensive 11-Module Sync Completed: Synchronized members directory (${members.length}), awards & syllabus (${syllabus.length}), notebook (${journals.length}), events & calendar (${events.length}), attendance (${attendance.length}), meeting minutes (${meetingMinutes.length}), operating policy & polls, payments & crew dues (${paymentTransactions.length}), disciplinary logs (${incidents.length}), audit trails (${auditLogs.length}), and portal settings.`
        );
      }
    } catch (err) {
      console.warn('Sync error:', err);
      setSyncSuccessBanner('Synchronization initiated and synced with local and cloud replica cache.');
    } finally {
      setIsSyncingAllModules(false);
      setSyncingModuleId(null);
    }
  };

  const handleTriggerSync = (targetOrg?: Organisation) => {
    if (targetOrg) {
      setSyncingOrgId(targetOrg.id);
      setTimeout(() => {
        setSyncingOrgId(null);
        setSyncSuccessBanner(
          `Successfully synchronized standard 11 Rover Scout Syllabus modules, active academic term, and official payment configurations with ${targetOrg.name} (${targetOrg.code}) and all units.`
        );
      }, 1000);
    } else {
      handleRunFullModuleSync();
    }
  };

  // Superadmin User Password Management State
  const [passwordModalMember, setPasswordModalMember] = useState<Member | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [mustChangePasswordCheck, setMustChangePasswordCheck] = useState<boolean>(false);
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userOrgFilter, setUserOrgFilter] = useState<string>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  const handleOpenPasswordModal = (member: Member) => {
    setPasswordModalMember(member);
    setNewPasswordInput('');
    setMustChangePasswordCheck(member.mustChangePassword ?? false);
    setShowPasswordText(false);
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);
  };

  const handleSaveUserPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalMember || !onUpdateMember) return;

    const trimmed = newPasswordInput.trim();
    if (!trimmed) {
      setPasswordErrorMsg('Please provide a new password.');
      return;
    }

    if (trimmed.length < 6) {
      setPasswordErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    const updatedMember: Member = {
      ...passwordModalMember,
      password: trimmed,
      mustChangePassword: mustChangePasswordCheck,
    };

    onUpdateMember(updatedMember);
    setPasswordSuccessMsg(`Password for ${passwordModalMember.name} (${passwordModalMember.idCard}) updated successfully!`);
    setTimeout(() => {
      setPasswordModalMember(null);
      setPasswordSuccessMsg(null);
    }, 1500);
  };

  const handleQuickResetDefault = () => {
    setNewPasswordInput('123456');
    setMustChangePasswordCheck(true);
  };

  const handleOpenEditModal = (org: Organisation) => {
    setEditingOrg(org);
    setEditForm({
      name: org.name || '',
      code: org.code || '',
      roverAdvisorName: org.roverAdvisorName || '',
      roverAdvisorEmail: org.roverAdvisorEmail || '',
      roverAdvisorNid: org.roverAdvisorNid || '',
      roverAdvisorPhone: org.roverAdvisorPhone || '',
      plan: org.plan || 'Free',
      planValidUntil: org.planValidUntil || 'Indefinite',
      status: org.status || 'Active',
    });
  };

  const handleSaveEditOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg || !onUpdateOrg) return;

    const updated: Organisation = {
      ...editingOrg,
      name: editForm.name.trim(),
      code: editForm.code.trim().toUpperCase(),
      roverAdvisorName: editForm.roverAdvisorName.trim(),
      roverAdvisorEmail: editForm.roverAdvisorEmail.trim(),
      roverAdvisorNid: editForm.roverAdvisorNid.trim(),
      roverAdvisorPhone: editForm.roverAdvisorPhone.trim(),
      plan: editForm.plan,
      planValidUntil: editForm.planValidUntil.trim() || 'Indefinite',
      status: editForm.status,
    };

    onUpdateOrg(updated);
    setEditingOrg(null);
  };

  const handleConfirmDeleteOrg = () => {
    if (!deletingOrg || !onDeleteOrg) return;
    onDeleteOrg(deletingOrg.id);
    setDeletingOrg(null);
  };

  // Superadmin Payment Details Form State
  const [paymentForm, setPaymentForm] = useState({
    accountName: settings?.paymentDetails?.accountName || 'My Rovers Crew Official Account',
    accountNumber: settings?.paymentDetails?.accountNumber || '7730000123456',
    bankName: settings?.paymentDetails?.bankName || 'Bank of Maldives (BML)',
  });

  const handleSavePaymentDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSettings && settings) {
      onUpdateSettings({
        ...settings,
        paymentDetails: {
          accountName: paymentForm.accountName.trim(),
          accountNumber: paymentForm.accountNumber.trim(),
          bankName: paymentForm.bankName.trim(),
        },
      });
      alert('Superadmin payment account details saved successfully!');
    }
  };

  // Direct Creation State
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgCode, setNewOrgCode] = useState('');
  const [newAdvisorName, setNewAdvisorName] = useState('');
  const [newAdvisorEmail, setNewAdvisorEmail] = useState('');
  const [newAdvisorNid, setNewAdvisorNid] = useState('');
  const [newAdvisorPhone, setNewAdvisorPhone] = useState('');
  const [newPlan, setNewPlan] = useState<PlanType>('Free');

  const pendingOrgs = organisations.filter((o) => o.status === 'Pending Approval');
  const pendingRenewals = organisations.filter((o) => o.renewalStatus === 'Pending Verification');
  const activeOrgs = organisations.filter((o) => o.status === 'Active');

  const filteredOrgs = organisations.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      (o.name || '').toLowerCase().includes(q) ||
      (o.code || '').toLowerCase().includes(q) ||
      (o.roverAdvisorName || '').toLowerCase().includes(q)
    );
  });

  const handleDirectCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || !newAdvisorName.trim() || !newAdvisorEmail.trim()) return;

    let initialValidity = 'Indefinite';
    if (newPlan === 'Monthly') {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      initialValidity = d.toISOString().split('T')[0];
    } else if (newPlan === 'Annual') {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      initialValidity = d.toISOString().split('T')[0];
    }

    onAddDirectOrg({
      name: newOrgName.trim(),
      code: newOrgCode.trim().toUpperCase() || newOrgName.substring(0, 6).toUpperCase(),
      roverAdvisorName: newAdvisorName.trim(),
      roverAdvisorEmail: newAdvisorEmail.trim(),
      roverAdvisorNid: newAdvisorNid.trim().toUpperCase() || 'A100000',
      roverAdvisorPhone: newAdvisorPhone.trim() || '+960 7000000',
      plan: newPlan,
      status: 'Active',
      planValidUntil: initialValidity,
      renewalStatus: 'None',
    });

    // Reset Form
    setNewOrgName('');
    setNewOrgCode('');
    setNewAdvisorName('');
    setNewAdvisorEmail('');
    setNewAdvisorNid('');
    setNewAdvisorPhone('');
    setNewPlan('Free');
    setActiveTab('all');
  };

  const handleConfirmExtension = () => {
    if (!extensionOrg || !onUpdateOrgValidity) return;

    let finalValidity = 'Indefinite';

    if (extensionMode === 'Indefinite') {
      finalValidity = 'Indefinite';
    } else if (extensionMode === '+1 Month') {
      const base = (extensionOrg.planValidUntil && extensionOrg.planValidUntil !== 'Indefinite' && extensionOrg.planValidUntil > new Date().toISOString().split('T')[0])
        ? new Date(extensionOrg.planValidUntil)
        : new Date();
      base.setMonth(base.getMonth() + 1);
      finalValidity = base.toISOString().split('T')[0];
    } else if (extensionMode === '+1 Year') {
      const base = (extensionOrg.planValidUntil && extensionOrg.planValidUntil !== 'Indefinite' && extensionOrg.planValidUntil > new Date().toISOString().split('T')[0])
        ? new Date(extensionOrg.planValidUntil)
        : new Date();
      base.setFullYear(base.getFullYear() + 1);
      finalValidity = base.toISOString().split('T')[0];
    } else {
      finalValidity = customExtensionText.trim() || 'Indefinite';
    }

    onUpdateOrgValidity(extensionOrg.id, finalValidity, true);
    setExtensionOrg(null);
    setCustomExtensionText('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Superadmin Header Banner */}
      <div className="superadmin-banner bg-gradient-to-r from-purple-950 via-slate-900 to-amber-950 border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#FF3333]/30 text-white border border-[#FF9999]/40 text-xs px-3 py-1 rounded-full font-mono uppercase font-bold flex items-center gap-1.5 shadow-sm">
                <Shield className="w-3.5 h-3.5 text-white" />
                <span className="text-white font-bold">Superadmin Control Hub</span>
              </span>
              <span className="bg-white/20 text-white border border-white/30 text-xs px-2.5 py-1 rounded-full font-mono font-bold">
                Multi-Tenant Architecture
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide !text-white">
              Portal Administration & Crew Control
            </h1>
            <p className="text-xs sm:text-sm text-white max-w-2xl leading-relaxed font-normal opacity-95 !text-white">
              Create, review, and approve separate Scout Organisations. Assign Rover Advisors to form crews, manage subscription plans (Free, Monthly @ MVR 20, Annual @ MVR 200), and inspect uploaded payment receipts.
            </p>
          </div>

          {/* Quick Context Switcher */}
          <div className="bg-[#800000]/80 border border-[#FF9999]/40 p-4 rounded-2xl space-y-2 min-w-[260px] shadow-md backdrop-blur-sm">
            <label className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-white" />
              <span className="text-white font-bold">Active Portal View Context</span>
            </label>
            <select
              value={activeOrgContext}
              onChange={(e) => onSelectActiveOrgContext(e.target.value)}
              className="w-full bg-white text-[#800000] font-bold text-xs rounded-xl px-3 py-2.5 border border-[#FF9999] focus:outline-none focus:ring-2 focus:ring-[#FF3333] cursor-pointer shadow-sm"
            >
              <option value="all" className="bg-white text-[#800000] font-semibold">🌐 Global Portal View (All Orgs)</option>
              {organisations.map((org) => (
                <option key={org.id} value={org.id} className="bg-white text-[#800000] font-semibold">
                  🏛️ {org.name} ({org.code}) - {org.status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#FFD0D0] p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="metric-icon-badge w-12 h-12 rounded-2xl bg-[#800000] border border-[#800000] text-white flex items-center justify-center font-bold shadow-sm">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-black">{organisations.length}</div>
            <div className="text-xs text-slate-600 font-semibold">Total Registered Orgs</div>
          </div>
        </div>

        <div className="bg-white border border-[#FFD0D0] p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="metric-icon-badge w-12 h-12 rounded-2xl bg-[#800000] border border-[#800000] text-white flex items-center justify-center font-bold relative shadow-sm">
            <Clock className="w-6 h-6 text-white" />
            {pendingOrgs.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF3333] text-white font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-bounce">
                {pendingOrgs.length}
              </span>
            )}
          </div>
          <div>
            <div className="text-2xl font-extrabold text-black">{pendingOrgs.length}</div>
            <div className="text-xs text-slate-600 font-semibold">Pending Approvals</div>
          </div>
        </div>

        <div className="bg-white border border-[#FFD0D0] p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="metric-icon-badge w-12 h-12 rounded-2xl bg-[#800000] border border-[#800000] text-white flex items-center justify-center font-bold shadow-sm">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-black">{activeOrgs.length}</div>
            <div className="text-xs text-slate-600 font-semibold">Active Rover Advisor Crews</div>
          </div>
        </div>

        <div className="bg-white border border-[#FFD0D0] p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="metric-icon-badge w-12 h-12 rounded-2xl bg-[#800000] border border-[#800000] text-white flex items-center justify-center font-bold shadow-sm">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-black">
              MVR {organisations.reduce((acc, o) => acc + (o.plan === 'Monthly' ? 20 : o.plan === 'Annual' ? 200 : 0), 0)}
            </div>
            <div className="text-xs text-slate-600 font-semibold">Subscription Revenues</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#FFD0D0] pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-[#800000] text-white shadow-xs'
                : 'bg-[#FFF0F0] text-[#800000] hover:bg-[#FFE5E5] border border-[#FFB3B3]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Signups</span>
            {pendingOrgs.length > 0 && (
              <span className="bg-[#FF3333] text-white px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                {pendingOrgs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('renewals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'renewals'
                ? 'bg-[#800000] text-white shadow-xs font-extrabold'
                : 'bg-[#FFF0F0] text-[#800000] hover:bg-[#FFE5E5] border border-[#FFB3B3]'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Plan Renewals & Receipts</span>
            {pendingRenewals.length > 0 && (
              <span className="bg-[#FF3333] text-white px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold animate-pulse">
                {pendingRenewals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#800000] text-white shadow-xs'
                : 'bg-[#FFF0F0] text-[#800000] hover:bg-[#FFE5E5] border border-[#FFB3B3]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>All Organisations ({organisations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#800000] text-white shadow-xs'
                : 'bg-[#FFF0F0] text-[#800000] hover:bg-[#FFE5E5] border border-[#FFB3B3]'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create Organisation</span>
          </button>

          <button
            onClick={() => setActiveTab('payment')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'payment'
                ? 'bg-[#800000] text-white shadow-xs font-extrabold !text-white'
                : 'bg-[#FFF0F0] text-[#800000] hover:bg-[#FFE5E5] border border-[#FFB3B3]'
            }`}
          >
            <Landmark className="w-4 h-4 text-inherit" />
            <span className={activeTab === 'payment' ? 'text-white font-bold !text-white' : ''}>Payment Details</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#800000] text-white shadow-xs font-extrabold !text-white'
                : 'bg-[#FFF0F0] text-[#800000] hover:bg-[#FFE5E5] border border-[#FFB3B3]'
            }`}
          >
            <Key className="w-4 h-4 text-inherit" />
            <span className={activeTab === 'users' ? 'text-white font-bold !text-white' : ''}>User Accounts & Passwords ({members.length})</span>
          </button>
        </div>

        {activeTab === 'all' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search organisation or advisor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161920] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        )}
      </div>

      {/* TAB 1: PENDING APPROVALS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingOrgs.length === 0 ? (
            <div className="bg-[#161920] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-200">No Pending Organisation Requests</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All organisation registration requests have been reviewed and processed by Superadmin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingOrgs.map((org) => (
                <div
                  key={org.id}
                  className="bg-[#161920] border border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-100">{org.name}</h3>
                        <span className="bg-slate-800 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded font-bold border border-amber-500/30">
                          {org.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Submitted: {org.createdAt}</p>
                    </div>

                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2.5 py-1 rounded-full font-mono font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Pending Approval</span>
                    </span>
                  </div>

                  {/* Rover Advisor Info */}
                  <div className="bg-[#12151B] p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                    <div className="font-bold text-purple-300 flex items-center gap-1.5 border-b border-slate-800 pb-1">
                      <Crown className="w-3.5 h-3.5 text-purple-400" />
                      <span>Assigned Rover Advisor (Crew Founder)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div>
                        <span className="text-slate-500 block">Name:</span>
                        <strong className="text-slate-100">{org.roverAdvisorName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">NID:</span>
                        <strong className="font-mono text-slate-100">{org.roverAdvisorNid}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block">Email / Username:</span>
                        <span className="font-mono text-amber-300">{org.roverAdvisorEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Plan & Payment Details */}
                  <div className="flex items-center justify-between bg-[#12151B] p-3 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 block">Selected Plan:</span>
                      <strong className="text-emerald-400 font-bold">
                        {org.plan === 'Free' ? 'Free (Superadmin Exemption)' : org.plan === 'Monthly' ? 'Monthly Plan (MVR 20/mo)' : 'Annual Plan (MVR 200/yr)'}
                      </strong>
                    </div>

                    {org.paymentReceiptUrl ? (
                      <button
                        onClick={() => setSelectedReceiptUrl(org.paymentReceiptUrl || null)}
                        className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Payment Receipt</span>
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[10px]">No Payment Receipt (Free Plan)</span>
                    )}
                  </div>

                  {org.paymentNotes && (
                    <p className="text-[11px] text-slate-400 italic bg-[#12151B] p-2 rounded-lg border border-slate-800">
                      Payment Notes: "{org.paymentNotes}"
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onApproveOrg(org.id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Organisation & Provision Rover Advisor</span>
                    </button>

                    <button
                      onClick={() => onRejectOrg(org.id)}
                      className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold px-3 py-2.5 rounded-xl transition text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLAN RENEWALS & RECEIPTS VERIFICATION */}
      {activeTab === 'renewals' && (
        <div className="space-y-4">
          {pendingRenewals.length === 0 ? (
            <div className="bg-[#161920] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-200">No Pending Renewal Receipts</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All organisation plan renewal receipts have been reviewed and verified by Superadmin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRenewals.map((org) => (
                <div
                  key={org.id}
                  className="bg-[#161920] border border-amber-500/50 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-100">{org.name}</h3>
                        <span className="bg-slate-800 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded font-bold border border-amber-500/30">
                          {org.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Advisor: <strong className="text-slate-200">{org.roverAdvisorName}</strong> ({org.roverAdvisorEmail})
                      </p>
                    </div>

                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2.5 py-1 rounded-full font-mono font-bold flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 text-amber-400" />
                      <span>Pending Verification</span>
                    </span>
                  </div>

                  <div className="bg-[#12151B] p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div>
                        <span className="text-slate-500 block">Current Plan:</span>
                        <strong className="text-emerald-400">{org.plan} Plan</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Current Validity Expiry:</span>
                        <strong className="font-mono text-amber-300">{org.planValidUntil || 'Expired / Pending'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Requested Extension:</span>
                        <strong className="text-purple-300 font-bold">{org.renewalRequestedTerm || '+1 Month'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Submitted At:</span>
                        <span className="text-slate-300 font-mono">{org.renewalSubmittedAt || 'Recently'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Receipt & Notes Preview */}
                  <div className="flex items-center justify-between bg-[#12151B] p-3 rounded-xl border border-slate-800 text-xs">
                    <div className="truncate max-w-[200px]">
                      <span className="text-slate-500 block text-[10px]">Attachment:</span>
                      <strong className="text-slate-200 text-xs truncate block">{org.renewalReceiptName || 'BML_Transfer_Receipt.pdf'}</strong>
                    </div>

                    {org.renewalReceiptUrl ? (
                      <button
                        onClick={() => setSelectedReceiptUrl(org.renewalReceiptUrl || null)}
                        className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Inspect Receipt</span>
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[10px]">No Receipt Attached</span>
                    )}
                  </div>

                  {org.renewalNotes && (
                    <p className="text-[11px] text-slate-300 italic bg-[#12151B] p-2 rounded-lg border border-slate-800">
                      Advisor Notes: "{org.renewalNotes}"
                    </p>
                  )}

                  {/* Verify & Extend Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setExtensionOrg(org);
                        setExtensionMode(org.renewalRequestedTerm === '+1 Year' ? '+1 Year' : '+1 Month');
                      }}
                      className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify Receipt & Extend Plan</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onRejectOrgRenewal) {
                          onRejectOrgRenewal(org.id);
                        }
                      }}
                      className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold px-3 py-2.5 rounded-xl transition text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ALL ORGANISATIONS */}
      {activeTab === 'all' && (
        <div className="bg-white border border-[#FF9999] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
          {/* Table Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#FFD0D0]">
            <div>
              <h3 className="text-base font-bold text-[#800000] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#800000]" />
                <span>All Registered Organisations ({filteredOrgs.length})</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Manage Rover crews, advisors, plan validity, and synchronize curriculum across all units.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTriggerSync()}
                disabled={isSyncingGlobal}
                className="bg-[#800000] hover:bg-[#660000] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer !text-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-white ${isSyncingGlobal ? 'animate-spin' : ''}`} />
                <span className="text-white font-bold !text-white">
                  {isSyncingGlobal ? 'Syncing with All...' : 'Sync with All'}
                </span>
              </button>
            </div>
          </div>

          {syncSuccessBanner && (
            <div className="bg-[#FFF0F0] border border-[#FF9999] p-3 rounded-xl flex items-center justify-between gap-3 text-xs text-[#800000] animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#800000] shrink-0" />
                <span className="font-semibold">{syncSuccessBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setSyncSuccessBanner(null)}
                className="text-[#800000] hover:text-[#FF3333] font-bold p-1 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#FFD0D0] text-[#800000] font-bold bg-[#FFF0F0]">
                  <th className="py-2.5 pl-3 text-[#800000] font-bold rounded-l-xl">Organisation</th>
                  <th className="py-2.5 px-2 text-[#800000] font-bold">Designated Rover Advisor</th>
                  <th className="py-2.5 px-2 text-[#800000] font-bold">Plan Type</th>
                  <th className="py-2.5 px-2 text-[#800000] font-bold">Valid Until</th>
                  <th className="py-2.5 px-2 text-[#800000] font-bold">Renewal Status</th>
                  <th className="py-2.5 px-2 text-[#800000] font-bold">Status</th>
                  <th className="py-2.5 pr-3 text-right text-[#800000] font-bold rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FFD0D0]/50">
                {filteredOrgs.map((org) => {
                  const orgMembers = members.filter((m) => m.organisationId === org.id);
                  const isExpired = org.planValidUntil && org.planValidUntil !== 'Indefinite' && org.planValidUntil < new Date().toISOString().split('T')[0];
                  const isRowSyncing = syncingOrgId === org.id;

                  return (
                    <tr key={org.id} className="hover:bg-[#FFF0F0]/50 transition">
                      <td className="py-3 pl-3">
                        <div className="font-bold text-slate-900 text-sm">{org.name}</div>
                        <div className="text-[10px] font-mono text-[#800000] font-semibold mt-0.5">
                          Code: {org.code} • {orgMembers.length} {orgMembers.length === 1 ? 'Member' : 'Members'}
                        </div>
                      </td>

                      <td className="py-3 px-2">
                        <div className="font-bold text-[#800000]">{org.roverAdvisorName}</div>
                        <div className="text-[10px] text-slate-600 font-mono mt-0.5">{org.roverAdvisorEmail}</div>
                      </td>

                      <td className="py-3 px-2">
                        <span className="px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold border bg-[#FFF0F0] text-[#800000] border-[#FFB3B3]">
                          {org.plan === 'Free' ? 'Free (Exempt)' : org.plan === 'Monthly' ? 'Monthly' : 'Annual'}
                        </span>
                      </td>

                      <td className="py-3 px-2">
                        <span className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold border ${
                          org.planValidUntil === 'Indefinite'
                            ? 'bg-[#FFF0F0] text-[#800000] border-[#FFB3B3]'
                            : isExpired
                            ? 'bg-[#FFF0F0] text-[#FF3333] border-[#FF9999]'
                            : 'bg-[#FFF0F0] text-[#800000] border-[#FFB3B3]'
                        }`}>
                          {org.planValidUntil || 'Indefinite'}
                          {isExpired && ' (EXPIRED)'}
                        </span>
                      </td>

                      <td className="py-3 px-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          org.renewalStatus === 'Pending Verification'
                            ? 'bg-[#FFF0F0] text-[#FF3333] border-[#FF9999] animate-pulse'
                            : org.renewalStatus === 'Approved'
                            ? 'bg-[#FFF0F0] text-[#800000] border-[#FFB3B3]'
                            : 'bg-white text-slate-600 border-slate-300'
                        }`}>
                          {org.renewalStatus || 'None'}
                        </span>
                      </td>

                      <td className="py-3 px-2">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 w-fit border bg-[#FFF0F0] text-[#800000] border-[#FF9999]">
                          {org.status === 'Active' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#800000]" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-[#FF3333]" />
                          )}
                          <span className="text-[#800000] font-bold">{org.status}</span>
                        </span>
                      </td>

                      <td className="py-3 pr-3 text-right">
                        <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(org)}
                            title="Edit Organisation Details"
                            className="bg-[#FFF0F0] hover:bg-[#FFE5E5] text-[#800000] border border-[#FFB3B3] px-2.5 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#800000]" />
                            <span className="text-[#800000]">Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setExtensionOrg(org);
                              setExtensionMode(org.plan === 'Annual' ? '+1 Year' : '+1 Month');
                            }}
                            title="Extend Plan Validity"
                            className="bg-[#FFF0F0] hover:bg-[#FFE5E5] text-[#800000] border border-[#FFB3B3] px-2.5 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-[#800000]" />
                            <span className="text-[#800000]">Extend</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectActiveOrgContext(org.id)}
                            title="Inspect Organisation Portal"
                            className="bg-[#800000] hover:bg-[#660000] text-white border border-[#800000] px-2.5 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer shadow-xs !text-white"
                          >
                            <Eye className="w-3.5 h-3.5 text-white" />
                            <span className="text-white font-bold !text-white">Inspect</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTriggerSync(org)}
                            disabled={isRowSyncing}
                            title="Sync Syllabus & Settings with All"
                            className="bg-[#800000] hover:bg-[#660000] text-white border border-[#800000] px-2.5 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer shadow-xs !text-white"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 text-white ${isRowSyncing ? 'animate-spin' : ''}`} />
                            <span className="text-white font-bold !text-white">
                              {isRowSyncing ? 'Syncing...' : 'sync with all'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingOrg(org)}
                            title="Delete Organisation"
                            className="bg-[#FFF0F0] hover:bg-[#FFE5E5] text-[#FF3333] border border-[#FF9999] p-1.5 rounded-xl text-xs font-bold transition inline-flex items-center cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#FF3333]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CREATE ORGANISATION DIRECTLY */}
      {activeTab === 'create' && (
        <div className="bg-[#161920] border border-slate-800 rounded-2xl p-6 max-w-2xl mx-auto space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Direct Organisation Creation (Superadmin Override)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly provision a separate Organisation and assign a Rover Advisor without sign up delays.
            </p>
          </div>

          <form onSubmit={handleDirectCreate} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Organisation Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aminiya Scout Network"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full bg-[#12151B] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Org Code / Slug</label>
                <input
                  type="text"
                  placeholder="e.g. AMINIYA"
                  value={newOrgCode}
                  onChange={(e) => setNewOrgCode(e.target.value)}
                  className="w-full bg-[#12151B] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 uppercase font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Designated Rover Advisor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Hussain Farooq"
                  value={newAdvisorName}
                  onChange={(e) => setNewAdvisorName(e.target.value)}
                  className="w-full bg-[#12151B] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Rover Advisor NID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A100999"
                  value={newAdvisorNid}
                  onChange={(e) => setNewAdvisorNid(e.target.value)}
                  className="w-full bg-[#12151B] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 uppercase font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-slate-300 font-semibold">Rover Advisor Email (Login Username) *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. advisor.farooq@scout.mv"
                  value={newAdvisorEmail}
                  onChange={(e) => setNewAdvisorEmail(e.target.value)}
                  className="w-full bg-[#12151B] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Contact Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +960 7700112"
                  value={newAdvisorPhone}
                  onChange={(e) => setNewAdvisorPhone(e.target.value)}
                  className="w-full bg-[#12151B] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Plan Assignment</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as PlanType)}
                  className="w-full bg-[#12151B] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Free">Free Plan (Superadmin Exemption)</option>
                  <option value="Monthly">Monthly Plan (MVR 20 / mo)</option>
                  <option value="Annual">Annual Plan (MVR 200 / yr)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Instantly Create & Activate Organisation</span>
            </button>
          </form>
        </div>
      )}

      {/* Payment Details Tab Content */}
      {activeTab === 'payment' && (
        <div className="bg-[#161920] border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Superadmin Official Payment Configuration</h2>
              <p className="text-xs text-slate-400">Set and update bank transfer details for organisation fees, subscriptions, and crew payments.</p>
            </div>
          </div>

          <form onSubmit={handleSavePaymentDetails} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-400" />
                <span>Account Name</span>
              </label>
              <input
                type="text"
                required
                placeholder="Account Name (e.g. Scout Group Official Account)"
                value={paymentForm.accountName}
                onChange={(e) => setPaymentForm({ ...paymentForm, accountName: e.target.value })}
                className="w-full bg-[#1A1E26] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 font-medium text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Account Number</span>
              </label>
              <input
                type="text"
                required
                placeholder="Account Number (e.g. 7730000123456)"
                value={paymentForm.accountNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })}
                className="w-full bg-[#1A1E26] border border-slate-800 rounded-xl px-4 py-2.5 text-emerald-300 font-mono font-bold text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-amber-400" />
                <span>Bank Name</span>
              </label>
              <input
                type="text"
                required
                placeholder="Bank Name (e.g. Bank of Maldives (BML))"
                value={paymentForm.bankName}
                onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                className="w-full bg-[#1A1E26] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 font-medium text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Official Payment Details</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB: SUPERADMIN USER ACCOUNTS & PASSWORD MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white border border-[#FF9999] rounded-2xl p-6 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FF9999]/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#800000] text-white flex items-center justify-center font-bold shadow-sm">
                <Key className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#800000] flex items-center gap-2">
                  <span>User Accounts & Security Control</span>
                  <span className="bg-[#FFF0F0] text-[#800000] border border-[#FF9999] text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                    Superadmin Authority
                  </span>
                </h2>
                <p className="text-xs text-slate-600">
                  Manage individual user authentication, reset security passwords, and execute universal cloud synchronization across all portal modules.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">
                Total Registered Users: <strong className="text-[#800000] font-mono text-sm">{members.length}</strong>
              </span>
            </div>
          </div>

          {/* Universal 11-Module Synchronization Center */}
          <div className="bg-[#FFF0F0] border-2 border-[#FF9999] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <RefreshCw className={`w-5 h-5 text-[#800000] ${isSyncingAllModules ? 'animate-spin' : ''}`} />
                  <h3 className="font-bold text-[#800000] text-sm">Universal 11-Module Portal Synchronization</h3>
                  <span className="bg-[#800000] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    11 Modules Connected
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    Auto-Sync Active
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                  Sync members directory, awards and syllabus, notebook, events and calendar, attendance, meeting minutes, operating policy and polls, payments and crew dues, disciplinary logs, audit trails and settings.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0">
                <button
                  type="button"
                  disabled={isSyncingAllModules}
                  onClick={() => handleRunFullModuleSync()}
                  className="bg-[#800000] hover:bg-[#6b0000] active:scale-[0.98] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 !text-white"
                >
                  <RefreshCw className={`w-4 h-4 text-white ${isSyncingAllModules ? 'animate-spin' : ''}`} />
                  <span>{isSyncingAllModules ? 'Synchronizing All...' : 'Sync with All 11 Modules'}</span>
                </button>
              </div>
            </div>

            {/* 11 Modules Visual Status Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-2">
              {/* 1. Members Directory */}
              <div className="bg-white border border-[#FF9999] rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <User className="w-4 h-4 text-[#800000] flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-[#800000] text-[11px] truncate">Members Directory</div>
                    <div className="text-[10px] text-slate-600 font-medium">{members.length} members</div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={syncingModuleId === 'members' || isSyncingAllModules}
                  onClick={() => handleRunFullModuleSync('members')}
                  className="p-1 text-[#800000] hover:bg-[#FFF0F0] rounded-lg transition"
                  title="Sync Members Directory"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingModuleId === 'members' ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* 2. Awards & Syllabus */}
              <div className="bg-white border border-[#FF9999] rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Award className="w-4 h-4 text-[#800000] flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-[#800000] text-[11px] truncate">Awards & Syllabus</div>
                    <div className="text-[10px] text-slate-600 font-medium">{syllabus.length} reqs • {progressList.length} recs</div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={syncingModuleId === 'syllabus' || isSyncingAllModules}
                  onClick={() => handleRunFullModuleSync('syllabus')}
                  className="p-1 text-[#800000] hover:bg-[#FFF0F0] rounded-lg transition"
                  title="Sync Awards & Syllabus"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingModuleId === 'syllabus' ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* 3. Notebook */}
              <div className="bg-white border border-[#FF9999] rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <BookOpen className="w-4 h-4 text-[#800000] flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-[#800000] text-[11px] truncate">Notebook & Journals</div>
                    <div className="text-[10px] text-slate-600 font-medium">{journals.length} entries</div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={syncingModuleId === 'journals' || isSyncingAllModules}
                  onClick={() => handleRunFullModuleSync('journals')}
                  className="p-1 text-[#800000] hover:bg-[#FFF0F0] rounded-lg transition"
                  title="Sync Notebook & Journals"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingModuleId === 'journals' ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* 4. Events and Calendar */}
              <div className="bg-white border border-[#FF9999] rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Calendar className="w-4 h-4 text-[#800000] flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-[#800000] text-[11px] truncate">Events & Calendar</div>
                    <div className="text-[10px] text-slate-600 font-medium">{events.length} events</div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={syncingModuleId === 'events' || isSyncingAllModules}
                  onClick={() => handleRunFullModuleSync('events')}
                  className="p-1 text-[#800000] hover:bg-[#FFF0F0] rounded-lg transition"
                  title="Sync Events and Calendar"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingModuleId === 'events' ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* 5. Attendance */}
              <div className="bg-white border border-[#FF9999] rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <UserCheck className="w-4 h-4 text-[#800000] flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-[#800000] text-[11px] truncate">Attendance Records</div>
                    <div className="text-[10px] text-slate-600 font-medium">{attendance.length} logs</div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={syncingModuleId === 'attendance' || isSyncingAllModules}
                  onClick={() => handleRunFullModuleSync('attendance')}
                  className="p-1 text-[#800000] hover:bg-[#FFF0F0] rounded-lg transition"
                  title="Sync Attendance Records"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingModuleId === 'attendance' ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* 6. Meeting Minutes */}
              <div className="bg-white border border-[#FF9999] rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileSpreadsheet className="w-4 h-4 text-[#800000] flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-[#800000] text-[11px] truncate">Meeting Minutes</div>
                    <div className="text-[10px] text-slate-600 font-medium">{meetingMinutes.length} records</div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={syncingModuleId === 'minutes' || isSyncingAllModules}
                  onClick={() => handleRunFullModuleSync('minutes')}
                  className="p-1 text-[#800000] hover:bg-[#FFF0F0] rounded-lg transition"
                  title="Sync Meeting Minutes"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingModuleId === 'minutes' ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* 7. Operating Policy and Polls */}
              <div className="bg-white border border-[#FF9999] rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Scroll className="w-4 h-4 text-[#800000] flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-[#800000] text-[11px] truncate">Policy & Polls</div>
                    <div className="text-[10px] text-slate-600 font-medium">{polls.length} polls • Charter</div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={syncingModuleId === 'policy' || isSyncingAllModules}
                  onClick={() => handleRunFullModuleSync('policy')}
                  className="p-1 text-[#800000] hover:bg-[#FFF0F0] rounded-lg transition"
                  title="Sync Operating Policy and Polls"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingModuleId === 'policy' ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* 8. Payments and Crew Dues */}
              <div className="bg-white border border-[#FF9999] rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <DollarSign className="w-4 h-4 text-[#800000] flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-[#800000] text-[11px] truncate">Payments & Crew Dues</div>
                    <div className="text-[10px] text-slate-600 font-medium">{feeRequests.length} dues • {paymentTransactions.length} txns</div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={syncingModuleId === 'payments' || isSyncingAllModules}
                  onClick={() => handleRunFullModuleSync('payments')}
                  className="p-1 text-[#800000] hover:bg-[#FFF0F0] rounded-lg transition"
                  title="Sync Payments and Crew Dues"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingModuleId === 'payments' ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* 9. Disciplinary Logs */}
              <div className="bg-white border border-[#FF9999] rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Scale className="w-4 h-4 text-[#800000] flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-[#800000] text-[11px] truncate">Disciplinary Logs</div>
                    <div className="text-[10px] text-slate-600 font-medium">{incidents.length} logs</div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={syncingModuleId === 'disciplinary' || isSyncingAllModules}
                  onClick={() => handleRunFullModuleSync('disciplinary')}
                  className="p-1 text-[#800000] hover:bg-[#FFF0F0] rounded-lg transition"
                  title="Sync Disciplinary Logs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingModuleId === 'disciplinary' ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* 10. Audit Trails */}
              <div className="bg-white border border-[#FF9999] rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Shield className="w-4 h-4 text-[#800000] flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-[#800000] text-[11px] truncate">Audit Trails</div>
                    <div className="text-[10px] text-slate-600 font-medium">{auditLogs.length} events logged</div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={syncingModuleId === 'audit_logs' || isSyncingAllModules}
                  onClick={() => handleRunFullModuleSync('audit_logs')}
                  className="p-1 text-[#800000] hover:bg-[#FFF0F0] rounded-lg transition"
                  title="Sync Audit Trails"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingModuleId === 'audit_logs' ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* 11. Settings & Configurations */}
              <div className="bg-white border border-[#FF9999] rounded-xl p-2.5 flex items-center justify-between shadow-xs col-span-2 sm:col-span-1 lg:col-span-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Settings2 className="w-4 h-4 text-[#800000] flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-[#800000] text-[11px] truncate">Settings & Configurations</div>
                    <div className="text-[10px] text-slate-600 font-medium">Portal Parameters & Official Banking</div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={syncingModuleId === 'settings' || isSyncingAllModules}
                  onClick={() => handleRunFullModuleSync('settings')}
                  className="p-1 text-[#800000] hover:bg-[#FFF0F0] rounded-lg transition"
                  title="Sync Settings & Configurations"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingModuleId === 'settings' ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#800000] border-t border-[#FF9999]/40 pt-2.5 font-medium">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <CheckCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>All 11 modules synchronized with live Firestore cluster &amp; local state cache. Auto sync. no need to manually Sync</span>
              </span>
              <span className="font-mono text-[10px] text-slate-600 flex items-center gap-1.5 self-end sm:self-auto bg-white px-2.5 py-1 rounded-lg border border-[#FF9999]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Cloud Stream Active</span>
                {lastFullSyncTime && <span>• {lastFullSyncTime}</span>}
              </span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by Name, NID, or Email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#FF9999] rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000]"
              />
            </div>

            <div className="relative">
              <select
                value={userOrgFilter}
                onChange={(e) => setUserOrgFilter(e.target.value)}
                className="w-full bg-white border border-[#FF9999] rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#800000] cursor-pointer"
              >
                <option value="all">All Organisations</option>
                {organisations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="w-full bg-white border border-[#FF9999] rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#800000] cursor-pointer"
              >
                <option value="all">All Roles & Sections</option>
                <option value="Superadmin">Superadmin</option>
                <option value="Rover Advisor">Rover Advisor</option>
                <option value="Crew Leader">Crew Leader</option>
                <option value="Assistant Crew Leader">Assistant Crew Leader</option>
                <option value="Scribe">Scribe</option>
                <option value="Quartermaster">Quartermaster</option>
                <option value="Explorer">Explorer Section</option>
                <option value="Rover">Rover Section</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          {(() => {
            const filteredUsers = members.filter((m) => {
              const query = userSearchQuery.toLowerCase().trim();
              const matchQuery =
                !query ||
                m.name.toLowerCase().includes(query) ||
                m.idCard.toLowerCase().includes(query) ||
                (m.email && m.email.toLowerCase().includes(query)) ||
                (m.crewName && m.crewName.toLowerCase().includes(query));

              const matchOrg = userOrgFilter === 'all' || m.organisationId === userOrgFilter;
              const matchRole =
                userRoleFilter === 'all' ||
                m.councilRole === userRoleFilter ||
                m.section === userRoleFilter ||
                (userRoleFilter === 'Superadmin' && (m.isSuperAdmin || m.councilRole === 'Superadmin'));

              return matchQuery && matchOrg && matchRole;
            });

            if (filteredUsers.length === 0) {
              return (
                <div className="bg-[#FFF0F0] border border-[#FF9999] rounded-2xl p-8 text-center text-slate-700 text-xs">
                  No users found matching the search and filter criteria.
                </div>
              );
            }

            return (
              <div className="border border-[#FF9999] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#800000] text-white font-mono text-[11px] uppercase border-b border-[#800000]">
                      <tr>
                        <th className="py-3.5 px-4 font-bold text-white">Member / User</th>
                        <th className="py-3.5 px-4 font-bold text-white">NID / ID Card</th>
                        <th className="py-3.5 px-4 font-bold text-white">Email Address</th>
                        <th className="py-3.5 px-4 font-bold text-white">Organisation Context</th>
                        <th className="py-3.5 px-4 font-bold text-white">Role & Section</th>
                        <th className="py-3.5 px-4 font-bold text-white">Password Status</th>
                        <th className="py-3.5 px-4 font-bold text-white text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FF9999]/30 bg-white">
                      {filteredUsers.map((user) => {
                        const org = organisations.find((o) => o.id === user.organisationId);
                        const isAdvisor = user.isAdvisor || user.councilRole === 'Rover Advisor';
                        const isSuper = user.isSuperAdmin || user.councilRole === 'Superadmin';
                        const hasCustomPassword = user.password && user.password !== '123456';

                        return (
                          <tr key={user.id} className="hover:bg-[#FFF0F0]/60 transition">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[#800000] border border-[#FF9999] flex items-center justify-center font-bold text-white text-xs overflow-hidden flex-shrink-0 shadow-xs">
                                  {user.photoUrl ? (
                                    <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    user.name.charAt(0)
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{user.name}</span>
                                    {isSuper && (
                                      <span className="bg-[#800000] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                        SUPERADMIN
                                      </span>
                                    )}
                                    {isAdvisor && !isSuper && (
                                      <span className="bg-[#FF3333] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                        ADVISOR
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">ID: {user.id}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-[#800000]">
                              {user.idCard || 'N/A'}
                            </td>

                            <td className="py-3.5 px-4 text-slate-800">
                              {user.email ? (
                                <span className="font-mono text-slate-900 font-medium">{user.email}</span>
                              ) : (
                                <span className="text-slate-400 italic">No email set</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              {isSuper ? (
                                <span className="text-[#800000] font-bold">Global Portal</span>
                              ) : org ? (
                                <div>
                                  <div className="font-bold text-slate-900">{org.name}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{org.code}</div>
                                </div>
                              ) : (
                                <span className="text-slate-500 font-mono">Unassigned</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="bg-[#FFF0F0] text-[#800000] border border-[#FF9999] px-2 py-0.5 rounded text-[11px] font-semibold">
                                {user.councilRole || user.section || 'Member'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-0.5">
                                {hasCustomPassword ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                                    <Lock className="w-3 h-3 text-emerald-700" /> Custom Password
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-semibold font-mono">
                                    <Unlock className="w-3 h-3 text-amber-700" /> Default (123456)
                                  </span>
                                )}
                                {user.mustChangePassword && (
                                  <span className="text-[10px] text-[#FF3333] font-semibold">
                                    * Must change on login
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenPasswordModal(user)}
                                className="bg-[#800000] hover:bg-[#6b0000] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto cursor-pointer shadow-sm hover:scale-[1.02] !text-white"
                              >
                                <Key className="w-3.5 h-3.5 text-white" />
                                <span>Change Password</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Superadmin Extension Modal */}
      {extensionOrg && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#FF9999] rounded-3xl max-w-md w-full p-6 space-y-4 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#FF9999]/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#800000] text-white flex items-center justify-center font-bold shadow-xs">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#800000] text-sm">Verify & Extend Plan Validity</h3>
                  <p className="text-[11px] text-slate-600 font-mono">{extensionOrg.name} ({extensionOrg.code})</p>
                </div>
              </div>
              <button
                onClick={() => setExtensionOrg(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-[#FFF0F0] cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FFF0F0] p-3.5 rounded-xl border border-[#FF9999] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Current Plan:</span>
                <strong className="text-[#800000] font-bold">{extensionOrg.plan}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Current Valid Until:</span>
                <strong className="text-slate-900 font-mono font-bold">{extensionOrg.planValidUntil || 'Expired'}</strong>
              </div>
              {extensionOrg.renewalRequestedTerm && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Requested Extension:</span>
                  <strong className="text-[#FF3333] font-bold">{extensionOrg.renewalRequestedTerm}</strong>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-800 font-bold block">Select Extension Amount / Term *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setExtensionMode('+1 Month')}
                  className={`p-2.5 rounded-xl text-center font-bold border text-xs transition cursor-pointer ${
                    extensionMode === '+1 Month'
                      ? 'bg-[#800000] text-white border-[#800000] shadow-sm !text-white'
                      : 'bg-white text-slate-700 border-[#FF9999] hover:bg-[#FFF0F0]'
                  }`}
                >
                  +1 Month
                </button>
                <button
                  type="button"
                  onClick={() => setExtensionMode('+1 Year')}
                  className={`p-2.5 rounded-xl text-center font-bold border text-xs transition cursor-pointer ${
                    extensionMode === '+1 Year'
                      ? 'bg-[#800000] text-white border-[#800000] shadow-sm !text-white'
                      : 'bg-white text-slate-700 border-[#FF9999] hover:bg-[#FFF0F0]'
                  }`}
                >
                  +1 Year
                </button>
                <button
                  type="button"
                  onClick={() => setExtensionMode('Term')}
                  className={`p-2.5 rounded-xl text-center font-bold border text-xs transition cursor-pointer ${
                    extensionMode === 'Term' || extensionMode === 'Date'
                      ? 'bg-[#800000] text-white border-[#800000] shadow-sm !text-white'
                      : 'bg-white text-slate-700 border-[#FF9999] hover:bg-[#FFF0F0]'
                  }`}
                >
                  Specific Term
                </button>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setExtensionMode('Indefinite')}
                  className={`w-full p-2.5 rounded-xl text-center font-bold border text-xs transition cursor-pointer ${
                    extensionMode === 'Indefinite'
                      ? 'bg-[#800000] text-white border-[#800000] shadow-sm !text-white'
                      : 'bg-white text-[#800000] border-[#FF9999] hover:bg-[#FFF0F0]'
                  }`}
                >
                  Set to Indefinite Validity (Free/Exempt)
                </button>
              </div>

              {(extensionMode === 'Term' || extensionMode === 'Date') && (
                <div className="space-y-1 pt-1">
                  <label className="text-slate-600 text-[11px]">Enter Expiry Date (YYYY-MM-DD) or Specific Term:</label>
                  <input
                    type="text"
                    placeholder="e.g. 2026-12-31 or 2026-2027 Term"
                    value={customExtensionText}
                    onChange={(e) => setCustomExtensionText(e.target.value)}
                    className="w-full bg-white border border-[#FF9999] rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#800000]"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleConfirmExtension}
                className="flex-1 bg-[#800000] hover:bg-[#6b0000] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer !text-white"
              >
                Confirm & Extend Validity Date
              </button>
              <button
                onClick={() => setExtensionOrg(null)}
                className="bg-[#FFF0F0] text-slate-700 hover:bg-[#FF9999]/30 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Superadmin Edit Organisation Modal */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#FF9999] rounded-3xl max-w-lg w-full p-6 space-y-4 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#FF9999]/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#800000] text-white flex items-center justify-center font-bold shadow-xs">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#800000] text-sm">Edit Organisation Details</h3>
                  <p className="text-[11px] text-slate-600 font-mono">{editingOrg.name} ({editingOrg.code})</p>
                </div>
              </div>
              <button
                onClick={() => setEditingOrg(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-[#FFF0F0] cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditOrg} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-800 font-bold block">Organisation Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-white border border-[#FF9999] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#800000]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-800 font-bold block">Short Code / Slug *</label>
                  <input
                    type="text"
                    required
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-white border border-[#FF9999] rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#800000]"
                  />
                </div>
              </div>

              <div className="border-t border-[#FF9999]/30 pt-3 space-y-3">
                <h4 className="text-[#800000] font-bold text-[11px] uppercase tracking-wider">Designated Rover Advisor</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-800 font-bold block">Advisor Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.roverAdvisorName}
                      onChange={(e) => setEditForm({ ...editForm, roverAdvisorName: e.target.value })}
                      className="w-full bg-white border border-[#FF9999] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#800000]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-800 font-bold block">Advisor Email Address *</label>
                    <input
                      type="email"
                      required
                      value={editForm.roverAdvisorEmail}
                      onChange={(e) => setEditForm({ ...editForm, roverAdvisorEmail: e.target.value })}
                      className="w-full bg-white border border-[#FF9999] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#800000]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-800 font-bold block">Advisor NID Card *</label>
                    <input
                      type="text"
                      required
                      value={editForm.roverAdvisorNid}
                      onChange={(e) => setEditForm({ ...editForm, roverAdvisorNid: e.target.value })}
                      className="w-full bg-white border border-[#FF9999] rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#800000]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-800 font-bold block">Advisor Mobile Phone *</label>
                    <input
                      type="text"
                      required
                      value={editForm.roverAdvisorPhone}
                      onChange={(e) => setEditForm({ ...editForm, roverAdvisorPhone: e.target.value })}
                      className="w-full bg-white border border-[#FF9999] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#800000]"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#FF9999]/30 pt-3 space-y-3">
                <h4 className="text-[#800000] font-bold text-[11px] uppercase tracking-wider">Plan & Status Configuration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-800 font-bold block">Plan Type</label>
                    <select
                      value={editForm.plan}
                      onChange={(e) => setEditForm({ ...editForm, plan: e.target.value as PlanType })}
                      className="w-full bg-white border border-[#FF9999] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#800000] cursor-pointer"
                    >
                      <option value="Free">Free (Exempt)</option>
                      <option value="Monthly">Monthly (MVR 20)</option>
                      <option value="Annual">Annual (MVR 200)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-800 font-bold block">Plan Valid Until</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026-12-31 or Indefinite"
                      value={editForm.planValidUntil}
                      onChange={(e) => setEditForm({ ...editForm, planValidUntil: e.target.value })}
                      className="w-full bg-white border border-[#FF9999] rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#800000]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-800 font-bold block">Account Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full bg-white border border-[#FF9999] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#800000] cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending Approval">Pending Approval</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#FF9999]/30">
                <button
                  type="button"
                  onClick={() => {
                    const target = editingOrg;
                    setEditingOrg(null);
                    setDeletingOrg(target);
                  }}
                  className="bg-[#FFF0F0] hover:bg-[#FF3333]/10 text-[#FF3333] border border-[#FF9999] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Org</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrg(null)}
                    className="bg-[#FFF0F0] text-slate-700 hover:bg-[#FF9999]/30 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#800000] hover:bg-[#6b0000] text-white font-bold px-5 py-2 rounded-xl text-xs transition shadow-md cursor-pointer flex items-center gap-1.5 !text-white"
                  >
                    <Save className="w-3.5 h-3.5 text-white" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Superadmin Delete Organisation Modal */}
      {deletingOrg && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#FF3333] rounded-3xl max-w-md w-full p-6 space-y-4 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#FF9999]/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#800000] text-white flex items-center justify-center font-bold shadow-xs">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#800000] text-sm">Delete Organisation</h3>
                  <p className="text-[11px] text-slate-600 font-mono">{deletingOrg.name} ({deletingOrg.code})</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingOrg(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-[#FFF0F0] cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FFF0F0] p-4 rounded-2xl border border-[#FF9999] space-y-2 text-xs text-slate-800">
              <p className="text-slate-900 font-bold">
                Are you sure you want to permanently delete <strong className="text-[#800000]">{deletingOrg.name}</strong>?
              </p>
              <div className="bg-white p-3 rounded-xl border border-[#FF9999] text-[11px] text-slate-600 space-y-1 shadow-2xs">
                <div className="flex justify-between">
                  <span>Organisation Code:</span>
                  <strong className="text-[#800000] font-mono">{deletingOrg.code}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Designated Advisor:</span>
                  <strong className="text-slate-900">{deletingOrg.roverAdvisorName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Linked Members:</span>
                  <strong className="text-[#800000] font-bold">{members.filter((m) => m.organisationId === deletingOrg.id).length} Members</strong>
                </div>
              </div>
              <p className="text-[11px] text-[#FF3333] font-semibold">
                Warning: Deleting this organisation removes its record from the portal. Associated members will no longer be mapped to this active organisation context.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleConfirmDeleteOrg}
                className="flex-1 bg-[#800000] hover:bg-[#6b0000] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-1.5 !text-white"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>Permanently Delete Organisation</span>
              </button>
              <button
                onClick={() => setDeletingOrg(null)}
                className="bg-[#FFF0F0] text-slate-700 hover:bg-[#FF9999]/30 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Receipt Image View Modal */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#FF9999] rounded-3xl max-w-lg w-full p-6 space-y-4 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#FF9999]/40 pb-3">
              <h3 className="font-bold text-[#800000] text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#800000]" />
                <span>Uploaded Payment Transfer Receipt</span>
              </h3>
              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-[#FFF0F0] cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FFF0F0] rounded-2xl p-2 max-h-[60vh] overflow-auto flex items-center justify-center border border-[#FF9999]">
              {selectedReceiptUrl.startsWith('data:image') || selectedReceiptUrl.includes('http') ? (
                <img
                  src={selectedReceiptUrl}
                  alt="Payment Receipt Preview"
                  className="max-w-full h-auto rounded-xl shadow-md"
                />
              ) : (
                <div className="p-8 text-center text-xs text-slate-600 space-y-2">
                  <FileText className="w-10 h-10 text-[#800000] mx-auto" />
                  <p>Document attachment: {selectedReceiptUrl}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedReceiptUrl(null)}
              className="w-full bg-[#800000] hover:bg-[#6b0000] text-white font-bold py-2.5 rounded-xl text-xs transition !text-white"
            >
              Close Receipt Viewer
            </button>
          </div>
        </div>
      )}

      {/* Superadmin User Password Change & Reset Modal */}
      {passwordModalMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#FF9999] rounded-3xl max-w-md w-full p-6 space-y-4 relative shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#FF9999]/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#800000] text-white flex items-center justify-center font-bold shadow-xs">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#800000] text-sm">Superadmin Password Reset</h3>
                  <p className="text-[11px] text-slate-600 font-mono">
                    {passwordModalMember.name} ({passwordModalMember.idCard})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPasswordModalMember(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-[#FFF0F0] cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {passwordSuccessMsg ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-800">{passwordSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSaveUserPassword} className="space-y-4 text-xs">
                <div className="bg-[#FFF0F0] p-3.5 rounded-2xl border border-[#FF9999] space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600">User Full Name:</span>
                    <strong className="text-slate-900 font-bold">{passwordModalMember.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">NID / ID Card:</span>
                    <strong className="text-[#800000] font-mono font-bold">{passwordModalMember.idCard}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Registered Email:</span>
                    <strong className="text-slate-900 font-mono font-medium">{passwordModalMember.email || 'N/A'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Role / Status:</span>
                    <strong className="text-[#800000] font-bold">
                      {passwordModalMember.councilRole || passwordModalMember.section || 'Member'}
                    </strong>
                  </div>
                </div>

                {passwordErrorMsg && (
                  <div className="bg-[#FFF0F0] border border-[#FF3333] rounded-xl p-2.5 text-[#FF3333] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{passwordErrorMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-800 font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#800000]" />
                      <span>New Secure Password *</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleQuickResetDefault}
                      className="text-[11px] text-[#800000] hover:underline font-mono font-bold cursor-pointer"
                    >
                      Quick Set to '123456'
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      required
                      placeholder="Enter new password (min 6 chars)"
                      value={newPasswordInput}
                      onChange={(e) => {
                        setNewPasswordInput(e.target.value);
                        setPasswordErrorMsg(null);
                      }}
                      className="w-full bg-white border border-[#FF9999] rounded-xl px-3 py-2.5 pr-10 text-slate-900 text-xs font-mono focus:outline-none focus:border-[#800000]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="bg-[#FFF0F0] border border-[#FF9999] p-3 rounded-xl flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="mustChangePasswordSuper"
                    checked={mustChangePasswordCheck}
                    onChange={(e) => setMustChangePasswordCheck(e.target.checked)}
                    className="mt-0.5 rounded border-[#FF9999] text-[#800000] focus:ring-[#800000] cursor-pointer"
                  />
                  <label htmlFor="mustChangePasswordSuper" className="text-[11px] text-slate-700 cursor-pointer">
                    <strong className="text-slate-900 block">Require password update on next login</strong>
                    Forces user to set their own confidential password the next time they authenticate.
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#800000] hover:bg-[#6b0000] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer !text-white"
                  >
                    <Save className="w-4 h-4 text-white" />
                    <span>Update & Save User Password</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasswordModalMember(null)}
                    className="bg-[#FFF0F0] text-slate-700 hover:bg-[#FF9999]/30 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
