import React, { useState, useRef, useEffect } from 'react';
import {
  Member,
  FeeRequest,
  CrewPaymentTransaction,
  PortalSettings,
  PaymentDetails,
} from '../types';
import {
  CreditCard,
  Landmark,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  Upload,
  Search,
  Filter,
  Copy,
  Check,
  Crown,
  User,
  AlertCircle,
  Building2,
  Save,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useToast } from './ToastContext';

interface PaymentsModuleProps {
  currentMember: Member | null;
  members?: Member[];
  feeRequests?: FeeRequest[];
  paymentTransactions?: CrewPaymentTransaction[];
  transactions?: CrewPaymentTransaction[];
  onAddFeeRequest?: (fee: Omit<FeeRequest, 'id' | 'createdAt'>) => void;
  onCreateFeeRequest?: (fee: Omit<FeeRequest, 'id' | 'createdAt'>) => void;
  onSubmitPayment: (payment: Omit<CrewPaymentTransaction, 'id' | 'submittedAt' | 'status'>) => void;
  onVerifyPayment: (paymentId: string, status: 'Verified / Paid' | 'Rejected', notes?: string) => void;
  settings?: PortalSettings;
  onUpdateSettings?: (settings: PortalSettings) => void;
  activeOrgContext?: string;
}

export const PaymentsModule: React.FC<PaymentsModuleProps> = ({
  currentMember,
  members = [],
  feeRequests = [],
  paymentTransactions,
  transactions,
  onAddFeeRequest,
  onCreateFeeRequest,
  onSubmitPayment,
  onVerifyPayment,
  settings,
  onUpdateSettings,
  activeOrgContext = 'all',
}) => {
  const { toastSuccess, toastInfo, toastError } = useToast();

  const safeTransactions = (paymentTransactions || transactions || []).filter(Boolean);
  const safeFeeRequests = (feeRequests || []).filter(Boolean);
  const safeMembers = (members || []).filter(
    (m) => m && !m.isSuperAdmin && m.councilRole !== 'Superadmin' && m.councilRole !== 'Rover Advisor'
  );
  const handleAddFee = onAddFeeRequest || onCreateFeeRequest;

  const isAdvisor = currentMember?.councilRole === 'Rover Advisor' || currentMember?.isSuperAdmin;
  const isCouncil = !!currentMember && currentMember.councilRole !== 'Member';

  const [activeTab, setActiveTab] = useState<'requests' | 'my_payments' | 'all_transactions' | 'create_fee' | 'bank_config'>('requests');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

  // New Fee Request Form
  const [feeTitle, setFeeTitle] = useState('');
  const [feeCategory, setFeeCategory] = useState<FeeRequest['category']>('Annual Dues');
  const [feeAmount, setFeeAmount] = useState<number>(150);
  const [feeDueDate, setFeeDueDate] = useState('2026-09-30');
  const [feeDesc, setFeeDesc] = useState('');

  // Submit Payment Modal / Form
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<FeeRequest | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash / Offline'>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [receiptFileUrl, setReceiptFileUrl] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>('');

  // Manual Offline Payment Form (for Advisor)
  const [offlineMemberId, setOfflineMemberId] = useState<string>('');
  const [offlineFeeId, setOfflineFeeId] = useState<string>('');
  const [offlineAmount, setOfflineAmount] = useState<number>(150);
  const [offlineNotes, setOfflineNotes] = useState('');

  // Bank Configuration Form
  const [bankForm, setBankForm] = useState<PaymentDetails>({
    accountName: settings?.paymentDetails?.accountName || 'Scout Group Official Account',
    accountNumber: settings?.paymentDetails?.accountNumber || '7730000889900',
    bankName: settings?.paymentDetails?.bankName || 'Bank of Maldives (BML)',
  });

  // Automated Toast Notification & Email Alert on Payment Status Change
  const prevStatusesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!safeTransactions || safeTransactions.length === 0) return;

    safeTransactions.forEach((pt) => {
      if (!pt || !pt.id) return;
      const prev = prevStatusesRef.current[pt.id];
      if (prev && (prev === 'Pending Verification' || prev === 'Pending') && prev !== pt.status) {
        if (pt.status === 'Verified / Paid') {
          toastSuccess(
            `🔔 Payment Approved: MVR ${pt.amountMvr} for "${pt.feeTitle}" (${pt.memberName}) has been VERIFIED. Automated email dispatch triggered.`
          );
        } else if (pt.status === 'Rejected') {
          toastError(
            `🚨 Payment Rejected: Submission for "${pt.feeTitle}" (${pt.memberName}) was REJECTED. Automated email alert sent to member.`
          );
        }
      }
      prevStatusesRef.current[pt.id] = pt.status;
    });
  }, [safeTransactions, toastSuccess, toastError]);

  const handleCopyBank = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankField(field);
    toastInfo(`Copied ${field} to clipboard!`);
    setTimeout(() => setCopiedBankField(null), 2000);
  };

  const handleSaveBankConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSettings && settings) {
      onUpdateSettings({
        ...settings,
        paymentDetails: bankForm,
      });
      toastSuccess('Crew official bank account details saved successfully!');
    }
  };

  const handleCreateFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeTitle.trim() || feeAmount <= 0) {
      toastError('Please enter a valid title and fee amount.');
      return;
    }
    if (handleAddFee) {
      handleAddFee({
        organisationId: activeOrgContext,
        title: feeTitle.trim(),
        category: feeCategory,
        amountMvr: feeAmount,
        dueDate: feeDueDate,
        description: feeDesc.trim(),
        createdBy: currentMember?.name || 'Rover Advisor',
      });
      toastSuccess(`Created fee request: ${feeTitle}`);
    }
    setFeeTitle('');
    setFeeDesc('');
    setActiveTab('requests');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toastError('Receipt image file must be under 5MB');
        return;
      }
      setReceiptFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setReceiptFileUrl(event.target?.result as string);
        toastSuccess('Receipt attached successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitMemberPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeeForPayment) return;
    if (!currentMember) {
      toastError('Please log in to submit payment.');
      return;
    }

    onSubmitPayment({
      organisationId: activeOrgContext,
      feeRequestId: selectedFeeForPayment.id,
      feeTitle: selectedFeeForPayment.title,
      memberId: currentMember.id,
      memberName: currentMember.name,
      amountMvr: selectedFeeForPayment.amountMvr,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
      receiptUrl: receiptFileUrl || undefined,
      receiptFileName: receiptFileName || undefined,
      notes: paymentNotes.trim() || undefined,
    });

    toastSuccess('Payment submission sent for verification!');
    setSelectedFeeForPayment(null);
    setReferenceNumber('');
    setPaymentNotes('');
    setReceiptFileUrl(null);
    setReceiptFileName('');
  };

  const handleRecordOfflinePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineMemberId || !offlineFeeId) {
      toastError('Please select both a member and a fee request.');
      return;
    }
    const m = safeMembers.find((x) => x.id === offlineMemberId);
    const f = safeFeeRequests.find((x) => x.id === offlineFeeId);
    if (!m || !f) return;

    onSubmitPayment({
      organisationId: activeOrgContext,
      feeRequestId: f.id,
      feeTitle: f.title,
      memberId: m.id,
      memberName: m.name,
      amountMvr: offlineAmount,
      paymentMethod: 'Cash / Offline',
      notes: offlineNotes.trim() || `Cash received by ${currentMember?.name || 'Advisor'}`,
    });

    toastSuccess(`Cash payment recorded for ${m.name}`);
    setOfflineMemberId('');
    setOfflineFeeId('');
    setOfflineNotes('');
  };

  // Filtered transactions
  const myTransactions = safeTransactions.filter((pt) => pt && pt.memberId === currentMember?.id);
  const filteredTransactions = safeTransactions.filter((pt) => {
    if (!pt) return false;
    const matchesStatus = selectedStatusFilter === 'all' || pt.status === selectedStatusFilter;
    const matchesQuery =
      (pt.memberName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pt.feeTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pt.referenceNumber ? pt.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) : false);
    return matchesStatus && matchesQuery;
  });

  // Calculate Metrics
  const totalVerifiedMvr = safeTransactions
    .filter((pt) => pt && pt.status === 'Verified / Paid')
    .reduce((sum, pt) => sum + (pt?.amountMvr || 0), 0);

  const pendingVerificationCount = safeTransactions.filter((pt) => pt && pt.status === 'Pending Verification').length;

  const crewAccount = settings?.paymentDetails || {
    accountName: 'Scout Group Official Account',
    accountNumber: '7730000889900',
    bankName: 'Bank of Maldives (BML)',
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 text-slate-900">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-emerald-50 border border-blue-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-[#002B7F]/10 text-[#002B7F] border border-[#002B7F]/20 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#002B7F]" />
                <span>Crew Finance & Dues Portal</span>
              </span>
              {isAdvisor && (
                <span className="bg-rose-50 text-[#800020] border border-[#800020]/20 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3 text-[#800020]" />
                  <span>Advisor Controller</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-serif">
              Rover Crew Dues & Financial Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Track membership dues, event fee collections, upload bank transfer receipts, and verify crew financial receipts.
            </p>
          </div>

          {/* Quick Bank Account Card - Visible Only for Rover Advisor */}
          {isAdvisor && (
            <div className="bg-white border border-blue-200 p-3.5 rounded-2xl space-y-1.5 text-xs min-w-[260px] shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-bold text-[#002B7F] flex items-center gap-1 text-[11px]">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Superadmin Preset Account</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{crewAccount.bankName}</span>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Account Name:</div>
                <div className="font-semibold text-slate-800 truncate">{crewAccount.accountName}</div>
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-200 font-mono">
                <span className="font-bold text-[#006B3F] text-xs">{crewAccount.accountNumber}</span>
                <button
                  onClick={() => handleCopyBank(crewAccount.accountNumber, 'Account Number')}
                  className="text-slate-500 hover:text-[#002B7F] p-1 transition cursor-pointer"
                  title="Copy Account Number"
                >
                  {copiedBankField === 'Account Number' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 sm:gap-4 shadow-xs">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#006B3F] flex items-center justify-center font-bold flex-shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-2xl font-extrabold text-[#006B3F] truncate">
              MVR {totalVerifiedMvr}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">Total Verified Collections</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 sm:gap-4 shadow-xs">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#002B7F] flex items-center justify-center font-bold relative flex-shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            {pendingVerificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#002B7F] text-white font-mono text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                {pendingVerificationCount}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-2xl font-extrabold text-[#002B7F] truncate">
              {pendingVerificationCount}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">Pending Verifications</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 sm:gap-4 shadow-xs">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 border border-rose-200 text-[#800020] flex items-center justify-center font-bold flex-shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-2xl font-extrabold text-slate-900 truncate">{safeFeeRequests.length}</div>
            <div className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">Active Dues Drives</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 sm:gap-4 shadow-xs">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold flex-shrink-0">
            <User className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-2xl font-extrabold text-sky-800 truncate">
              {myTransactions.filter((pt) => pt?.status === 'Verified / Paid').length} / {safeFeeRequests.length}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">My Personal Paid Fees</div>
          </div>
        </div>
      </div>

      {/* Responsive Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-[#002B7F] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Active Fee Drives</span>
          </button>

          <button
            onClick={() => setActiveTab('my_payments')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'my_payments'
                ? 'bg-[#006B3F] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Payment History ({myTransactions.length})</span>
          </button>

          {isCouncil && (
            <button
              onClick={() => setActiveTab('all_transactions')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'all_transactions'
                  ? 'bg-[#800020] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Verify Submissions ({safeTransactions.length})</span>
              {pendingVerificationCount > 0 && (
                <span className="bg-white text-[#800020] text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                  {pendingVerificationCount}
                </span>
              )}
            </button>
          )}

          {isAdvisor && (
            <>
              <button
                onClick={() => setActiveTab('create_fee')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'create_fee'
                    ? 'bg-[#002B7F] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Fee Drive</span>
              </button>

              <button
                onClick={() => setActiveTab('bank_config')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'bank_config'
                    ? 'bg-[#006B3F] text-white shadow-xs font-extrabold'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Preset Bank Details</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* TAB 1: ACTIVE FEE REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeFeeRequests.map((fee) => {
              const myPayment = safeTransactions.find(
                (pt) => pt.feeRequestId === fee.id && pt.memberId === currentMember?.id
              );
              const isPaid = myPayment?.status === 'Verified / Paid';
              const isPending = myPayment?.status === 'Pending Verification';

              return (
                <div
                  key={fee.id}
                  className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#002B7F] border border-blue-200">
                          {fee.category}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 mt-1">{fee.title}</h3>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-extrabold text-[#006B3F]">MVR {fee.amountMvr}</div>
                        <div className="text-[10px] text-slate-500">Due: {fee.dueDate}</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{fee.description}</p>
                    <div className="text-[11px] text-slate-500">Issued by: <strong className="text-slate-800">{fee.createdBy}</strong></div>
                  </div>

                  {/* Payment Action Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isPaid ? (
                      <span className="w-full bg-emerald-50 text-[#006B3F] border border-emerald-200 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#006B3F]" />
                        <span>Payment Verified & Cleared</span>
                      </span>
                    ) : isPending ? (
                      <span className="w-full bg-blue-50 text-[#002B7F] border border-blue-200 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#002B7F]" />
                        <span>Receipt Submitted • Pending Verification</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedFeeForPayment(fee)}
                        className="w-full bg-[#002B7F] hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Pay Dues / Upload Transfer Slip</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MY PAYMENT HISTORY */}
      {activeTab === 'my_payments' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-[#002B7F]" />
            <span>Personal Payment Submissions & Transfer Slips</span>
          </h3>

          {myTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2 border border-slate-200 rounded-xl bg-slate-50">
              <CreditCard className="w-8 h-8 text-slate-400 mx-auto" />
              <p>No payment records submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTransactions.map((pt) => (
                <div
                  key={pt.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-900">{pt.feeTitle}</div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span>Submitted: {pt.submittedAt}</span>
                      <span>Method: <strong className="text-slate-700">{pt.paymentMethod}</strong></span>
                      {pt.referenceNumber && <span>Ref: <strong className="font-mono text-[#002B7F]">{pt.referenceNumber}</strong></span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-slate-200 pt-2 sm:pt-0">
                    <div className="text-right">
                      <div className="font-extrabold text-sm text-[#006B3F]">MVR {pt.amountMvr}</div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                        pt.status === 'Verified / Paid'
                          ? 'bg-emerald-50 text-[#006B3F] border-emerald-200'
                          : pt.status === 'Pending Verification'
                          ? 'bg-blue-50 text-[#002B7F] border-blue-200'
                          : 'bg-rose-50 text-[#800020] border-rose-200'
                      }`}>
                        {pt.status === 'Verified / Paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>{pt.status}</span>
                      </span>
                    </div>

                    {pt.receiptUrl && (
                      <button
                        onClick={() => setViewingReceiptUrl(pt.receiptUrl || null)}
                        className="p-2 bg-white hover:bg-slate-100 text-[#002B7F] border border-slate-200 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer shadow-xs"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VERIFY ALL SUBMISSIONS (COUNCIL & ADVISOR) */}
      {activeTab === 'all_transactions' && isCouncil && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#002B7F]" />
              <span>Council Financial Verification Ledger</span>
            </h3>

            {/* Status Filter */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Filter:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="all">All Statuses</option>
                <option value="Pending Verification">Pending Verification</option>
                <option value="Verified / Paid">Verified / Paid</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTransactions.map((pt) => (
              <div
                key={pt.id}
                className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{pt.memberName}</div>
                    <div className="text-xs text-[#002B7F] font-semibold">{pt.feeTitle}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-[#006B3F] font-mono">
                      MVR {pt.amountMvr}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                      pt.status === 'Verified / Paid'
                        ? 'bg-emerald-50 text-[#006B3F] border-emerald-200'
                        : pt.status === 'Pending Verification'
                        ? 'bg-blue-50 text-[#002B7F] border-blue-200'
                        : 'bg-rose-50 text-[#800020] border-rose-200'
                    }`}>
                      {pt.status === 'Verified / Paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span>{pt.status}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Method:</span>
                    <strong>{pt.paymentMethod}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Reference Code:</span>
                    <strong className="font-mono text-[#002B7F]">{pt.referenceNumber || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Submitted Date:</span>
                    <span>{pt.submittedAt}</span>
                  </div>
                </div>

                {pt.notes && (
                  <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200">
                    &quot;{pt.notes}&quot;
                  </p>
                )}

                {/* Verification Action Bar for Advisor/Council */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                  {pt.receiptUrl && (
                    <button
                      onClick={() => setViewingReceiptUrl(pt.receiptUrl || null)}
                      className="bg-blue-50 hover:bg-blue-100 text-[#002B7F] border border-blue-200 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Receipt Image</span>
                    </button>
                  )}

                  {pt.status === 'Pending Verification' && (
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => {
                          onVerifyPayment(pt.id, 'Verified / Paid', 'Verified by Council');
                          toastSuccess(`Verified payment for ${pt.memberName}. Email alert dispatched.`);
                        }}
                        className="bg-[#006B3F] hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify & Approve</span>
                      </button>

                      <button
                        onClick={() => {
                          onVerifyPayment(pt.id, 'Rejected', 'Insufficient transfer verification');
                          toastError(`Rejected submission for ${pt.memberName}. Automated email notification sent.`);
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-[#800020] border border-rose-200 text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CREATE FEE DRIVE (ADVISOR ONLY) */}
      {activeTab === 'create_fee' && isAdvisor && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl mx-auto space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#002B7F]" />
              <span>Create New Dues or Event Fee Request</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Issue a financial fee request to all Rover members of the crew.
            </p>
          </div>

          <form onSubmit={handleCreateFeeSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-800 font-semibold">Fee Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Annual Crew Contribution 2026"
                value={feeTitle}
                onChange={(e) => setFeeTitle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-800 font-semibold">Category</label>
                <select
                  value={feeCategory}
                  onChange={(e) => setFeeCategory(e.target.value as FeeRequest['category'])}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="Annual Dues">Annual Dues</option>
                  <option value="Event Fee">Event Fee</option>
                  <option value="Uniform & Badges">Uniform & Badges</option>
                  <option value="Equipment Fund">Equipment Fund</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-800 font-semibold">Amount (MVR) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-[#006B3F] font-mono font-bold focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-800 font-semibold">Due Date</label>
              <input
                type="date"
                value={feeDueDate}
                onChange={(e) => setFeeDueDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-800 font-semibold">Description & Payment Instructions</label>
              <textarea
                rows={3}
                placeholder="Details regarding what this fee covers..."
                value={feeDesc}
                onChange={(e) => setFeeDesc(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#002B7F] hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Fee Request to Crew</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: PRESET BANK DETAILS VIEW (ROVER ADVISOR ONLY) */}
      {activeTab === 'bank_config' && isAdvisor && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 max-w-xl mx-auto space-y-5 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#002B7F] font-bold">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Superadmin Preset Bank Transfer Details</h3>
                <p className="text-xs text-slate-500">Official account preset by Superadmin for portal subscriptions and fee transfers.</p>
              </div>
              <span className="bg-blue-50 text-[#002B7F] border border-blue-200 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                Preset by Superadmin
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
              <span className="text-slate-500 text-xs font-medium">Bank Name</span>
              <span className="font-semibold text-slate-800">{crewAccount.bankName}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
              <span className="text-slate-500 text-xs font-medium">Official Account Name</span>
              <span className="font-semibold text-slate-800 text-right">{crewAccount.accountName}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
              <span className="text-slate-500 text-xs font-medium">Official Account Number</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#006B3F] font-bold text-sm">{crewAccount.accountNumber}</span>
                <button
                  type="button"
                  onClick={() => handleCopyBank(crewAccount.accountNumber, 'Account Number')}
                  className="bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 border border-slate-200"
                >
                  {copiedBankField === 'Account Number' ? (
                    <span className="text-[#006B3F] font-bold">Copied!</span>
                  ) : (
                    <span>Copy</span>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
              <strong>Note for Rover Advisors:</strong> Bank transfer parameters are globally preset and maintained by Superadmin. If you require updates to the official bank account details, please request an update via Superadmin.
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT PAYMENT / TRANSFER RECEIPT */}
      {selectedFeeForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-5 space-y-4 relative my-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Submit Dues Payment</h3>
                <p className="text-xs text-[#002B7F] font-semibold">{selectedFeeForPayment.title}</p>
              </div>
              <button
                onClick={() => setSelectedFeeForPayment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Crew Bank Account Box */}
            <div className="bg-slate-50 p-3 rounded-xl border border-blue-200 text-xs space-y-1.5">
              <div className="font-bold text-[#002B7F] flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5" />
                <span>Transfer Funds to Official Crew Account</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                <div>Bank: <strong className="text-slate-900">{crewAccount.bankName}</strong></div>
                <div>Account: <strong className="font-mono text-[#006B3F]">{crewAccount.accountNumber}</strong></div>
                <div className="col-span-2">Name: <strong className="text-slate-900">{crewAccount.accountName}</strong></div>
              </div>
            </div>

            <form onSubmit={handleSubmitMemberPayment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-800 font-semibold block mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Bank Transfer')}
                    className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer ${
                      paymentMethod === 'Bank Transfer'
                        ? 'bg-blue-50 text-[#002B7F] border-[#002B7F]'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Bank Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash / Offline')}
                    className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer ${
                      paymentMethod === 'Cash / Offline'
                        ? 'bg-blue-50 text-[#002B7F] border-[#002B7F]'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Cash / Hand Over
                  </button>
                </div>
              </div>

              {paymentMethod === 'Bank Transfer' && (
                <div>
                  <label className="text-slate-800 font-semibold block mb-1">Bank Reference Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BML-TR-998124"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-800 font-semibold block mb-1">Upload Receipt / Transfer Slip Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-700 text-xs"
                />
                {receiptFileName && (
                  <div className="text-[10px] text-[#006B3F] mt-1 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Attached: {receiptFileName}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-slate-800 font-semibold block mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="Optional note for Treasurer..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#002B7F] hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Upload className="w-4 h-4" />
                <span>Submit Payment Receipt (MVR {selectedFeeForPayment.amountMvr})</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT IMAGE VIEWER MODAL */}
      {viewingReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-4 space-y-3 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#002B7F]" />
                <span>Transfer Slip Attachment</span>
              </h3>
              <button
                onClick={() => setViewingReceiptUrl(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-2 max-h-[60vh] overflow-auto flex items-center justify-center border border-slate-200">
              <img src={viewingReceiptUrl} alt="Receipt Slip" className="max-w-full h-auto rounded-lg shadow-xs" />
            </div>

            <button
              onClick={() => setViewingReceiptUrl(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
            >
              Close Viewer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
