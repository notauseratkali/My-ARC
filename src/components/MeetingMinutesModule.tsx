import React, { useState } from 'react';
import {
  Member,
  MeetingMinutes,
  MeetingType,
  MeetingMinutesStatus,
  ActionItem,
  MeetingMinutesAttachment,
  PortalSettings,
} from '../types';
import { RichDocumentEditor } from './RichDocumentEditor';
import { hasPermission } from '../utils/permissions';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  UserX,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Printer,
  Edit2,
  Trash2,
  Send,
  Eye,
  CheckSquare,
  ShieldCheck,
  Award,
  List,
  Sparkles,
  ChevronRight,
  BookOpen,
  X,
  Upload,
  Paperclip,
} from 'lucide-react';

interface MeetingMinutesModuleProps {
  currentMember: Member;
  members: Member[];
  minutesList: MeetingMinutes[];
  onSaveMinutes: (minutes: MeetingMinutes) => void;
  onDeleteMinutes?: (id: string) => void;
  settings?: PortalSettings;
}

export const MeetingMinutesModule: React.FC<MeetingMinutesModuleProps> = ({
  currentMember,
  members,
  minutesList,
  onSaveMinutes,
  onDeleteMinutes,
  settings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'All' | MeetingType>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | MeetingMinutesStatus>('All');
  
  const [activeMinutesId, setActiveMinutesId] = useState<string | null>(
    minutesList.length > 0 ? minutesList[0].id : null
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMinutes, setEditingMinutes] = useState<MeetingMinutes | null>(null);

  // Form State for Create/Edit
  const [formTitle, setFormTitle] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [formType, setFormType] = useState<MeetingType>('Council Executive Meeting');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('20:00 - 21:30 MVT');
  const [formLocation, setFormLocation] = useState("Scout HQ Conference Room");
  const [formChairperson, setFormChairperson] = useState(currentMember.name);
  const [formSecretary, setFormSecretary] = useState('Ibrahim Rizwan (Secretary)');
  const [formAttendees, setFormAttendees] = useState<string[]>([]);
  const [formAbsentees, setFormAbsentees] = useState<string>('');
  const [formAgenda, setFormAgenda] = useState<string[]>(['1. Roll call and approval of agenda', '2. Sub-crew progress updates']);
  const [formResolutions, setFormResolutions] = useState<string[]>(['APPROVED: Operations roadmap for upcoming quarter.']);
  const [formActionItems, setFormActionItems] = useState<ActionItem[]>([
    {
      id: `act-${Date.now()}-1`,
      task: 'Publish meeting minutes to all crew members',
      assignedTo: currentMember.name,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'In Progress',
    },
  ]);
  const [formContent, setFormContent] = useState('');
  const [formAttachments, setFormAttachments] = useState<MeetingMinutesAttachment[]>([]);
  const [formStatus, setFormStatus] = useState<MeetingMinutesStatus>('Published');

  // Permissions Check
  const canManage =
    currentMember.councilRole === 'Secretary' ||
    currentMember.councilRole === 'Chairperson' ||
    currentMember.councilRole === 'Vice Chairperson' ||
    hasPermission(currentMember, 'manageMinutes', settings);

  // Filtered Minutes List
  const filteredList = minutesList.filter((m) => {
    // Non-council members only see Published minutes
    if (!canManage && m.status !== 'Published') return false;

    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.meetingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedTypeFilter === 'All' || m.meetingType === selectedTypeFilter;
    const matchesStatus = selectedStatusFilter === 'All' || m.status === selectedStatusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const selectedMinutes = minutesList.find((m) => m.id === activeMinutesId) || filteredList[0];

  const handleOpenCreateModal = (minutesToEdit?: MeetingMinutes) => {
    if (minutesToEdit) {
      setEditingMinutes(minutesToEdit);
      setFormTitle(minutesToEdit.title);
      setFormNumber(minutesToEdit.meetingNumber);
      setFormType(minutesToEdit.meetingType);
      setFormDate(minutesToEdit.date);
      setFormTime(minutesToEdit.time);
      setFormLocation(minutesToEdit.location);
      setFormChairperson(minutesToEdit.chairperson);
      setFormSecretary(minutesToEdit.secretary);
      setFormAttendees(minutesToEdit.attendees);
      setFormAbsentees((minutesToEdit.absenteeList || []).join(', '));
      setFormAgenda(minutesToEdit.agenda);
      setFormResolutions(minutesToEdit.resolutions);
      setFormActionItems(minutesToEdit.actionItems);
      setFormContent(minutesToEdit.content);
      setFormAttachments(minutesToEdit.attachments || []);
      setFormStatus(minutesToEdit.status);
    } else {
      setEditingMinutes(null);
      setFormTitle(`Council Meeting #${minutesList.length + 1}`);
      setFormNumber(`MM-2025/0${minutesList.length + 1}`);
      setFormType('Council Executive Meeting');
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormTime('20:00 - 21:30 MVT');
      setFormLocation("Scout HQ Conference Room");
      setFormChairperson('Zayd Ahmed (Chairperson)');
      setFormSecretary(`${currentMember.name} (Secretary)`);
      setFormAttendees(members.slice(0, 5).map((m) => m.name));
      setFormAbsentees('');
      setFormAgenda(['1. Approval of previous minutes', '2. Sub-crew status reports']);
      setFormResolutions(['RESOLVED: Approved proposed activities.']);
      setFormActionItems([
        {
          id: `act-${Date.now()}-1`,
          task: 'Follow up on event venue confirmation',
          assignedTo: currentMember.name,
          dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          status: 'In Progress',
        },
      ]);
      setFormContent(`# Council Executive Meeting Minutes\n**Date:** ${new Date().toLocaleDateString()}\n**Secretary:** ${currentMember.name}\n\n### Executive Summary\nThe council met to deliberate on key crew operations and award submissions.`);
      setFormAttachments([]);
      setFormStatus('Published');
    }
    setIsCreateModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Please enter a meeting title.');
      return;
    }

    const newMin: MeetingMinutes = {
      id: editingMinutes ? editingMinutes.id : `mm-${Date.now()}`,
      title: formTitle,
      meetingNumber: formNumber || `MM-${new Date().getFullYear()}/${minutesList.length + 1}`,
      meetingType: formType,
      date: formDate,
      time: formTime,
      location: formLocation,
      chairperson: formChairperson,
      secretary: formSecretary,
      attendees: formAttendees,
      absenteeList: formAbsentees ? formAbsentees.split(',').map((s) => s.trim()) : [],
      agenda: formAgenda.filter((a) => a.trim().length > 0),
      resolutions: formResolutions.filter((r) => r.trim().length > 0),
      actionItems: formActionItems,
      content: formContent,
      attachments: formAttachments,
      status: formStatus,
      publishedAt: formStatus === 'Published' ? new Date().toISOString() : undefined,
      createdAt: editingMinutes ? editingMinutes.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorId: currentMember.id,
    };

    onSaveMinutes(newMin);
    setActiveMinutesId(newMin.id);
    setIsCreateModalOpen(false);
  };

  const handleAddActionItem = () => {
    setFormActionItems([
      ...formActionItems,
      {
        id: `act-${Date.now()}`,
        task: '',
        assignedTo: members.length > 0 ? members[0].name : 'Member',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        status: 'Pending',
      },
    ]);
  };

  const handleToggleActionStatus = (minId: string, actionId: string) => {
    if (!selectedMinutes) return;
    const updatedActions = selectedMinutes.actionItems.map((act) => {
      if (act.id === actionId) {
        const nextStatus = act.status === 'Completed' ? 'Pending' : act.status === 'Pending' ? 'In Progress' : 'Completed';
        return { ...act, status: nextStatus };
      }
      return act;
    });

    onSaveMinutes({
      ...selectedMinutes,
      actionItems: updatedActions,
      updatedAt: new Date().toISOString(),
    });
  };

  const handlePrintMinutes = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secretary & Executive Council Governance</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>Official Meeting Minutes Portal</span>
            <span className="text-xs font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              Published for Rovers
            </span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Official records, resolutions, agendas, and action items recorded by the Crew Secretary and published for all Rovers.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => handleOpenCreateModal()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Meeting Minutes</span>
          </button>
        )}
      </div>

      {/* Main Layout Grid: Left Sidebar List + Right Minutes Document Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Minutes Catalog & Search */}
        <div className="lg:col-span-4 space-y-4">
          {/* Search & Filter Controls */}
          <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search meeting titles, resolutions, numbers..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Meeting Types</option>
                <option value="Council Executive Meeting">Council Executive Meeting</option>
                <option value="General Crew Assembly">General Crew Assembly</option>
                <option value="Sub-Crew Leader Sync">Sub-Crew Leader Sync</option>
                <option value="Emergency Council Meeting">Emergency Council Meeting</option>
                <option value="Annual General Meeting (AGM)">Annual General Meeting (AGM)</option>
              </select>

              {canManage && (
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  {(['All', 'Published', 'Draft'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedStatusFilter(st)}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition ${
                        selectedStatusFilter === st
                          ? 'bg-slate-800 text-emerald-400 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* List Cards */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredList.length === 0 ? (
              <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
                <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
                No meeting minutes match your filter criteria.
              </div>
            ) : (
              filteredList.map((m) => {
                const isSelected = selectedMinutes?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setActiveMinutesId(m.id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-2.5 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md'
                        : 'bg-[#1A1E26] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-emerald-400 px-2 py-0.5 rounded-full">
                        {m.meetingNumber}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                          m.status === 'Published'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 leading-snug line-clamp-2">
                      {m.title}
                    </h4>

                    <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{m.date} ({m.time})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{m.location}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        Secretary: <strong className="text-slate-200">{m.secretary.split(' ')[0]}</strong>
                      </span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        View Document <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Full Official Document Viewer */}
        <div className="lg:col-span-8">
          {!selectedMinutes ? (
            <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-base font-semibold text-slate-200">No Meeting Minutes Selected</p>
              <p className="text-xs text-slate-400">Select a record from the list to view full minutes and action items.</p>
            </div>
          ) : (
            <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 print:bg-white print:text-black print:border-none print:shadow-none">
              {/* Document Header & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                      {selectedMinutes.meetingNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {selectedMinutes.meetingType}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-100 leading-tight">
                    {selectedMinutes.title}
                  </h1>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={handlePrintMinutes}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
                    title="Print / Save to PDF"
                  >
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <span>Print PDF</span>
                  </button>

                  {canManage && (
                    <button
                      onClick={() => handleOpenCreateModal(selectedMinutes)}
                      className="p-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit Minutes</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Official Meeting Details Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Date & Time</span>
                  <span className="text-slate-200 font-bold">{selectedMinutes.date} ({selectedMinutes.time})</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Venue</span>
                  <span className="text-slate-200 font-bold truncate block">{selectedMinutes.location}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Chairperson</span>
                  <span className="text-emerald-400 font-bold">{selectedMinutes.chairperson}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Secretary</span>
                  <span className="text-emerald-400 font-bold">{selectedMinutes.secretary}</span>
                </div>
              </div>

              {/* Attendees & Absentees List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-900/50 border border-slate-800/80 p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <UserCheck className="w-4 h-4" />
                    <span>Present Attendees ({selectedMinutes.attendees.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMinutes.attendees.map((att, idx) => (
                      <span key={idx} className="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg font-medium border border-slate-700/50">
                        {att}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedMinutes.absenteeList && selectedMinutes.absenteeList.length > 0 && (
                  <div className="bg-slate-900/50 border border-slate-800/80 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400">
                      <UserX className="w-4 h-4" />
                      <span>Absentees / Apologies</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMinutes.absenteeList.map((abs, idx) => (
                        <span key={idx} className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg font-medium border border-slate-700/50">
                          {abs}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Agenda Box */}
              {selectedMinutes.agenda.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <List className="w-4 h-4 text-emerald-400" />
                    <span>Meeting Agenda Topics</span>
                  </h3>
                  <ul className="space-y-1 text-xs text-slate-200">
                    {selectedMinutes.agenda.map((ag, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{ag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Formatted Content Document Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Minutes Document Content & Detailed Discussions</span>
                </h3>

                <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed whitespace-pre-line bg-slate-950/50 border border-slate-800/80 p-5 rounded-xl">
                  {selectedMinutes.content}
                </div>
              </div>

              {/* Resolutions & Decisions Box */}
              {selectedMinutes.resolutions.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl space-y-2">
                  <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Official Council Resolutions & Decisions</span>
                  </h3>
                  <div className="space-y-1.5 text-xs text-slate-100 font-medium">
                    {selectedMinutes.resolutions.map((res, idx) => (
                      <p key={idx} className="bg-emerald-950/40 border border-emerald-500/20 p-2.5 rounded-lg">
                        {res}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Items Table */}
              {selectedMinutes.actionItems.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    <span>Assigned Action Items & Deadlines</span>
                  </h3>

                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs text-slate-200">
                      <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase">
                        <tr>
                          <th className="p-3">Action Task</th>
                          <th className="p-3">Assigned Lead</th>
                          <th className="p-3">Deadline</th>
                          <th className="p-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                        {selectedMinutes.actionItems.map((act) => (
                          <tr key={act.id} className="hover:bg-slate-800/30 transition">
                            <td className="p-3 font-medium text-slate-100">{act.task}</td>
                            <td className="p-3 font-mono text-emerald-400">{act.assignedTo}</td>
                            <td className="p-3 font-mono text-slate-400">{act.dueDate}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleToggleActionStatus(selectedMinutes.id, act.id)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition border ${
                                  act.status === 'Completed'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : act.status === 'In Progress'
                                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {act.status}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Photo Attachments Gallery */}
              {selectedMinutes.attachments && selectedMinutes.attachments.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-emerald-400" />
                    <span>Meeting Photos & Documentation ({selectedMinutes.attachments.length})</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedMinutes.attachments.map((att) => (
                      <div key={att.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group">
                        <img
                          src={att.url}
                          alt={att.name}
                          className="w-full h-40 object-cover group-hover:scale-105 transition duration-300"
                        />
                        {att.caption && (
                          <p className="p-2 text-[11px] text-slate-300 italic bg-slate-950 border-t border-slate-800">
                            {att.caption}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Sign-off Footer */}
              <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-mono">
                <div>
                  Published By: <span className="text-emerald-400 font-bold">{selectedMinutes.secretary}</span>
                </div>
                <div>
                  Record Date: <span>{selectedMinutes.date}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Minutes Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#161920] border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    {editingMinutes ? 'Edit Meeting Minutes' : 'Record New Council Meeting Minutes'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Write, format notes, attach photos, and publish to all Rovers.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              {/* Form Row 1: Title & Meeting Number */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-300 font-semibold">Meeting Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g., Council Executive Meeting #09"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Meeting Number</label>
                  <input
                    type="text"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    placeholder="MM-2025/09"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Form Row 2: Type, Date, Time, Location */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Meeting Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as MeetingType)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Council Executive Meeting">Council Executive Meeting</option>
                    <option value="General Crew Assembly">General Crew Assembly</option>
                    <option value="Sub-Crew Leader Sync">Sub-Crew Leader Sync</option>
                    <option value="Emergency Council Meeting">Emergency Council Meeting</option>
                    <option value="Annual General Meeting (AGM)">Annual General Meeting (AGM)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Time</label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="20:00 - 21:30 MVT"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Location / Venue</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Chair & Secretary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Chairperson</label>
                  <input
                    type="text"
                    value={formChairperson}
                    onChange={(e) => setFormChairperson(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Secretary (Recorded By)</label>
                  <input
                    type="text"
                    value={formSecretary}
                    onChange={(e) => setFormSecretary(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Rich Document Editor */}
              <div className="pt-2">
                <RichDocumentEditor
                  value={formContent}
                  onChange={setFormContent}
                  attachments={formAttachments}
                  onAttachmentsChange={setFormAttachments}
                  label="Official Minutes Document Notes & Deliberations (Word Formattable)"
                  placeholder="Record discussions, section reports, and official speeches here..."
                  minHeight="min-h-[200px]"
                />
              </div>

              {/* Action Items Setup */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                    Assigned Action Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddActionItem}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Action Task
                  </button>
                </div>

                {formActionItems.map((act, idx) => (
                  <div key={act.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <input
                      type="text"
                      value={act.task}
                      onChange={(e) => {
                        const updated = [...formActionItems];
                        updated[idx].task = e.target.value;
                        setFormActionItems(updated);
                      }}
                      placeholder="Task description..."
                      className="sm:col-span-6 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-100"
                    />
                    <select
                      value={act.assignedTo}
                      onChange={(e) => {
                        const updated = [...formActionItems];
                        updated[idx].assignedTo = e.target.value;
                        setFormActionItems(updated);
                      }}
                      className="sm:col-span-3 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.councilRole})
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={act.dueDate}
                      onChange={(e) => {
                        const updated = [...formActionItems];
                        updated[idx].dueDate = e.target.value;
                        setFormActionItems(updated);
                      }}
                      className="sm:col-span-3 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200"
                    />
                  </div>
                ))}
              </div>

              {/* Status and Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-slate-400 font-semibold">Publishing Status:</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as MeetingMinutesStatus)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Published">Published (Visible to All Rovers)</option>
                    <option value="Draft">Draft (Secretary Only)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{editingMinutes ? 'Update Minutes' : 'Publish Minutes'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
