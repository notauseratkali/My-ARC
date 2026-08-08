import React, { useState, useEffect } from 'react';
import { safeOnAuthStateChanged, safeSignInWithPopup, safeSignOut, type User } from '../lib/firebase';
import { Member } from '../types';
import { Shield, Lock, LogIn, LogOut, CheckCircle2, AlertOctagon, UserCheck, Mail, ArrowRight } from 'lucide-react';

interface FirebaseAuthModalProps {
  members: Member[];
  currentMember: Member;
  onSelectMember: (member: Member) => void;
}

export const FirebaseAuthModal: React.FC<FirebaseAuthModalProps> = ({
  members = [],
  currentMember,
  onSelectMember,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = safeOnAuthStateChanged((user) => {
      setAuthUser(user);
      if (user && user.email) {
        // Validate user email against members roster
        const userEmail = user.email.toLowerCase();
        const matchedMember = members.find(
          (m) => m.email && m.email.toLowerCase() === userEmail
        );

        if (matchedMember) {
          setAuthError(null);
          onSelectMember(matchedMember);
        } else {
          // Access Denied! Unlisted user attempting to sign in.
          safeSignOut();
          setAuthUser(null);
          setAuthError(
            `Access Denied: The Google account (${user.email}) is NOT in the authorized crew roster. Self-registration is strictly disabled — new members must be pre-added by the Crew Leader or Chairperson.`
          );
        }
      }
    });

    return () => unsubscribe();
  }, [members, onSelectMember]);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setAuthError(null);
      await safeSignInWithPopup();
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(err?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await safeSignOut();
    setAuthUser(null);
    setAuthError(null);
  };

  return (
    <div className="relative inline-block text-left">
      {/* Firebase Auth trigger button in header */}
      <button
        type="button"
        id="firebase-auth-btn"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#12151C] border border-emerald-900/60 hover:border-emerald-500/80 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium transition shadow"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <Shield className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden md:inline text-emerald-300 font-semibold">Firebase Auth:</span>
        <span className="font-mono text-slate-200">
          {authUser ? authUser.email : 'Strict Admin Sign-In'}
        </span>
      </button>

      {/* Auth Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-fadeIn text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">Firebase Roster Sign-In</h3>
                  <p className="text-[11px] text-slate-400">Restricted Admin-Control Authentication</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>

            {/* Error / Access Denied Banner */}
            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-400">
                  <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                  <span>REGISTRATION RESTRICTED</span>
                </div>
                <p className="leading-relaxed">{authError}</p>
                <div className="pt-2 border-t border-rose-500/20 text-[10px] text-rose-200">
                  To get access, contact your Crew Leader or Chairperson to add your email address ({authError.match(/\(([^)]+)\)/)?.[1] || 'your email'}) to the official roster in Member Directory.
                </div>
              </div>
            )}

            {/* Current Auth Status */}
            {authUser ? (
              <div className="bg-[#12151C] border border-emerald-800/50 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                    {authUser.displayName ? authUser.displayName.charAt(0) : authUser.email?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-100">{authUser.displayName || 'Scout Member'}</div>
                    <div className="text-[11px] font-mono text-emerald-400">{authUser.email}</div>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-2.5 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Verified Roster Account — Signed in as <strong>{currentMember.name}</strong> ({currentMember.councilRole}).</span>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out of Google Account</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-[#12151C] border border-slate-800 p-4 rounded-xl space-y-2 text-xs text-slate-300">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" /> Policy: Closed Roster Enrollment
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    New users cannot self-register. You can only sign in if your email address was previously added by an authorized Leader in the Crew Member Directory.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSigningIn ? 'Signing In with Google...' : 'Sign In with Google Account'}</span>
                </button>
              </div>
            )}

            {/* Quick Demo Roster Email Helper */}
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">Pre-Registered Roster Emails in System:</span>
              <div className="max-h-24 overflow-y-auto font-mono text-[10px] space-y-0.5 text-slate-400 bg-[#12151C] p-2 rounded-lg border border-slate-800">
                {members.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex justify-between">
                    <span>{m.name}</span>
                    <span className="text-emerald-400">{m.email}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
