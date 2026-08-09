import React, { useState, useEffect } from 'react';
import { SubCrew, PortalSettings, Member } from '../types';
import { CouncilPermissionsManager } from './CouncilPermissionsManager';
import { AdvisorGovernanceModal } from './AdvisorGovernanceModal';
import {
  Settings,
  MapPin,
  Sparkles,
  Bell,
  Plus,
  Trash2,
  Shield,
  X,
  Mail,
  Smartphone,
  User,
  Phone,
  Home,
  Save,
  Lock,
  MessageCircle,
  Instagram,
  Send,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Edit2,
  Crown,
  UserX,
  RefreshCw,
  Landmark,
  CreditCard,
  Copy,
  Palette,
} from 'lucide-react';

interface SettingsCrewModuleProps {
  crews: SubCrew[];
  settings?: PortalSettings;
  members: Member[];
  currentMember: Member;
  onAddCrew: (crew: Omit<SubCrew, 'id'>) => void;
  onDeleteCrew: (id: string) => void;
  onUpdateSettings: (settings: PortalSettings) => void;
  onUpdateMember?: (member: Member) => void;
}

export const SettingsCrewModule: React.FC<SettingsCrewModuleProps> = ({
  crews = [],
  settings: settingsProp,
  members = [],
  currentMember,
  onAddCrew,
  onDeleteCrew,
  onUpdateSettings,
  onUpdateMember,
}) => {
  const settings: PortalSettings = settingsProp || {
    aiEnabled: true,
    smsNotificationsEnabled: true,
    emailNotificationsEnabled: true,
    activeTerm: '2025-2026',
    councilPositions: [],
    paymentDetails: {
      accountName: 'My Rovers Crew Official Account',
      accountNumber: '7730000123456',
      bankName: 'Bank of Maldives (BML)',
    },
  };
  const isCouncil = currentMember.councilRole !== 'Member';
  const [activeTab, setActiveTab] = useState<'admin' | 'personal'>(isCouncil ? 'admin' : 'personal');

  // Personal Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: currentMember.name || '',
    email: currentMember.email || '',
    mobile: currentMember.mobile || '',
    phone: currentMember.phone || '',
    permAddress: currentMember.permAddress || '',
    currAddress: currentMember.currAddress || '',
    telegram: currentMember.telegram || '',
    whatsapp: currentMember.whatsapp || '',
    instagram: currentMember.instagram || '',
    emergencyContactName: currentMember.emergencyContactName || '',
    emergencyContactNumber: currentMember.emergencyContactNumber || '',
  });

  // Keep form updated if currentMember changes (e.g., via User Switcher)
  useEffect(() => {
    setProfileForm({
      name: currentMember.name || '',
      email: currentMember.email || '',
      mobile: currentMember.mobile || '',
      phone: currentMember.phone || '',
      permAddress: currentMember.permAddress || '',
      currAddress: currentMember.currAddress || '',
      telegram: currentMember.telegram || '',
      whatsapp: currentMember.whatsapp || '',
      instagram: currentMember.instagram || '',
      emergencyContactName: currentMember.emergencyContactName || '',
      emergencyContactNumber: currentMember.emergencyContactNumber || '',
    });
    // Force non-council members to 'personal' tab
    if (currentMember.councilRole === 'Member') {
      setActiveTab('personal');
    }
  }, [currentMember]);

  // Superadmin Payment Details Form State
  const [paymentForm, setPaymentForm] = useState({
    accountName: settings?.paymentDetails?.accountName || 'My Rovers Crew Official Account',
    accountNumber: settings?.paymentDetails?.accountNumber || '7730000123456',
    bankName: settings?.paymentDetails?.bankName || 'Bank of Maldives (BML)',
  });
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  useEffect(() => {
    if (settings?.paymentDetails) {
      setPaymentForm({
        accountName: settings.paymentDetails.accountName || '',
        accountNumber: settings.paymentDetails.accountNumber || '',
        bankName: settings.paymentDetails.bankName || '',
      });
    }
  }, [settings?.paymentDetails]);

  const handleSavePaymentDetails = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      paymentDetails: {
        accountName: paymentForm.accountName.trim(),
        accountNumber: paymentForm.accountNumber.trim(),
        bankName: paymentForm.bankName.trim(),
      },
    });
    alert('Official payment details updated successfully!');
  };

  // Council Roles Management State
  const defaultCouncilRoles = [
    'Chairperson',
    'Vice Chairperson',
    'Secretary',
    'Treasurer',
    'Event Coordinator',
    'Progress Coordinator',
    'Media Coordinator',
    'Crew Leader',
  ];

  const councilPositions =
    settings.councilPositions && settings.councilPositions.length > 0
      ? settings.councilPositions
      : defaultCouncilRoles;

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
  const [editingRoleIndex, setEditingRoleIndex] = useState<number | null>(null);
  const [roleInputName, setRoleInputName] = useState('');

  // Search & Filter state for role assignments
  const [roleAssignmentSearch, setRoleAssignmentSearch] = useState('');
  const [roleAssignmentFilterCrew, setRoleAssignmentFilterCrew] = useState('All');

  const handleOpenCreateRole = () => {
    setEditingRoleIndex(null);
    setRoleInputName('');
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (index: number, currentRoleName: string) => {
    setEditingRoleIndex(index);
    setRoleInputName(currentRoleName);
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = roleInputName.trim();
    if (!trimmed) {
      alert('Role title cannot be empty.');
      return;
    }

    let updatedPositions = [...councilPositions];

    if (editingRoleIndex !== null) {
      const oldRoleName = updatedPositions[editingRoleIndex];
      if (
        updatedPositions.some(
          (r, i) => i !== editingRoleIndex && r.toLowerCase() === trimmed.toLowerCase()
        )
      ) {
        alert('A Council Role with this title already exists.');
        return;
      }
      updatedPositions[editingRoleIndex] = trimmed;

      if (onUpdateMember) {
        members.forEach((m) => {
          if (m.councilRole === oldRoleName) {
            onUpdateMember({ ...m, councilRole: trimmed });
          }
        });
      }
    } else {
      if (updatedPositions.some((r) => r.toLowerCase() === trimmed.toLowerCase())) {
        alert('A Council Role with this title already exists.');
        return;
      }
      updatedPositions.push(trimmed);
    }

    onUpdateSettings({ ...settings, councilPositions: updatedPositions });
    setIsRoleModalOpen(false);
    setRoleInputName('');
    alert(
      editingRoleIndex !== null
        ? `Council Role updated to "${trimmed}".`
        : `New Council Role "${trimmed}" created successfully!`
    );
  };

  const handleDeleteRole = (index: number, roleToDelete: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the Council Role "${roleToDelete}"? Members currently holding this role will be set to 'Member'.`
      )
    ) {
      return;
    }

    const updatedPositions = councilPositions.filter((_, i) => i !== index);

    if (onUpdateMember) {
      members.forEach((m) => {
        if (m.councilRole === roleToDelete) {
          onUpdateMember({ ...m, councilRole: 'Member' });
        }
      });
    }

    onUpdateSettings({ ...settings, councilPositions: updatedPositions });
    alert(`Council Role "${roleToDelete}" deleted.`);
  };

  const handleAssignRoleToMember = (member: Member, newRole: string) => {
    if (!onUpdateMember) return;
    onUpdateMember({ ...member, councilRole: newRole });
  };

  // Modal State for New Sub-Crew
  const [isCrewModalOpen, setIsCrewModalOpen] = useState(false);
  const [newCrewData, setNewCrewData] = useState({
    name: '',
    location: '',
    crewLeaderId: '',
    description: '',
  });

  const handleCreateCrew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrewData.name.trim() || !newCrewData.location.trim()) {
      alert('Crew name and location are required.');
      return;
    }

    const leaderObj = members.find((m) => m.id === newCrewData.crewLeaderId);

    onAddCrew({
      name: newCrewData.name,
      location: newCrewData.location,
      crewLeaderId: newCrewData.crewLeaderId || undefined,
      crewLeaderName: leaderObj ? leaderObj.name : undefined,
      description: newCrewData.description,
    });

    setIsCrewModalOpen(false);
    setNewCrewData({ name: '', location: '', crewLeaderId: '', description: '' });
    alert('New Sub-Crew unit provisioned successfully!');
  };

  const handleSavePersonalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateMember) return;

    const updatedMember: Member = {
      ...currentMember,
      ...profileForm,
    };

    onUpdateMember(updatedMember);
    alert('Personal Settings & Profile updated successfully!');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar with Tab Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1A1E26] border border-slate-800 p-5 rounded-2xl shadow-md">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-400" />
            {isCouncil ? 'Crew Settings & Administration' : 'Personal Settings & Profile'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isCouncil
              ? 'Configure crew deployment units, AI engine settings, and personal account preferences.'
              : 'Customize your personal information, contact details, and notification preferences.'}
          </p>
        </div>

        {/* Tab Switcher for Council Members */}
        {isCouncil ? (
          <div className="flex items-center gap-2 bg-[#161920] p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Settings</span>
            </button>
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                activeTab === 'personal'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Personal Settings</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1.5 rounded-xl font-medium">
            <User className="w-4 h-4" />
            <span>Member Personal Portal</span>
          </div>
        )}
      </div>

      {/* ADMIN SETTINGS VIEW (Council Only) */}
      {activeTab === 'admin' && isCouncil && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Sub-Crews Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rover Advisor Exclusive Executive Override Banner */}
            {currentMember.councilRole === 'Rover Advisor' && (
              <div className="bg-gradient-to-r from-purple-950/80 via-[#1A1829] to-slate-900 border-2 border-purple-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 flex-shrink-0 shadow-md">
                      <Crown className="w-6 h-6 text-purple-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-100 font-serif">
                          Rover Advisor Executive Override Protocol
                        </h3>
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                          Exclusive Authority
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        High-level advisory power to replace underperforming Chairpersons or dissolve & overhaul crew leadership.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAdvisorModalOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 flex-shrink-0"
                  >
                    <Crown className="w-4 h-4 text-amber-200" />
                    <span>Execute Advisory Overhaul Protocol</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-purple-950/40 border border-purple-500/20 p-3 rounded-xl flex items-center gap-2.5">
                    <UserX className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-purple-200">Replace / Oust Chairperson</div>
                      <div className="text-[10px] text-slate-400">Reassign chairperson position in case of non-performance</div>
                    </div>
                  </div>

                  <div className="bg-purple-950/40 border border-purple-500/20 p-3 rounded-xl flex items-center gap-2.5">
                    <RefreshCw className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-purple-200">Full Crew Leadership Overhaul</div>
                      <div className="text-[10px] text-slate-400">Dissolve all council roles & mandate fresh elections</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    Multi-Crew Operational Units
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Decentralized crews operating under Executive Council supervision.
                  </p>
                </div>

                <button
                  id="settings-add-crew-btn"
                  onClick={() => setIsCrewModalOpen(true)}
                  className="bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Provision Sub-Crew</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {crews.map((c) => {
                  const crewMembers = members.filter((m) => m.crewId === c.id && m.status === 'Active');
                  return (
                    <div key={c.id} className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-100">{c.name}</h4>
                          <span className="text-xs text-emerald-400 font-mono">{c.location}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`Remove sub-crew "${c.name}"?`)) {
                              onDeleteCrew(c.id);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-400">{c.description}</p>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                        <span>Crew Leader: <strong className="text-amber-300">{c.crewLeaderName || 'Unassigned'}</strong></span>
                        <span className="bg-slate-800 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                          {crewMembers.length} Active Members
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Council Permissions & Role Delegation Engine */}
            <CouncilPermissionsManager
              councilPositions={councilPositions}
              members={members}
              settings={settings}
              onUpdateSettings={(newSettings) => {
                onUpdateSettings(newSettings);
              }}
              onUpdateMember={onUpdateMember}
              onCreateRole={handleOpenCreateRole}
              onEditRole={handleOpenEditRole}
              onDeleteRole={handleDeleteRole}
            />
          </div>

          {/* Right 1 Col: Admin AI & System Toggles */}
          <div className="space-y-6">
            {/* Admin AI Permission Control */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">Admin AI Controls</h3>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-200">Enable AI Journal Refinement</span>
                  <input
                    type="checkbox"
                    checked={settings.aiEnabled}
                    onChange={(e) => onUpdateSettings({ ...settings, aiEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  When enabled, members can use the Gemini AI button to polish, summarize, or format their journal logs into professional reports.
                </p>
              </div>
            </div>

            {/* Automated Notifications Toggles */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">Notification Triggers</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>SMS Automated Alerts</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.smsNotificationsEnabled}
                    onChange={(e) => onUpdateSettings({ ...settings, smsNotificationsEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
                  />
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span>Email Calendar Dispatch</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotificationsEnabled}
                    onChange={(e) => onUpdateSettings({ ...settings, emailNotificationsEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Active Term Config */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <h3 className="text-sm font-bold text-slate-100">Active Governance Term</h3>
              <input
                type="text"
                value={settings.activeTerm}
                onChange={(e) => onUpdateSettings({ ...settings, activeTerm: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none"
              />
            </div>

            {/* Official Payment & Banking Details (Set by Super Admin) */}
            <div className="bg-[#1A1E26] border border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Official Payment & Banking Details</h3>
                    <p className="text-[11px] text-slate-400">Configured by Superadmin for fee collection & event dues.</p>
                  </div>
                </div>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                  Superadmin
                </span>
              </div>

              <form onSubmit={handleSavePaymentDetails} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Account Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kushafah Rover Crew Official"
                    value={paymentForm.accountName}
                    onChange={(e) => setPaymentForm({ ...paymentForm, accountName: e.target.value })}
                    className="w-full bg-[#161920] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    <span>Account Number</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7730000123456"
                    value={paymentForm.accountNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })}
                    className="w-full bg-[#161920] border border-slate-800 rounded-xl px-3 py-2 text-emerald-300 font-mono font-bold focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bank Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bank of Maldives (BML)"
                    value={paymentForm.bankName}
                    onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                    className="w-full bg-[#161920] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Payment Details</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Non-Council Warning if attempt to view Admin */}
      {activeTab === 'admin' && !isCouncil && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-slate-200 flex items-center gap-4">
          <Lock className="w-8 h-8 text-rose-400 flex-shrink-0" />
          <div>
            <h3 className="text-base font-bold text-rose-300">Admin Settings Restricted</h3>
            <p className="text-xs text-slate-400 mt-1">
              Admin & system architecture configurations are reserved for Executive Council Officers. You have been redirected to your Personal Settings.
            </p>
          </div>
        </div>
      )}

      {/* PERSONAL SETTINGS VIEW (Available to All Members) */}
      {(activeTab === 'personal' || !isCouncil) && (
        <form onSubmit={handleSavePersonalSettings} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Official Standing Summary */}
            <div className="space-y-6">
              <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center font-bold">
                    {currentMember.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{currentMember.name}</h3>
                    <p className="text-xs text-emerald-400 font-mono">{currentMember.councilRole}</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="bg-[#161920] p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">ID Card Number</span>
                    <span className="font-mono text-slate-200 font-bold">{currentMember.idCard}</span>
                  </div>
                  <div className="bg-[#161920] p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Section & Crew</span>
                    <span className="font-semibold text-slate-200">{currentMember.section} • {currentMember.crewName}</span>
                  </div>
                  <div className="bg-[#161920] p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Standing Status</span>
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold font-mono text-[10px]">
                      {currentMember.status}
                    </span>
                  </div>
                  <div className="bg-[#161920] p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Investiture Date</span>
                    <span className="text-slate-300">{currentMember.investitureDate}</span>
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Official rank and council role changes must be requested through the Executive Council Secretary.</span>
                </div>
              </div>

              {/* Official Crew Payment Details Widget for Members */}
              <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-slate-200">Official Crew Payment Account</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">BML Direct Deposit</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-[#161920] p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Account Name</span>
                    <span className="font-semibold text-slate-200 text-right">{settings?.paymentDetails?.accountName || 'My Rovers Crew'}</span>
                  </div>
                  <div className="bg-[#161920] p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Account Number</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-300 font-bold">{settings?.paymentDetails?.accountNumber || '7730000123456'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (settings?.paymentDetails?.accountNumber) {
                            navigator.clipboard.writeText(settings.paymentDetails.accountNumber);
                            setCopiedAccount(true);
                            setTimeout(() => setCopiedAccount(false), 2000);
                          }
                        }}
                        className="text-slate-400 hover:text-emerald-300 transition p-1 cursor-pointer"
                        title="Copy Account Number"
                      >
                        {copiedAccount ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="bg-[#161920] p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Bank Name</span>
                    <span className="text-slate-300">{settings?.paymentDetails?.bankName || 'Bank of Maldives (BML)'}</span>
                  </div>
                </div>
              </div>

              {/* Kushafah Scout Group Official Brand Color Palette Widget */}
              <div className="bg-[#1A1E26] border border-amber-500/20 rounded-2xl p-5 shadow-lg space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#002B7F] via-[#800020] to-[#006B3F] flex items-center justify-center text-amber-300 border border-[#FFC72C]/40">
                      <Palette className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">Kushafah Scout Group Official Brand Palette</h4>
                      <p className="text-[10px] text-slate-400">Click any color card to copy exact HEX code</p>
                    </div>
                  </div>
                  <span className="bg-[#002B7F]/40 text-amber-300 border border-[#FFC72C]/40 text-[9px] font-bold px-2 py-0.5 rounded font-mono">
                    Branding
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    {
                      name: 'Kushafah Maroon',
                      role: 'School & Emblem Trim',
                      hex: '#800020',
                      bg: 'bg-[#800020]',
                      border: 'border-[#800020]',
                      text: 'text-amber-200',
                    },
                    {
                      name: 'Royal Blue',
                      role: 'Scarf & Badge Crest',
                      hex: '#002B7F',
                      bg: 'bg-[#002B7F]',
                      border: 'border-[#002B7F]',
                      text: 'text-amber-200',
                    },
                    {
                      name: 'Scout Gold',
                      role: 'Emblem Ring & Star',
                      hex: '#FFC72C',
                      bg: 'bg-[#FFC72C]',
                      border: 'border-[#FFC72C]',
                      text: 'text-slate-950 font-bold',
                    },
                    {
                      name: 'Islamic Green',
                      role: 'Scout Association Flag',
                      hex: '#006B3F',
                      bg: 'bg-[#006B3F]',
                      border: 'border-[#006B3F]',
                      text: 'text-emerald-100',
                    },
                  ].map((col) => (
                    <div
                      key={col.hex}
                      onClick={() => {
                        navigator.clipboard.writeText(col.hex);
                        setCopiedColor(col.hex);
                        setTimeout(() => setCopiedColor(null), 2000);
                      }}
                      className="bg-[#161920] border border-slate-800 hover:border-amber-500/50 rounded-xl p-2.5 flex items-center gap-2.5 cursor-pointer transition group"
                    >
                      <div className={`w-8 h-8 rounded-lg ${col.bg} flex-shrink-0 border border-white/20 shadow-sm flex items-center justify-center`}>
                        {copiedColor === col.hex && <CheckCircle2 className={`w-4 h-4 ${col.hex === '#FFC72C' ? 'text-slate-950' : 'text-white'}`} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-200 truncate">{col.name}</span>
                          <span className="text-[10px] font-mono text-amber-300 font-bold ml-1">{col.hex}</span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 truncate mt-0.5">{col.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 2 Cols: Editable Personal Fields */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                  <User className="w-5 h-5 text-emerald-400" />
                  Personal Information & Contact Profile
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full bg-[#161920] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full bg-[#161920] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Mobile Number</label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={profileForm.mobile}
                        onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                        className="w-full bg-[#161920] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Secondary Phone (Optional)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full bg-[#161920] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Permanent Address</label>
                    <input
                      type="text"
                      value={profileForm.permAddress}
                      onChange={(e) => setProfileForm({ ...profileForm, permAddress: e.target.value })}
                      className="w-full bg-[#161920] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Current Living Address</label>
                    <input
                      type="text"
                      value={profileForm.currAddress}
                      onChange={(e) => setProfileForm({ ...profileForm, currAddress: e.target.value })}
                      className="w-full bg-[#161920] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-200 pt-2 border-t border-slate-800 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-sky-400" />
                  Social Handles & Emergency Contact
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Telegram Handle</label>
                    <input
                      type="text"
                      placeholder="@username"
                      value={profileForm.telegram}
                      onChange={(e) => setProfileForm({ ...profileForm, telegram: e.target.value })}
                      className="w-full bg-[#161920] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      placeholder="+960 7xxxxxx"
                      value={profileForm.whatsapp}
                      onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                      className="w-full bg-[#161920] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Instagram Handle</label>
                    <input
                      type="text"
                      placeholder="@handle"
                      value={profileForm.instagram}
                      onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                      className="w-full bg-[#161920] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={profileForm.emergencyContactName}
                      onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })}
                      className="w-full bg-[#161920] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Emergency Contact Mobile</label>
                    <input
                      type="text"
                      value={profileForm.emergencyContactNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, emergencyContactNumber: e.target.value })}
                      className="w-full bg-[#161920] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Personal Settings</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Provision New Sub-Crew Modal */}
      {isCrewModalOpen && isCouncil && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCrew}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 text-slate-100 space-y-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold font-serif text-slate-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-400" />
                Provision New Sub-Crew
              </h3>
              <button type="button" onClick={() => setIsCrewModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Sub-Crew Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hulhumale Phase 2 Crew"
                  value={newCrewData.name}
                  onChange={(e) => setNewCrewData({ ...newCrewData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Operational Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hulhumale' Phase 2"
                  value={newCrewData.location}
                  onChange={(e) => setNewCrewData({ ...newCrewData, location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Assign Crew Leader</label>
                <select
                  value={newCrewData.crewLeaderId}
                  onChange={(e) => setNewCrewData({ ...newCrewData, crewLeaderId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                >
                  <option value="">-- Assign Later --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.councilRole})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Purpose and deployment focus of this crew..."
                  value={newCrewData.description}
                  onChange={(e) => setNewCrewData({ ...newCrewData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCrewModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-500 text-slate-950 text-xs font-bold px-5 py-2 rounded-xl transition shadow-md"
              >
                Provision Sub-Crew
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal for Creating / Editing Council Role */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1E26] border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                {editingRoleIndex !== null ? 'Edit Council Role Title' : 'Create New Council Role'}
              </h3>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Council Role Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quartermaster, Logistics Coordinator, Training Officer..."
                  value={roleInputName}
                  onChange={(e) => setRoleInputName(e.target.value)}
                  className="w-full bg-[#161920] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {editingRoleIndex !== null
                  ? 'Renaming this role will automatically update all currently assigned members to the new role name.'
                  : 'New council roles will immediately be available for assignment across all crew members.'}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition shadow"
                >
                  {editingRoleIndex !== null ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Advisor Governance Override Modal */}
      <AdvisorGovernanceModal
        isOpen={isAdvisorModalOpen}
        onClose={() => setIsAdvisorModalOpen(false)}
        currentMember={currentMember}
        members={members}
        onUpdateMember={onUpdateMember}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />
    </div>
  );
};
