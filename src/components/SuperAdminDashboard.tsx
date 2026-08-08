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
} from 'lucide-react';

interface SuperAdminDashboardProps {
  organisations: Organisation[];
  members: Member[];
  onApproveOrg: (orgId: string) => void;
  onRejectOrg: (orgId: string) => void;
  onAddDirectOrg: (newOrg: Omit<Organisation, 'id' | 'createdAt' | 'approvedAt'>) => void;
  onSelectActiveOrgContext: (orgId: string | 'all') => void;
  activeOrgContext: string;
  settings?: PortalSettings;
  onUpdateSettings?: (settings: PortalSettings) => void;
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
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'create' | 'payment'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

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
  const activeOrgs = organisations.filter((o) => o.status === 'Active');

  const filteredOrgs = organisations.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      o.code.toLowerCase().includes(q) ||
      o.roverAdvisorName.toLowerCase().includes(q)
    );
  });

  const handleDirectCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || !newAdvisorName.trim() || !newAdvisorEmail.trim()) return;

    onAddDirectOrg({
      name: newOrgName.trim(),
      code: newOrgCode.trim().toUpperCase() || newOrgName.substring(0, 6).toUpperCase(),
      roverAdvisorName: newAdvisorName.trim(),
      roverAdvisorEmail: newAdvisorEmail.trim(),
      roverAdvisorNid: newAdvisorNid.trim().toUpperCase() || 'A100000',
      roverAdvisorPhone: newAdvisorPhone.trim() || '+960 7000000',
      plan: newPlan,
      status: 'Active',
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
              National Organisation Portal Administration
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
        <div className="flex items-center gap-2">
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

      {/* TAB 2: ALL ORGANISATIONS */}
      {activeTab === 'all' && (
        <div className="bg-[#161920] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 pl-2">Organisation</th>
                  <th className="pb-3">Designated Rover Advisor</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Crew Size</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrgs.map((org) => {
                  const orgMembers = members.filter((m) => m.organisationId === org.id);
                  return (
                    <tr key={org.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 pl-2">
                        <div className="font-bold text-slate-100 text-sm">{org.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">Code: {org.code}</div>
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
                          {org.plan === 'Free' ? 'Free (Superadmin)' : org.plan === 'Monthly' ? 'Monthly (MVR 20)' : 'Annual (MVR 200)'}
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

                      <td className="py-3.5 font-bold text-slate-200">
                        {orgMembers.length} Members
                      </td>

                      <td className="py-3.5 pr-2 text-right">
                        <button
                          onClick={() => onSelectActiveOrgContext(org.id)}
                          className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Org Context</span>
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
                  placeholder="e.g. Arabiyya Rover Network"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full bg-[#12151B] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Org Code / Slug</label>
                <input
                  type="text"
                  placeholder="e.g. ARABIYYA"
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
                  placeholder="e.g. advisor.farooq@arabiyya.scout.mv"
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
                placeholder="Account Name (e.g. Arabiyya Rover Crew Official)"
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
