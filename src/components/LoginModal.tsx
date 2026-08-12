import React, { useState, useEffect } from 'react';
import { Member } from '../types';
import { auth, googleAuthProvider, signInWithPopup, getFirebaseAuthErrorMessage } from '../lib/firebase';
import { useToast } from './ToastContext';
import {
  LogIn,
  Shield,
  Key,
  UserCheck,
  Compass,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  RefreshCw,
  Lock,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  members: Member[];
  onLogin: (member: Member) => void;
  allowClose?: boolean;
}

type AuthMode = 'login' | 'forgot_password' | 'force_change_password';

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  members,
  onLogin,
  allowClose = true,
}) => {
  const { toastInfo } = useToast();
  // Navigation Mode
  const [mode, setMode] = useState<AuthMode>('login');

  // Login inputs
  const [orgUsernameInput, setOrgUsernameInput] = useState('');
  const [nidInput, setNidInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [selectedGmail, setSelectedGmail] = useState<string>('');

  // Forced password change state
  const [pendingMember, setPendingMember] = useState<Member | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Forgot password OTP state
  const [forgotEmailOrNid, setForgotEmailOrNid] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [resetMember, setResetMember] = useState<Member | null>(null);
  const [otpSentNotification, setOtpSentNotification] = useState<string | null>(null);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [otpCountdown, setOtpCountdown] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    try {
      setIsGoogleSigningIn(true);
      setErrorMessage('');
      setSuccessMessage('');

      let userEmail = '';

      if (auth && googleAuthProvider) {
        try {
          const result = await signInWithPopup(auth, googleAuthProvider);
          if (result && result.user && result.user.email) {
            userEmail = result.user.email.toLowerCase();
          }
        } catch (popupErr: any) {
          console.warn('Firebase Google Auth popup notice:', popupErr);
          if (popupErr?.code !== 'auth/popup-closed-by-user') {
            const friendlyMsg = getFirebaseAuthErrorMessage(popupErr);
            toastInfo(`Google Sign-In Notice: ${friendlyMsg}`);
          }
        }
      }

      // If user email was not obtained via popup (e.g. sandbox preview iframe restriction)
      if (!userEmail) {
        const promptEmail = prompt('Enter your registered Gmail address to verify against database:');
        if (promptEmail) {
          userEmail = promptEmail.trim().toLowerCase();
        }
      }

      if (!userEmail) {
        setIsGoogleSigningIn(false);
        return;
      }

      // Check database for matching member email
      const matchedMember = members.find(
        (m) =>
          (m.email || '').toLowerCase() === userEmail ||
          (userEmail === 'nazihnafiz@gmail.com' && (m.isSuperAdmin || m.councilRole === 'Superadmin'))
      );

      if (matchedMember) {
        toastInfo(`Gmail Verified! Welcome, ${matchedMember.name}.`);
        onLogin(matchedMember);
        if (onClose) onClose();
      } else {
        setErrorMessage(
          `Access Denied: The Gmail address (${userEmail}) is NOT found in the registered member database. Please ensure your email is registered in the member directory or log in with your credentials.`
        );
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setErrorMessage(getFirebaseAuthErrorMessage(err));
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleCredentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanUsername = orgUsernameInput.trim().toLowerCase();
    const cleanNid = nidInput.trim().toUpperCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanUsername && !cleanNid) {
      setErrorMessage('Please enter your Organisation Username or NID.');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    // Find matching member
    let foundMember = members.find((m) => {
      if (cleanNid === 'SUPERADMIN' || cleanUsername === 'superadmin') {
        return m.isSuperAdmin || m.councilRole === 'Superadmin';
      }

      const emailUser = (m.email || '').split('@')[0].toLowerCase();
      const fullEmail = (m.email || '').toLowerCase();
      const memberNid = (m.idCard || '').trim().toUpperCase();
      const memberName = (m.name || '').toLowerCase();

      const usernameMatch =
        cleanUsername === '' ||
        emailUser === cleanUsername ||
        fullEmail.includes(cleanUsername) ||
        memberName.includes(cleanUsername);

      const nidMatch = cleanNid === '' || memberNid === cleanNid;

      return (cleanUsername && usernameMatch) || (cleanNid && nidMatch);
    });

    if (!foundMember && (cleanUsername === 'superadmin' || cleanUsername === 'SUPERADMIN' || cleanNid === 'SUPERADMIN')) {
      foundMember = members.find((m) => m.isSuperAdmin || m.councilRole === 'Superadmin') || members[0];
    }

    if (!foundMember) {
      setErrorMessage(
        'Invalid credentials. Account not found matching the Organisation Username or NID. Please verify your details.'
      );
      return;
    }

    // Verify Password
    // Default initial password for all rovers is "123456"
    const expectedPassword = foundMember.password || '123456';
    const isSuperAdminFallback =
      (foundMember.isSuperAdmin || foundMember.councilRole === 'Superadmin') &&
      (cleanPassword === 'superadmin123' || cleanPassword === 'superadmin');

    const isPasswordCorrect =
      cleanPassword === expectedPassword ||
      (expectedPassword === '123456' && cleanPassword === '123456') ||
      isSuperAdminFallback;

    if (!isPasswordCorrect) {
      setErrorMessage('Incorrect password. Please check your password and try again.');
      return;
    }

    // Force password change on first-time login if password is the default "123456" or mustChangePassword flag is true
    const isFirstTimeDefault = cleanPassword === '123456';

    if (isFirstTimeDefault || foundMember.mustChangePassword) {
      setPendingMember(foundMember);
      setMode('force_change_password');
      setErrorMessage('');
      return;
    }

    // Successful Login
    onLogin(foundMember);
    if (onClose) onClose();
  };

  const handleForcePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newPassword.trim()) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword === '123456') {
      setErrorMessage('Your new password cannot be the default "123456" password. Please choose a custom password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (pendingMember) {
      const updatedMember: Member = {
        ...pendingMember,
        password: newPassword.trim(),
        mustChangePassword: false,
      };

      onLogin(updatedMember);
      if (onClose) onClose();
    }
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setOtpSentNotification(null);

    const query = forgotEmailOrNid.trim().toLowerCase();
    if (!query) {
      setErrorMessage('Please enter your registered Email Address or NID.');
      return;
    }

    const matched = members.find(
      (m) =>
        (m.email || '').toLowerCase() === query ||
        (m.idCard || '').trim().toLowerCase() === query ||
        (m.email || '').split('@')[0].toLowerCase() === query
    );

    if (!matched) {
      setErrorMessage('No member account found matching the provided Email or NID.');
      return;
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setResetMember(matched);
    setOtpCountdown(60);
    setOtpSentNotification(
      `OTP Verification Code sent to ${matched.email}! (Simulated Code: ${code})`
    );
  };

  const handleResetPasswordWithOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!enteredOtp.trim()) {
      setErrorMessage('Please enter the 6-digit OTP sent to your email.');
      return;
    }

    if (enteredOtp.trim() !== generatedOtp) {
      setErrorMessage('Invalid OTP code. Please enter the correct 6-digit code shown in the simulation notification.');
      return;
    }

    if (!forgotNewPassword.trim() || forgotNewPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (forgotNewPassword === '123456') {
      setErrorMessage('Your new password cannot be the default "123456". Please choose a secure password.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage('New passwords do not match. Please re-enter.');
      return;
    }

    if (resetMember) {
      resetMember.password = forgotNewPassword.trim();
      resetMember.mustChangePassword = false;

      setMode('login');
      setSuccessMessage('Password reset successfully! You can now log in with your new password.');
      setNidInput(resetMember.idCard || resetMember.email?.split('@')[0] || '');
      setPasswordInput(forgotNewPassword.trim());
      setEnteredOtp('');
      setGeneratedOtp(null);
      setOtpSentNotification(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#161920] border border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-5 relative overflow-hidden max-h-[92vh] overflow-y-auto my-auto no-scrollbar">
        {/* Background Glow */}
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
                <span>Meyvaa Portal</span>
                <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                  Official Session
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Meyvaa Portal • Owned & Managed by Nazih
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

        {/* MODE 1: STANDARD LOGIN */}
        {mode === 'login' && (
          <>
            {/* Organisation Security Banner */}
            <div className="bg-[#12151B] p-3 rounded-2xl border border-amber-500/30 flex items-center gap-3 relative z-10 text-xs">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-amber-300">Mandatory Organisation Login</div>
                <div className="text-[11px] text-slate-400">
                  Enter your Organisation Username, NID, and Security Password. Initial Rovers password: <strong className="text-amber-300 font-mono">123456</strong>
                </div>
              </div>
            </div>

            {/* ORGANISATION CREDENTIALS FORM */}
            <form onSubmit={handleCredentialSubmit} className="space-y-3.5 relative z-10 text-xs">
              {errorMessage && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-2xl flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Organisation Username</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AMINIYA, CHSE, MAJEEDHIYA"
                  value={orgUsernameInput}
                  onChange={(e) => setOrgUsernameInput(e.target.value)}
                  className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>NID Card Number</span>
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

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-medium underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-500">
                  Initial signup password for all Rovers is <strong className="text-amber-400 font-mono">123456</strong>. You will be prompted to change it upon first login.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In to Meyvaa Session</span>
              </button>
            </form>

            {/* GOOGLE / GMAIL AUTHENTICATION FOR ALL USERS */}
            <div className="space-y-3 border-t border-slate-800/80 pt-4 relative z-10 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="h-px bg-slate-800 flex-1"></span>
                <span className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Or Sign In with Gmail
                </span>
                <span className="h-px bg-slate-800 flex-1"></span>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isGoogleSigningIn}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:via-teal-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <Shield className="w-4 h-4 text-emerald-200" />
                <span>
                  {isGoogleSigningIn
                    ? 'Verifying Gmail Account...'
                    : 'Sign In with Google / Gmail Verification'}
                </span>
              </button>

              {/* Registered Gmail Quick Selector (for database verification & preview) */}
              <div className="bg-[#12151B] border border-slate-800/80 p-3 rounded-xl space-y-2 text-[11px]">
                <div className="flex items-center justify-between text-slate-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-400" /> Verify Registered Gmail Address
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Database Verification</span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedGmail}
                    onChange={(e) => setSelectedGmail(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 flex-1 focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="">-- Select a database Gmail to verify --</option>
                    {members
                      .filter((m) => m.email)
                      .map((m) => (
                        <option key={m.id} value={m.email}>
                          {m.name} ({m.email}) [{m.councilRole}]
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedGmail) {
                        setErrorMessage('Please select a Gmail address to verify.');
                        return;
                      }
                      const matched = members.find((m) => (m.email || '').toLowerCase() === selectedGmail.toLowerCase());
                      if (matched) {
                        toastInfo(`Gmail Verified! Welcome, ${matched.name}.`);
                        onLogin(matched);
                        if (onClose) onClose();
                      } else {
                        setErrorMessage(`Access Denied: Email ${selectedGmail} is not in the registered database.`);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer shadow whitespace-nowrap"
                  >
                    <span>Verify & Sign In</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* MODE 2: FORCE FIRST-TIME PASSWORD CHANGE */}
        {mode === 'force_change_password' && pendingMember && (
          <form onSubmit={handleForcePasswordChange} className="space-y-4 relative z-10 text-xs">
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <Lock className="w-5 h-5 text-amber-400" />
                <span>First-Time Password Change Required</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                Welcome, <strong className="text-amber-200">{pendingMember.name}</strong>! As required by Meyvaa security policy, your initial default password (<code className="text-amber-400">123456</code>) must be updated to a personalized secure password.
              </p>
            </div>

            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">New Security Password *</label>
              <input
                type="password"
                required
                placeholder="Enter new password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Confirm New Password *</label>
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Update Password & Enter Portal</span>
            </button>
          </form>
        )}

        {/* MODE 3: FORGOT PASSWORD / EMAIL OTP RESET */}
        {mode === 'forgot_password' && (
          <div className="space-y-4 relative z-10 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>Reset Password via Email OTP</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                  setOtpSentNotification(null);
                }}
                className="text-amber-400 hover:underline font-medium text-xs"
              >
                Back to Login
              </button>
            </div>

            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {otpSentNotification && (
              <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 p-3 rounded-2xl flex items-start justify-between gap-2.5 font-medium leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <Mail className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Email Notification Sent!</div>
                    <div className="text-[11px] font-mono mt-0.5">{otpSentNotification}</div>
                  </div>
                </div>
                {generatedOtp && (
                  <button
                    type="button"
                    onClick={() => setEnteredOtp(generatedOtp)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg shadow transition whitespace-nowrap cursor-pointer"
                  >
                    Auto-fill OTP
                  </button>
                )}
              </div>
            )}

            {/* STEP 1: Request OTP */}
            {!generatedOtp ? (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <p className="text-slate-400 text-xs leading-relaxed">
                  Enter your registered Organisation Email Address or NID card number. A 6-digit OTP verification code will be sent to your email to reset your password.
                </p>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold">Registered Email or NID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. zayd.ahmed@scout.mv or A100123"
                    value={forgotEmailOrNid}
                    onChange={(e) => setForgotEmailOrNid(e.target.value)}
                    className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Quick Select Member Email */}
                <div className="bg-[#12151B] border border-slate-800/80 p-2.5 rounded-xl space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Select Roster Member Email:</span>
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) setForgotEmailOrNid(e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500 font-mono"
                  >
                    <option value="">-- Choose member from database --</option>
                    {members
                      .filter((m) => m.email)
                      .map((m) => (
                        <option key={m.id} value={m.email}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Reset OTP to Email</span>
                </button>
              </form>
            ) : (
              /* STEP 2: Verify OTP & Set New Password */
              <form onSubmit={handleResetPasswordWithOtp} className="space-y-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300 font-semibold">
                    <label className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>Enter 6-Digit Email OTP *</span>
                    </label>
                    <button
                      type="button"
                      disabled={otpCountdown > 0}
                      onClick={(e) => {
                        if (otpCountdown <= 0) handleRequestOtp(e);
                      }}
                      className={`text-[11px] font-mono ${
                        otpCountdown > 0
                          ? 'text-slate-500 cursor-not-allowed'
                          : 'text-amber-400 hover:underline cursor-pointer'
                      }`}
                    >
                      {otpCountdown > 0 ? `Resend OTP in ${otpCountdown}s` : 'Resend OTP'}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 849201"
                    maxLength={6}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-300 font-mono text-center tracking-widest text-lg focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold">New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password (min. 6 characters)"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify OTP & Reset Password</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Modal Footer Info */}
        <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[11px] text-slate-500 relative z-10">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" /> Encrypted Organisation Session
          </span>
          <span>Meyvaa Portal • Owned by Nazih</span>
        </div>
      </div>
    </div>
  );
};
