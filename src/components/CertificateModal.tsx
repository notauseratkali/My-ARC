import React, { useRef, useState } from 'react';
import { Award, Download, Printer, X, ShieldCheck, CheckCircle2, Sparkles, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Member, AwardType } from '../types';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  awardTier: AwardType | string;
  issueDate?: string;
  signedByLeader?: string;
  completedItemsCount?: number;
  totalItemsCount?: number;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  member,
  awardTier,
  issueDate = new Date().toISOString().split('T')[0],
  signedByLeader = 'Zayd Ahmed (Crew Leader)',
  completedItemsCount = 10,
  totalItemsCount = 10,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customSignatory, setCustomSignatory] = useState(signedByLeader);
  const [customDate, setCustomDate] = useState(issueDate);

  if (!isOpen) return null;

  const certNumber = `ARC-CERT-${new Date().getFullYear()}-${member.id.replace(/[^0-9]/g, '').padStart(4, '0') || '1084'}`;
  const isFullyCompleted = completedItemsCount >= totalItemsCount;

  const handleDownloadPdf = async () => {
    if (!certificateRef.current) return;
    try {
      setIsGenerating(true);
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${member.name.replace(/\s+/g, '_')}_${awardTier.replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Could not render PDF. Opening print dialog instead.');
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-6 relative text-slate-900">
        {/* Modal Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#002B7F]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif text-slate-900 flex items-center gap-2">
                <span>Award Progression Certificate</span>
                {isFullyCompleted ? (
                  <span className="bg-emerald-50 text-[#006B3F] border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Fully Verified
                  </span>
                ) : (
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] px-2 py-0.5 rounded-full font-mono">
                    Progress Preview ({completedItemsCount}/{totalItemsCount})
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">Official Meyvaa Portal Scouting Certification</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="bg-[#800000] hover:bg-[#6b0000] text-white !text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4 text-white" />
              <span>{isGenerating ? 'Rendering PDF...' : 'Download PDF Certificate'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-[#FFF0F0] hover:bg-white text-[#800000] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition border border-[#FF9999] cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-[#800000]" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#800000] hover:text-[#FF3333] p-2 rounded-xl hover:bg-[#FFF0F0] transition cursor-pointer"
            >
              <X className="w-5 h-5 text-[#800000]" />
            </button>
          </div>
        </div>

        {/* Customization Options Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Authorized Signatory:</span>
            <input
              type="text"
              value={customSignatory}
              onChange={(e) => setCustomSignatory(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Issue Date:</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Printable/Canvas Certificate Area */}
        <div className="overflow-x-auto flex justify-center py-2">
          <div
            ref={certificateRef}
            className="w-[842px] h-[595px] bg-[#FCFBF8] text-slate-900 p-10 rounded-2xl border-4 border-[#002B7F] shadow-xl relative flex flex-col justify-between overflow-hidden select-none font-serif"
            style={{
              boxShadow: 'inset 0 0 40px rgba(0, 43, 127, 0.05)',
            }}
          >
            {/* Watermark Crest */}
            <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none">
              <ShieldCheck className="w-[420px] h-[420px] text-[#002B7F]" />
            </div>

            {/* Corner Ornaments */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#800020] rounded-tl-xl" />
            <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#800020] rounded-tr-xl" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#800020] rounded-bl-xl" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#800020] rounded-br-xl" />

            {/* Inner Border Line */}
            <div className="absolute inset-3 border border-[#006B3F]/30 rounded-xl pointer-events-none" />

            {/* Certificate Header */}
            <div className="text-center space-y-2 relative z-10 pt-2">
              <div className="flex items-center justify-center gap-2 text-[#002B7F] font-mono text-xs tracking-widest uppercase font-bold">
                <Sparkles className="w-4 h-4 text-[#800020]" />
                <span>Meyvaa Portal • Owned & Managed by Nazih</span>
                <Sparkles className="w-4 h-4 text-[#800020]" />
              </div>

              <h1 className="text-3xl font-extrabold tracking-wider text-[#002B7F] uppercase font-serif">
                Certificate of Merit & Progression
              </h1>
              <div className="w-48 h-1 bg-[#800020] mx-auto rounded-full" />
            </div>

            {/* Certificate Body */}
            <div className="text-center space-y-4 relative z-10 px-8 my-auto">
              <p className="text-sm italic text-slate-600 font-sans">This official parchment certifies that</p>

              <div className="text-3xl font-bold text-[#800020] font-serif border-b border-slate-300 pb-2 max-w-lg mx-auto tracking-wide">
                {member.name}
              </div>

              <div className="text-xs text-slate-600 font-sans flex items-center justify-center gap-3">
                <span className="font-semibold text-slate-800">Rank: {member.councilRole}</span>
                <span>•</span>
                <span className="font-semibold text-slate-800">Section: {member.section}</span>
                <span>•</span>
                <span className="font-semibold text-slate-800">Crew: {member.crewName}</span>
              </div>

              <p className="text-xs text-slate-600 font-sans max-w-xl mx-auto leading-relaxed pt-2">
                has fulfilled all rigorous syllabus competencies, leadership standards, and practical field requirements for the official progression award of
              </p>

              <div className="inline-block bg-blue-50 border border-[#002B7F]/30 px-6 py-2 rounded-2xl">
                <span className="text-2xl font-extrabold text-[#002B7F] tracking-wider font-serif uppercase">
                  {awardTier}
                </span>
              </div>
            </div>

            {/* Certificate Footer & Signatures */}
            <div className="relative z-10 border-t border-slate-200 pt-4 px-4">
              <div className="grid grid-cols-3 items-end text-center">
                {/* Reference ID & Seal */}
                <div className="text-left space-y-1">
                  <div className="text-[10px] font-mono text-slate-600">Ref ID: {certNumber}</div>
                  <div className="text-[10px] font-mono text-slate-500">Issued: {customDate}</div>
                  <div className="flex items-center gap-1.5 text-[#006B3F] text-[10px] font-semibold font-sans mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Council Record
                  </div>
                </div>

                {/* Official Crest Badge */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-[#006B3F] flex flex-col items-center justify-center text-[#006B3F] shadow-xs">
                    <Award className="w-7 h-7" />
                    <span className="text-[8px] font-bold font-mono tracking-tighter uppercase mt-0.5">Official</span>
                  </div>
                </div>

                {/* Authorized Leader Signature */}
                <div className="text-right space-y-1">
                  <div className="font-serif italic text-sm text-[#800020] border-b border-slate-400 inline-block pb-0.5 min-w-[160px]">
                    {customSignatory}
                  </div>
                  <div className="text-[10px] font-sans text-slate-500 uppercase tracking-wider">Authorized Scout Master / Council Leader</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
