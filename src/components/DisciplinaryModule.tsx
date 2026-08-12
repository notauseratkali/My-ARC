import React, { useState } from 'react';
import { RichDocumentEditor } from './RichDocumentEditor';
import {
  DisciplinaryIncident,
  InfractionCategory,
  DisciplinaryAction,
  DisciplinaryStatus,
  Member,
} from '../types';
import {
  ShieldAlert,
  Plus,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  Calendar,
  FileText,
  Edit2,
  Trash2,
  X,
  Eye,
  Shield,
} from 'lucide-react';

interface DisciplinaryModuleProps {
  incidents: DisciplinaryIncident[];
  members: Member[];
  currentMember: Member;
  onAddIncident: (incident: Omit<DisciplinaryIncident, 'id' | 'loggedBy'>) => void;
  onUpdateIncident: (incident: DisciplinaryIncident) => void;
  onDeleteIncident: (id: string) => void;
}

export const DisciplinaryModule: React.FC<DisciplinaryModuleProps> = ({
  incidents = [],
  members = [],
  currentMember,
  onAddIncident,
  onUpdateIncident,
  onDeleteIncident,
}) => {
  const isCouncil = currentMember.councilRole !== 'Member';

  const [statusFilter, setStatusFilter] = useState<DisciplinaryStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<InfractionCategory | 'All'>('All');

  // Modal State for Logging New / Editing Incident
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<DisciplinaryIncident | null>(null);

  const [formData, setFormData] = useState<{
    memberId: string;
    incidentDate: string;
    location: string;
    infractionCategory: InfractionCategory;
    narrativeNotes: string;
    actionTaken: DisciplinaryAction;
    effectiveStartDate: string;
    effectiveEndDate: string;
    status: DisciplinaryStatus;
    followUpRemarks: string;
    confidential: boolean;
  }>({
    memberId: members[0]?.id || '',
    incidentDate: new Date().toISOString().split('T')[0],
    location: '',
    infractionCategory: 'Conduct Breach',
    narrativeNotes: '',
    actionTaken: 'Warning Letter',
    effectiveStartDate: new Date().toISOString().split('T')[0],
    effectiveEndDate: '',
    status: 'Open',
    followUpRemarks: '',
    confidential: true,
  });

  const categories: InfractionCategory[] = [
    'Conduct Breach',
    'Policy Violation',
    'Attendance Neglect',
    'Financial Irregularity',
    'Safety Hazard',
    'Other',
  ];

  const actions: DisciplinaryAction[] = [
    'Warning Letter',
    'Temporary Suspension',
    'Mandatory Community Service',
    'Council Probation',
    'Termination',
  ];

  const statuses: DisciplinaryStatus[] = ['Open', 'Under Review', 'Resolved', 'Escalated'];

  const filteredIncidents = incidents.filter((inc) => {
    // General members can view disciplinary logs, but strictly restricted to their own individual logs
    if (!isCouncil && inc.memberId !== currentMember.id) return false;
    if (statusFilter !== 'All' && inc.status !== statusFilter) return false;
    if (categoryFilter !== 'All' && inc.infractionCategory !== categoryFilter) return false;
    return true;
  });



  const handleOpenAdd = () => {
    setEditingIncident(null);
    setFormData({
      memberId: members[0]?.id || '',
      incidentDate: new Date().toISOString().split('T')[0],
      location: '',
      infractionCategory: 'Conduct Breach',
      narrativeNotes: '',
      actionTaken: 'Warning Letter',
      effectiveStartDate: new Date().toISOString().split('T')[0],
      effectiveEndDate: '',
      status: 'Open',
      followUpRemarks: '',
      confidential: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inc: DisciplinaryIncident) => {
    setEditingIncident(inc);
    setFormData({
      memberId: inc.memberId,
      incidentDate: inc.incidentDate,
      location: inc.location,
      infractionCategory: inc.infractionCategory,
      narrativeNotes: inc.narrativeNotes,
      actionTaken: inc.actionTaken,
      effectiveStartDate: inc.effectiveStartDate,
      effectiveEndDate: inc.effectiveEndDate || '',
      status: inc.status,
      followUpRemarks: inc.followUpRemarks,
      confidential: inc.confidential,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId || !formData.narrativeNotes.trim()) {
      alert('Please select a member and enter incident narrative notes.');
      return;
    }

    const memberObj = members.find((m) => m.id === formData.memberId);
    const memberName = memberObj ? memberObj.name : 'Rover Member';

    if (editingIncident) {
      onUpdateIncident({
        ...editingIncident,
        memberId: formData.memberId,
        memberName,
        incidentDate: formData.incidentDate,
        location: formData.location,
        infractionCategory: formData.infractionCategory,
        narrativeNotes: formData.narrativeNotes,
        actionTaken: formData.actionTaken,
        effectiveStartDate: formData.effectiveStartDate,
        effectiveEndDate: formData.effectiveEndDate || undefined,
        status: formData.status,
        followUpRemarks: formData.followUpRemarks,
        confidential: formData.confidential,
      });
      alert('Incident case record updated.');
    } else {
      onAddIncident({
        memberId: formData.memberId,
        memberName,
        incidentDate: formData.incidentDate,
        location: formData.location,
        infractionCategory: formData.infractionCategory,
        narrativeNotes: formData.narrativeNotes,
        actionTaken: formData.actionTaken,
        effectiveStartDate: formData.effectiveStartDate,
        effectiveEndDate: formData.effectiveEndDate || undefined,
        status: formData.status,
        followUpRemarks: formData.followUpRemarks,
        confidential: formData.confidential,
      });
      alert(`Disciplinary incident logged for member "${memberName}". Case status: ${formData.status}.`);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1A1E26] border border-slate-800 p-5 rounded-2xl shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
              Disciplinary Action & Incident Management Module
            </h2>
            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
              Council Restricted
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Confidential case tracking for policy infractions, warnings, suspensions, and follow-up reviews.
          </p>
        </div>

        {isCouncil && (
          <button
            id="disciplinary-log-btn"
            onClick={handleOpenAdd}
            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Disciplinary Incident</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>Case Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-rose-600"
            >
              <option value="All">All Case Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Infraction Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-rose-600"
            >
              <option value="All">All Infraction Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-[11px] font-mono text-rose-400 font-semibold">
          {filteredIncidents.length} Confidential Incident Cases
        </span>
      </div>

      {/* Incident List Cards */}
      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
            No disciplinary incidents logged matching the selected filter constraints.
          </div>
        ) : (
          filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-slate-900 border border-slate-800 hover:border-rose-800/50 rounded-2xl p-5 shadow-lg space-y-4 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold px-2.5 py-0.5 rounded font-mono">
                      {inc.infractionCategory}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded font-mono ${
                        inc.status === 'Open'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : inc.status === 'Under Review'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : inc.status === 'Resolved'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      Status: {inc.status}
                    </span>
                    {inc.confidential && (
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-400" /> Confidential
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>Member: {inc.memberName}</span>
                  </h3>
                </div>

                {isCouncil && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(inc)}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 transition rounded-lg hover:bg-slate-800 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Case</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete incident record for ${inc.memberName}?`)) {
                          onDeleteIncident(inc.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-slate-800 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Narrative & Action Details */}
              <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl space-y-2 text-xs">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase font-bold block">
                    Incident Narrative Notes:
                  </span>
                  <p className="text-slate-200 mt-0.5 leading-relaxed">{inc.narrativeNotes}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-slate-800/80 pt-2 text-slate-300">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Action Sanction Taken:</span>
                    <span className="font-bold text-rose-400">{inc.actionTaken}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Effective Dates:</span>
                    <span>
                      {inc.effectiveStartDate} {inc.effectiveEndDate ? `to ${inc.effectiveEndDate}` : '(Ongoing)'}
                    </span>
                  </div>
                </div>

                {inc.followUpRemarks && (
                  <div className="border-t border-slate-800/80 pt-2">
                    <span className="font-mono text-[10px] text-amber-400 uppercase font-bold block">
                      Council Follow-up Remarks:
                    </span>
                    <p className="text-slate-300 mt-0.5 italic">{inc.followUpRemarks}</p>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                <span>Incident Date: {inc.incidentDate} ({inc.location || 'Location Not Specified'})</span>
                <span>Case Logged By: <strong className="text-slate-200">{inc.loggedBy}</strong></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New / Edit Incident Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-100 space-y-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold font-serif text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                {editingIncident ? 'Edit Incident Case Record' : 'Log Council Disciplinary Incident'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="col-span-full">
                <label className="block text-slate-300 font-medium mb-1">Select Member Involved *</label>
                <select
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                >
                  {members
                    .filter((m) => !m.isSuperAdmin && m.councilRole !== 'Superadmin')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.idCard} - {m.section} - {m.crewName})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Incident Date *</label>
                <input
                  type="date"
                  required
                  value={formData.incidentDate}
                  onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Incident Location</label>
                <input
                  type="text"
                  placeholder="e.g. Scout HQ Grounds"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Infraction Category</label>
                <select
                  value={formData.infractionCategory}
                  onChange={(e) => setFormData({ ...formData, infractionCategory: e.target.value as InfractionCategory })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Sanction Action Taken</label>
                <select
                  value={formData.actionTaken}
                  onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value as DisciplinaryAction })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                >
                  {actions.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-full">
                <RichDocumentEditor
                  value={formData.narrativeNotes}
                  onChange={(val) => setFormData({ ...formData, narrativeNotes: val })}
                  label="Detailed Incident Narrative & Photo Evidence (Word Formattable)"
                  placeholder="Factual summary of the infraction, witness accounts, photo attachments, and policy breach specifics..."
                  minHeight="min-h-[160px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Effective Start Date</label>
                <input
                  type="date"
                  value={formData.effectiveStartDate}
                  onChange={(e) => setFormData({ ...formData, effectiveStartDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Effective End Date (If Applicable)</label>
                <input
                  type="date"
                  value={formData.effectiveEndDate}
                  onChange={(e) => setFormData({ ...formData, effectiveEndDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Case Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as DisciplinaryStatus })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-full">
                <label className="block text-slate-300 font-medium mb-1">Final Follow-up Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Mandatory meeting scheduled with Chairperson before reinstatement..."
                  value={formData.followUpRemarks}
                  onChange={(e) => setFormData({ ...formData, followUpRemarks: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-5 py-2 rounded-xl transition shadow-md"
              >
                Save Incident Log
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
