import React, { useState } from 'react';
import { Organisation, PortalSettings } from '../types';
import {
  Calendar,
  CreditCard,
  Upload,
  CheckCircle2,
  X,
  Shield,
  FileText,
  AlertCircle,
  Landmark,
  Clock,
  Sparkles,
  HelpCircle,
  RefreshCw,
  Building2,
} from 'lucide-react';

interface PlanRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOrg: Organisation | null;
  settings?: PortalSettings;
  onSubmitRenewal: (
    orgId: string,
    receiptUrl: string,
    receiptName: string,
    requestedTerm: string,
    notes?: string
  ) => void;
}

export const PlanRenewalModal: React.FC<PlanRenewalModalProps> = ({
  isOpen,
  onClose,
  currentOrg,
  settings,
  onSubmitRenewal,
}) => {
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [receiptName, setReceiptName] = useState<string>('');
  const [requestedTerm, setRequestedTerm] = useState<string>('+1 Month');
  const [customTerm, setCustomTerm] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);

  if (!isOpen || !currentOrg) return null;

  const isFreePlan = currentOrg.plan === 'Free' || currentOrg.planValidUntil === 'Indefinite';

  const bankDetails = settings?.paymentDetails || {
    accountName: 'Meyvaa Portal Payment Account',
    accountNumber: '7730000123456',
    bankName: 'Bank of Maldives (BML)',
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isFreePlan) {
      alert('Free plans have indefinite validity and do not require renewal receipts.');
      onClose();
      return;
    }

    if (!receiptUrl && !currentOrg.renewalReceiptUrl) {
      setErrorMessage('Please upload a valid BML payment transfer receipt image or PDF.');
      return;
    }

    const finalTerm = requestedTerm === 'Custom' ? customTerm.trim() || 'Custom Date/Term' : requestedTerm;
    const finalReceiptUrl = receiptUrl || currentOrg.renewalReceiptUrl || '';
    const finalReceiptName = receiptName || currentOrg.renewalReceiptName || 'Renewal_Transfer_Receipt.pdf';

    onSubmitRenewal(currentOrg.id, finalReceiptUrl, finalReceiptName, finalTerm, notes.trim());
    setIsSubmittedSuccess(true);
    setTimeout(() => {
      setIsSubmittedSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#161920] border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden my-auto">
        {/* Glowing Background Accent */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Plan Validity & Renewal</span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold">
                  {currentOrg.code}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {currentOrg.name} • Subscription Management
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Plan & Validity Info Banner */}
        <div className="bg-[#12151B] p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Current Plan Type:</span>
            </span>
            <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              {currentOrg.plan} Plan
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Plan Valid Until:</span>
            </span>
            <span className="font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              {currentOrg.planValidUntil || 'Indefinite'}
            </span>
          </div>

          {currentOrg.renewalStatus === 'Pending Verification' && (
            <div className="mt-2 bg-amber-500/15 border border-amber-500/40 text-amber-300 p-2.5 rounded-xl flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0 text-amber-400 animate-pulse" />
              <div className="text-[11px] leading-tight">
                <strong className="block">Renewal Verification Pending</strong>
                <span>Receipt uploaded on {currentOrg.renewalSubmittedAt || 'recently'}. Superadmin review in progress.</span>
              </div>
            </div>
          )}
        </div>

        {isFreePlan ? (
          <div className="bg-purple-950/30 border border-purple-500/30 p-4 rounded-2xl space-y-2 text-xs text-center relative z-10">
            <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
            <h4 className="font-bold text-purple-200">Indefinite Free Plan Exemption</h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              This organisation is operating on a Superadmin-granted Free Indefinite Plan. No periodic payment receipts or manual renewals are required.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs relative z-10">
            {/* Superadmin BML Payment Details Box */}
            <div className="bg-[#12151B] p-3 rounded-2xl border border-amber-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-amber-300 font-bold border-b border-slate-800 pb-1">
                <span className="flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>BML Transfer Details for Extension</span>
                </span>
                <span className="text-[10px] text-amber-400/80 font-mono">BML Direct</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Account Name:</span>
                  <strong className="text-slate-200">{bankDetails.accountName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Account Number:</span>
                  <strong className="text-emerald-400 font-mono font-bold">{bankDetails.accountNumber}</strong>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-2.5 rounded-xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isSubmittedSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-2.5 rounded-xl flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>Renewal receipt submitted! Superadmin will verify and extend validity.</span>
              </div>
            )}

            {/* Requested Extension Duration / Term */}
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>Requested Plan Extension Amount / Term *</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRequestedTerm('+1 Month')}
                  className={`p-2 rounded-xl text-center font-bold border transition ${
                    requestedTerm === '+1 Month'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-[#12151B] text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs">+1 Month</div>
                  <div className="text-[10px] font-mono opacity-80">MVR 20</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestedTerm('+1 Year')}
                  className={`p-2 rounded-xl text-center font-bold border transition ${
                    requestedTerm === '+1 Year'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-[#12151B] text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs">+1 Year (Annual)</div>
                  <div className="text-[10px] font-mono opacity-80">MVR 200</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestedTerm('Custom')}
                  className={`p-2 rounded-xl text-center font-bold border transition ${
                    requestedTerm === 'Custom'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-[#12151B] text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs">Specific Term</div>
                  <div className="text-[10px] opacity-80">Custom / Term</div>
                </button>
              </div>

              {requestedTerm === 'Custom' && (
                <input
                  type="text"
                  placeholder="e.g. 2026-2027 Term or 2026-12-31"
                  value={customTerm}
                  onChange={(e) => setCustomTerm(e.target.value)}
                  className="w-full bg-[#12151B] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 mt-1.5"
                />
              )}
            </div>

            {/* Receipt File Upload */}
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Upload BML Payment Transfer Receipt *</span>
                </span>
                <span className="text-[10px] text-slate-500">Image or PDF</span>
              </label>

              <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 text-center bg-[#12151B] transition relative cursor-pointer group">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="space-y-1 pointer-events-none">
                  {receiptUrl || currentOrg.renewalReceiptUrl ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="truncate max-w-[220px]">
                        {receiptName || currentOrg.renewalReceiptName || 'Receipt Attached'}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-slate-500 group-hover:text-amber-400 mx-auto transition" />
                      <div className="text-slate-300 font-medium">Click or Drag & Drop BML Transfer Receipt</div>
                      <div className="text-[10px] text-slate-500">JPEG, PNG, or PDF format supported</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Payment / Renewal Notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. Paid MVR 20 via BML Mobile Banking transfer for Term 2 extension."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#12151B] border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 text-xs cursor-pointer mt-2"
            >
              <Upload className="w-4 h-4" />
              <span>Submit Renewal Receipt for Superadmin Verification</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
