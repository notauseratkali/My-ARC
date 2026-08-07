import React from 'react';
import { Member } from '../types';
import { UserCheck, Shield, ChevronDown, LogOut, Crown, LogIn } from 'lucide-react';

interface UserSwitcherProps {
  currentMember: Member | null;
  allMembers?: Member[];
  onSelectMember?: (member: Member) => void;
  onLogout?: () => void;
  onOpenLoginModal?: () => void;
}

export const UserSwitcher: React.FC<UserSwitcherProps> = ({
  currentMember,
  allMembers = [],
  onSelectMember = (_m: Member) => {},
  onLogout,
  onOpenLoginModal,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!currentMember) {
    return (
      <button
        type="button"
        onClick={onOpenLoginModal}
        className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
      >
        <LogIn className="w-4 h-4" />
        <span>Log In</span>
      </button>
    );
  }

  const isAdvisor = currentMember.councilRole === 'Rover Advisor';

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        id="user-switcher-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 border hover:border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium transition shadow-sm ${
          isAdvisor
            ? 'bg-purple-950/60 border-purple-500/40'
            : 'bg-[#1A1E26] border-slate-800'
        }`}
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0 ${
          isAdvisor ? 'bg-purple-700 text-purple-100 ring-1 ring-purple-400' : 'bg-emerald-600 text-white'
        }`}>
          {currentMember.avatar ? (
            <img src={currentMember.avatar} alt={currentMember.name} className="w-full h-full object-cover" />
          ) : (
            currentMember.name.charAt(0)
          )}
        </div>

        <div className="text-left hidden sm:block">
          <div className="leading-tight font-semibold flex items-center gap-1.5">
            <span>{currentMember.name}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono border flex items-center gap-0.5 ${
                isAdvisor
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              {isAdvisor && <Crown className="w-2.5 h-2.5 text-purple-300" />}
              {currentMember.councilRole}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            {currentMember.section} • {currentMember.crewName}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-[#1A1E26] border border-slate-800 rounded-2xl shadow-2xl z-50 py-2 text-slate-100 text-xs divide-y divide-slate-800 overflow-hidden">
            <div className="p-3.5 bg-[#161920] space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-400" /> Active Authenticated Session
                </p>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                  Session Active
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0 border ${
                  isAdvisor ? 'bg-purple-900 border-purple-400 text-purple-200' : 'bg-emerald-800 border-emerald-500 text-emerald-100'
                }`}>
                  {currentMember.avatar ? (
                    <img src={currentMember.avatar} alt={currentMember.name} className="w-full h-full object-cover" />
                  ) : (
                    currentMember.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-100 text-sm truncate">{currentMember.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    NID / ID: <span className="text-amber-300 font-semibold">{currentMember.idCard}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{currentMember.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-1">
                <div className="bg-[#12151B] p-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Council Role</span>
                  <span className={`font-semibold ${isAdvisor ? 'text-purple-300' : 'text-emerald-400'}`}>
                    {currentMember.councilRole}
                  </span>
                </div>
                <div className="bg-[#12151B] p-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Crew Unit</span>
                  <span className="text-slate-200 font-semibold truncate block">{currentMember.crewName}</span>
                </div>
              </div>
            </div>

            {/* Session Security Notice */}
            <div className="px-3.5 py-2.5 bg-amber-950/20 border-t border-b border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
              <p className="font-semibold text-amber-300 flex items-center gap-1 mb-0.5">
                <Shield className="w-3 h-3 text-amber-400" />
                <span>Single User ID Policy</span>
              </p>
              <p className="text-[10px] text-slate-400">
                You are strictly authenticated as <strong className="text-slate-200">{currentMember.idCard}</strong>. To access another user's account, you must log out first.
              </p>
            </div>

            {/* Logout Action Bar */}
            {onLogout && (
              <div className="p-2 bg-[#12151B]">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onLogout();
                  }}
                  className="w-full text-center px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition flex items-center justify-center gap-2 shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out to Switch Account ID</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
