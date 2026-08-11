import React, { useEffect } from 'react';
import { Member } from '../types';
import { ShieldAlert, LogIn, Lock } from 'lucide-react';

interface RequireAuthProps {
  currentMemberId: string | null;
  members: Member[];
  onRedirectToLogin: () => void;
  children: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({
  currentMemberId,
  members,
  onRedirectToLogin,
  children,
}) => {
  // Verify currentMemberId against the Firestore members collection
  const verifiedMember = React.useMemo(() => {
    if (!currentMemberId) return null;
    return members.find((m) => m.id === currentMemberId) || null;
  }, [currentMemberId, members]);

  const isAuthenticated = Boolean(currentMemberId && verifiedMember);

  useEffect(() => {
    if (!isAuthenticated) {
      onRedirectToLogin();
    }
  }, [isAuthenticated, onRedirectToLogin]);

  if (!isAuthenticated) {
    return (
      <div className="bg-[#1A1E26] border border-amber-500/20 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto my-12 shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-100 flex items-center justify-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            Authentication & Verification Required
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
            You must be logged in as a verified member in the Firestore database to view and interact with protected Rover Portal modules.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={onRedirectToLogin}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition cursor-pointer shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 mx-auto"
          >
            <LogIn className="w-4 h-4" />
            <span>Open Login Portal</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
