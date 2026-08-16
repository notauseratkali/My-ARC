import React, { useState, useEffect } from 'react';
import {
  Member,
  PortalSettings,
  AIAssistantConfig,
  AIAssistantKnowledgeDoc,
  AIAssistantTrainingQA,
  CouncilRole,
  RoverOperatingPolicy,
  SyllabusRequirement,
  CrewEvent,
  AIMemberQuestionLog,
  AIQuestionCategory,
  AIQuestionQualityStatus,
} from '../types';
import {
  Bot,
  Sparkles,
  Shield,
  Users,
  BookOpen,
  HelpCircle,
  Play,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Search,
  Check,
  X,
  Sliders,
  FileText,
  SlidersHorizontal,
  Flame,
  Lightbulb,
  Send,
  MessageSquare,
  Lock,
  Unlock,
  Filter,
  Download,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Activity,
  CheckSquare,
  ArrowUpRight,
  BarChart3,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { getMemberAIAccessStatus } from '../utils/aiPermissions';
import { useToast } from './ToastContext';

interface AIAssistantTrainingHubProps {
  settings: PortalSettings;
  onUpdateSettings: (newSettings: PortalSettings) => void;
  members: Member[];
  policy?: RoverOperatingPolicy;
  syllabus?: SyllabusRequirement[];
  events?: CrewEvent[];
  currentMember: Member;
  onLogAudit?: (action: string, category: any, details: string, targetId?: string, targetName?: string) => void;
}

const ALL_ROLES: CouncilRole[] = [
  'Superadmin',
  'Rover Advisor',
  'Chairperson',
  'Vice Chairperson',
  'Secretary',
  'Treasurer',
  'Event Coordinator',
  'Progress Coordinator',
  'Media Coordinator',
  'Crew Leader',
  'Member',
];

const PRESET_PROMPTS = [
  {
    title: 'Official Rover Advisor Persona',
    prompt: `You are the Meyvaa Portal AI Scout Advisor, an expert assistant dedicated to assisting scout leaders, Rovers, explorers, and council members.
Your responsibilities:
1. Provide accurate guidance on Scout syllabus requirements (President's Scout Award, Baden-Powell Award, Auxiliary Badges).
2. Assist with drafting formal Scout Meeting Minutes, Event Agendas, Camp Plans, Risk Assessments, and Reflection Journals.
3. Explain group operating policies, referendum rules (minimum 7 days voting, majority Yea required for ratification), and attendance excusal policies.
4. Encourage leadership, community service, outdoor safety, and adherence to the Scout Promise and Scout Law.
Always respond in a structured, respectful, and motivating tone. Format responses with clear Markdown headings, bullet points, and actionable checklists.`,
  },
  {
    title: 'Curriculum & Badge Progression Coach',
    prompt: `You are the Meyvaa Portal AI Curriculum & Progression Specialist.
Your primary role is to guide scouts through their badge journey, breaking down requirements for the Baden-Powell Award and President's Scout Award into step-by-step practical action items.
Focus on:
- Explaining submission types (written reflections, photo proof, evidence documents).
- Recommending next badge milestones based on member interest.
- Providing logbook entry writing tips.
Tone: Highly encouraging, clear, structured, and pedagogical.`,
  },
  {
    title: 'Council Executive Secretary & Governance AI',
    prompt: `You are the Meyvaa Portal Governance & Secretarial AI Assistant.
Specialized in:
- Drafting parliamentary meeting minutes and structured agendas.
- Explaining voting quotas, quorum standards, and the 7-day referendum period for bylaws.
- Writing official notices, circulars, and resolution statements.
Tone: Formal, precise, authoritative, and compliant with Scouting constitution guidelines.`,
  },
];

export const AIAssistantTrainingHub: React.FC<AIAssistantTrainingHubProps> = ({
  settings,
  onUpdateSettings,
  members,
  policy,
  syllabus = [],
  events = [],
  currentMember,
  onLogAudit,
}) => {
  const { toastSuccess, toastInfo, toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'allocation' | 'persona' | 'knowledge' | 'fewshot' | 'inquiries' | 'sandbox'>('allocation');

  // Working copy of AI Assistant configuration
  const initialConfig: AIAssistantConfig = settings.aiAssistantConfig || {
    enabled: true,
    name: 'Meyvaa AI Scout Advisor',
    tagline: 'Official AI Assistant for Meyvaa Portal - Grounded in Scouting Excellence',
    allowAllMembers: false,
    allowedUserIds: ['m-superadmin'],
    allowedRoles: ['Superadmin'],
    systemPrompt: PRESET_PROMPTS[0].prompt,
    tone: 'Encouraging & Inspiring',
    temperature: 0.3,
    knowledgeDocs: [
      {
        id: 'kdoc-1',
        title: 'Bylaws & Governance: Referendum Policy Clause',
        category: 'Bylaws & Governance',
        content: 'Any council proposed edit or new clause to the Operating Policy MUST be submitted to a crew-wide referendum vote coordinated by the Secretary. The voting deadline must be at least 7 days (1 week). If Yea votes exceed Nay votes upon completion, the amendment is immediately enacted.',
        lastUpdated: '2026-08-01',
      },
      {
        id: 'kdoc-2',
        title: 'Syllabus Advancement: BP Award & President Scout Award',
        category: 'Curriculum & Badges',
        content: 'The Baden-Powell (BP) Award is the pinnacle Rover badge requiring mastery across Leadership, Community Service, Outdoor Skills, Personal Development, Scoutcraft, and Global Citizenship. All submissions require task verification, hours logging, and written reflection logbooks.',
        lastUpdated: '2026-08-01',
      },
    ],
    trainingQAs: [
      {
        id: 'tqa-1',
        question: 'How do I propose a change to the crew operating policy?',
        answer: 'To propose an amendment, the Council drafts the revision and the Secretary coordinates a formal crew-wide referendum poll. The voting period must remain open for a minimum of 7 days (1 week). If the Yea votes exceed Nay votes, the amendment is officially ratified.',
        category: 'Governance',
        createdAt: '2026-08-01',
      },
    ],
    lastTrainedAt: '2026-08-15',
    trainedBy: currentMember.name,
  };

  const [config, setConfig] = useState<AIAssistantConfig>(initialConfig);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Question Inquiries & Quality Control State
  const [questionLogs, setQuestionLogs] = useState<AIMemberQuestionLog[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState<boolean>(false);
  const [logSearch, setLogSearch] = useState<string>('');
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>('all');
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all');
  const [logRoleFilter, setLogRoleFilter] = useState<string>('all');
  const [qcStats, setQcStats] = useState<{
    totalInquiries: number;
    unreviewed: number;
    promoted: number;
    verified: number;
    needsReview: number;
    knowledgeGaps: number;
    restricted: number;
    helpfulPercentage: number;
    categoryCounts: Record<string, number>;
    roleCounts: Record<string, number>;
  }>({
    totalInquiries: 0,
    unreviewed: 0,
    promoted: 0,
    verified: 0,
    needsReview: 0,
    knowledgeGaps: 0,
    restricted: 0,
    helpfulPercentage: 100,
    categoryCounts: {},
    roleCounts: {},
  });

  // Selected Log for detail review drawer/modal
  const [selectedLogForReview, setSelectedLogForReview] = useState<AIMemberQuestionLog | null>(null);
  const [reviewNoteInput, setReviewNoteInput] = useState<string>('');
  const [reviewStatusInput, setReviewStatusInput] = useState<AIQuestionQualityStatus>('Verified High Quality');

  // Promote to Training QA Modal state
  const [promoteModalLog, setPromoteModalLog] = useState<AIMemberQuestionLog | null>(null);
  const [promoteQAQuestion, setPromoteQAQuestion] = useState<string>('');
  const [promoteQAAnswer, setPromoteQAAnswer] = useState<string>('');
  const [promoteQACategory, setPromoteQACategory] = useState<string>('General');
  const [isPromoting, setIsPromoting] = useState<boolean>(false);

  // Fetch question logs from backend
  const fetchQuestionLogs = async () => {
    setIsLogsLoading(true);
    try {
      const params = new URLSearchParams();
      if (logSearch) params.append('search', logSearch);
      if (logCategoryFilter !== 'all') params.append('category', logCategoryFilter);
      if (logStatusFilter !== 'all') params.append('status', logStatusFilter);
      if (logRoleFilter !== 'all') params.append('role', logRoleFilter);

      const res = await fetch(`/api/ai/question-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuestionLogs(data.logs || []);
        if (data.stats) {
          setQcStats(data.stats);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch question logs:', err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionLogs();
  }, [logCategoryFilter, logStatusFilter, logRoleFilter, activeTab]);

  // Knowledge base doc editor modal / inline state
  const [editingDoc, setEditingDoc] = useState<AIAssistantKnowledgeDoc | null>(null);
  const [isNewDocOpen, setIsNewDocOpen] = useState<boolean>(false);
  const [newDocForm, setNewDocForm] = useState<{
    title: string;
    category: AIAssistantKnowledgeDoc['category'];
    content: string;
  }>({
    title: '',
    category: 'General Operations',
    content: '',
  });

  // Few-Shot Q&A editor state
  const [isNewQAOpen, setIsNewQAOpen] = useState<boolean>(false);
  const [newQAForm, setNewQAForm] = useState<{
    question: string;
    answer: string;
    category: string;
  }>({
    question: '',
    answer: '',
    category: 'General',
  });

  // Sandbox Live Test State
  const [sandboxMessages, setSandboxMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: `Hello Superadmin **${currentMember.name}**! This is the live AI Assistant training sandbox running with your current active configuration. Test any question or directive below.`,
    },
  ]);
  const [sandboxInput, setSandboxInput] = useState('');
  const [isSandboxLoading, setIsSandboxLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Toggle user allocation
  const handleToggleUserAccess = (memberId: string) => {
    setConfig((prev) => {
      const currentAllowed = prev.allowedUserIds || [];
      const exists = currentAllowed.includes(memberId);
      const updated = exists ? currentAllowed.filter((id) => id !== memberId) : [...currentAllowed, memberId];
      return {
        ...prev,
        allowedUserIds: updated,
      };
    });
  };

  // Toggle role allocation
  const handleToggleRoleAccess = (role: CouncilRole) => {
    if (role === 'Superadmin') return; // Superadmin always has access
    setConfig((prev) => {
      const currentRoles = prev.allowedRoles || ['Superadmin'];
      const exists = currentRoles.includes(role);
      const updated = exists ? currentRoles.filter((r) => r !== role) : [...currentRoles, role];
      return {
        ...prev,
        allowedRoles: updated,
      };
    });
  };

  // Auto-sync portal live data into knowledge base
  const handleSyncPortalDataIntoKnowledge = () => {
    const newDocs: AIAssistantKnowledgeDoc[] = [];

    if (policy) {
      newDocs.push({
        id: `kdoc-policy-${Date.now()}`,
        title: `Official Operating Policy: ${policy.title} (${policy.version})`,
        category: 'Bylaws & Governance',
        content: `Title: ${policy.title}\nVersion: ${policy.version}\nLast Updated: ${policy.lastUpdated}\n\nFull Text:\n${policy.content.slice(0, 1500)}`,
        lastUpdated: new Date().toISOString().split('T')[0],
      });
    }

    if (syllabus.length > 0) {
      const syllabusSummary = syllabus
        .slice(0, 12)
        .map((s) => `- [${s.awardType}] ${s.title} (${s.category}): ${s.description} (Tasks: ${s.tasks.length})`)
        .join('\n');

      newDocs.push({
        id: `kdoc-syllabus-${Date.now()}`,
        title: `Curriculum Catalog Summary (${syllabus.length} Badges)`,
        category: 'Curriculum & Badges',
        content: `Active Scout Syllabus Items:\n${syllabusSummary}`,
        lastUpdated: new Date().toISOString().split('T')[0],
      });
    }

    if (events.length > 0) {
      const eventSummary = events
        .slice(0, 8)
        .map((e) => `- ${e.title} (${e.type}): ${e.startDate} at ${e.location}. ${e.description}`)
        .join('\n');

      newDocs.push({
        id: `kdoc-events-${Date.now()}`,
        title: `Upcoming Crew Calendar & Activities`,
        category: 'General Operations',
        content: `Scheduled Events:\n${eventSummary}`,
        lastUpdated: new Date().toISOString().split('T')[0],
      });
    }

    setConfig((prev) => {
      // Filter out previous auto-synced versions
      const existing = prev.knowledgeDocs.filter((d) => !d.id.startsWith('kdoc-policy-') && !d.id.startsWith('kdoc-syllabus-') && !d.id.startsWith('kdoc-events-'));
      return {
        ...prev,
        knowledgeDocs: [...existing, ...newDocs],
      };
    });

    toastSuccess(`Synced ${newDocs.length} live portal records into AI Knowledge Base!`);
  };

  // Add new knowledge doc
  const handleSaveDoc = () => {
    if (!newDocForm.title.trim() || !newDocForm.content.trim()) {
      toastError('Title and content are required for knowledge entries.');
      return;
    }

    if (editingDoc) {
      setConfig((prev) => ({
        ...prev,
        knowledgeDocs: prev.knowledgeDocs.map((d) =>
          d.id === editingDoc.id
            ? {
                ...d,
                title: newDocForm.title.trim(),
                category: newDocForm.category,
                content: newDocForm.content.trim(),
                lastUpdated: new Date().toISOString().split('T')[0],
              }
            : d
        ),
      }));
      setEditingDoc(null);
      toastSuccess('Knowledge entry updated.');
    } else {
      const docItem: AIAssistantKnowledgeDoc = {
        id: `kdoc-${Date.now()}`,
        title: newDocForm.title.trim(),
        category: newDocForm.category,
        content: newDocForm.content.trim(),
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      setConfig((prev) => ({
        ...prev,
        knowledgeDocs: [...prev.knowledgeDocs, docItem],
      }));
      toastSuccess('Knowledge entry added.');
    }

    setNewDocForm({ title: '', category: 'General Operations', content: '' });
    setIsNewDocOpen(false);
  };

  // Delete knowledge doc
  const handleDeleteDoc = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      knowledgeDocs: prev.knowledgeDocs.filter((d) => d.id !== id),
    }));
    toastInfo('Knowledge entry removed.');
  };

  // Add new Few-Shot QA
  const handleSaveQA = () => {
    if (!newQAForm.question.trim() || !newQAForm.answer.trim()) {
      toastError('Question and answer are required.');
      return;
    }

    const qaItem: AIAssistantTrainingQA = {
      id: `tqa-${Date.now()}`,
      question: newQAForm.question.trim(),
      answer: newQAForm.answer.trim(),
      category: newQAForm.category.trim() || 'General',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setConfig((prev) => ({
      ...prev,
      trainingQAs: [...(prev.trainingQAs || []), qaItem],
    }));

    setNewQAForm({ question: '', answer: '', category: 'General' });
    setIsNewQAOpen(false);
    toastSuccess('Training Q&A pair added.');
  };

  const handleDeleteQA = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      trainingQAs: (prev.trainingQAs || []).filter((q) => q.id !== id),
    }));
    toastInfo('Training Q&A pair removed.');
  };

  // Run Sandbox Test Prompt
  const handleSendSandboxMessage = async () => {
    if (!sandboxInput.trim() || isSandboxLoading) return;
    const userMsg = sandboxInput.trim();
    setSandboxInput('');

    const newHistory = [...sandboxMessages, { sender: 'user' as const, text: userMsg }];
    setSandboxMessages(newHistory);
    setIsSandboxLoading(true);

    try {
      const response = await fetch('/api/ai/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: newHistory,
          memberId: currentMember.id,
          memberRole: currentMember.councilRole,
          memberName: currentMember.name,
          isSuperAdmin: true,
          aiAssistantConfig: config,
          portalContext: {
            syllabusCount: syllabus.length,
            eventsCount: events.length,
            activeTerm: settings.activeTerm,
            crewName: settings.crewName,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get sandbox response');
      }

      const data = await response.json();
      setSandboxMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: data.response || 'No response generated.',
        },
      ]);
    } catch (err: any) {
      setSandboxMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `⚠️ Test Sandbox Error: ${err.message || 'Unable to connect to AI server.'}`,
        },
      ]);
    } finally {
      setIsSandboxLoading(false);
    }
  };

  // Open promote modal
  const handleOpenPromoteModal = (log: AIMemberQuestionLog) => {
    setPromoteModalLog(log);
    setPromoteQAQuestion(log.question);
    setPromoteQAAnswer(log.response);
    setPromoteQACategory(log.category || 'General');
  };

  // Confirm promotion to few-shot QA
  const handleConfirmPromoteQA = async () => {
    if (!promoteModalLog) return;
    if (!promoteQAQuestion.trim() || !promoteQAAnswer.trim()) {
      toastError('Question and expected answer are required.');
      return;
    }

    setIsPromoting(true);
    try {
      const res = await fetch(`/api/ai/question-logs/${promoteModalLog.id}/promote-to-training`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: promoteQAQuestion.trim(),
          answer: promoteQAAnswer.trim(),
          category: promoteQACategory.trim(),
          reviewedBy: `${currentMember.name} (Superadmin)`,
        }),
      });

      if (!res.ok) throw new Error('Failed to promote question to training.');

      const data = await res.json();
      if (data.qaItem) {
        // Add to active config QA pairs
        setConfig((prev) => ({
          ...prev,
          trainingQAs: [...(prev.trainingQAs || []), data.qaItem],
        }));
      }

      toastSuccess('Question promoted to active Few-Shot training dataset!');
      setPromoteModalLog(null);
      fetchQuestionLogs();
    } catch (err: any) {
      toastError(err.message || 'Failed to promote question.');
    } finally {
      setIsPromoting(false);
    }
  };

  // Update QC Status & Admin review notes
  const handleUpdateQCStatus = async (logId: string, status: AIQuestionQualityStatus, adminNotes?: string) => {
    try {
      const res = await fetch(`/api/ai/question-logs/${logId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          adminReviewNotes: adminNotes,
          reviewedBy: `${currentMember.name} (Superadmin)`,
        }),
      });

      if (res.ok) {
        toastSuccess(`Inquiry status updated to "${status}".`);
        fetchQuestionLogs();
        if (selectedLogForReview && selectedLogForReview.id === logId) {
          setSelectedLogForReview((prev) => (prev ? { ...prev, status, adminReviewNotes: adminNotes } : null));
        }
      }
    } catch (err) {
      toastError('Failed to update quality control record.');
    }
  };

  // Convert an inquiry into a Knowledge Base document
  const handleConvertLogToKnowledgeDoc = (log: AIMemberQuestionLog) => {
    setNewDocForm({
      title: `Official Guidance: ${log.question.slice(0, 50)}...`,
      category: log.category === 'Curriculum & Badges' ? 'Curriculum & Badges' : log.category === 'Bylaws & Governance' ? 'Bylaws & Governance' : log.category === 'Events & Attendance' ? 'Camp & Safety' : 'General Operations',
      content: `### Question / Member Inquiry Context\n${log.question}\n\n### Official Directive & Resolution\n${log.response}`,
    });
    setEditingDoc(null);
    setIsNewDocOpen(true);
    toastInfo('Knowledge Base creation form pre-filled with inquiry context.');
  };

  // Delete a question log
  const handleDeleteQuestionLog = async (logId: string) => {
    try {
      const res = await fetch(`/api/ai/question-logs/${logId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toastInfo('Inquiry log removed.');
        fetchQuestionLogs();
        if (selectedLogForReview?.id === logId) setSelectedLogForReview(null);
      }
    } catch (err) {
      toastError('Failed to delete question log.');
    }
  };

  // Export logs as JSON dataset
  const handleExportLogsJSON = () => {
    const dataStr = JSON.stringify(questionLogs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Meyvaa_AI_Member_Inquiries_Dataset_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toastSuccess('Exported AI Question Intelligence dataset (JSON).');
  };

  // Export logs as CSV
  const handleExportLogsCSV = () => {
    const headers = ['ID', 'Date', 'Member Name', 'Role', 'Category', 'Question', 'Response', 'Status', 'Feedback', 'Reviewed By'];
    const rows = questionLogs.map((l) => [
      l.id,
      l.timestamp,
      `"${(l.memberName || '').replace(/"/g, '""')}"`,
      l.memberRole,
      l.category,
      `"${(l.question || '').replace(/"/g, '""')}"`,
      `"${(l.response || '').replace(/"/g, '""')}"`,
      l.status,
      l.qualityRating || 'N/A',
      l.reviewedBy || 'N/A',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Meyvaa_AI_Quality_Control_Logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toastSuccess('Exported AI Quality Control dataset (CSV).');
  };

  // Save and deploy all training settings
  const handleDeployAndSave = () => {
    setIsSaving(true);

    const updatedConfig: AIAssistantConfig = {
      ...config,
      lastTrainedAt: new Date().toISOString().split('T')[0],
      trainedBy: `${currentMember.name} (Superadmin)`,
    };

    const newSettings: PortalSettings = {
      ...settings,
      aiAssistantConfig: updatedConfig,
    };

    onUpdateSettings(newSettings);

    if (onLogAudit) {
      onLogAudit(
        'AI Assistant Trained & Configured',
        'System',
        `Superadmin updated AI Assistant configuration (Allowed Roles: ${updatedConfig.allowedRoles.join(', ')}, Allowed Users: ${updatedConfig.allowedUserIds.length}, Knowledge Docs: ${updatedConfig.knowledgeDocs.length}).`,
        'ai-assistant-config',
        updatedConfig.name
      );
    }

    setTimeout(() => {
      setIsSaving(false);
      toastSuccess('AI Assistant training & user allocation successfully deployed!');
    }, 400);
  };

  // Filtered members for allocation matrix
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchMemberQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchMemberQuery.toLowerCase()) ||
      m.councilRole.toLowerCase().includes(searchMemberQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || m.councilRole === filterRole;
    return matchesSearch && matchesRole;
  });

  const totalAllocatedCount = members.filter((m) => {
    const status = getMemberAIAccessStatus(m, { ...settings, aiAssistantConfig: config });
    return status.hasAccess;
  }).length;

  return (
    <div id="ai-assistant-training-hub" className="space-y-6">
      {/* Top Banner - Superadmin Training Hub Master Card (Primary Maroon) */}
      <div className="bg-[#800000] text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden border border-[#800000]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
              <Shield className="w-3.5 h-3.5 text-white" />
              <span>Superadmin Control Panel • AI Engine Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              AI Assistant Training & Allocation Hub
            </h1>
            <p className="text-white/90 text-sm leading-relaxed">
              Configure, train, and allocate access to the Meyvaa Portal AI Scout Assistant. Only authorized Superadmins can modify training parameters, knowledge bases, few-shot examples, and assign access permissions to specific council roles and members.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleDeployAndSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[#800000] font-bold text-sm shadow-md hover:bg-slate-100 transition cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#800000]" />
                  <span>Deploying...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#800000]" />
                  <span>Deploy & Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <div className="text-xs text-white/80 font-medium">Status</div>
            <div className="text-lg font-bold text-white flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {config.enabled ? 'Active & Live' : 'Disabled'}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <div className="text-xs text-white/80 font-medium">Allocated Users</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {config.allowAllMembers ? 'All Members' : `${totalAllocatedCount} / ${members.length}`}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <div className="text-xs text-white/80 font-medium">Knowledge Docs</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {config.knowledgeDocs.length} Articles
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <div className="text-xs text-white/80 font-medium">Few-Shot Pairs</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {(config.trainingQAs || []).length} Trained Q&As
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-white rounded-xl border border-[#FFD0D0] p-1.5 flex flex-wrap gap-1 shadow-xs">
        <button
          onClick={() => setActiveTab('allocation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === 'allocation'
              ? 'bg-[#800000] text-white shadow-xs'
              : 'text-slate-700 hover:bg-[#FFF0F0] hover:text-[#800000]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Access Allocation Matrix</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'allocation' ? 'bg-white text-[#800000]' : 'bg-[#FFF0F0] text-[#800000]'}`}>
            {config.allowAllMembers ? 'All' : totalAllocatedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('persona')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === 'persona'
              ? 'bg-[#800000] text-white shadow-xs'
              : 'text-slate-700 hover:bg-[#FFF0F0] hover:text-[#800000]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>AI Persona & Prompt Training</span>
        </button>

        <button
          onClick={() => setActiveTab('knowledge')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === 'knowledge'
              ? 'bg-[#800000] text-white shadow-xs'
              : 'text-slate-700 hover:bg-[#FFF0F0] hover:text-[#800000]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Knowledge Base & Docs</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'knowledge' ? 'bg-white text-[#800000]' : 'bg-[#FFF0F0] text-[#800000]'}`}>
            {config.knowledgeDocs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('fewshot')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === 'fewshot'
              ? 'bg-[#800000] text-white shadow-xs'
              : 'text-slate-700 hover:bg-[#FFF0F0] hover:text-[#800000]'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Few-Shot Q&A Pairs</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'fewshot' ? 'bg-white text-[#800000]' : 'bg-[#FFF0F0] text-[#800000]'}`}>
            {(config.trainingQAs || []).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === 'inquiries'
              ? 'bg-[#800000] text-white shadow-xs'
              : 'text-slate-700 hover:bg-[#FFF0F0] hover:text-[#800000]'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-[#800000]" />
          <span>Question Intelligence & QC</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'inquiries' ? 'bg-white text-[#800000]' : 'bg-[#FFF0F0] text-[#800000]'}`}>
            {qcStats.totalInquiries > 0 ? `${qcStats.totalInquiries}` : questionLogs.length}
          </span>
          {qcStats.unreviewed > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-extrabold animate-pulse">
              {qcStats.unreviewed} new
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sandbox')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === 'sandbox'
              ? 'bg-[#800000] text-white shadow-xs'
              : 'text-slate-700 hover:bg-[#FFF0F0] hover:text-[#800000]'
          }`}
        >
          <Play className="w-4 h-4 text-emerald-500" />
          <span>Interactive Sandbox Simulator</span>
        </button>
      </div>

      {/* TAB 1: ACCESS ALLOCATION MATRIX */}
      {activeTab === 'allocation' && (
        <div className="space-y-6">
          {/* Master Scope & Role Permissions Card (Rose Pink Subtle Card - Black text) */}
          <div className="bg-[#FFF0F0] text-black border border-[#FFD0D0] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#FFD0D0] pb-4">
              <div>
                <h3 className="text-lg font-bold text-black flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#800000]" />
                  Global AI Access Policy
                </h3>
                <p className="text-xs text-black/80 mt-1">
                  Define high-level allocation rules. Superadmins always retain unrestricted access.
                </p>
              </div>

              {/* Master AI Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-black">Master AI Engine:</span>
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    config.enabled ? 'bg-[#800000]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      config.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Scope Mode Switcher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                onClick={() => setConfig((prev) => ({ ...prev, allowAllMembers: false }))}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3.5 ${
                  !config.allowAllMembers
                    ? 'border-[#800000] bg-white shadow-xs'
                    : 'border-[#FFD0D0] bg-white/60 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="accessMode"
                  checked={!config.allowAllMembers}
                  onChange={() => {}}
                  className="mt-1 text-[#800000]"
                />
                <div>
                  <div className="text-sm font-bold text-black flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-[#800000]" />
                    Allocated Only (Recommended)
                  </div>
                  <p className="text-xs text-black/80 mt-1 leading-relaxed">
                    AI Assistant is visible and accessible only to Superadmin, designated Council Roles, and specifically allowed members.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setConfig((prev) => ({ ...prev, allowAllMembers: true }))}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3.5 ${
                  config.allowAllMembers
                    ? 'border-[#800000] bg-white shadow-xs'
                    : 'border-[#FFD0D0] bg-white/60 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="accessMode"
                  checked={config.allowAllMembers}
                  onChange={() => {}}
                  className="mt-1 text-[#800000]"
                />
                <div>
                  <div className="text-sm font-bold text-black flex items-center gap-1.5">
                    <Unlock className="w-4 h-4 text-emerald-700" />
                    Open to All Crew Members
                  </div>
                  <p className="text-xs text-black/80 mt-1 leading-relaxed">
                    Every active crew member will be able to see, open, and interact with the AI Assistant across the portal.
                  </p>
                </div>
              </label>
            </div>

            {/* Role-Based Quick Allocation */}
            {!config.allowAllMembers && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-black uppercase tracking-wider">
                  Allocate by Council Role
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((role) => {
                    const isSuper = role === 'Superadmin';
                    const isChecked = isSuper || (config.allowedRoles || []).includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleToggleRoleAccess(role)}
                        disabled={isSuper}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                          isChecked
                            ? 'bg-[#800000] text-white shadow-xs'
                            : 'bg-white text-black border border-[#FFD0D0] hover:bg-[#FFE5E5]'
                        } ${isSuper ? 'opacity-80 cursor-not-allowed' : ''}`}
                      >
                        {isChecked ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{role}</span>
                        {isSuper && <span className="text-[10px] text-white/80">(Always)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Member-Level Granular Allocation Table */}
          <div className="bg-white rounded-2xl border border-[#FFD0D0] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Individual Member Access Directory
                </h3>
                <p className="text-xs text-slate-600">
                  Search members and toggle direct AI Assistant allocation.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchMemberQuery}
                    onChange={(e) => setSearchMemberQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-3 py-1.5 bg-[#FFF0F0] border border-[#FFD0D0] rounded-lg text-xs text-black placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                  />
                </div>

                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  aria-label="Filter members by council role"
                  className="w-full sm:w-auto px-3 py-1.5 bg-[#FFF0F0] border border-[#FFD0D0] rounded-lg text-xs text-black font-medium focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                >
                  <option value="all">All Roles ({members.length})</option>
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-[#FFD0D0] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF0F0] text-black font-bold uppercase tracking-wider border-b border-[#FFD0D0]">
                  <tr>
                    <th className="p-3">Member Name & Email</th>
                    <th className="p-3">Council Role</th>
                    <th className="p-3">Access Status</th>
                    <th className="p-3 text-right">Allocation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FFD0D0]">
                  {filteredMembers.map((member) => {
                    const status = getMemberAIAccessStatus(member, { ...settings, aiAssistantConfig: config });
                    const isSuper = member.isSuperAdmin || member.councilRole === 'Superadmin';
                    const isDirectlyGranted = (config.allowedUserIds || []).includes(member.id);

                    return (
                      <tr key={member.id} className="hover:bg-[#FFF5F5] transition">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-[#FFD0D0]"
                            />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                {member.name}
                                {isSuper && (
                                  <span className="px-1.5 py-0.2 bg-[#800000] text-white text-[10px] rounded-sm font-bold">
                                    Superadmin
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">{member.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 font-semibold text-slate-700">
                          {member.councilRole}
                        </td>

                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${status.badgeColor}`}>
                            {status.hasAccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {status.hasAccess ? `Allowed (${status.source})` : 'Restricted'}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          {isSuper ? (
                            <span className="text-xs text-slate-400 italic font-medium">
                              Full Superadmin Access
                            </span>
                          ) : config.allowAllMembers ? (
                            <span className="text-xs text-emerald-600 font-medium">
                              Enabled by Global Policy
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleUserAccess(member.id)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                isDirectlyGranted
                                  ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                  : 'bg-[#800000] text-white hover:bg-[#990000]'
                              }`}
                            >
                              {isDirectlyGranted ? 'Revoke Direct Grant' : 'Grant AI Access'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONA & PROMPT TRAINING */}
      {activeTab === 'persona' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-[#FFD0D0] p-6 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Assistant Identity & Persona Directives
                </h3>
                <p className="text-xs text-slate-600">
                  Train the core system instruction that guides how the AI interprets scouting tasks and answers queries.
                </p>
              </div>

              {/* Preset Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Load Preset Scouting Persona
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {PRESET_PROMPTS.map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => {
                        setConfig((prev) => ({ ...prev, systemPrompt: preset.prompt }));
                        toastInfo(`Loaded "${preset.title}" preset template.`);
                      }}
                      className="p-3 text-left rounded-xl border border-[#FFD0D0] bg-[#FFF0F0] hover:bg-[#FFE5E5] transition cursor-pointer"
                    >
                      <div className="text-xs font-bold text-black">{preset.title}</div>
                      <div className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                        {preset.prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* System Prompt Editor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Custom System Prompt / Instruction
                </label>
                <textarea
                  rows={10}
                  value={config.systemPrompt}
                  onChange={(e) => setConfig((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                  placeholder="Enter the primary system instructions and rules for the AI Scout Assistant..."
                  className="w-full p-4 bg-[#FFF0F0] border border-[#FFD0D0] rounded-xl text-xs text-black font-mono leading-relaxed placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                />
              </div>

              {/* Tone & Style Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Response Tone & Atmosphere
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      'Encouraging & Inspiring',
                      'Professional & Structured',
                      'Direct & Action-Oriented',
                      'Strict Policy Auditor',
                    ] as const
                  ).map((toneOption) => (
                    <button
                      key={toneOption}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, tone: toneOption }))}
                      className={`p-2.5 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                        config.tone === toneOption
                          ? 'bg-[#800000] text-white shadow-xs'
                          : 'bg-[#FFF0F0] text-black border border-[#FFD0D0] hover:bg-[#FFE5E5]'
                      }`}
                    >
                      {toneOption}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Settings: Names, Model & Temperature */}
          <div className="space-y-6">
            <div className="bg-[#FFF0F0] text-black rounded-2xl border border-[#FFD0D0] p-6 shadow-xs space-y-5">
              <h3 className="text-base font-bold text-black flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#800000]" />
                Display Configuration
              </h3>

              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                  Assistant Display Name
                </label>
                <input
                  type="text"
                  value={config.name || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Meyvaa AI Scout Advisor"
                  className="w-full px-3.5 py-2 bg-white border border-[#FFD0D0] rounded-xl text-xs text-black font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={config.tagline || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, tagline: e.target.value }))}
                  placeholder="e.g. Official Scout Knowledge Assistant"
                  className="w-full px-3.5 py-2 bg-white border border-[#FFD0D0] rounded-xl text-xs text-black focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-black uppercase tracking-wider">
                    Creativity / Temperature
                  </label>
                  <span className="text-xs font-bold text-[#800000]">{config.temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={config.temperature}
                  onChange={(e) => setConfig((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full accent-[#800000] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>0.0 (Precise & Factual)</span>
                  <span>1.0 (Creative & Varied)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#FFD0D0] text-xs text-slate-700 space-y-1.5">
                <div className="font-semibold text-black">Model Architecture:</div>
                <div className="font-mono text-[11px] bg-white p-2 rounded-lg border border-[#FFD0D0] text-[#800000] font-bold">
                  gemini-3.7-flash (Multimodal Fast Text)
                </div>
                <div className="text-[11px] text-slate-600">
                  Last trained on {config.lastTrainedAt || '2026-08-15'} by {config.trainedBy || 'Superadmin'}.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KNOWLEDGE BASE & TRAINING DOCUMENTS */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#FFD0D0] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FFD0D0] pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#800000]" />
                  Scouting Knowledge Base & Directives
                </h3>
                <p className="text-xs text-slate-600">
                  Ground the AI Assistant in specific bylaws, curriculum specifications, emergency rules, and camp policies.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSyncPortalDataIntoKnowledge}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFF0F0] text-[#800000] border border-[#FFD0D0] font-bold text-xs hover:bg-[#FFE5E5] transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Auto-Sync Live Portal Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingDoc(null);
                    setNewDocForm({ title: '', category: 'General Operations', content: '' });
                    setIsNewDocOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#800000] text-white font-bold text-xs hover:bg-[#990000] transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Knowledge Entry</span>
                </button>
              </div>
            </div>

            {/* List of Docs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.knowledgeDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-[#FFF0F0] text-black border border-[#FFD0D0] rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm text-black">{doc.title}</div>
                      <span className="px-2 py-0.5 rounded-full bg-white text-[#800000] text-[10px] font-bold border border-[#FFD0D0]">
                        {doc.category}
                      </span>
                    </div>
                    <p className="text-xs text-black/80 mt-2 line-clamp-4 leading-relaxed font-mono">
                      {doc.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#FFD0D0] text-[11px] text-slate-600">
                    <span>Updated: {doc.lastUpdated}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDoc(doc);
                          setNewDocForm({
                            title: doc.title,
                            category: doc.category,
                            content: doc.content,
                          });
                          setIsNewDocOpen(true);
                        }}
                        className="p-1.5 text-slate-700 hover:text-[#800000] bg-white rounded-lg border border-[#FFD0D0] transition cursor-pointer"
                        title="Edit entry"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 bg-white rounded-lg border border-[#FFD0D0] transition cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {config.knowledgeDocs.length === 0 && (
              <div className="text-center py-10 bg-[#FFF0F0] rounded-xl border border-dashed border-[#FFD0D0]">
                <BookOpen className="w-8 h-8 text-[#800000] mx-auto mb-2 opacity-50" />
                <p className="text-xs text-black font-semibold">No custom knowledge documents added yet.</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Click "Auto-Sync Live Portal Data" or "Add Knowledge Entry" above.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: FEW-SHOT Q&A EXAMPLES */}
      {activeTab === 'fewshot' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#FFD0D0] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FFD0D0] pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#800000]" />
                  Few-Shot Q&A Direct Training Examples
                </h3>
                <p className="text-xs text-slate-600">
                  Provide exact question and answer pairs to teach the AI the precise official phrasing and policy guidance for key scout topics.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewQAOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#800000] text-white font-bold text-xs hover:bg-[#990000] transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Q&A Example</span>
              </button>
            </div>

            <div className="space-y-3">
              {(config.trainingQAs || []).map((qa, idx) => (
                <div
                  key={qa.id}
                  className="bg-[#FFF0F0] text-black border border-[#FFD0D0] rounded-xl p-4 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#800000] text-white flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-sm text-black">Q: {qa.question}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteQA(qa.id)}
                      className="text-rose-600 hover:text-rose-800 p-1 rounded-md transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="pl-8 text-xs text-black/90 font-mono bg-white p-3 rounded-lg border border-[#FFD0D0]">
                    <span className="font-bold text-[#800000]">Expected Answer:</span> {qa.answer}
                  </div>
                </div>
              ))}

              {(config.trainingQAs || []).length === 0 && (
                <div className="text-center py-10 bg-[#FFF0F0] rounded-xl border border-dashed border-[#FFD0D0]">
                  <HelpCircle className="w-8 h-8 text-[#800000] mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-black font-semibold">No few-shot Q&A pairs configured.</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">Add Q&A examples to teach the assistant direct answers.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: QUESTION INTELLIGENCE & QUALITY CONTROL (DATA COLLECTION & TRAINING) */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6">
          {/* Top Analytics Summary Metrics (Rose Pink Subtle Card with Dark Accents) */}
          <div className="bg-[#FFF0F0] text-black border border-[#FFD0D0] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FFD0D0] pb-4">
              <div>
                <h3 className="text-lg font-bold text-black flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#800000]" />
                  AI Question Intelligence & Quality Control Hub
                </h3>
                <p className="text-xs text-black/80 mt-1">
                  Telemetry and prompt dataset generated from real member questions across allocated roles. Review answers, spot knowledge gaps, and promote high-value inquiries directly into few-shot training.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportLogsJSON}
                  className="px-3 py-2 rounded-xl bg-white border border-[#FFD0D0] text-black font-bold text-xs hover:bg-[#FFE5E5] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Export full dataset in JSON format for fine-tuning"
                >
                  <Download className="w-3.5 h-3.5 text-[#800000]" />
                  <span>Export JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportLogsCSV}
                  className="px-3 py-2 rounded-xl bg-white border border-[#FFD0D0] text-black font-bold text-xs hover:bg-[#FFE5E5] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Export quality control logs in CSV format"
                >
                  <Download className="w-3.5 h-3.5 text-[#800000]" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={fetchQuestionLogs}
                  disabled={isLogsLoading}
                  className="p-2 rounded-xl bg-white border border-[#FFD0D0] text-black hover:bg-[#FFE5E5] transition cursor-pointer shadow-2xs"
                  title="Refresh logs from server"
                >
                  <RefreshCw className={`w-4 h-4 text-[#800000] ${isLogsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white rounded-xl p-3.5 border border-[#FFD0D0] shadow-2xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Questions</div>
                <div className="text-xl font-extrabold text-slate-900 mt-1">{qcStats.totalInquiries}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Collected from members</div>
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-2xs">
                <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Unreviewed</div>
                <div className="text-xl font-extrabold text-amber-700 mt-1">{qcStats.unreviewed}</div>
                <div className="text-[10px] text-amber-600 mt-0.5">Pending QC check</div>
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-purple-200 shadow-2xs">
                <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Trained Q&As</div>
                <div className="text-xl font-extrabold text-purple-700 mt-1">{qcStats.promoted}</div>
                <div className="text-[10px] text-purple-600 mt-0.5">Promoted to Few-Shot</div>
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-emerald-200 shadow-2xs">
                <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Verified High QC</div>
                <div className="text-xl font-extrabold text-emerald-700 mt-1">{qcStats.verified}</div>
                <div className="text-[10px] text-emerald-600 mt-0.5">Passed council audit</div>
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-rose-200 shadow-2xs">
                <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Knowledge Gaps</div>
                <div className="text-xl font-extrabold text-rose-700 mt-1">{qcStats.knowledgeGaps}</div>
                <div className="text-[10px] text-rose-600 mt-0.5">Missing policy docs</div>
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-[#FFD0D0] shadow-2xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Member Approval</div>
                <div className="text-xl font-extrabold text-emerald-600 mt-1">{qcStats.helpfulPercentage}%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Helpful feedback rate</div>
              </div>
            </div>
          </div>

          {/* Search, Filters and Sorting Bar */}
          <div className="bg-white rounded-2xl border border-[#FFD0D0] p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchQuestionLogs()}
                  placeholder="Search questions, answers, or member names..."
                  className="w-full pl-9 pr-4 py-2 bg-[#FFF0F0] border border-[#FFD0D0] rounded-xl text-xs text-black placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                />
              </div>

              {/* Category Filter */}
              <div className="w-full md:w-48">
                <select
                  value={logCategoryFilter}
                  onChange={(e) => setLogCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF0F0] border border-[#FFD0D0] rounded-xl text-xs text-black font-medium focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                >
                  <option value="all">All Categories</option>
                  <option value="Curriculum & Badges">Curriculum & Badges</option>
                  <option value="Bylaws & Governance">Bylaws & Governance</option>
                  <option value="Events & Attendance">Events & Attendance</option>
                  <option value="Portfolio & Journals">Portfolio & Journals</option>
                  <option value="Finance & Dues">Finance & Dues</option>
                  <option value="Access Control & Permissions">Access & Permissions</option>
                  <option value="General Scouting">General Scouting</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-44">
                <select
                  value={logStatusFilter}
                  onChange={(e) => setLogStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF0F0] border border-[#FFD0D0] rounded-xl text-xs text-black font-medium focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                >
                  <option value="all">All QC Statuses</option>
                  <option value="Unreviewed">Unreviewed</option>
                  <option value="Promoted to Training">Promoted to Training</option>
                  <option value="Verified High Quality">Verified High Quality</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                  <option value="Knowledge Gap">Knowledge Gap</option>
                  <option value="Restricted / Out of Scope">Restricted / Out of Scope</option>
                </select>
              </div>

              {/* Member Role Filter */}
              <div className="w-full md:w-40">
                <select
                  value={logRoleFilter}
                  onChange={(e) => setLogRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF0F0] border border-[#FFD0D0] rounded-xl text-xs text-black font-medium focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                >
                  <option value="all">All Roles</option>
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={fetchQuestionLogs}
                className="w-full md:w-auto px-4 py-2 bg-[#800000] text-white rounded-xl text-xs font-bold hover:bg-[#990000] transition cursor-pointer shrink-0 shadow-2xs"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Question Logs List */}
          <div className="space-y-3">
            {isLogsLoading ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-[#FFD0D0]">
                <RefreshCw className="w-6 h-6 text-[#800000] animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-semibold">Loading Member Question telemetry...</p>
              </div>
            ) : questionLogs.length === 0 ? (
              <div className="text-center py-12 bg-[#FFF0F0] rounded-2xl border border-dashed border-[#FFD0D0]">
                <MessageSquare className="w-10 h-10 text-[#800000] mx-auto mb-2 opacity-60" />
                <h4 className="text-sm font-bold text-black">No member question records found</h4>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  Member queries from the AI Chatbot and Floating widget will be automatically collected here for continuous quality control and training dataset expansion.
                </p>
              </div>
            ) : (
              questionLogs.map((log) => {
                const isPromoted = log.status === 'Promoted to Training';
                const isVerified = log.status === 'Verified High Quality';
                const isNeedsImprovement = log.status === 'Needs Improvement';
                const isKnowledgeGap = log.status === 'Knowledge Gap';
                const isRestricted = log.status === 'Restricted / Out of Scope';

                return (
                  <div
                    key={log.id}
                    className="bg-white rounded-2xl border border-[#FFD0D0] p-5 shadow-xs hover:shadow-md transition space-y-4"
                  >
                    {/* Header: Member Info, Role Badge, Category, QC Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#FFF0F0] text-[#800000] border border-[#FFD0D0] flex items-center justify-center font-bold text-xs shrink-0">
                          {log.memberName ? log.memberName.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{log.memberName}</span>
                            <span className="px-2 py-0.5 rounded-md bg-[#FFF0F0] text-[#800000] border border-[#FFD0D0] text-[10px] font-bold">
                              {log.memberRole}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(log.timestamp).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-medium">Source: {log.source}</span>
                            {log.responseLatencyMs && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                • {log.responseLatencyMs}ms latency
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status and Category Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                          {log.category}
                        </span>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            isPromoted
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : isVerified
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isNeedsImprovement
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : isKnowledgeGap
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isRestricted
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isPromoted && <Sparkles className="w-3 h-3 text-purple-600" />}
                          {isVerified && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {isKnowledgeGap && <AlertCircle className="w-3 h-3 text-rose-600" />}
                          <span>{log.status}</span>
                        </span>

                        {log.qualityRating && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                              log.qualityRating === 'helpful'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {log.qualityRating === 'helpful' ? (
                              <>
                                <ThumbsUp className="w-3 h-3" />
                                <span>Member: Helpful</span>
                              </>
                            ) : (
                              <>
                                <ThumbsDown className="w-3 h-3" />
                                <span>Member: Flagged</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Member's Exact Question */}
                    <div className="bg-[#FFF0F0] text-black border border-[#FFD0D0] rounded-xl p-3.5">
                      <div className="text-[10px] font-bold text-[#800000] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>Member Question:</span>
                      </div>
                      <div className="text-xs font-semibold text-black leading-relaxed">
                        {log.question}
                      </div>
                    </div>

                    {/* AI Assistant Generated Response */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Bot className="w-3 h-3 text-[#800000]" />
                          <span>AI Assistant Response:</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-sans pr-1">
                        {log.response}
                      </div>
                    </div>

                    {/* Admin Review Notes (if any) */}
                    {log.adminReviewNotes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                        <div className="font-bold text-[10px] uppercase tracking-wider text-amber-800 flex items-center gap-1 mb-0.5">
                          <Edit3 className="w-3 h-3" />
                          <span>Council QC Review Note ({log.reviewedBy || 'Admin'}):</span>
                        </div>
                        <p>{log.adminReviewNotes}</p>
                      </div>
                    )}

                    {/* Superadmin QC Actions Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      {/* Status Changer Dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500">QC Status:</span>
                        <select
                          value={log.status}
                          onChange={(e) => handleUpdateQCStatus(log.id, e.target.value as AIQuestionQualityStatus, log.adminReviewNotes)}
                          className="px-2.5 py-1 bg-white border border-[#FFD0D0] rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#800000] cursor-pointer"
                        >
                          <option value="Unreviewed">Unreviewed</option>
                          <option value="Verified High Quality">Verified High Quality</option>
                          <option value="Needs Improvement">Needs Improvement</option>
                          <option value="Knowledge Gap">Knowledge Gap</option>
                          <option value="Restricted / Out of Scope">Restricted / Out of Scope</option>
                          <option value="Promoted to Training">Promoted to Training</option>
                        </select>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Promote to Few-Shot Training */}
                        <button
                          type="button"
                          onClick={() => handleOpenPromoteModal(log)}
                          className="px-3 py-1.5 rounded-lg bg-[#800000] text-white text-xs font-bold hover:bg-[#990000] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Convert this question & perfected answer into a permanent Few-Shot training example"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Promote to Training QA</span>
                        </button>

                        {/* Convert to Knowledge Doc */}
                        <button
                          type="button"
                          onClick={() => handleConvertLogToKnowledgeDoc(log)}
                          className="px-3 py-1.5 rounded-lg bg-[#FFF0F0] text-[#800000] border border-[#FFD0D0] text-xs font-bold hover:bg-[#FFE5E5] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Create a draft Knowledge Base article from this question"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Draft Knowledge Doc</span>
                        </button>

                        {/* Open Review & Note Modal */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLogForReview(log);
                            setReviewNoteInput(log.adminReviewNotes || '');
                            setReviewStatusInput(log.status);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
                          title="Add internal audit notes"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Log */}
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestionLog(log.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete inquiry record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 6: INTERACTIVE SANDBOX SIMULATOR */}
      {activeTab === 'sandbox' && (
        <div className="bg-white rounded-2xl border border-[#FFD0D0] p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FFD0D0] pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-600" />
                Live Training Evaluation Sandbox
              </h3>
              <p className="text-xs text-slate-600">
                Test prompts in real-time with the current training instructions, tone, and knowledge base before deploying.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSandboxMessages([
                  {
                    sender: 'assistant',
                    text: `Sandbox conversation reset. Ready for new evaluation queries.`,
                  },
                ])
              }
              className="px-3 py-1.5 rounded-lg bg-[#FFF0F0] text-[#800000] border border-[#FFD0D0] text-xs font-bold hover:bg-[#FFE5E5] transition cursor-pointer"
            >
              Reset Chat Simulator
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="bg-slate-50 border border-[#FFD0D0] rounded-xl p-4 h-96 overflow-y-auto space-y-3">
            {sandboxMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-[#800000] text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#800000] text-white shadow-xs'
                      : 'bg-white text-slate-900 border border-[#FFD0D0] shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                </div>
              </div>
            ))}
            {isSandboxLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#800000]" />
                <span>Generating sandbox response using gemini-3.7-flash with active training context...</span>
              </div>
            )}
          </div>

          {/* Sandbox Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendSandboxMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={sandboxInput}
              onChange={(e) => setSandboxInput(e.target.value)}
              placeholder="Type a test question (e.g., 'How do I submit Baden-Powell Award reflection logs?')..."
              className="flex-1 px-4 py-2.5 bg-[#FFF0F0] border border-[#FFD0D0] rounded-xl text-xs text-black placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
            />
            <button
              type="submit"
              disabled={isSandboxLoading || !sandboxInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#800000] text-white font-bold text-xs hover:bg-[#990000] transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Test</span>
            </button>
          </form>
        </div>
      )}

      {/* Modal: Add/Edit Knowledge Doc */}
      {isNewDocOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-[#FFD0D0] shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#FFD0D0] pb-3">
              <h4 className="text-base font-bold text-slate-900">
                {editingDoc ? 'Edit Knowledge Base Entry' : 'New Scouting Knowledge Entry'}
              </h4>
              <button
                type="button"
                onClick={() => setIsNewDocOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Document / Rule Title
                </label>
                <input
                  type="text"
                  value={newDocForm.title}
                  onChange={(e) => setNewDocForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Campsite Environmental Protocol 2026"
                  className="w-full px-3 py-2 bg-[#FFF0F0] border border-[#FFD0D0] rounded-lg text-xs text-black font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={newDocForm.category}
                  onChange={(e) => setNewDocForm((prev) => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-[#FFF0F0] border border-[#FFD0D0] rounded-lg text-xs text-black font-medium focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                >
                  <option value="Bylaws & Governance">Bylaws & Governance</option>
                  <option value="Curriculum & Badges">Curriculum & Badges</option>
                  <option value="Camp & Safety">Camp & Safety</option>
                  <option value="General Operations">General Operations</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Content / Directives
                </label>
                <textarea
                  rows={6}
                  value={newDocForm.content}
                  onChange={(e) => setNewDocForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter the full policy, protocol steps, or syllabus instructions..."
                  className="w-full p-3 bg-[#FFF0F0] border border-[#FFD0D0] rounded-lg text-xs text-black font-mono leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewDocOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDoc}
                className="px-4 py-2 rounded-xl bg-[#800000] text-white text-xs font-bold hover:bg-[#990000] shadow-xs cursor-pointer"
              >
                Save Knowledge Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Q&A Pair */}
      {isNewQAOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-[#FFD0D0] shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#FFD0D0] pb-3">
              <h4 className="text-base font-bold text-slate-900">Add Few-Shot Training Q&A</h4>
              <button
                type="button"
                onClick={() => setIsNewQAOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  User Question
                </label>
                <input
                  type="text"
                  value={newQAForm.question}
                  onChange={(e) => setNewQAForm((prev) => ({ ...prev, question: e.target.value }))}
                  placeholder="e.g. What is the deadline for referendum voting?"
                  className="w-full px-3 py-2 bg-[#FFF0F0] border border-[#FFD0D0] rounded-lg text-xs text-black font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Expected Official AI Answer
                </label>
                <textarea
                  rows={4}
                  value={newQAForm.answer}
                  onChange={(e) => setNewQAForm((prev) => ({ ...prev, answer: e.target.value }))}
                  placeholder="Enter the exact answer the AI should return..."
                  className="w-full p-3 bg-[#FFF0F0] border border-[#FFD0D0] rounded-lg text-xs text-black font-mono leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewQAOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQA}
                className="px-4 py-2 rounded-xl bg-[#800000] text-white text-xs font-bold hover:bg-[#990000] shadow-xs cursor-pointer"
              >
                Add Training Pair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Promote Question to Few-Shot Training QA */}
      {promoteModalLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-[#FFD0D0] shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#FFD0D0] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#800000] text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Promote Member Question to Few-Shot Training</h4>
                  <p className="text-xs text-slate-500">Refine this inquiry into an official ground-truth training pair.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPromoteModalLog(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#FFF0F0] text-black border border-[#FFD0D0] rounded-xl p-3 text-xs">
                <span className="font-bold text-[#800000]">Originally Asked by:</span> {promoteModalLog.memberName} ({promoteModalLog.memberRole}) on {new Date(promoteModalLog.timestamp).toLocaleDateString()}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Exemplary Question (Refined / Normalized)
                </label>
                <input
                  type="text"
                  value={promoteQAQuestion}
                  onChange={(e) => setPromoteQAQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FFF0F0] border border-[#FFD0D0] rounded-xl text-xs text-black font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={promoteQACategory}
                  onChange={(e) => setPromoteQACategory(e.target.value)}
                  placeholder="e.g. Governance, Curriculum, Events, Finance"
                  className="w-full px-3.5 py-2.5 bg-[#FFF0F0] border border-[#FFD0D0] rounded-xl text-xs text-black font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Expected Official AI Answer (Ground Truth)
                </label>
                <textarea
                  rows={6}
                  value={promoteQAAnswer}
                  onChange={(e) => setPromoteQAAnswer(e.target.value)}
                  placeholder="Refine the exact approved council response that the AI should return when asked similar questions..."
                  className="w-full p-3.5 bg-[#FFF0F0] border border-[#FFD0D0] rounded-xl text-xs text-black font-mono leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPromoteModalLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPromoteQA}
                disabled={isPromoting}
                className="px-5 py-2 rounded-xl bg-[#800000] text-white text-xs font-bold hover:bg-[#990000] transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isPromoting ? 'Promoting...' : 'Confirm & Add to Training QA'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Review Notes & Status Editor */}
      {selectedLogForReview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-[#FFD0D0] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#FFD0D0] pb-3">
              <h4 className="text-base font-bold text-slate-900">Quality Control Audit & Review</h4>
              <button
                type="button"
                onClick={() => setSelectedLogForReview(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assign Quality Status
                </label>
                <select
                  value={reviewStatusInput}
                  onChange={(e) => setReviewStatusInput(e.target.value as AIQuestionQualityStatus)}
                  className="w-full px-3 py-2 bg-[#FFF0F0] border border-[#FFD0D0] rounded-xl text-xs text-black font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                >
                  <option value="Unreviewed">Unreviewed</option>
                  <option value="Verified High Quality">Verified High Quality</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                  <option value="Knowledge Gap">Knowledge Gap (Requires new policy doc)</option>
                  <option value="Restricted / Out of Scope">Restricted / Out of Scope</option>
                  <option value="Promoted to Training">Promoted to Training</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Admin Audit Notes & Directives
                </label>
                <textarea
                  rows={4}
                  value={reviewNoteInput}
                  onChange={(e) => setReviewNoteInput(e.target.value)}
                  placeholder="e.g., Response was slightly vague on the 7-day referendum rule. Added few-shot pair to clarify."
                  className="w-full p-3 bg-[#FFF0F0] border border-[#FFD0D0] rounded-xl text-xs text-black font-medium leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLogForReview(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateQCStatus(selectedLogForReview.id, reviewStatusInput, reviewNoteInput)}
                className="px-4 py-2 rounded-xl bg-[#800000] text-white text-xs font-bold hover:bg-[#990000] transition cursor-pointer shadow-xs"
              >
                Save Review Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
