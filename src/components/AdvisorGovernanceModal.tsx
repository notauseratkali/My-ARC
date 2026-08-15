import React, { useState } from 'react';
import { Member, PortalSettings } from '../types';
import {
  Crown,
  ShieldAlert,
  UserX,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  UserCheck,
  ShieldCheck,
  FileText,
  Users,
} from 'lucide-react';

interface AdvisorGovernanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMember: Member;
  members: Member[];
  onUpdateMember?: (member: Member) => void;
  settings?: PortalSettings;
  onUpdateSettings?: (settings: PortalSettings) => void;
}

export const AdvisorGovernanceModal: React.FC<AdvisorGovernanceModalProps> = ({
  isOpen,
  onClose,
  currentMember,
  members,
  onUpdateMember,
  settings,
  onUpdateSettings,
}) => {
  const [activeAction, setActiveAction] = useState<'replace_chair' | 'overhaul_crew'>('replace_chair');

  // Replace Chairperson state
  const currentChairperson = members.find((m) => m.councilRole === 'Chairperson');
  const [selectedNewChairId, setSelectedNewChairId] = useState<string>('');
  const [demoteCurrentChairRole, setDemoteCurrentChairRole] = useState<string>('Member');
  const [terminationReason, setTerminationReason] = useState<string>(
    'Non-performance of chairperson duties and executive advisory override.'
  );
  const [chairConfirmCheck, setChairConfirmCheck] = useState<boolean>(false);

  // Overhaul Crew state
  const [overhaulReason, setOverhaulReason] = useState<string>(
    'Complete crew leadership restructuring by Rover Advisor decree.'
  );
  const [overhaulConfirmCheck, setOverhaulConfirmCheck] = useState<boolean>(false);

  // Success Feedback
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  // Ensure user is Rover Advisor
  if (currentMember.councilRole !== 'Rover Advisor') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white border border-rose-200 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-[#800020] mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-600">
            Emergency Chairperson Replacement and Crew Overhaul protocols are restricted strictly to the <strong className="text-[#002B7F]">Rover Advisor</strong> supreme role.
          </p>
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Eligible members for new Chairperson (excluding current Chairperson and Advisor)
  const eligibleNewChairs = members.filter(
    (m) => m.id !== currentChairperson?.id && m.councilRole !== 'Rover Advisor'
  );

  const handleExecuteReplaceChairperson = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    if (!selectedNewChairId) {
      alert('Please select an eligible Rover member to promote as the new Chairperson.');
      return;
    }

    if (!chairConfirmCheck) {
      alert('You must check the confirmation box acknowledging this Supreme Advisory Action.');
      return;
    }

    const newChair = members.find((m) => m.id === selectedNewChairId);
    if (!newChair) return;

    if (!onUpdateMember) {
      alert('Member update callback unavailable.');
      return;
    }

    // 1. Demote or reassign current chairperson if exists
    if (currentChairperson) {
      onUpdateMember({
        ...currentChairperson,
        councilRole: demoteCurrentChairRole as any,
      });
    }

    // 2. Promote selected member to Chairperson
    onUpdateMember({
      ...newChair,
      councilRole: 'Chairperson',
    });

    setSuccessMsg(
      `Executive Advisory Order Executed: ${currentChairperson?.name || 'Former Chairperson'} was removed from Chairperson position. ${newChair.name} has been appointed as the new Rover Crew Chairperson.`
    );
    setChairConfirmCheck(false);
  };

  const handleExecuteOverhaulCrew = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    if (!overhaulConfirmCheck) {
      alert('You must check the confirmation box to execute a full crew leadership overhaul.');
      return;
    }

    if (!onUpdateMember) return;

    // Reset all council roles (except Rover Advisor) to 'Member'
    members.forEach((m) => {
      if (m.councilRole !== 'Rover Advisor' && m.councilRole !== 'Member') {
        onUpdateMember({
          ...m,
          councilRole: 'Member',
        });
      }
    });

    setSuccessMsg(
      `Supreme Advisory Decree Executed: All executive council positions across the crew have been dissolved and reset to General Member. You may now assign a fresh leadership team.`
    );
    setOverhaulConfirmCheck(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-purple-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative overflow-hidden text-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-700 shadow-xs border border-purple-200">
              <Crown className="w-7 h-7 text-purple-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif text-slate-900">
                  Rover Advisor Executive Mandate
                </h2>
                <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                  Supreme Override Protocol
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Restricted to Rover Advisor • Ouster of Chairperson & Crew Overhaul Authority
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-start gap-3 text-xs relative z-10 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-[#006B3F] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[#006B3F] mb-0.5">Advisory Action Successful</p>
              <p className="leading-relaxed text-slate-700">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Action Toggle Tabs */}
        <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-2 relative z-10 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveAction('replace_chair');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeAction === 'replace_chair'
                ? 'bg-white text-purple-800 border border-purple-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserX className="w-4 h-4 text-purple-700" />
            <span>Oust / Replace Chairperson</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveAction('overhaul_crew');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeAction === 'overhaul_crew'
                ? 'bg-white text-purple-800 border border-purple-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-purple-700" />
            <span>Full Leadership Overhaul</span>
          </button>
        </div>

        {/* ACTION 1: OUST / REPLACE CHAIRPERSON */}
        {activeAction === 'replace_chair' && (
          <form onSubmit={handleExecuteReplaceChairperson} className="space-y-4 relative z-10 text-xs">
            {/* Current Chairperson Card */}
            <div className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 font-bold overflow-hidden">
                  {currentChairperson?.avatar ? (
                    <img src={currentChairperson.avatar} alt={currentChairperson.name} className="w-full h-full object-cover" />
                  ) : (
                    currentChairperson?.name.charAt(0) || '?'
                  )}
                </div>
                <div>
                  <div className="text-[10px] text-amber-800 font-mono font-bold uppercase tracking-wider">
                    Incumbent Chairperson
                  </div>
                  <div className="text-sm font-bold text-slate-900">{currentChairperson?.name || 'No Active Chairperson'}</div>
                  <div className="text-[10px] text-slate-500">
                    ID: <span className="font-mono text-slate-700">{currentChairperson?.idCard || 'N/A'}</span> • {currentChairperson?.crewName}
                  </div>
                </div>
              </div>

              <span className="bg-rose-50 text-[#800020] border border-rose-200 text-[10px] font-bold px-2.5 py-1 rounded-xl">
                Target for Ouster
              </span>
            </div>

            {/* Select New Chairperson */}
            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-700" />
                <span>Appoint New Replacement Chairperson</span>
              </label>
              <select
                value={selectedNewChairId}
                onChange={(e) => setSelectedNewChairId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold focus:outline-none focus:border-purple-600 cursor-pointer"
              >
                <option value="">-- Select Member to Promote to Chairperson --</option>
                {eligibleNewChairs.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.councilRole}) — {m.crewName} [{m.idCard}]
                  </option>
                ))}
              </select>
            </div>

            {/* Reassign Demoted Chairperson Role */}
            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                <span>Reassign Incumbent Chairperson To</span>
              </label>
              <select
                value={demoteCurrentChairRole}
                onChange={(e) => setDemoteCurrentChairRole(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold focus:outline-none focus:border-purple-600 cursor-pointer"
              >
                <option value="Member">General Member (Standard Member Access)</option>
                <option value="Vice Chairperson">Vice Chairperson</option>
                <option value="Secretary">Secretary</option>
              </select>
            </div>

            {/* Termination Reason */}
            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-700" />
                <span>Official Advisory Termination / Replacement Reason</span>
              </label>
              <textarea
                rows={2}
                value={terminationReason}
                onChange={(e) => setTerminationReason(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600"
                placeholder="State reason for replacing the chairperson..."
              />
            </div>

            {/* High Security Checkbox */}
            <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-2xl flex items-start gap-3">
              <input
                type="checkbox"
                id="chair-confirm"
                checked={chairConfirmCheck}
                onChange={(e) => setChairConfirmCheck(e.target.checked)}
                className="mt-1 accent-purple-700 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="chair-confirm" className="text-[11px] text-purple-900 leading-relaxed cursor-pointer font-medium">
                I solemnly confirm as <strong className="text-purple-800">Rover Advisor ({currentMember.name})</strong> that I am exercising my supreme advisory decree to terminate the incumbent chairperson and appoint a new leadership head.
              </label>
            </div>

            <button
              type="submit"
              disabled={!chairConfirmCheck}
              className={`w-full py-3 rounded-2xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-xs ${
                chairConfirmCheck
                  ? 'bg-purple-700 hover:bg-purple-800 text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>Execute Chairperson Ouster & Appoint Successor</span>
            </button>
          </form>
        )}

        {/* ACTION 2: FULL CREW LEADERSHIP OVERHAUL */}
        {activeAction === 'overhaul_crew' && (
          <form onSubmit={handleExecuteOverhaulCrew} className="space-y-4 relative z-10 text-xs">
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-[#800020] font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-[#800020]" />
                <span>High-Level Advisory Overhaul Warning</span>
              </div>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                Executing a Full Leadership Overhaul will immediately dissolve all assigned Council positions across the entire Rover Crew/Network (Chairperson, Vice Chairperson, Secretary, Treasurer, Coordinators) and reset them to regular Members.
              </p>
            </div>

            {/* Overhaul Reason */}
            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-700" />
                <span>Official Overhaul Decree Reason</span>
              </label>
              <textarea
                rows={2}
                value={overhaulReason}
                onChange={(e) => setOverhaulReason(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600"
                placeholder="State justification for dissolving the crew council leadership..."
              />
            </div>

            {/* Security Checkbox */}
            <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-2xl flex items-start gap-3">
              <input
                type="checkbox"
                id="overhaul-confirm"
                checked={overhaulConfirmCheck}
                onChange={(e) => setOverhaulConfirmCheck(e.target.checked)}
                className="mt-1 accent-purple-700 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="overhaul-confirm" className="text-[11px] text-purple-900 leading-relaxed cursor-pointer font-medium">
                I confirm as <strong className="text-purple-800">Rover Advisor</strong> to dissolve all active council positions and initiate a complete crew leadership reorganization.
              </label>
            </div>

            <button
              type="submit"
              disabled={!overhaulConfirmCheck}
              className={`w-full py-3 rounded-2xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-xs ${
                overhaulConfirmCheck
                  ? 'bg-[#800020] hover:bg-rose-900 text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Dissolve Executive Council & Reset Roles</span>
            </button>
          </form>
        )}

        {/* Modal Footer */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-500 relative z-10">
          <span className="flex items-center gap-1 text-purple-700 font-mono">
            <Crown className="w-3.5 h-3.5 text-purple-700" /> Advisory Directive Protocol
          </span>
          <span>Portal Supreme Council</span>
        </div>
      </div>
    </div>
  );
};
