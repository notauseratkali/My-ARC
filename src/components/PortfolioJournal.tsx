import React, { useState } from 'react';
import { RichDocumentEditor, PhotoAttachment } from './RichDocumentEditor';
import {
  JournalEntry,
  JournalCategory,
  Member,
  CrewEvent,
  PortalSettings,
} from '../types';
import {
  BookOpen,
  Sparkles,
  Plus,
  Calendar,
  Image,
  Link,
  Trash2,
  FileText,
  Check,
  RefreshCw,
  X,
  ExternalLink,
  ShieldAlert,
  Edit2,
} from 'lucide-react';

interface PortfolioJournalProps {
  journals: JournalEntry[];
  events: CrewEvent[];
  currentMember: Member;
  allMembers?: Member[];
  settings?: PortalSettings;
  onAddJournal: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateJournal: (entry: JournalEntry) => void;
  onDeleteJournal: (id: string) => void;
}

export const PortfolioJournal: React.FC<PortfolioJournalProps> = ({
  journals = [],
  events = [],
  currentMember,
  allMembers = [],
  settings = { aiEnabled: true, smsNotificationsEnabled: true, emailNotificationsEnabled: true, activeTerm: '1' },
  onAddJournal,
  onUpdateJournal,
  onDeleteJournal,
}) => {
  const [filterCategory, setFilterCategory] = useState<JournalCategory | 'All'>('All');

  // Modal State for New Journal Entry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    category: JournalCategory;
    content: string;
    date: string;
    linkedEventId: string;
    mediaUrlInput: string;
    mediaUrls: string[];
  }>({
    title: '',
    category: 'Personal Reflection',
    content: '',
    date: new Date().toISOString().split('T')[0],
    linkedEventId: '',
    mediaUrlInput: '',
    mediaUrls: [],
  });

  // AI Loading State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiActionType, setAiActionType] = useState<'polish' | 'report' | 'summarize' | 'proofread' | null>(null);

  const categories: JournalCategory[] = [
    'Personal Reflection',
    'Meeting Notes',
    'Camp Log',
    'Hike Record',
    'Service Project',
    'Council Log',
  ];

  // Filter Journals for Current Member (Members see their own + Council officers can view crew logs)
  const isCouncil = currentMember.councilRole !== 'Member';

  const visibleJournals = journals.filter((j) => {
    const isOwner = j.memberId === currentMember.id;
    if (!isOwner && !isCouncil) return false;
    if (filterCategory !== 'All' && j.category !== filterCategory) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingEntry(null);
    setFormData({
      title: '',
      category: 'Personal Reflection',
      content: '',
      date: new Date().toISOString().split('T')[0],
      linkedEventId: '',
      mediaUrlInput: '',
      mediaUrls: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      category: entry.category,
      content: entry.content,
      date: entry.date,
      linkedEventId: entry.linkedEventId || '',
      mediaUrlInput: '',
      mediaUrls: [...entry.mediaUrls],
    });
    setIsModalOpen(true);
  };

  const handleAddMediaUrl = () => {
    if (formData.mediaUrlInput.trim()) {
      setFormData({
        ...formData,
        mediaUrls: [...formData.mediaUrls, formData.mediaUrlInput.trim()],
        mediaUrlInput: '',
      });
    }
  };

  const handleRemoveMediaUrl = (idx: number) => {
    setFormData({
      ...formData,
      mediaUrls: formData.mediaUrls.filter((_, i) => i !== idx),
    });
  };

  const handleAIEnhance = async (action: 'polish' | 'report' | 'summarize' | 'proofread') => {
    if (!formData.content.trim()) {
      alert('Please write some initial journal content before applying AI enhancement.');
      return;
    }

    if (!settings.aiEnabled) {
      alert('AI Features are currently turned off in Crew Council settings.');
      return;
    }

    setAiLoading(true);
    setAiActionType(action);

    try {
      const response = await fetch('/api/ai/enhance-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: formData.content,
          action,
          title: formData.title,
          aiEnabled: settings.aiEnabled,
        }),
      });

      const data = await response.json();
      if (data.enhancedText) {
        setFormData((prev) => ({
          ...prev,
          content: data.enhancedText,
        }));
      } else if (data.error) {
        alert(`AI Error: ${data.error}`);
      }
    } catch (err: any) {
      console.error('AI Enhance failure:', err);
      alert('Failed to connect to AI enhancement service.');
    } finally {
      setAiLoading(false);
      setAiActionType(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Title and Content are required.');
      return;
    }

    if (editingEntry) {
      onUpdateJournal({
        ...editingEntry,
        title: formData.title,
        category: formData.category,
        content: formData.content,
        date: formData.date,
        linkedEventId: formData.linkedEventId || undefined,
        mediaUrls: formData.mediaUrls,
        updatedAt: new Date().toISOString(),
      });
      alert('Journal entry updated!');
    } else {
      onAddJournal({
        memberId: currentMember.id,
        title: formData.title,
        category: formData.category,
        content: formData.content,
        date: formData.date,
        linkedEventId: formData.linkedEventId || undefined,
        mediaUrls: formData.mediaUrls,
        aiPolished: false,
      });
      alert('New journal entry logged to your portfolio!');
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#006B3F]" />
            Member Personal Portfolio & Journal Workspace
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Confidential digital notebook for reflections, meeting notes, camp logs, certificates, and AI-polishing.
          </p>
        </div>

        <button
          id="journal-add-entry-btn"
          onClick={handleOpenAdd}
          className="bg-[#002B7F] hover:bg-blue-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Journal Entry</span>
        </button>
      </div>

      {/* Categories Filter Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setFilterCategory('All')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
            filterCategory === 'All'
              ? 'bg-blue-50 text-[#002B7F] border border-blue-200 font-semibold shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Categories ({journals.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              filterCategory === cat
                ? 'bg-blue-50 text-[#002B7F] border border-blue-200 font-semibold shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Journal Cards Stream */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleJournals.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs bg-white border border-slate-200 rounded-2xl">
            No journal entries recorded in this view. Click "New Journal Entry" to log your thoughts or activity notes.
          </div>
        ) : (
          visibleJournals.map((j) => {
            const author = allMembers.find((m) => m.id === j.memberId);
            const linkedEv = events.find((e) => e.id === j.linkedEventId);

            return (
              <div
                key={j.id}
                className="bg-white border border-slate-200 hover:border-[#002B7F]/40 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between transition"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="bg-emerald-50 text-[#006B3F] border border-emerald-200 font-mono font-semibold px-2 py-0.5 rounded">
                      {j.category}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {j.date}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900">{j.title}</h3>

                  {author && author.id !== currentMember.id && (
                    <p className="text-[11px] text-slate-500">
                      Author: <span className="text-[#002B7F] font-semibold">{author.name}</span> ({author.section})
                    </p>
                  )}

                  {linkedEv && (
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-[11px] text-slate-700 flex items-center gap-1.5">
                      <Link className="w-3.5 h-3.5 text-[#002B7F] flex-shrink-0" />
                      <span className="truncate">Linked Event: <strong>{linkedEv.title}</strong></span>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed line-clamp-6">
                    {j.content}
                  </p>

                  {/* Media attachments */}
                  {j.mediaUrls && j.mediaUrls.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                      {j.mediaUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[#002B7F] px-2 py-1 rounded-md flex items-center gap-1 transition"
                        >
                          <Image className="w-3 h-3" />
                          <span>Photo/Certificate #{i + 1}</span>
                          <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {j.aiPolished ? (
                    <span className="text-[#006B3F] font-medium text-[11px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI Formatted
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Draft Entry</span>
                  )}

                  {(j.memberId === currentMember.id || isCouncil) && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(j)}
                        className="text-slate-600 hover:text-[#002B7F] text-[11px] font-medium transition cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this journal entry?')) {
                            onDeleteJournal(j.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 text-[11px] font-medium transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New / Edit Journal Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-900 space-y-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#006B3F]" />
                {editingEntry ? 'Edit Portfolio Entry' : 'Log New Journal & Activity Entry'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Title / Activity Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Patrol Survival Exercise Log"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as JournalCategory })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Link Attended Event (Optional)</label>
                  <select
                    value={formData.linkedEventId}
                    onChange={(e) => setFormData({ ...formData, linkedEventId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  >
                    <option value="">-- No Linked Event --</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({ev.startDate.split('T')[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Journal Content Area + Admin-Controlled AI Tools Bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-medium">
                    Personal Reflections & Activity Log Details *
                  </label>

                  {/* AI Enhancement Actions Bar */}
                  {settings.aiEnabled ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[#006B3F] font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI Refine:
                      </span>
                      <button
                        type="button"
                        disabled={aiLoading}
                        onClick={() => handleAIEnhance('polish')}
                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#006B3F] text-[10px] px-2 py-1 rounded font-medium transition disabled:opacity-50 cursor-pointer"
                      >
                        {aiLoading && aiActionType === 'polish' ? 'Polishing...' : 'Refine & Polish'}
                      </button>
                      <button
                        type="button"
                        disabled={aiLoading}
                        onClick={() => handleAIEnhance('report')}
                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#006B3F] text-[10px] px-2 py-1 rounded font-medium transition disabled:opacity-50 cursor-pointer"
                      >
                        {aiLoading && aiActionType === 'report' ? 'Formatting...' : 'Report Style'}
                      </button>
                      <button
                        type="button"
                        disabled={aiLoading}
                        onClick={() => handleAIEnhance('proofread')}
                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#006B3F] text-[10px] px-2 py-1 rounded font-medium transition disabled:opacity-50 cursor-pointer"
                      >
                        {aiLoading && aiActionType === 'proofread' ? 'Checking...' : 'Proofread'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">
                      AI Polish disabled by Crew settings
                    </span>
                  )}
                </div>

                <RichDocumentEditor
                  value={formData.content}
                  onChange={(val) => setFormData({ ...formData, content: val })}
                  attachments={formData.mediaUrls.map((url, i) => ({
                    id: `media-${i}`,
                    name: `Photo #${i + 1}`,
                    url,
                  }))}
                  onAttachmentsChange={(atts) =>
                    setFormData({ ...formData, mediaUrls: atts.map((a) => a.url) })
                  }
                  label="Journal Reflections & Activity Details (Formattable Word Notes)"
                  placeholder="Write your personal reflections, activity details, meeting decisions, or hike observations..."
                  minHeight="min-h-[180px]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Note: AI Refinement strictly polishes and formats your existing factual text — it does not generate stories from scratch.
                </p>
              </div>

              {/* Additional Web Media Links */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Add Optional Web Image or Certificate URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.mediaUrlInput}
                    onChange={(e) => setFormData({ ...formData, mediaUrlInput: e.target.value })}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  />
                  <button
                    type="button"
                    onClick={handleAddMediaUrl}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-2 rounded-lg font-medium transition border border-slate-200 cursor-pointer"
                  >
                    Attach Link
                  </button>
                </div>

                {formData.mediaUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.mediaUrls.map((url, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-50 border border-slate-200 text-[#006B3F] text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-2"
                      >
                        <span className="truncate max-w-[200px]">{url}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMediaUrl(idx)}
                          className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#002B7F] hover:bg-blue-900 text-white text-xs font-semibold px-5 py-2 rounded-xl transition shadow-xs cursor-pointer"
              >
                Save Portfolio Entry
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
