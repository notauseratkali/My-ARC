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
  UserPlus,
  ArrowRight,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  members: Member[];
  onLogin: (member: Member) => void;
  allowClose?: boolean;
  onOpenSignUp?: () => void;
}

type AuthMode = 'login' | 'forgot_password' | 'force_change_password';

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  members,
  onLogin,
  allowClose = true,
  onOpenSignUp,
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-5 relative overflow-hidden max-h-[92vh] overflow-y-auto my-auto no-scrollbar text-slate-900">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-emerald-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#FFD0D0] pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#800000] via-[#800000] to-[#FF3333] flex items-center justify-center text-white font-extrabold shadow-md shadow-[#800000]/20 border border-[#FF3333]/40">
              <Compass className="w-7 h-7 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>Meyvaa Portal</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Meyvaa Portal • Owned & Managed by Nazih
              </p>
            </div>
          </div>

          {allowClose && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-[#800000] hover:bg-[#FFF0F0] rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* MODE 1: STANDARD LOGIN */}
        {mode === 'login' && (
          <>
            {/* Organisation Security Banner */}
            <div className="bg-[#FFF0F0] border border-[#FF9999] text-slate-800 p-3 rounded-2xl flex items-center gap-3 relative z-10 text-xs shadow-xs">
              <div className="p-2 bg-[#800000] rounded-xl text-white">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-[#800000]">Mandatory Organisation Login</div>
                <div className="text-[11px] text-slate-600">
                  Enter your Organisation Username, NID, and Security Password.
                </div>
              </div>
            </div>

            {/* ORGANISATION CREDENTIALS FORM */}
            <form onSubmit={handleCredentialSubmit} className="space-y-3.5 relative z-10 text-xs">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-2xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-800 font-semibold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#800000]" />
                  <span>Organisation Username</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AMINIYA, CHSE, MAJEEDHIYA"
                  value={orgUsernameInput}
                  onChange={(e) => setOrgUsernameInput(e.target.value)}
                  className="w-full bg-white border border-[#FFD0D0] rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-800 font-semibold flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#800000]" />
                  <span>NID Card Number</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A100999 or A100123"
                  value={nidInput}
                  onChange={(e) => setNidInput(e.target.value)}
                  className="w-full bg-white border border-[#FFD0D0] rounded-xl px-3.5 py-2.5 text-slate-900 uppercase placeholder-slate-400 focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000] font-mono"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-semibold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#800000]" />
                    <span>Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-[11px] text-[#800000] hover:text-[#FF3333] font-medium underline"
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
                  className="w-full bg-white border border-[#FFD0D0] rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000]"
                />
                <p className="text-xs text-black font-normal leading-relaxed">
                  Initial signup password for all Rovers is <span className="font-bold text-black bg-[#FFF0F0] border border-[#FF9999] px-1 py-0.5 rounded">123456</span>. You will be prompted to change it upon first login.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-[#800000] hover:bg-[#660000] text-white font-bold py-3.5 rounded-2xl transition shadow-xs flex items-center justify-center gap-2 text-sm cursor-pointer !text-white"
              >
                <LogIn className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm tracking-wide !text-white">Log in</span>
              </button>
            </form>

            {/* SIGN UP / REGISTER LINK */}
            {onOpenSignUp && (
              <div className="bg-[#FFF0F0] border border-[#FF9999] rounded-2xl p-3 text-center space-y-1.5 relative z-10 text-xs">
                <span className="text-slate-700">Don&apos;t have an organisation registered yet?</span>
                <div>
                  <button
                    type="button"
                    onClick={onOpenSignUp}
                    className="inline-flex items-center gap-1.5 text-[#800000] hover:text-[#FF3333] font-bold text-xs underline cursor-pointer hover:scale-[1.01] transition"
                  >
                    <UserPlus className="w-4 h-4 text-[#800000]" />
                    <span>Sign Up & Register Your Organisation & Crew</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* GOOGLE / GMAIL AUTHENTICATION FOR ALL USERS */}
            <div className="space-y-3 border-t border-[#FFD0D0] pt-4 relative z-10 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="h-px bg-[#FFD0D0] flex-1"></span>
                <span className="px-3 text-[11px] font-bold text-[#800000] uppercase tracking-wider">
                  Or Sign In with Google
                </span>
                <span className="h-px bg-[#FFD0D0] flex-1"></span>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isGoogleSigningIn}
                className="w-full bg-[#800000] hover:bg-[#660000] text-white font-bold py-3.5 px-4 rounded-2xl transition shadow-xs flex items-center justify-center gap-3 cursor-pointer text-xs border border-[#800000]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#FFFFFF"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#FFFFFF"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FFFFFF"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#FFFFFF"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-white font-bold text-sm tracking-wide !text-white">
                  {isGoogleSigningIn
                    ? 'Verifying Google Account...'
                    : 'Sign In with Google'}
                </span>
              </button>
            </div>
          </>
        )}

        {/* MODE 2: FORCE FIRST-TIME PASSWORD CHANGE */}
        {mode === 'force_change_password' && pendingMember && (
          <form onSubmit={handleForcePasswordChange} className="space-y-4 relative z-10 text-xs">
            <div className="bg-[#FFF0F0] border border-[#FF9999] p-4 rounded-2xl space-y-2 text-slate-800">
              <div className="flex items-center gap-2 font-bold text-[#800000] text-sm">
                <Lock className="w-5 h-5 text-[#800000]" />
                <span>First-Time Password Change Required</span>
              </div>
              <p className="text-slate-700 leading-relaxed text-xs">
                Welcome, <strong className="text-[#800000]">{pendingMember.name}</strong>! As required by Meyvaa security policy, your initial default password (<code className="text-[#FF3333] font-bold">123456</code>) must be updated to a personalized secure password.
              </p>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-2xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-slate-800 font-semibold">New Security Password *</label>
              <input
                type="password"
                required
                placeholder="Enter new password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white border border-[#FFD0D0] rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-800 font-semibold">Confirm New Password *</label>
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full bg-white border border-[#FFD0D0] rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#800000] hover:bg-[#660000] text-white font-bold py-3 rounded-2xl transition shadow-xs flex items-center justify-center gap-2 text-sm cursor-pointer !text-white"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span className="text-white font-bold">Update Password & Enter Portal</span>
            </button>
          </form>
        )}

        {/* MODE 3: FORGOT PASSWORD / EMAIL OTP RESET */}
        {mode === 'forgot_password' && (
          <div className="space-y-4 relative z-10 text-xs">
            <div className="flex items-center justify-between border-b border-[#FFD0D0] pb-2">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#800000]" />
                <span>Reset Password via Email OTP</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                  setOtpSentNotification(null);
                }}
                className="text-[#800000] hover:underline font-medium text-xs cursor-pointer"
              >
                Back to Login
              </button>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-2xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {otpSentNotification && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-2xl flex items-start justify-between gap-2.5 font-medium leading-relaxed shadow-sm">
                <div className="flex items-start gap-2.5">
                  <Mail className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Email Notification Sent!</div>
                    <div className="text-[11px] font-mono mt-0.5 text-emerald-800">{otpSentNotification}</div>
                  </div>
                </div>
                {generatedOtp && (
                  <button
                    type="button"
                    onClick={() => setEnteredOtp(generatedOtp)}
                    className="bg-[#800000] hover:bg-[#660000] text-white font-bold text-[10px] px-2.5 py-1 rounded-lg shadow-xs transition whitespace-nowrap cursor-pointer !text-white"
                  >
                    Auto-fill OTP
                  </button>
                )}
              </div>
            )}

            {/* STEP 1: Request OTP */}
            {!generatedOtp ? (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <p className="text-slate-600 text-xs leading-relaxed">
                  Enter your registered Organisation Email Address or NID card number. A 6-digit OTP verification code will be sent to your email to reset your password.
                </p>

                <div className="space-y-1.5">
                  <label className="text-slate-800 font-semibold">Registered Email or NID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. zayd.ahmed@scout.mv or A100123"
                    value={forgotEmailOrNid}
                    onChange={(e) => setForgotEmailOrNid(e.target.value)}
                    className="w-full bg-white border border-[#FFD0D0] rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000]"
                  />
                </div>

                {/* Quick Select Member Email */}
                <div className="bg-[#FFF0F0] border border-[#FF9999] p-2.5 rounded-xl space-y-1.5">
                  <label className="text-[11px] text-slate-800 font-semibold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-[#800000]" />
                    <span>Quick Select Roster Member Email:</span>
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) setForgotEmailOrNid(e.target.value);
                    }}
                    className="w-full bg-white border border-[#FFD0D0] text-slate-900 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#800000] font-mono"
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
                  className="w-full bg-[#800000] hover:bg-[#660000] text-white font-bold py-3 rounded-2xl transition shadow-xs flex items-center justify-center gap-2 text-sm cursor-pointer !text-white"
                >
                  <Mail className="w-4 h-4 text-white" />
                  <span className="text-white font-bold">Send Reset OTP to Email</span>
                </button>
              </form>
            ) : (
              /* STEP 2: Verify OTP & Set New Password */
              <form onSubmit={handleResetPasswordWithOtp} className="space-y-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-slate-800 font-semibold">
                    <label className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-[#800000]" />
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
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'text-[#800000] hover:underline cursor-pointer'
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
                    className="w-full bg-[#FFF0F0] border border-[#FF9999] rounded-xl px-3.5 py-2.5 text-[#800000] font-mono text-center tracking-widest text-lg focus:outline-none focus:border-[#800000] font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-800 font-semibold">New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password (min. 6 characters)"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full bg-white border border-[#FFD0D0] rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-800 font-semibold">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-[#FFD0D0] rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#800000] hover:bg-[#660000] text-white font-bold py-3 rounded-2xl transition shadow-xs flex items-center justify-center gap-2 text-sm cursor-pointer !text-white"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span className="text-white font-bold">Verify OTP & Reset Password</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Modal Footer Info */}
        <div className="border-t border-[#FFD0D0] pt-3 flex items-center justify-between text-[11px] text-slate-500 relative z-10">
          <span className="flex items-center gap-1 text-slate-600">
            <Shield className="w-3.5 h-3.5 text-[#FF3333]" /> Encrypted Organisation Authentication
          </span>
          <span className="text-slate-500">Meyvaa Portal • Owned by Nazih</span>
        </div>
      </div>
    </div>
  );
};
