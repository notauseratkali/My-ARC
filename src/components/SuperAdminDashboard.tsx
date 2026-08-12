import React, { useState } from 'react';
import { Organisation, Member, PlanType, PortalSettings } from '../types';
import {
  Shield,
  Building2,
  Crown,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Eye,
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
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'renewals' | 'all' | 'create' | 'payment'>('pending');
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
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-amber-950/80 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs px-3 py-1 rounded-full font-mono uppercase font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Superadmin Control Hub</span>
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-1 rounded-full font-mono font-bold">
                Multi-Tenant Architecture
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-100">
              Portal Administration & Crew Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Create, review, and approve separate Scout Organisations. Assign Rover Advisors to form crews, manage subscription plans (Free, Monthly @ MVR 20, Annual @ MVR 200), and inspect uploaded payment receipts.
            </p>
          </div>

          {/* Quick Context Switcher */}
          <div className="bg-[#12151B]/90 border border-slate-800 p-4 rounded-2xl space-y-2 min-w-[260px]">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Active Portal View Context</span>
            </label>
            <select
              value={activeOrgContext}
              onChange={(e) => onSelectActiveOrgContext(e.target.value)}
              className="w-full bg-[#1A1E26] border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">🌐 Global Portal View (All Orgs)</option>
              {organisations.map((org) => (
                <option key={org.id} value={org.id}>
                  🏛️ {org.name} ({org.code}) - {org.status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161920] border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-100">{organisations.length}</div>
            <div className="text-xs text-slate-400 font-medium">Total Registered Orgs</div>
          </div>
        </div>

        <div className="bg-[#161920] border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold relative">
            <Clock className="w-6 h-6" />
            {pendingOrgs.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-bounce">
                {pendingOrgs.length}
              </span>
            )}
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-400">{pendingOrgs.length}</div>
            <div className="text-xs text-slate-400 font-medium">Pending Approvals</div>
          </div>
        </div>

        <div className="bg-[#161920] border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-400">{activeOrgs.length}</div>
            <div className="text-xs text-slate-400 font-medium">Active Rover Advisor Crews</div>
          </div>
        </div>

        <div className="bg-[#161920] border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-sky-300">
              MVR {organisations.reduce((acc, o) => acc + (o.plan === 'Monthly' ? 20 : o.plan === 'Annual' ? 200 : 0), 0)}
            </div>
            <div className="text-xs text-slate-400 font-medium">Subscription Revenues</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'bg-[#161920] text-slate-400 hover:text-slate-100 border border-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Signups</span>
            {pendingOrgs.length > 0 && (
              <span className="bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-full text-[10px] font-mono">
                {pendingOrgs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('renewals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'renewals'
                ? 'bg-amber-500 text-slate-950 shadow-lg font-extrabold'
                : 'bg-[#161920] text-slate-400 hover:text-slate-100 border border-slate-800'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Plan Renewals & Receipts</span>
            {pendingRenewals.length > 0 && (
              <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold animate-pulse">
                {pendingRenewals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-[#161920] text-slate-400 hover:text-slate-100 border border-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>All Organisations ({organisations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-[#161920] text-slate-400 hover:text-slate-100 border border-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create Organisation</span>
          </button>

          <button
            onClick={() => setActiveTab('payment')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'payment'
                ? 'bg-amber-500 text-slate-950 shadow-lg font-extrabold'
                : 'bg-[#161920] text-slate-400 hover:text-slate-100 border border-slate-800'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Payment Details</span>
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
        <div className="bg-[#161920] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 pl-2">Organisation</th>
                  <th className="pb-3">Designated Rover Advisor</th>
                  <th className="pb-3">Plan Type</th>
                  <th className="pb-3">Valid Until</th>
                  <th className="pb-3">Renewal Status</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrgs.map((org) => {
                  const orgMembers = members.filter((m) => m.organisationId === org.id);
                  const isExpired = org.planValidUntil && org.planValidUntil !== 'Indefinite' && org.planValidUntil < new Date().toISOString().split('T')[0];

                  return (
                    <tr key={org.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 pl-2">
                        <div className="font-bold text-slate-100 text-sm">{org.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">Code: {org.code} • {orgMembers.length} Members</div>
                      </td>

                      <td className="py-3.5">
                        <div className="font-semibold text-purple-300">{org.roverAdvisorName}</div>
                        <div className="text-[10px] text-slate-400">{org.roverAdvisorEmail}</div>
                      </td>

                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                          org.plan === 'Free'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : org.plan === 'Monthly'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {org.plan === 'Free' ? 'Free (Exempt)' : org.plan === 'Monthly' ? 'Monthly' : 'Annual'}
                        </span>
                      </td>

                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                          org.planValidUntil === 'Indefinite'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : isExpired
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}>
                          {org.planValidUntil || 'Indefinite'}
                          {isExpired && ' (EXPIRED)'}
                        </span>
                      </td>

                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          org.renewalStatus === 'Pending Verification'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                            : org.renewalStatus === 'Approved'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {org.renewalStatus || 'None'}
                        </span>
                      </td>

                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                          org.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        }`}>
                          {org.status === 'Active' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{org.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 pr-2 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEditModal(org)}
                          title="Edit Organisation Details"
                          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => {
                            setExtensionOrg(org);
                            setExtensionMode(org.plan === 'Annual' ? '+1 Year' : '+1 Month');
                          }}
                          className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                          <span>Extend</span>
                        </button>

                        <button
                          onClick={() => onSelectActiveOrgContext(org.id)}
                          className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>

                        <button
                          onClick={() => setDeletingOrg(org)}
                          title="Delete Organisation"
                          className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>
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

      {/* Superadmin Extension Modal */}
      {extensionOrg && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161920] border border-amber-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Verify & Extend Plan Validity</h3>
                  <p className="text-[11px] text-amber-300 font-mono">{extensionOrg.name} ({extensionOrg.code})</p>
                </div>
              </div>
              <button
                onClick={() => setExtensionOrg(null)}
                className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#12151B] p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Plan:</span>
                <strong className="text-emerald-400">{extensionOrg.plan}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Valid Until:</span>
                <strong className="text-amber-300 font-mono">{extensionOrg.planValidUntil || 'Expired'}</strong>
              </div>
              {extensionOrg.renewalRequestedTerm && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Requested Extension:</span>
                  <strong className="text-purple-300 font-bold">{extensionOrg.renewalRequestedTerm}</strong>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-semibold block">Select Extension Amount / Term *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setExtensionMode('+1 Month')}
                  className={`p-2 rounded-xl text-center font-bold border text-xs transition cursor-pointer ${
                    extensionMode === '+1 Month'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-[#12151B] text-slate-300 border-slate-800'
                  }`}
                >
                  +1 Month
                </button>
                <button
                  type="button"
                  onClick={() => setExtensionMode('+1 Year')}
                  className={`p-2 rounded-xl text-center font-bold border text-xs transition cursor-pointer ${
                    extensionMode === '+1 Year'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-[#12151B] text-slate-300 border-slate-800'
                  }`}
                >
                  +1 Year
                </button>
                <button
                  type="button"
                  onClick={() => setExtensionMode('Term')}
                  className={`p-2 rounded-xl text-center font-bold border text-xs transition cursor-pointer ${
                    extensionMode === 'Term' || extensionMode === 'Date'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-[#12151B] text-slate-300 border-slate-800'
                  }`}
                >
                  Specific Term
                </button>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setExtensionMode('Indefinite')}
                  className={`w-full p-2 rounded-xl text-center font-bold border text-xs transition cursor-pointer ${
                    extensionMode === 'Indefinite'
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-[#12151B] text-purple-300 border-slate-800'
                  }`}
                >
                  ♾️ Set to Indefinite Validity (Free/Exempt)
                </button>
              </div>

              {(extensionMode === 'Term' || extensionMode === 'Date') && (
                <div className="space-y-1 pt-1">
                  <label className="text-slate-400 text-[11px]">Enter Expiry Date (YYYY-MM-DD) or Specific Term:</label>
                  <input
                    type="text"
                    placeholder="e.g. 2026-12-31 or 2026-2027 Term"
                    value={customExtensionText}
                    onChange={(e) => setCustomExtensionText(e.target.value)}
                    className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleConfirmExtension}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg cursor-pointer"
              >
                Confirm & Extend Validity Date
              </button>
              <button
                onClick={() => setExtensionOrg(null)}
                className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Superadmin Edit Organisation Modal */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161920] border border-blue-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Edit Organisation Details</h3>
                  <p className="text-[11px] text-blue-300 font-mono">{editingOrg.name} ({editingOrg.code})</p>
                </div>
              </div>
              <button
                onClick={() => setEditingOrg(null)}
                className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditOrg} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Organisation Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Short Code / Slug *</label>
                  <input
                    type="text"
                    required
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-3 space-y-3">
                <h4 className="text-amber-400 font-bold text-[11px] uppercase tracking-wider">Designated Rover Advisor</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">Advisor Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.roverAdvisorName}
                      onChange={(e) => setEditForm({ ...editForm, roverAdvisorName: e.target.value })}
                      className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">Advisor Email Address *</label>
                    <input
                      type="email"
                      required
                      value={editForm.roverAdvisorEmail}
                      onChange={(e) => setEditForm({ ...editForm, roverAdvisorEmail: e.target.value })}
                      className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">Advisor NID Card *</label>
                    <input
                      type="text"
                      required
                      value={editForm.roverAdvisorNid}
                      onChange={(e) => setEditForm({ ...editForm, roverAdvisorNid: e.target.value })}
                      className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">Advisor Mobile Phone *</label>
                    <input
                      type="text"
                      required
                      value={editForm.roverAdvisorPhone}
                      onChange={(e) => setEditForm({ ...editForm, roverAdvisorPhone: e.target.value })}
                      className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-3 space-y-3">
                <h4 className="text-purple-400 font-bold text-[11px] uppercase tracking-wider">Plan & Status Configuration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">Plan Type</label>
                    <select
                      value={editForm.plan}
                      onChange={(e) => setEditForm({ ...editForm, plan: e.target.value as PlanType })}
                      className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Free">Free (Exempt)</option>
                      <option value="Monthly">Monthly (MVR 20)</option>
                      <option value="Annual">Annual (MVR 200)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">Plan Valid Until</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026-12-31 or Indefinite"
                      value={editForm.planValidUntil}
                      onChange={(e) => setEditForm({ ...editForm, planValidUntil: e.target.value })}
                      className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">Account Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending Approval">Pending Approval</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const target = editingOrg;
                    setEditingOrg(null);
                    setDeletingOrg(target);
                  }}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Org</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrg(null)}
                    className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold px-5 py-2 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161920] border border-rose-500/50 rounded-3xl max-w-md w-full p-6 space-y-4 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Delete Organisation</h3>
                  <p className="text-[11px] text-rose-400 font-mono">{deletingOrg.name} ({deletingOrg.code})</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingOrg(null)}
                className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#12151B] p-4 rounded-2xl border border-rose-500/20 space-y-2 text-xs text-slate-300">
              <p className="text-slate-200 font-semibold">
                Are you sure you want to permanently delete <strong className="text-rose-400">{deletingOrg.name}</strong>?
              </p>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Organisation Code:</span>
                  <strong className="text-slate-200 font-mono">{deletingOrg.code}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Designated Advisor:</span>
                  <strong className="text-slate-200">{deletingOrg.roverAdvisorName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Linked Members:</span>
                  <strong className="text-amber-400">{members.filter((m) => m.organisationId === deletingOrg.id).length} Members</strong>
                </div>
              </div>
              <p className="text-[11px] text-rose-400/90 italic">
                ⚠️ Warning: Deleting this organisation removes its record from the portal. Associated members will no longer be mapped to this active organisation context.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleConfirmDeleteOrg}
                className="flex-1 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Permanently Delete Organisation</span>
              </button>
              <button
                onClick={() => setDeletingOrg(null)}
                className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Receipt Image View Modal */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161920] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Uploaded Payment Transfer Receipt</span>
              </h3>
              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#12151B] rounded-2xl p-2 max-h-[60vh] overflow-auto flex items-center justify-center">
              {selectedReceiptUrl.startsWith('data:image') || selectedReceiptUrl.includes('http') ? (
                <img
                  src={selectedReceiptUrl}
                  alt="Payment Receipt Preview"
                  className="max-w-full h-auto rounded-xl shadow-lg"
                />
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 text-amber-400 mx-auto" />
                  <p>Document attachment: {selectedReceiptUrl}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedReceiptUrl(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 rounded-xl text-xs transition"
            >
              Close Receipt Viewer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
