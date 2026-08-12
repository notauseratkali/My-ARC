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
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-[#161920] border border-rose-500/40 rounded-3xl max-w-md w-full p-6 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-100">Access Restricted</h3>
          <p className="text-xs text-slate-400">
            Emergency Chairperson Replacement and Crew Overhaul protocols are restricted strictly to the <strong className="text-purple-300">Rover Advisor</strong> supreme role.
          </p>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold"
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
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#161920] border-2 border-purple-500/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-purple-100 shadow-lg shadow-purple-950/60 border border-purple-400/30">
              <Crown className="w-7 h-7 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif text-slate-100">
                  Rover Advisor Executive Mandate
                </h2>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                  Supreme Override Protocol
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Restricted to Rover Advisor • Ouster of Chairperson & Crew Overhaul Authority
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl flex items-start gap-3 text-xs relative z-10 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-emerald-200 mb-0.5">Advisory Action Successful</p>
              <p className="leading-relaxed">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Action Toggle Tabs */}
        <div className="bg-[#12151B] p-1.5 rounded-2xl border border-slate-800 flex items-center gap-2 relative z-10 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveAction('replace_chair');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
              activeAction === 'replace_chair'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserX className="w-4 h-4 text-purple-400" />
            <span>Oust / Replace Chairperson</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveAction('overhaul_crew');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
              activeAction === 'overhaul_crew'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-purple-400" />
            <span>Full Leadership Overhaul</span>
          </button>
        </div>

        {/* ACTION 1: OUST / REPLACE CHAIRPERSON */}
        {activeAction === 'replace_chair' && (
          <form onSubmit={handleExecuteReplaceChairperson} className="space-y-4 relative z-10 text-xs">
            {/* Current Chairperson Card */}
            <div className="bg-[#12151B] border border-amber-500/30 p-3.5 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold overflow-hidden">
                  {currentChairperson?.avatar ? (
                    <img src={currentChairperson.avatar} alt={currentChairperson.name} className="w-full h-full object-cover" />
                  ) : (
                    currentChairperson?.name.charAt(0) || '?'
                  )}
                </div>
                <div>
                  <div className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider">
                    Incumbent Chairperson
                  </div>
                  <div className="text-sm font-bold text-slate-100">{currentChairperson?.name || 'No Active Chairperson'}</div>
                  <div className="text-[10px] text-slate-400">
                    ID: <span className="font-mono text-slate-300">{currentChairperson?.idCard || 'N/A'}</span> • {currentChairperson?.crewName}
                  </div>
                </div>
              </div>

              <span className="bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2.5 py-1 rounded-xl">
                Target for Ouster
              </span>
            </div>

            {/* Select New Chairperson */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Appoint New Replacement Chairperson</span>
              </label>
              <select
                value={selectedNewChairId}
                onChange={(e) => setSelectedNewChairId(e.target.value)}
                className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
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
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Reassign Incumbent Chairperson To</span>
              </label>
              <select
                value={demoteCurrentChairRole}
                onChange={(e) => setDemoteCurrentChairRole(e.target.value)}
                className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="Member">General Member (Standard Member Access)</option>
                <option value="Vice Chairperson">Vice Chairperson</option>
                <option value="Secretary">Secretary</option>
              </select>
            </div>

            {/* Termination Reason */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Official Advisory Termination / Replacement Reason</span>
              </label>
              <textarea
                rows={2}
                value={terminationReason}
                onChange={(e) => setTerminationReason(e.target.value)}
                className="w-full bg-[#12151B] border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                placeholder="State reason for replacing the chairperson..."
              />
            </div>

            {/* High Security Checkbox */}
            <div className="bg-purple-950/30 border border-purple-500/30 p-3.5 rounded-2xl flex items-start gap-3">
              <input
                type="checkbox"
                id="chair-confirm"
                checked={chairConfirmCheck}
                onChange={(e) => setChairConfirmCheck(e.target.checked)}
                className="mt-1 accent-purple-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="chair-confirm" className="text-[11px] text-purple-200 leading-relaxed cursor-pointer font-medium">
                I solemnly confirm as <strong className="text-purple-300">Rover Advisor ({currentMember.name})</strong> that I am exercising my supreme advisory decree to terminate the incumbent chairperson and appoint a new leadership head.
              </label>
            </div>

            <button
              type="submit"
              disabled={!chairConfirmCheck}
              className={`w-full py-3 rounded-2xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-lg ${
                chairConfirmCheck
                  ? 'bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
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
            <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>High-Level Advisory Overhaul Warning</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Executing a Full Leadership Overhaul will immediately dissolve all assigned Council positions across the entire Rover Crew/Network (Chairperson, Vice Chairperson, Secretary, Treasurer, Coordinators) and reset them to regular Members.
              </p>
            </div>

            {/* Overhaul Reason */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Official Overhaul Decree Reason</span>
              </label>
              <textarea
                rows={2}
                value={overhaulReason}
                onChange={(e) => setOverhaulReason(e.target.value)}
                className="w-full bg-[#12151B] border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                placeholder="State justification for dissolving the crew council leadership..."
              />
            </div>

            {/* Security Checkbox */}
            <div className="bg-purple-950/30 border border-purple-500/30 p-3.5 rounded-2xl flex items-start gap-3">
              <input
                type="checkbox"
                id="overhaul-confirm"
                checked={overhaulConfirmCheck}
                onChange={(e) => setOverhaulConfirmCheck(e.target.checked)}
                className="mt-1 accent-purple-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="overhaul-confirm" className="text-[11px] text-purple-200 leading-relaxed cursor-pointer font-medium">
                I confirm as <strong className="text-purple-300">Rover Advisor</strong> to dissolve all active council positions and initiate a complete crew leadership reorganization.
              </label>
            </div>

            <button
              type="submit"
              disabled={!overhaulConfirmCheck}
              className={`w-full py-3 rounded-2xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-lg ${
                overhaulConfirmCheck
                  ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Dissolve Executive Council & Reset Roles</span>
            </button>
          </form>
        )}

        {/* Modal Footer */}
        <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[11px] text-slate-500 relative z-10">
          <span className="flex items-center gap-1 text-purple-300 font-mono">
            <Crown className="w-3.5 h-3.5 text-purple-400" /> Advisory Directive Protocol
          </span>
          <span>Meyvaa Portal Supreme Council</span>
        </div>
      </div>
    </div>
  );
};
