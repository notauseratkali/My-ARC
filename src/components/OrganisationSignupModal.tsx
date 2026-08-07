import React, { useState } from 'react';
import { Organisation, PlanType } from '../types';
import {
  Building2,
  UserCheck,
  Key,
  CreditCard,
  Upload,
  CheckCircle2,
  X,
  Shield,
  FileText,
  AlertCircle,
  Sparkles,
  HelpCircle,
  Crown,
} from 'lucide-react';

interface OrganisationSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupSubmit: (newOrgData: Omit<Organisation, 'id' | 'createdAt' | 'status'>) => void;
}

export const OrganisationSignupModal: React.FC<OrganisationSignupModalProps> = ({
  isOpen,
  onClose,
  onSignupSubmit,
}) => {
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  
  // Designated Rover Advisor details
  const [advisorName, setAdvisorName] = useState('');
  const [advisorEmail, setAdvisorEmail] = useState('');
  const [advisorNid, setAdvisorNid] = useState('');
  const [advisorPhone, setAdvisorPhone] = useState('');
  
  // Subscription Plan selection
  const [plan, setPlan] = useState<PlanType>('Monthly');
  
  // Payment Receipt state
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState<string>('');
  const [paymentReceiptName, setPaymentReceiptName] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentReceiptName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!orgName.trim() || !advisorName.trim() || !advisorEmail.trim() || !advisorNid.trim()) {
      setErrorMessage('Please fill in all required organisation and Rover Advisor fields.');
      return;
    }

    if ((plan === 'Monthly' || plan === 'Annual') && !paymentReceiptUrl) {
      setErrorMessage('A payment receipt upload is required for Monthly and Annual subscription plans.');
      return;
    }

    onSignupSubmit({
      name: orgName.trim(),
      code: orgCode.trim().toUpperCase() || orgName.substring(0, 6).toUpperCase(),
      roverAdvisorName: advisorName.trim(),
      roverAdvisorEmail: advisorEmail.trim(),
      roverAdvisorNid: advisorNid.trim().toUpperCase(),
      roverAdvisorPhone: advisorPhone.trim(),
      plan,
      paymentReceiptUrl,
      paymentReceiptName,
      paymentNotes: paymentNotes.trim(),
    });

    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#161920] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden my-8">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-amber-600 flex items-center justify-center text-white font-extrabold shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-slate-100 flex items-center gap-2">
                <span>Organisation Sign Up</span>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase">
                  Rover Advisor Required
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Register a new Rover Organisation portal • Pending Superadmin Approval
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

        {isSubmitted ? (
          /* SUCCESS SUBMISSION MESSAGE */
          <div className="py-8 text-center space-y-5 relative z-10 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-slate-100">Sign Up Request Submitted!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your request to register <strong className="text-amber-300">{orgName}</strong> with designated Rover Advisor <strong className="text-purple-300">{advisorName}</strong> has been sent to Superadmin.
              </p>
              <div className="bg-[#12151B] p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-2 mt-4">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Assigned Rover Advisor:</span>
                  <span className="text-slate-100 font-semibold">{advisorName} ({advisorNid})</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Plan Selected:</span>
                  <span className="text-amber-400 font-bold">
                    {plan === 'Free' ? 'Free Plan (Superadmin Exemption)' : plan === 'Monthly' ? 'Monthly Plan (MVR 20/mo)' : 'Annual Plan (MVR 200/yr)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Approval Status:</span>
                  <span className="text-amber-400 font-mono font-bold">Pending Superadmin Review</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition text-xs shadow-lg"
            >
              Return to Login Portal
            </button>
          </div>
        ) : (
          /* SIGNUP FORM */
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10 text-xs">
            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: Organisation Details */}
            <div className="bg-[#12151B] p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>1. Organisation Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-300 font-semibold">Organisation Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aminiya Rover Crew or CHSE Rovers"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-[#1A1E26] border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Org Code / Short Code</label>
                  <input
                    type="text"
                    placeholder="e.g. AMINIYA"
                    value={orgCode}
                    onChange={(e) => setOrgCode(e.target.value)}
                    className="w-full bg-[#1A1E26] border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 uppercase font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* STEP 2: Designated Rover Advisor */}
            <div className="bg-[#12151B] p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Crown className="w-4 h-4 text-purple-400" />
                  <span>2. Designated Rover Advisor</span>
                </h3>
                <span className="text-[10px] text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded font-mono">
                  Forms & Leads Crew
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Rover Advisor Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aishath Mariyam"
                    value={advisorName}
                    onChange={(e) => setAdvisorName(e.target.value)}
                    className="w-full bg-[#1A1E26] border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">National ID (NID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A200888"
                    value={advisorNid}
                    onChange={(e) => setAdvisorNid(e.target.value)}
                    className="w-full bg-[#1A1E26] border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 uppercase font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Email (Organisation Login Username) *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. advisor.mariyam@aminiya.scout.mv"
                    value={advisorEmail}
                    onChange={(e) => setAdvisorEmail(e.target.value)}
                    className="w-full bg-[#1A1E26] border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Contact Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +960 7700223"
                    value={advisorPhone}
                    onChange={(e) => setAdvisorPhone(e.target.value)}
                    className="w-full bg-[#1A1E26] border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* STEP 3: Plan Selection */}
            <div className="bg-[#12151B] p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>3. Select Portal Subscription Plan</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Free Option */}
                <div
                  onClick={() => setPlan('Free')}
                  className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    plan === 'Free'
                      ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-lg'
                      : 'bg-[#1A1E26] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-100">Free Plan</span>
                      <span className="bg-purple-500/20 text-purple-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                        MVR 0
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      For Superadmin allowed organisations only. Requires special exemption approval.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-semibold text-purple-300">
                    {plan === 'Free' ? '✓ Selected' : 'Select Free'}
                  </div>
                </div>

                {/* Monthly Option */}
                <div
                  onClick={() => setPlan('Monthly')}
                  className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    plan === 'Monthly'
                      ? 'bg-amber-950/40 border-amber-500 text-amber-200 shadow-lg'
                      : 'bg-[#1A1E26] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-100">Monthly Plan</span>
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                        MVR 20 / mo
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Standard monthly portal subscription. Requires monthly payment transfer receipt.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-semibold text-amber-300">
                    {plan === 'Monthly' ? '✓ Selected' : 'Select Monthly'}
                  </div>
                </div>

                {/* Annual Option */}
                <div
                  onClick={() => setPlan('Annual')}
                  className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    plan === 'Annual'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-lg'
                      : 'bg-[#1A1E26] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-100">Annual Plan</span>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                        MVR 200 / yr
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Save MVR 40 annually with a full-year subscription. Payment receipt required.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-semibold text-emerald-300">
                    {plan === 'Annual' ? '✓ Selected' : 'Select Annual'}
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 4: Payment Receipt Upload (Required for Monthly/Annual) */}
            {(plan === 'Monthly' || plan === 'Annual') && (
              <div className="bg-[#12151B] p-4 rounded-2xl border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>4. Upload Payment Receipt *</span>
                  </h3>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {plan === 'Monthly' ? 'MVR 20 Required' : 'MVR 200 Required'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  Please transfer payment to BML Scout Association Account (Account No: <strong className="text-slate-200 font-mono">7701122334401</strong>) and upload the transfer receipt below.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="block p-4 border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-2xl text-center cursor-pointer transition bg-[#1A1E26]">
                      <Upload className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                      <span className="font-semibold text-slate-200 block">
                        {paymentReceiptName ? paymentReceiptName : 'Choose or Drop Receipt Image/PDF'}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">PNG, JPG, or PDF up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {paymentReceiptUrl && (
                      <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-xl text-[11px] text-emerald-300">
                        <span className="truncate flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{paymentReceiptName || 'Receipt Attached'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentReceiptUrl('');
                            setPaymentReceiptName('');
                          }}
                          className="text-rose-400 hover:text-rose-300 text-xs font-bold px-2 py-0.5"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Payment Notes / Reference No.</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. BML Transfer ref #98123048, transferred from Aishath Mariyam."
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full bg-[#1A1E26] border border-slate-700 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 via-amber-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-bold py-3 rounded-2xl transition shadow-xl text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Submit Organisation Registration Request</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
