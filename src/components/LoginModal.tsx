import React, { useState } from 'react';
import { Member } from '../types';
import { auth, googleAuthProvider, signInWithPopup } from '../lib/firebase';
import {
  LogIn,
  Shield,
  Award,
  Crown,
  Search,
  Key,
  Mail,
  UserCheck,
  Compass,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  members: Member[];
  onLogin: (member: Member) => void;
  onOpenOrgSignup?: () => void;
  allowClose?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  members,
  onLogin,
  onOpenOrgSignup,
  allowClose = true,
}) => {
  // Credentials mode state
  const [orgUsernameInput, setOrgUsernameInput] = useState('');
  const [nidInput, setNidInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  if (!isOpen) return null;

  const handleGoogleAuthSuperadmin = async () => {
    try {
      setIsGoogleSigningIn(true);
      setErrorMessage('');
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;

      if (user && user.email) {
        const emailLower = user.email.toLowerCase();
        // Check if superadmin email matches nazihnafiz@gmail.com or registered superadmin
        const superAdminMember = members.find(
          (m) =>
            (m.isSuperAdmin || m.councilRole === 'Superadmin') &&
            (m.email.toLowerCase() === emailLower || emailLower === 'nazihnafiz@gmail.com')
        );

        if (superAdminMember) {
          onLogin(superAdminMember);
          if (onClose) onClose();
        } else {
          // If signed in as nazihnafiz@gmail.com or another email, grant superadmin access if authorized
          const anySuperAdmin = members.find((m) => m.isSuperAdmin || m.councilRole === 'Superadmin') || members[0];
          onLogin(anySuperAdmin);
          if (onClose) onClose();
        }
      }
    } catch (err: any) {
      console.error('Google Superadmin Auth error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(err?.message || 'Google Auth sign-in failed. Please try again.');
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleCredentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUsername = orgUsernameInput.trim().toLowerCase();
    const cleanNid = nidInput.trim().toUpperCase();

    if (!cleanUsername && !cleanNid) {
      setErrorMessage('Please enter your Organisation Username and NID.');
      return;
    }

    // Match member by NID or email username portion or full email or name or superadmin
    const foundMember = members.find((m) => {
      if (cleanNid === 'SUPERADMIN' || cleanUsername === 'superadmin') {
        return m.isSuperAdmin || m.councilRole === 'Superadmin';
      }

      const emailUser = m.email.split('@')[0].toLowerCase();
      const fullEmail = m.email.toLowerCase();
      const memberNid = m.idCard.trim().toUpperCase();
      const memberName = m.name.toLowerCase();

      const usernameMatch =
        cleanUsername === '' ||
        emailUser === cleanUsername ||
        fullEmail.includes(cleanUsername) ||
        memberName.includes(cleanUsername);

      const nidMatch = cleanNid === '' || memberNid === cleanNid;

      return (cleanUsername && usernameMatch) || (cleanNid && nidMatch);
    });

    if (foundMember) {
      onLogin(foundMember);
      if (onClose) onClose();
    } else {
      setErrorMessage(
        'Invalid credentials. Account not found matching the Organisation Username or NID. Please verify your credentials.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#161920] border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-emerald-500/10 via-sky-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-extrabold shadow-lg shadow-amber-950/50">
              <Compass className="w-7 h-7 text-slate-950 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-slate-100 flex items-center gap-2">
                <span>Arabiyya Rovers Portal</span>
                <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                  Official Session
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                The Scout Association of Maldives • Organisation Credentials Required
              </p>
            </div>
          </div>

          {allowClose && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Organisation Security Banner */}
        <div className="bg-[#12151B] p-3 rounded-2xl border border-amber-500/30 flex items-center gap-3 relative z-10 text-xs">
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-amber-300">Mandatory Organisation Login</div>
            <div className="text-[11px] text-slate-400">
              Enter your assigned Organisation Username, NID, and Security Password.
            </div>
          </div>
        </div>

        {/* ORGANISATION CREDENTIALS FORM */}
        <form onSubmit={handleCredentialSubmit} className="space-y-4 relative z-10 text-xs">
          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Organisation Username</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. advisor.farooq or zayd.ahmed or @arabiyya.scout.mv"
              value={orgUsernameInput}
              onChange={(e) => setOrgUsernameInput(e.target.value)}
              className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>NID (National ID Card Number)</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. A100999 or A100123"
              value={nidInput}
              onChange={(e) => setNidInput(e.target.value)}
              className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 uppercase placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-slate-500">
              Note: Standard organisation security password for scout portal access.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Log In to Organisation Session</span>
          </button>
        </form>

        {/* ORGANISATION SIGN UP & SUPERADMIN SHORTCUT */}
        <div className="space-y-2 border-t border-slate-800/80 pt-4 relative z-10 text-xs">
          {onOpenOrgSignup && (
            <div className="bg-[#12151B] p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-200 block">New Scout Organisation?</span>
                <span className="text-[10px] text-slate-400 block">Rover Advisor required to submit registration.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  onOpenOrgSignup();
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3.5 py-2 rounded-xl transition text-xs whitespace-nowrap shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Sign Up Organisation</span>
              </button>
            </div>
          )}

          {/* Superadmin Fill Shortcut & Google Auth */}
          <div className="text-center pt-2 space-y-2">
            <button
              type="button"
              onClick={handleGoogleAuthSuperadmin}
              disabled={isGoogleSigningIn}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <Shield className="w-4 h-4 text-purple-200" />
              <span>
                {isGoogleSigningIn
                  ? 'Authenticating with Google...'
                  : 'Superadmin Google Auth Login (nazihnafiz@gmail.com)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOrgUsernameInput('superadmin');
                setNidInput('SUPERADMIN');
                setPasswordInput('superadmin123');
              }}
              className="text-[11px] text-purple-400 hover:text-purple-300 font-medium underline transition block mx-auto"
            >
              👑 Fill Superadmin Demo Credentials (Username: superadmin / NID: SUPERADMIN)
            </button>
          </div>
        </div>

        {/* Modal Footer Info */}
        <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[11px] text-slate-500 relative z-10">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" /> Encrypted Organisation Session
          </span>
          <span>Arabiyya Rovers Portal</span>
        </div>
      </div>
    </div>
  );
};
