import React from 'react';
import { Member } from '../types';
import { Shield, ChevronDown, LogOut, Crown, LogIn, Trash2 } from 'lucide-react';

interface UserSwitcherProps {
  currentMember: Member | null;
  allMembers?: Member[];
  onSelectMember?: (member: Member) => void;
  onLogout?: () => void;
  onOpenLoginModal?: () => void;
  onClearLocalData?: () => void;
}

export const UserSwitcher: React.FC<UserSwitcherProps> = ({
  currentMember,
  onLogout,
  onOpenLoginModal,
  onClearLocalData,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!currentMember) {
    return (
      <button
        type="button"
        onClick={onOpenLoginModal}
        className="bg-[#800000] hover:bg-[#6b0000] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer !text-white"
      >
        <LogIn className="w-4 h-4 text-white" />
        <span>Log In</span>
      </button>
    );
  }

  const isSuperAdmin = currentMember.isSuperAdmin || currentMember.councilRole === 'Superadmin';
  const isAdvisor = currentMember.councilRole === 'Rover Advisor' && !isSuperAdmin;

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        id="user-profile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 border border-[#FF9999] hover:border-[#800000] bg-[#FFF0F0] text-[#800000] px-3 py-1.5 rounded-xl text-xs font-medium transition shadow-xs cursor-pointer"
      >
        <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0 bg-[#800000] text-white ring-1 ring-[#FF9999]">
          {currentMember.avatar ? (
            <img src={currentMember.avatar} alt={currentMember.name} className="w-full h-full object-cover" />
          ) : (
            currentMember.name.charAt(0)
          )}
        </div>

        <div className="text-left hidden sm:block">
          <div className="leading-tight font-semibold flex items-center gap-1.5 text-slate-900">
            <span className="truncate max-w-[130px] font-bold text-[#800000]">{currentMember.name}</span>
            <span
              className="text-[10px] px-1.5 py-0.2 rounded font-mono border flex items-center gap-0.5 bg-[#FFF0F0] text-[#800000] border-[#FF9999] font-bold"
            >
              {(isSuperAdmin || isAdvisor) && <Crown className="w-2.5 h-2.5 text-[#800000]" />}
              {isSuperAdmin ? 'Superadmin' : currentMember.councilRole}
            </span>
          </div>
          <div className="text-[10px] text-slate-600 truncate max-w-[180px]">
            {isSuperAdmin ? 'Portal Administration' : `${currentMember.section} • ${currentMember.crewName}`}
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#800000] ml-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/10 backdrop-blur-2xs" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-white border border-[#FF9999] rounded-2xl shadow-xl z-50 py-2 text-slate-800 text-xs divide-y divide-[#FFD0D0] overflow-hidden">
            <div className="p-3.5 bg-[#FFF0F0] space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#800000] flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#800000]" /> Active Authenticated Session
                </p>
                <span className="bg-white text-[#800000] border border-[#FF9999] text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                  Session Active
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0 border bg-[#800000] border-[#FF9999] text-white">
                  {currentMember.avatar ? (
                    <img src={currentMember.avatar} alt={currentMember.name} className="w-full h-full object-cover" />
                  ) : (
                    currentMember.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#800000] text-sm truncate">{currentMember.name}</p>
                  <p className="text-[10px] text-slate-600 font-mono">
                    NID / ID: <span className="text-[#800000] font-semibold">{currentMember.idCard}</span>
                  </p>
                  <p className="text-[10px] text-slate-600 truncate">{currentMember.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-1">
                <div className="bg-white p-2 rounded-lg border border-[#FF9999] shadow-2xs">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">System Authority</span>
                  <span className="font-semibold text-[#800000]">
                    {isSuperAdmin ? 'Superadmin' : currentMember.councilRole}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-[#FF9999] shadow-2xs">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Scope</span>
                  <span className="text-slate-800 font-semibold truncate block">
                    {isSuperAdmin ? 'Global Portal Admin' : currentMember.crewName}
                  </span>
                </div>
              </div>
            </div>

            {/* Session Security Notice */}
            <div className="px-3.5 py-2.5 bg-white border-t border-b border-[#FFD0D0] text-[11px] text-slate-700 leading-relaxed">
              <p className="font-semibold text-[#800000] flex items-center gap-1 mb-0.5">
                <Shield className="w-3 h-3 text-[#800000]" />
                <span>Single User ID Policy</span>
              </p>
              <p className="text-[10px] text-slate-600">
                You are strictly authenticated as <strong className="text-slate-800">{currentMember.idCard}</strong>. To access another user&apos;s account, you must log out first.
              </p>
            </div>

            {/* Logout Action Bar */}
            <div className="p-2.5 bg-[#FFF0F0] space-y-1.5">
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onLogout();
                  }}
                  className="w-full text-center px-3 py-2 rounded-xl bg-[#800000] hover:bg-[#6b0000] text-white font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer text-xs !text-white"
                >
                  <LogOut className="w-4 h-4 text-white" />
                  <span>Log Out to Switch Account ID</span>
                </button>
              )}

              {onClearLocalData && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onClearLocalData();
                  }}
                  className="w-full text-center px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFE5E5] text-[#800000] font-semibold transition flex items-center justify-center gap-2 border border-[#FF9999] text-[11px] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#800000]" />
                  <span>Clear Local Storage & Session</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
