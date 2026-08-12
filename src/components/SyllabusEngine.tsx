import React, { useState } from 'react';
import { CertificateModal } from './CertificateModal';
import { AIProgressionAssistant } from './AIProgressionAssistant';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  SyllabusRequirement,
  AwardType,
  CategoryType,
  Member,
  MemberRequirementProgress,
  RequirementStatus,
  SubmissionType,
  JournalEntry,
  CrewEvent,
  AttendanceRecord,
} from '../types';
import {
  Award,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Compass,
  BookOpen,
  Filter,
  CheckSquare,
  Square,
  UserCheck,
  ChevronRight,
  Sparkles,
  Layers,
  X,
  Search,
  UserPlus,
  Upload,
  Paperclip,
  FileText,
  Calendar,
  ExternalLink,
  FileCheck,
  Send,
  Check,
  Bot,
  Library,
  FileUp,
  Image as ImageIcon,
  AlertCircle,
  Eye,
  ArrowRight,
  Shield,
  Heart,
  Globe,
  Users,
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { PRESET_SYLLABUS_PACKS, PresetSyllabusPack } from '../data/presetSyllabusData';

interface SyllabusEngineProps {
  syllabus: SyllabusRequirement[];
  progressList: MemberRequirementProgress[];
  members: Member[];
  currentMember: Member;
  journals?: JournalEntry[];
  events?: CrewEvent[];
  attendance?: AttendanceRecord[];
  aiEnabled?: boolean;
  onAddRequirement: (req: Omit<SyllabusRequirement, 'id'>) => void;
  onUpdateRequirement: (req: SyllabusRequirement) => void;
  onDeleteRequirement: (id: string) => void;
  onUpdateProgress: (progress: MemberRequirementProgress) => void;
}

export const SyllabusEngine: React.FC<SyllabusEngineProps> = ({
  syllabus = [],
  progressList = [],
  members = [],
  currentMember,
  journals = [],
  events = [],
  attendance = [],
  aiEnabled = true,
  onAddRequirement,
  onUpdateRequirement,
  onDeleteRequirement,
  onUpdateProgress,
}) => {
  const [awardFilter, setAwardFilter] = useState<AwardType | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | 'All'>('All');
  const [activeTab, setActiveTab] = useState<'catalog' | 'signoffs' | 'presets' | 'analytics' | 'ai-assistant'>('catalog');

  // Search & Filter State for Sign-off Matrix
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  // Filter State for Progression Analytics
  const [analyticsCrewFilter, setAnalyticsCrewFilter] = useState<string>('All');
  const [analyticsMetricType, setAnalyticsMetricType] = useState<'percentage' | 'count'>('percentage');

  // Certificate Modal State
  const [certModal, setCertModal] = useState<{
    isOpen: boolean;
    member: Member | null;
    awardTier: AwardType | string;
    completedCount: number;
    totalCount: number;
  }>({
    isOpen: false,
    member: null,
    awardTier: "President's Scout Award",
    completedCount: 0,
    totalCount: 0,
  });

  // Modal State for New/Edit Requirement
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<SyllabusRequirement | null>(null);

  // Modal State for AI Prompt Parser
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [aiParsedResult, setAiParsedResult] = useState<Omit<SyllabusRequirement, 'id'> | null>(null);

  // Form Data State
  const [formData, setFormData] = useState<{
    awardType: AwardType;
    category: CategoryType;
    title: string;
    description: string;
    tasksText: string;
    minHours: number;
    submissionType: SubmissionType;
    requiresReport: boolean;
    requiresPhotos: boolean;
    requiresDocument: boolean;
    submissionInstructions: string;
  }>({
    awardType: "President's Scout Award",
    category: 'Leadership',
    title: '',
    description: '',
    tasksText: '',
    minHours: 20,
    submissionType: 'checkbox',
    requiresReport: false,
    requiresPhotos: false,
    requiresDocument: false,
    submissionInstructions: '',
  });

  const isCouncil = currentMember.councilRole !== 'Member';

  const categories: CategoryType[] = [
    'Leadership',
    'Community Service',
    'Outdoor Skills',
    'Personal Development',
    'Scoutcraft',
    'Global Citizenship',
  ];

  const filteredSyllabus = syllabus.filter((s) => {
    if (awardFilter !== 'All' && s.awardType !== awardFilter) return false;
    if (categoryFilter !== 'All' && s.category !== categoryFilter) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingReq(null);
    setFormData({
      awardType: "President's Scout Award",
      category: 'Leadership',
      title: '',
      description: '',
      tasksText: '',
      minHours: 20,
      submissionType: 'checkbox',
      requiresReport: false,
      requiresPhotos: false,
      requiresDocument: false,
      submissionInstructions: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (req: SyllabusRequirement) => {
    setEditingReq(req);
    setFormData({
      awardType: req.awardType,
      category: req.category,
      title: req.title,
      description: req.description,
      tasksText: req.tasks.map((t) => t.text).join('\n'),
      minHours: req.minHours || 0,
      submissionType: req.submissionType || 'checkbox',
      requiresReport: !!req.requiresReport,
      requiresPhotos: !!req.requiresPhotos,
      requiresDocument: !!req.requiresDocument,
      submissionInstructions: req.submissionInstructions || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a requirement title.');
      return;
    }

    const taskLines = formData.tasksText
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const tasks = taskLines.map((line, idx) => ({
      id: editingReq ? `task-${idx}-${Date.now()}` : `task-new-${idx}`,
      text: line,
    }));

    if (editingReq) {
      onUpdateRequirement({
        ...editingReq,
        awardType: formData.awardType,
        category: formData.category,
        title: formData.title,
        description: formData.description,
        tasks,
        minHours: formData.minHours,
        submissionType: formData.submissionType,
        requiresReport: formData.requiresReport,
        requiresPhotos: formData.requiresPhotos,
        requiresDocument: formData.requiresDocument,
        submissionInstructions: formData.submissionInstructions,
      });
      alert('Requirement updated successfully!');
    } else {
      onAddRequirement({
        awardType: formData.awardType,
        category: formData.category,
        title: formData.title,
        description: formData.description,
        tasks,
        minHours: formData.minHours,
        submissionType: formData.submissionType,
        requiresReport: formData.requiresReport,
        requiresPhotos: formData.requiresPhotos,
        requiresDocument: formData.requiresDocument,
        submissionInstructions: formData.submissionInstructions,
      });
      alert('New Syllabus requirement added!');
    }

    setIsModalOpen(false);
  };

  // AI Prompt Parsing Handler
  const handleParseAiPrompt = async () => {
    if (!aiPrompt.trim()) {
      alert('Please enter or paste a prompt describing the syllabus requirement.');
      return;
    }

    setIsAiParsing(true);
    try {
      const response = await fetch('/api/ai/parse-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      const data = await response.json();
      if (data.result) {
        const res = data.result;
        const tasksObj = (res.tasks || []).map((tText: string, i: number) => ({
          id: `task-ai-${i}-${Date.now()}`,
          text: tText,
        }));

        setAiParsedResult({
          awardType: res.awardType || "President's Scout Award",
          category: res.category || 'Outdoor Skills',
          title: res.title || 'AI Generated Requirement',
          description: res.description || aiPrompt,
          tasks: tasksObj,
          minHours: res.minHours || 15,
          badgeIcon: res.badgeIcon || 'Award',
          submissionType: res.submissionType || 'checkbox',
          requiresReport: !!res.requiresReport,
          requiresPhotos: !!res.requiresPhotos,
          requiresDocument: !!res.requiresDocument,
          submissionInstructions: res.submissionInstructions || 'Complete tasks and upload evidence.',
        });
      } else {
        alert('Could not parse prompt into a syllabus. Please check prompt content.');
      }
    } catch (err) {
      console.error('Error parsing AI syllabus:', err);
      alert('Server error parsing AI syllabus. Applying local fallback parser...');
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleApplyAiParsedResult = () => {
    if (!aiParsedResult) return;
    onAddRequirement(aiParsedResult);
    alert(`AI Requirement "${aiParsedResult.title}" created and added to Curriculum Syllabus!`);
    setIsAiModalOpen(false);
    setAiPrompt('');
    setAiParsedResult(null);
  };

  // Task Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignReqId, setAssignReqId] = useState<string>('');
  const [assignTargetType, setAssignTargetType] = useState<'individual' | 'crew' | 'all'>('individual');
  const [assignMemberIds, setAssignMemberIds] = useState<string[]>([]);
  const [assignCrewId, setAssignCrewId] = useState<string>('male-city');
  const [assignDueDate, setAssignDueDate] = useState<string>('');
  const [assignNotes, setAssignNotes] = useState<string>('');
  const [assignSearchQuery, setAssignSearchQuery] = useState<string>('');

  // Evidence / Submission Modal State
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceTarget, setEvidenceTarget] = useState<{
    memberId: string;
    requirementId: string;
    reqTitle: string;
    memberName: string;
    req: SyllabusRequirement;
  } | null>(null);
  const [writtenReport, setWrittenReport] = useState<string>('');
  const [evidenceNotes, setEvidenceNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<{
    fileName: string;
    fileUrl: string;
    fileSize: string;
  } | null>(null);
  const [autoCompleteTasks, setAutoCompleteTasks] = useState<boolean>(true);

  // Review / Signoff Modal for Council
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    member: Member;
    req: SyllabusRequirement;
    prog: MemberRequirementProgress;
  } | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');

  // Open Task Assignment Modal
  const handleOpenAssignModal = (reqId?: string, targetMemberId?: string) => {
    setAssignReqId(reqId || (syllabus.length > 0 ? syllabus[0].id : ''));
    setAssignTargetType('individual');
    setAssignMemberIds(targetMemberId ? [targetMemberId] : [currentMember.id]);
    setAssignDueDate('');
    setAssignNotes('');
    setAssignSearchQuery('');
    setIsAssignModalOpen(true);
  };

  const handleAssignTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignReqId) {
      alert('Please select a syllabus requirement to assign.');
      return;
    }

    let finalMemberIds: string[] = [];
    if (assignTargetType === 'all') {
      finalMemberIds = members.filter((m) => m.status === 'Active' && !m.isSuperAdmin && m.councilRole !== 'Superadmin').map((m) => m.id);
    } else if (assignTargetType === 'crew') {
      finalMemberIds = members.filter((m) => m.crewId === assignCrewId && m.status === 'Active' && !m.isSuperAdmin && m.councilRole !== 'Superadmin').map((m) => m.id);
    } else {
      finalMemberIds = assignMemberIds;
    }

    if (finalMemberIds.length === 0) {
      alert('Please select at least one member to assign this requirement.');
      return;
    }

    const req = syllabus.find((s) => s.id === assignReqId);
    const assignerLabel = `${currentMember.name} (${currentMember.councilRole})`;
    const todayStr = new Date().toISOString().split('T')[0];

    finalMemberIds.forEach((mId) => {
      const existing = progressList.find((p) => p.memberId === mId && p.requirementId === assignReqId);
      onUpdateProgress({
        id: existing ? existing.id : `pr-${Date.now()}-${mId}`,
        memberId: mId,
        requirementId: assignReqId,
        status: existing && existing.status !== 'Not Started' ? existing.status : 'In Progress',
        completedTasks: existing ? existing.completedTasks : [],
        assignedBy: assignerLabel,
        assignedDate: todayStr,
        dueDate: assignDueDate || undefined,
        assignmentNotes: assignNotes || undefined,
        completionDate: existing?.completionDate,
        verifiedBy: existing?.verifiedBy,
        evidenceFiles: existing?.evidenceFiles,
        writtenReport: existing?.writtenReport,
      });
    });

    alert(`Requirement "${req?.title || 'Syllabus Item'}" successfully assigned to ${finalMemberIds.length} member(s)!`);
    setIsAssignModalOpen(false);
  };

  // Assign Entire Preset Pack to Members
  const handleAssignPresetPack = (pack: PresetSyllabusPack) => {
    // Ensure all pack requirements exist in the current syllabus
    pack.requirements.forEach((pReq) => {
      const exists = syllabus.some((s) => s.title.toLowerCase() === pReq.title.toLowerCase());
      if (!exists) {
        onAddRequirement(pReq);
      }
    });

    // Default target: active members matching target section (excluding Superadmin and Rover Advisor)
    const targetMembers = members.filter((m) => {
      if (m.status !== 'Active') return false;
      if (m.isSuperAdmin || m.councilRole === 'Superadmin' || m.councilRole === 'Rover Advisor') return false;
      if (pack.targetSection === 'All') return true;
      return m.section === pack.targetSection;
    });

    const assignerLabel = `${currentMember.name} (${currentMember.councilRole})`;
    const todayStr = new Date().toISOString().split('T')[0];

    let assignCount = 0;
    pack.requirements.forEach((pReq) => {
      const matchReq = syllabus.find((s) => s.title.toLowerCase() === pReq.title.toLowerCase()) || pReq;
      targetMembers.forEach((m) => {
        const existing = progressList.find((p) => p.memberId === m.id && p.requirementId === matchReq.id);
        onUpdateProgress({
          id: existing ? existing.id : `pr-${Date.now()}-${m.id}-${matchReq.id}`,
          memberId: m.id,
          requirementId: matchReq.id,
          status: existing ? existing.status : 'In Progress',
          completedTasks: existing ? existing.completedTasks : [],
          assignedBy: assignerLabel,
          assignedDate: todayStr,
          assignmentNotes: `Assigned from Preset Pack: ${pack.name}`,
          evidenceFiles: existing?.evidenceFiles,
          writtenReport: existing?.writtenReport,
        });
        assignCount++;
      });
    });

    alert(`Successfully assigned Preset Pack "${pack.name}" (${pack.requirements.length} requirements) to ${targetMembers.length} ${pack.targetSection} members!`);
  };

  // Toggle individual task completed state for member
  const toggleTaskForMember = (memberId: string, reqId: string, taskId: string) => {
    const existing = progressList.find((p) => p.memberId === memberId && p.requirementId === reqId);
    const req = syllabus.find((s) => s.id === reqId);
    if (!req) return;

    let updatedTasks: string[] = [];
    if (existing) {
      if (existing.completedTasks.includes(taskId)) {
        updatedTasks = existing.completedTasks.filter((t) => t !== taskId);
      } else {
        updatedTasks = [...existing.completedTasks, taskId];
      }
    } else {
      updatedTasks = [taskId];
    }

    const isAllComplete = req.tasks.length > 0 && req.tasks.every((t) => updatedTasks.includes(t.id));

    // If requirement needs report or photo evidence, check if they are provided before auto-completing
    const requiresSubmission = req.requiresReport || req.requiresPhotos || req.requiresDocument;
    let status: RequirementStatus = 'In Progress';
    if (updatedTasks.length === 0) {
      status = 'Not Started';
    } else if (isAllComplete && !requiresSubmission) {
      status = 'Completed';
    } else if (updatedTasks.length > 0) {
      status = 'In Progress';
    }

    onUpdateProgress({
      id: existing ? existing.id : `pr-${Date.now()}`,
      memberId,
      requirementId: reqId,
      status,
      completedTasks: updatedTasks,
      completionDate: status === 'Completed' ? new Date().toISOString().split('T')[0] : existing?.completionDate,
      verifiedBy: status === 'Completed' ? `${currentMember.name} (${currentMember.councilRole})` : existing?.verifiedBy,
      notes: existing?.notes,
      assignedBy: existing?.assignedBy,
      assignedDate: existing?.assignedDate,
      dueDate: existing?.dueDate,
      assignmentNotes: existing?.assignmentNotes,
      evidenceFiles: existing?.evidenceFiles,
      writtenReport: existing?.writtenReport,
    });
  };

  // Open Evidence Submission Modal
  const handleOpenEvidenceModal = (memberId: string, req: SyllabusRequirement) => {
    const m = members.find((mem) => mem.id === memberId);
    const existing = progressList.find((p) => p.memberId === memberId && p.requirementId === req.id);

    setEvidenceTarget({
      memberId,
      requirementId: req.id,
      reqTitle: req.title,
      memberName: m?.name || 'Member',
      req,
    });
    setWrittenReport(existing?.writtenReport || '');
    setEvidenceNotes(existing?.notes || '');
    setSelectedFile(null);
    setAutoCompleteTasks(true);
    setIsEvidenceModalOpen(true);
  };

  // File Change Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setSelectedFile({
        fileName: file.name,
        fileUrl: reader.result as string,
        fileSize: `${sizeMb} MB`,
      });
    };
    reader.readAsDataURL(file);
  };

  // Member Evidence Submission Handler
  const handleEvidenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceTarget) return;

    const { memberId, requirementId, req } = evidenceTarget;
    const existing = progressList.find((p) => p.memberId === memberId && p.requirementId === requirementId);

    // Validate submission requirements if defined
    if (req.requiresReport && !writtenReport.trim()) {
      alert('This requirement requires a written report or reflection before submission.');
      return;
    }
    if ((req.requiresPhotos || req.requiresDocument) && !selectedFile && (!existing?.evidenceFiles || existing.evidenceFiles.length === 0)) {
      alert('This requirement requires photo proof or document evidence file attachment.');
      return;
    }

    const newEvidenceList = [...(existing?.evidenceFiles || [])];
    if (selectedFile) {
      newEvidenceList.push({
        id: `ev-${Date.now()}`,
        fileName: selectedFile.fileName,
        fileUrl: selectedFile.fileUrl,
        fileSize: selectedFile.fileSize,
        uploadedAt: new Date().toLocaleDateString(),
        notes: evidenceNotes,
      });
    }

    let updatedTasks = existing ? [...existing.completedTasks] : [];
    if (autoCompleteTasks && req) {
      updatedTasks = req.tasks.map((t) => t.id);
    }

    const isSimpleCheckbox = !req.requiresReport && !req.requiresPhotos && !req.requiresDocument;
    const newStatus: RequirementStatus = isSimpleCheckbox ? 'Completed' : 'Submitted';

    onUpdateProgress({
      id: existing ? existing.id : `pr-${Date.now()}`,
      memberId,
      requirementId,
      status: newStatus,
      completedTasks: updatedTasks,
      completionDate: newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : existing?.completionDate,
      notes: evidenceNotes || existing?.notes,
      writtenReport: writtenReport || existing?.writtenReport,
      assignedBy: existing?.assignedBy,
      assignedDate: existing?.assignedDate,
      dueDate: existing?.dueDate,
      assignmentNotes: existing?.assignmentNotes,
      evidenceFiles: newEvidenceList,
    });

    alert(isSimpleCheckbox ? 'Requirement marked complete!' : 'Requirement report & evidence submitted! Awaiting Council officer review & sign-off.');
    setIsEvidenceModalOpen(false);
  };

  // Open Council Review Modal
  const handleOpenReviewModal = (member: Member, req: SyllabusRequirement, prog: MemberRequirementProgress) => {
    setReviewTarget({ member, req, prog });
    setReviewNotes(prog.notes || '');
    setIsReviewModalOpen(true);
  };

  // Council Approves / Signs Off Requirement
  const handleCouncilApprove = () => {
    if (!reviewTarget) return;
    const { member, req, prog } = reviewTarget;

    onUpdateProgress({
      ...prog,
      status: 'Completed',
      completedTasks: req.tasks.map((t) => t.id),
      completionDate: new Date().toISOString().split('T')[0],
      verifiedBy: `${currentMember.name} (${currentMember.councilRole})`,
      notes: reviewNotes || prog.notes,
    });

    alert(`Requirement "${req.title}" official sign-off completed for ${member.name}!`);
    setIsReviewModalOpen(false);
    setReviewTarget(null);
  };

  // Recharts Analytics Data Calculations (Excludes Superadmin and Rover Advisor overseers)
  const filteredAnalyticsMembers = members.filter((m) => {
    if (m.status !== 'Active') return false;
    if (m.isSuperAdmin || m.councilRole === 'Superadmin' || m.councilRole === 'Rover Advisor') return false;
    if (analyticsCrewFilter !== 'All' && m.crewId !== analyticsCrewFilter) return false;
    return true;
  });

  const totalPresidentsReqs = syllabus.filter((s) => s.awardType === "President's Scout Award").length || 1;
  const totalBpReqs = syllabus.filter((s) => s.awardType === 'Baden-Powell (BP) Award').length || 1;
  const totalAuxReqs = syllabus.filter((s) => s.awardType === 'Auxiliary Badge').length || 1;

  const analyticsMemberData = filteredAnalyticsMembers.map((mem) => {
    const memProgress = progressList.filter((p) => p.memberId === mem.id);

    const presidentsCompleted = memProgress.filter((p) => {
      const req = syllabus.find((s) => s.id === p.requirementId);
      return req?.awardType === "President's Scout Award" && p.status === 'Completed';
    }).length;

    const bpCompleted = memProgress.filter((p) => {
      const req = syllabus.find((s) => s.id === p.requirementId);
      return req?.awardType === 'Baden-Powell (BP) Award' && p.status === 'Completed';
    }).length;

    const auxCompleted = memProgress.filter((p) => {
      const req = syllabus.find((s) => s.id === p.requirementId);
      return req?.awardType === 'Auxiliary Badge' && p.status === 'Completed';
    }).length;

    const nameParts = mem.name.trim().split(' ');
    const shortName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[1][0]}.` : nameParts[0];

    return {
      id: mem.id,
      name: shortName,
      fullName: mem.name,
      section: mem.section,
      crewName: mem.crewName,
      presidentsCompleted,
      presidentsPct: Math.min(100, Math.round((presidentsCompleted / totalPresidentsReqs) * 100)),
      bpCompleted,
      bpPct: Math.min(100, Math.round((bpCompleted / totalBpReqs) * 100)),
      auxCompleted,
      auxPct: Math.min(100, Math.round((auxCompleted / totalAuxReqs) * 100)),
      totalCompleted: presidentsCompleted + bpCompleted + auxCompleted,
      rawMember: mem,
    };
  });

  const crewList = [
    { id: 'male-city', name: 'Male City' },
    { id: 'hulhumale', name: 'Hulhumalé' },
    { id: 'villimale', name: 'Villimalé' },
  ];

  const analyticsCrewData = crewList.map((crew) => {
    const crewMembers = members.filter((m) => m.crewId === crew.id && m.status === 'Active' && !m.isSuperAdmin && m.councilRole !== 'Superadmin');
    const crewMemberIds = crewMembers.map((m) => m.id);
    const crewProgress = progressList.filter((p) => crewMemberIds.includes(p.memberId));

    const presidentsCount = crewProgress.filter((p) => {
      const req = syllabus.find((s) => s.id === p.requirementId);
      return req?.awardType === "President's Scout Award" && p.status === 'Completed';
    }).length;

    const bpCount = crewProgress.filter((p) => {
      const req = syllabus.find((s) => s.id === p.requirementId);
      return req?.awardType === 'Baden-Powell (BP) Award' && p.status === 'Completed';
    }).length;

    const auxCount = crewProgress.filter((p) => {
      const req = syllabus.find((s) => s.id === p.requirementId);
      return req?.awardType === 'Auxiliary Badge' && p.status === 'Completed';
    }).length;

    return {
      crewName: crew.name,
      presidentsCount,
      bpCount,
      auxCount,
      totalCount: presidentsCount + bpCount + auxCount,
    };
  });

  const analyticsStatusPieData = [
    { name: 'Completed Sign-Offs', value: progressList.filter((p) => p.status === 'Completed').length, color: '#10B981' },
    { name: 'Submitted (In Review)', value: progressList.filter((p) => p.status === 'Submitted').length, color: '#A855F7' },
    { name: 'In Progress', value: progressList.filter((p) => p.status === 'In Progress').length, color: '#3B82F6' },
    { name: 'Not Started', value: Math.max(0, members.length * syllabus.length - progressList.length), color: '#334155' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1A1E26] border border-slate-800 p-5 rounded-2xl shadow-md">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            Syllabus & Award Requirements Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configurable progression curriculum for President's Scout Award (Explorers), Baden-Powell BP Award (Rovers) & Auxiliary Badges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Navigation View Switcher */}
          <div className="bg-[#161920] p-1 border border-slate-800 rounded-xl flex items-center text-xs">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'catalog'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Curriculum Syllabus
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'presets'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Library className="w-3.5 h-3.5 text-amber-400" />
              <span>Pre-Set Packs</span>
            </button>
            <button
              onClick={() => setActiveTab('signoffs')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'signoffs'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Member Sign-Off Matrix
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Tier Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('ai-assistant')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'ai-assistant'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Progress Coach</span>
            </button>
          </div>

          {/* AI Builder Button */}
          {isCouncil && (
            <button
              id="syllabus-ai-builder-btn"
              onClick={() => setIsAiModalOpen(true)}
              className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold px-3 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition"
              title="Add Syllabus Requirement by giving AI a prompt"
            >
              <Bot className="w-4 h-4 text-purple-400" />
              <span>AI Syllabus Builder</span>
            </button>
          )}

          <button
            id="syllabus-assign-task-btn"
            onClick={() => handleOpenAssignModal()}
            className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition"
            title="Assign syllabus tasks/requirements to members"
          >
            <UserPlus className="w-4 h-4" />
            <span>Assign Task</span>
          </button>

          {isCouncil && (
            <button
              id="syllabus-add-req-btn"
              onClick={handleOpenAdd}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Manual</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'catalog' && (
        <>
          {/* Filters Bar */}
          <div className="bg-[#1A1E26] border border-slate-800 p-4 rounded-xl flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Award Track:</span>
              <select
                value={awardFilter}
                onChange={(e) => setAwardFilter(e.target.value as any)}
                className="bg-[#161920] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Award Frameworks</option>
                <option value="President's Scout Award">President's Scout Award (Explorer)</option>
                <option value="Baden-Powell (BP) Award">Baden-Powell (BP) Award (Rover)</option>
                <option value="Auxiliary Badge">Auxiliary Badges</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="bg-[#161920] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Syllabus Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSyllabus.map((req) => (
              <div
                key={req.id}
                className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                            req.awardType === "President's Scout Award"
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : req.awardType === 'Baden-Powell (BP) Award'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          }`}
                        >
                          {req.awardType}
                        </span>
                        <span className="bg-[#161920] text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-800">
                          {req.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                        <span>{req.title}</span>
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenAssignModal(req.id)}
                        className="p-1.5 text-sky-400 hover:text-sky-300 transition rounded-lg hover:bg-slate-800"
                        title="Assign Requirement to Members"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                      {isCouncil && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(req)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 transition rounded-lg hover:bg-slate-800"
                            title="Edit Requirement"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete requirement "${req.title}"?`)) {
                                onDeleteRequirement(req.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-slate-800"
                            title="Delete Requirement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">{req.description}</p>

                  {/* Submission Requirement Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {req.requiresReport && (
                      <span className="bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Written Report Required
                      </span>
                    )}
                    {req.requiresPhotos && (
                      <span className="bg-sky-500/10 text-sky-300 border border-sky-500/30 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Photo Proof Required
                      </span>
                    )}
                    {req.requiresDocument && (
                      <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                        <Paperclip className="w-3 h-3" /> Document/Log Required
                      </span>
                    )}
                    {!req.requiresReport && !req.requiresPhotos && !req.requiresDocument && (
                      <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] px-2 py-0.5 rounded">
                        Checkbox Verification Only
                      </span>
                    )}
                  </div>

                  {/* Task List */}
                  <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl space-y-2">
                    <h4 className="text-[11px] font-mono uppercase font-bold text-slate-400">
                      Sub-Task Checklist ({req.tasks.length}):
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {req.tasks.map((task) => (
                        <li key={task.id} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span>{task.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Minimum Hours: <strong className="text-amber-300">{req.minHours || 0} hrs</strong>
                  </span>
                  <button
                    onClick={() => handleOpenAssignModal(req.id)}
                    className="text-sky-400 hover:underline font-semibold text-[11px] flex items-center gap-1"
                  >
                    <span>Assign to Member</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pre-set Syllabus Packs Tab */}
      {activeTab === 'presets' && (
        <div className="space-y-6">
          <div className="bg-[#1A1E26] border border-slate-800 p-5 rounded-2xl shadow-md space-y-2">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-serif">
              <Library className="w-5 h-5 text-amber-400" />
              Pre-Set Syllabus Curriculum Packs
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              Official pre-configured Scout badge modules and award tracks. Council officers can assign an entire pre-set curriculum pack or individual syllabus items to members or sub-crews in one click.
            </p>
          </div>

          <div className="space-y-6">
            {PRESET_SYLLABUS_PACKS.map((pack) => (
              <div
                key={pack.id}
                className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded font-mono">
                        {pack.awardType}
                      </span>
                      <span className="bg-slate-800 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                        Target: {pack.targetSection} Section
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-100">{pack.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{pack.description}</p>
                  </div>

                  <button
                    onClick={() => handleAssignPresetPack(pack)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition flex-shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Assign Full Pack to {pack.targetSection} Members</span>
                  </button>
                </div>

                {/* Sub-items in Pack */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pack.requirements.map((req) => (
                    <div
                      key={req.id}
                      className="bg-[#161920] border border-slate-800/80 rounded-xl p-4 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                          {req.category}
                        </span>
                        <h5 className="font-bold text-sm text-slate-100">{req.title}</h5>
                        <p className="text-xs text-slate-300 line-clamp-3">{req.description}</p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {req.requiresReport && (
                            <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded">
                              Report
                            </span>
                          )}
                          {req.requiresPhotos && (
                            <span className="text-[10px] bg-sky-500/10 text-sky-300 border border-sky-500/20 px-1.5 py-0.5 rounded">
                              Photos
                            </span>
                          )}
                          {req.requiresDocument && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              PDF Doc
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>{req.minHours} hrs</span>
                        <button
                          onClick={() => handleOpenAssignModal(req.id)}
                          className="text-sky-400 hover:underline font-semibold"
                        >
                          Assign Item
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tier Progression Analytics View */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#1A1E26] border border-slate-800 p-4 rounded-2xl shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Total Curriculum Items</span>
                <BookOpen className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">{syllabus.length}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Across 3 Award Frameworks</div>
            </div>

            <div className="bg-[#1A1E26] border border-slate-800 p-4 rounded-2xl shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-400">President's Scout</span>
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-300 mt-1 font-mono">
                {syllabus.filter((s) => s.awardType === "President's Scout Award").length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Explorer Section Requirements</div>
            </div>

            <div className="bg-[#1A1E26] border border-slate-800 p-4 rounded-2xl shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-400">Baden-Powell (BP)</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-300 mt-1 font-mono">
                {syllabus.filter((s) => s.awardType === "Baden-Powell (BP) Award").length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Rover Section Requirements</div>
            </div>

            <div className="bg-[#1A1E26] border border-slate-800 p-4 rounded-2xl shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-sky-400">Verified Sign-offs</span>
                <ShieldCheck className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-bold text-sky-300 mt-1 font-mono">
                {progressList.filter((p) => p.status === 'Completed').length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Official Council Approvals</div>
            </div>
          </div>

          {/* Controls & Filter Bar */}
          <div className="bg-[#1A1E26] border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-serif">Crew Member Completion Across Award Tiers</h3>
                <p className="text-[11px] text-slate-400">Recharts visual analysis of individual & sub-crew progression metrics.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Sub-Crew Filter */}
              <div className="flex items-center gap-1.5 bg-[#161920] border border-slate-800 px-3 py-1.5 rounded-xl">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Crew:</span>
                <select
                  value={analyticsCrewFilter}
                  onChange={(e) => setAnalyticsCrewFilter(e.target.value)}
                  className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="All">All Crews</option>
                  <option value="male-city">Male City Crew</option>
                  <option value="hulhumale">Hulhumale Crew</option>
                  <option value="villimale">Villimale Coastal Crew</option>
                </select>
              </div>

              {/* View Metric Toggle */}
              <div className="bg-[#161920] border border-slate-800 p-1 rounded-xl flex items-center">
                <button
                  type="button"
                  onClick={() => setAnalyticsMetricType('percentage')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    analyticsMetricType === 'percentage'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Completion %
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsMetricType('count')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    analyticsMetricType === 'count'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Count (Items)
                </button>
              </div>
            </div>
          </div>

          {/* Main Bar Chart: Member Completion Across Tiers */}
          <div className="bg-[#1A1E26] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono uppercase">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Member Progression by Award Tier ({analyticsMetricType === 'percentage' ? 'Completion Percentage' : 'Completed Requirements Count'})
              </span>
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> President's Scout</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Baden-Powell (BP)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span> Auxiliary Badges</span>
              </div>
            </div>

            <div className="w-full h-80 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsMemberData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262C36" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    domain={analyticsMetricType === 'percentage' ? [0, 100] : [0, 'auto']}
                    unit={analyticsMetricType === 'percentage' ? '%' : ''}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161920',
                      borderColor: '#334155',
                      color: '#F1F5F9',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey={analyticsMetricType === 'percentage' ? 'presidentsPct' : 'presidentsCompleted'}
                    name="President's Scout"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey={analyticsMetricType === 'percentage' ? 'bpPct' : 'bpCompleted'}
                    name="Baden-Powell (BP)"
                    fill="#F59E0B"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey={analyticsMetricType === 'percentage' ? 'auxPct' : 'auxCompleted'}
                    name="Auxiliary Badge"
                    fill="#0EA5E9"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Grid: Sub-Crew Comparison Chart + Verification Status Donut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sub-Crew Comparison Bar Chart */}
            <div className="bg-[#1A1E26] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2 font-serif">
                  <Users className="w-4 h-4 text-sky-400" />
                  Sub-Crew Total Tier Completions
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Male / Hulhumalé / Villimalé</span>
              </div>

              <div className="w-full h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsCrewData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262C36" />
                    <XAxis dataKey="crewName" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161920',
                        borderColor: '#334155',
                        color: '#F1F5F9',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="presidentsCount" name="President's Scout" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="bpCount" name="Baden-Powell BP" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="auxCount" name="Auxiliary Badges" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Verification Status Distribution Donut Chart */}
            <div className="bg-[#1A1E26] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2 font-serif">
                  <PieChartIcon className="w-4 h-4 text-purple-400" />
                  Troop Verification Status Pipeline
                </span>
                <span className="text-[10px] text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  Real-time Sign-Off Status
                </span>
              </div>

              <div className="w-full h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsStatusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {analyticsStatusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161920',
                        borderColor: '#334155',
                        color: '#F1F5F9',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#CBD5E1' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Member Progress Leaderboard Table */}
          <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-slate-200 font-mono uppercase flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Member Award Tier Progress Breakdown
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">{analyticsMemberData.length} active scouts</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#161920] text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Scout Member</th>
                    <th className="py-2.5 px-3">Crew / Section</th>
                    <th className="py-2.5 px-3">President's Scout</th>
                    <th className="py-2.5 px-3">Baden-Powell (BP)</th>
                    <th className="py-2.5 px-3">Auxiliary Badges</th>
                    <th className="py-2.5 px-3 text-right">Total Verified</th>
                    <th className="py-2.5 px-3 text-right">Award Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {analyticsMemberData.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-100">{m.fullName}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">{m.crewName} ({m.section})</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${m.presidentsPct}%` }} />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-emerald-400">{m.presidentsPct}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${m.bpPct}%` }} />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-amber-400">{m.bpPct}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-500 rounded-full" style={{ width: `${m.auxPct}%` }} />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-sky-400">{m.auxPct}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-300">
                        {m.totalCompleted} badges
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const topTier = m.presidentsPct >= 100
                              ? "President's Scout Award"
                              : m.bpPct >= 100
                              ? 'Baden-Powell (BP) Award'
                              : m.presidentsPct > m.bpPct
                              ? "President's Scout Award"
                              : 'Baden-Powell (BP) Award';

                            setCertModal({
                              isOpen: true,
                              member: m.rawMember,
                              awardTier: topTier,
                              completedCount: topTier === "President's Scout Award" ? m.presidentsCompleted : m.bpCompleted,
                              totalCount: topTier === "President's Scout Award" ? totalPresidentsReqs : totalBpReqs,
                            });
                          }}
                          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition inline-flex items-center gap-1"
                          title="Generate and Download Official PDF Progression Certificate"
                        >
                          <Award className="w-3 h-3 text-amber-400" />
                          <span>PDF Cert</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AI Progression Assistant Tab Content */}
      {activeTab === 'ai-assistant' && (
        <AIProgressionAssistant
          members={members}
          currentMember={currentMember}
          syllabus={syllabus}
          progressList={progressList}
          journals={journals}
          events={events}
          attendance={attendance}
          aiEnabled={aiEnabled}
          onSelectRequirement={(reqId) => {
            setActiveTab('catalog');
          }}
        />
      )}

      {/* Member Sign-Off Matrix View */}
      {activeTab === 'signoffs' && (
        <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 font-serif">
                {isCouncil ? 'Troop Award Progression & Sign-off Matrix' : 'My Assigned Award Progression & Tasks'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isCouncil
                  ? 'Council Officers view all members to review submitted reports, evidence files, and sign off completed syllabus requirements.'
                  : 'Personal assigned checklist. Complete tasks, write reflection reports, or attach photos to submit for Council verification.'}
              </p>
            </div>
            {!isCouncil && (
              <span className="bg-sky-500/10 text-sky-300 border border-sky-500/30 text-[10px] font-bold px-2.5 py-1 rounded-md font-mono self-start sm:self-auto">
                Personal Progress View
              </span>
            )}
          </div>

          {/* Search & Filter Bar for Council Sign-Off Matrix */}
          {isCouncil && (
            <div className="bg-[#161920] border border-slate-800 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Search member by name, council role, ID, section..."
                    className="w-full bg-[#1A1E26] border border-slate-800 rounded-xl pl-8 pr-8 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                  {memberSearchQuery && (
                    <button
                      onClick={() => setMemberSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                      title="Clear Search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Role Filter */}
                <div className="flex items-center gap-1.5 bg-[#1A1E26] border border-slate-800 px-3 py-1.5 rounded-xl flex-shrink-0">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400 font-medium hidden sm:inline">Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="All">All Council Roles</option>
                    {Array.from(new Set(members.map((m) => m.councilRole)))
                      .sort()
                      .map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Counter */}
              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-slate-800 pt-2 md:pt-0">
                <span>
                  Showing <strong className="text-emerald-400 font-bold">{
                    (isCouncil ? members : members.filter((m) => m.id === currentMember.id)).filter((m) => {
                      if (roleFilter !== 'All' && m.councilRole !== roleFilter) return false;
                      if (!memberSearchQuery.trim()) return true;
                      const q = memberSearchQuery.toLowerCase().trim();
                      return (
                        (m.name || '').toLowerCase().includes(q) ||
                        (m.councilRole || '').toLowerCase().includes(q) ||
                        (m.section || '').toLowerCase().includes(q) ||
                        (m.crewName || '').toLowerCase().includes(q) ||
                        (m.idCard || '').toLowerCase().includes(q)
                      );
                    }).length
                  }</strong> of {isCouncil ? members.length : 1} records
                </span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {(() => {
              const baseList = isCouncil ? members : members.filter((m) => m && currentMember && m.id === currentMember.id);
              const filteredList = baseList.filter((m) => {
                if (roleFilter !== 'All' && m.councilRole !== roleFilter) return false;
                if (!memberSearchQuery.trim()) return true;
                const q = memberSearchQuery.toLowerCase().trim();
                return (
                  (m.name || '').toLowerCase().includes(q) ||
                  (m.councilRole || '').toLowerCase().includes(q) ||
                  (m.section || '').toLowerCase().includes(q) ||
                  (m.crewName || '').toLowerCase().includes(q) ||
                  (m.idCard || '').toLowerCase().includes(q)
                );
              });

              if (filteredList.length === 0) {
                return (
                  <div className="bg-[#161920] border border-slate-800 rounded-xl p-8 text-center space-y-2">
                    <Search className="w-8 h-8 text-slate-500 mx-auto opacity-60" />
                    <p className="text-slate-300 font-semibold text-xs">No member progress records found</p>
                  </div>
                );
              }

              return filteredList.map((m) => {
                const relevantAward = m.section === 'Explorer' ? "President's Scout Award" : 'Baden-Powell (BP) Award';
                const memberRequirements = syllabus.filter((s) => s.awardType === relevantAward || s.awardType === 'Auxiliary Badge');

                return (
                  <div key={m.id} className="bg-[#161920] border border-slate-800 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-emerald-700/50 flex items-center justify-center font-bold text-xs text-emerald-300">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-100">{m.name}</span>
                            {m.isSuperAdmin || m.councilRole === 'Superadmin' || m.councilRole === 'Rover Advisor' ? (
                              <span className="bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                                <Shield className="w-3 h-3 text-purple-400" />
                                Exempt Overseer ({m.isSuperAdmin || m.councilRole === 'Superadmin' ? 'Superadmin' : 'Rover Advisor'})
                              </span>
                            ) : (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                  m.councilRole !== 'Member'
                                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {m.councilRole}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {m.isSuperAdmin || m.councilRole === 'Superadmin' ? (
                              <span className="text-purple-300 font-medium">Portal Level Admin • Exempt from Crew & Candidate Syllabus Work</span>
                            ) : m.councilRole === 'Rover Advisor' ? (
                              <span className="text-purple-300 font-medium">Organisation Level Advisor • Exempt from Crew & Candidate Syllabus Work</span>
                            ) : (
                              <>{m.section} ({m.age} yrs) • {m.crewName} • Primary Track: <span className="text-amber-300 font-medium">{relevantAward}</span></>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Requirements List for Member */}
                    <div className="space-y-3 pt-1">
                      {memberRequirements.map((req) => {
                        const prog = progressList.find((p) => p.memberId === m.id && p.requirementId === req.id);
                        const completedTaskIds = prog ? prog.completedTasks : [];

                        return (
                          <div key={req.id} className="bg-[#1A1E26] border border-slate-800/80 p-3.5 rounded-xl space-y-3">
                            <div className="flex items-start justify-between gap-2 text-xs">
                              <div>
                                <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                                  <span>{req.title}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">({req.category})</span>
                                </h4>
                                {prog?.assignedBy && (
                                  <span className="text-[10px] text-sky-400 font-mono block mt-0.5">
                                    Assigned by {prog.assignedBy} {prog.assignedDate && `on ${prog.assignedDate}`} {prog.dueDate && `(Due: ${prog.dueDate})`}
                                  </span>
                                )}
                              </div>

                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold flex-shrink-0 ${
                                  prog?.status === 'Completed'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : prog?.status === 'Submitted'
                                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                    : prog?.status === 'In Progress'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {prog?.status || 'Not Started'}
                              </span>
                            </div>

                            {/* Sub-tasks checklist */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {req.tasks.map((task) => {
                                const isDone = completedTaskIds.includes(task.id);
                                return (
                                  <button
                                    key={task.id}
                                    onClick={() => toggleTaskForMember(m.id, req.id, task.id)}
                                    className={`p-2 rounded-lg text-left flex items-center gap-2 transition ${
                                      isDone
                                        ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-200'
                                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    {isDone ? (
                                      <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    ) : (
                                      <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                    )}
                                    <span className="text-[11px]">{task.text}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Submission Evidence Summary */}
                            {(prog?.writtenReport || (prog?.evidenceFiles && prog.evidenceFiles.length > 0)) && (
                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                                {prog.writtenReport && (
                                  <div>
                                    <span className="text-[10px] font-bold text-purple-400 uppercase font-mono block">Submitted Reflection Report:</span>
                                    <p className="text-slate-300 italic text-[11px] line-clamp-2">"{prog.writtenReport}"</p>
                                  </div>
                                )}
                                {prog.evidenceFiles && prog.evidenceFiles.length > 0 && (
                                  <div>
                                    <span className="text-[10px] font-bold text-sky-400 uppercase font-mono block">Attached Evidence Files:</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {prog.evidenceFiles.map((f) => (
                                        <span key={f.id} className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                                          <Paperclip className="w-3 h-3 text-sky-400" />
                                          <span>{f.fileName}</span>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Action Buttons for Member Submission or Council Signoff */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
                              {prog?.completionDate ? (
                                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified by {prog.verifiedBy} on {prog.completionDate}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">
                                  {req.submissionInstructions || 'Complete tasks and submit required evidence.'}
                                </span>
                              )}

                              <div className="flex items-center gap-2">
                                {/* Member Submit Button */}
                                {(m.id === currentMember.id || isCouncil) && (
                                  <button
                                    onClick={() => handleOpenEvidenceModal(m.id, req)}
                                    className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[11px] font-semibold px-3 py-1 rounded-lg flex items-center gap-1 transition"
                                  >
                                    <FileUp className="w-3.5 h-3.5" />
                                    <span>{prog?.writtenReport || (prog?.evidenceFiles && prog.evidenceFiles.length > 0) ? 'Update Report / Files' : 'Submit Report / Proof'}</span>
                                  </button>
                                )}

                                {/* Council Review & Signoff Button */}
                                {isCouncil && (prog?.status === 'Submitted' || prog?.status === 'In Progress') && (
                                  <button
                                    onClick={() => handleOpenReviewModal(m, req, prog)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-3 py-1 rounded-lg flex items-center gap-1 transition shadow"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Review & Sign Off</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* AI Syllabus Builder Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1E26] border border-purple-500/40 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-100 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-purple-300 flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-400" />
                <span>AI Prompt Syllabus Generator</span>
              </h3>
              <button onClick={() => setIsAiModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Describe your syllabus requirement or course prompt in plain language. AI will analyze the instructions to extract tasks, award track, category, and automatically determine whether a simple checkbox is enough or if members must submit a written report, photos, or PDF documents!
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Prompt Instructions / Syllabus Document Text *
                </label>
                <textarea
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Create a 3-day island wilderness hike requirement for Rovers. Members must cover 30km, construct a bivouac shelter, submit photo proof of the shelter, attach a GPS route map document, and write a 300-word reflection report."
                  className="w-full bg-[#161920] border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleParseAiPrompt}
                disabled={isAiParsing || !aiPrompt.trim()}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition shadow flex items-center justify-center gap-2"
              >
                {isAiParsing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-purple-200" />
                    <span>Analyzing Prompt & Configuring Submission Fields...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>Generate Structured Syllabus with AI</span>
                  </>
                )}
              </button>

              {/* AI Parsed Result Preview */}
              {aiParsedResult && (
                <div className="bg-[#161920] border border-purple-500/40 rounded-xl p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-bold uppercase font-mono text-purple-400">
                      Generated Requirement Preview:
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                      {aiParsedResult.awardType}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-100">{aiParsedResult.title}</h4>
                  <p className="text-xs text-slate-300">{aiParsedResult.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Category:</span>
                      <strong className="text-slate-200">{aiParsedResult.category}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Min Hours:</span>
                      <strong className="text-amber-300">{aiParsedResult.minHours} hrs</strong>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-800">
                      <span className="text-slate-500 block">Submission Configuration:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {aiParsedResult.requiresReport && (
                          <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded font-medium">
                            ✓ Written Report Required
                          </span>
                        )}
                        {aiParsedResult.requiresPhotos && (
                          <span className="bg-sky-500/20 text-sky-300 text-[10px] px-2 py-0.5 rounded font-medium">
                            ✓ Photo Evidence Required
                          </span>
                        )}
                        {aiParsedResult.requiresDocument && (
                          <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded font-medium">
                            ✓ Document/PDF File Required
                          </span>
                        )}
                        {!aiParsedResult.requiresReport && !aiParsedResult.requiresPhotos && !aiParsedResult.requiresDocument && (
                          <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-medium">
                            ✓ Checkbox Verification Only
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Extracted Tasks ({aiParsedResult.tasks.length}):</span>
                    <ul className="space-y-1 text-xs text-slate-300 pl-2">
                      {aiParsedResult.tasks.map((t, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-purple-400">•</span>
                          <span>{t.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={handleApplyAiParsedResult}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition shadow flex items-center justify-center gap-2 mt-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm & Add to Syllabus Catalog</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Manual Adding / Editing Requirement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleFormSubmit}
            className="bg-[#1A1E26] border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-100 space-y-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold font-serif text-slate-100">
                {editingReq ? 'Edit Syllabus Requirement' : 'Add New Syllabus Requirement'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Award Target Framework</label>
                <select
                  value={formData.awardType}
                  onChange={(e) => setFormData({ ...formData, awardType: e.target.value as AwardType })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                >
                  <option value="President's Scout Award">President's Scout Award (Explorer Section)</option>
                  <option value="Baden-Powell (BP) Award">Baden-Powell (BP) Award (Rover Section)</option>
                  <option value="Auxiliary Badge">Auxiliary Badge</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as CategoryType })}
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
                <label className="block text-slate-300 font-medium mb-1">Requirement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maritime Navigation & Seamanship"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description & Scope</label>
                <textarea
                  rows={2}
                  placeholder="Detailed criteria explanation..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              {/* Submission Requirements Toggles */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-slate-200 font-bold text-xs uppercase font-mono">
                  Member Submission Criteria Configuration:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiresReport}
                      onChange={(e) => setFormData({ ...formData, requiresReport: e.target.checked })}
                      className="rounded border-slate-700 text-purple-600 focus:ring-0"
                    />
                    <span className="text-slate-300 font-medium">Require Written Report / Reflection Log</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiresPhotos}
                      onChange={(e) => setFormData({ ...formData, requiresPhotos: e.target.checked })}
                      className="rounded border-slate-700 text-sky-600 focus:ring-0"
                    />
                    <span className="text-slate-300 font-medium">Require Photo Proof / Certificate Upload</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiresDocument}
                      onChange={(e) => setFormData({ ...formData, requiresDocument: e.target.checked })}
                      className="rounded border-slate-700 text-amber-600 focus:ring-0"
                    />
                    <span className="text-slate-300 font-medium">Require Route Map / Document PDF Attachment</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Required Task Blocks (One task per line)</label>
                <textarea
                  rows={3}
                  placeholder={`Complete a 30km wilderness hike.\nConstruct a bivouac shelter.\nPass knot tying exam.`}
                  value={formData.tasksText}
                  onChange={(e) => setFormData({ ...formData, tasksText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Minimum Required Hours</label>
                <input
                  type="number"
                  value={formData.minHours}
                  onChange={(e) => setFormData({ ...formData, minHours: Number(e.target.value) })}
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
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold px-5 py-2 rounded-xl transition shadow-md"
              >
                Save Requirement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal for Assigning Syllabus Requirement to Members */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAssignTaskSubmit}
            className="bg-[#1A1E26] border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-100 space-y-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold font-serif text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-400" />
                <span>Assign Syllabus Task to Members</span>
              </h3>
              <button type="button" onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Syllabus Requirement *</label>
                <select
                  value={assignReqId}
                  onChange={(e) => setAssignReqId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none font-medium"
                >
                  {syllabus.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.awardType}] {s.title} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Assignment Scope Target</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignTargetType('individual')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      assignTargetType === 'individual'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Select Members
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignTargetType('crew')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      assignTargetType === 'crew'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Specific Sub-Crew
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignTargetType('all')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      assignTargetType === 'all'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    All Active Crew
                  </button>
                </div>
              </div>

              {assignTargetType === 'crew' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Select Target Sub-Crew</label>
                  <select
                    value={assignCrewId}
                    onChange={(e) => setAssignCrewId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="male-city">Male City Crew</option>
                    <option value="hulhumale">Hulhumale Crew</option>
                    <option value="villimale">Villimale Coastal Crew</option>
                  </select>
                </div>
              )}

              {assignTargetType === 'individual' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Select Members to Assign</label>
                  <div className="max-h-40 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-2 space-y-1">
                    {members.map((m) => {
                      const isSelected = assignMemberIds.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            setAssignMemberIds((prev) =>
                              prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                            );
                          }}
                          className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition ${
                            isSelected ? 'bg-sky-950/60 text-sky-200 border border-sky-800/60' : 'hover:bg-slate-900 text-slate-300'
                          }`}
                        >
                          <div>
                            <span className="font-bold">{m.name}</span>
                            <span className="text-[10px] text-slate-500 ml-2">({m.section} • {m.councilRole})</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-sky-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Completion Due Date (Optional)</label>
                <input
                  type="date"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Council Assignment Notes / Special Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please submit route map PDF before next week's assembly..."
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition shadow-md flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Assign Requirement</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal for Member Evidence & Report Submission */}
      {isEvidenceModalOpen && evidenceTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleEvidenceSubmit}
            className="bg-[#1A1E26] border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-100 space-y-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold font-serif text-slate-100 flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-purple-400" />
                  <span>Submit Syllabus Completion Materials</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{evidenceTarget.reqTitle}</p>
              </div>
              <button type="button" onClick={() => setIsEvidenceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Report Field */}
              {evidenceTarget.req.requiresReport && (
                <div>
                  <label className="block text-purple-300 font-bold mb-1 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>Written Reflection Report / Activity Log *</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={writtenReport}
                    onChange={(e) => setWrittenReport(e.target.value)}
                    placeholder="Write a reflection report detailing your experience, lessons learned, and how Scouting values were applied..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-purple-500 text-xs"
                  />
                </div>
              )}

              {/* Photo / Document Upload Field */}
              {(evidenceTarget.req.requiresPhotos || evidenceTarget.req.requiresDocument) && (
                <div>
                  <label className="block text-sky-300 font-bold mb-1 flex items-center gap-1">
                    <Paperclip className="w-4 h-4" />
                    <span>Attach Photo Proof or Document PDF *</span>
                  </label>
                  <div className="bg-slate-950 border border-dashed border-slate-700 rounded-xl p-4 text-center space-y-2">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-slate-300 text-xs font-medium">Click to select photo or document file</p>
                    <input type="file" onChange={handleFileChange} className="hidden" id="evidence-file-input" />
                    <label
                      htmlFor="evidence-file-input"
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg font-semibold inline-block cursor-pointer transition"
                    >
                      Browse Files
                    </label>

                    {selectedFile && (
                      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between text-left mt-2">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-sky-400" />
                          <div>
                            <span className="font-bold text-slate-200 block">{selectedFile.fileName}</span>
                            <span className="text-[10px] text-slate-500">{selectedFile.fileSize}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold">Ready to upload</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Additional Notes / Remarks for Council</label>
                <textarea
                  rows={2}
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  placeholder="Optional remarks..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none text-xs"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={autoCompleteTasks}
                  onChange={(e) => setAutoCompleteTasks(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                />
                <span className="text-slate-300 text-xs">Mark all sub-task checkboxes as completed upon submission</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEvidenceModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition shadow-md flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Submit to Council</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal for Council Verification & Signoff Review */}
      {isReviewModalOpen && reviewTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1E26] border border-emerald-500/40 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-100 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold font-serif text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Council Officer Official Sign-off Review</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Member: {reviewTarget.member.name}</p>
              </div>
              <button type="button" onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#161920] border border-slate-800 p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">{reviewTarget.req.awardType}</span>
                <h4 className="font-bold text-sm text-slate-100">{reviewTarget.req.title}</h4>
                <p className="text-xs text-slate-300">{reviewTarget.req.description}</p>
              </div>

              {reviewTarget.prog.writtenReport && (
                <div className="bg-slate-950 p-3 rounded-xl border border-purple-500/30 space-y-1">
                  <span className="text-[10px] font-bold text-purple-400 uppercase font-mono block">
                    Member Reflection Report:
                  </span>
                  <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">{reviewTarget.prog.writtenReport}</p>
                </div>
              )}

              {reviewTarget.prog.evidenceFiles && reviewTarget.prog.evidenceFiles.length > 0 && (
                <div className="bg-slate-950 p-3 rounded-xl border border-sky-500/30 space-y-1.5">
                  <span className="text-[10px] font-bold text-sky-400 uppercase font-mono block">
                    Attached Evidence Documents/Photos:
                  </span>
                  {reviewTarget.prog.evidenceFiles.map((file) => (
                    <div key={file.id} className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-sky-400" />
                        <div>
                          <span className="font-bold text-slate-200 block">{file.fileName}</span>
                          <span className="text-[10px] text-slate-500">{file.uploadedAt} • {file.fileSize}</span>
                        </div>
                      </div>
                      {file.fileUrl && (
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-semibold px-2 py-1 rounded flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Council Verification Remarks / Log Notes</label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Official council evaluation remarks..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCouncilApprove}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition shadow-md flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Approve & Official Sign Off</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Award Certificate Modal */}
      {certModal.isOpen && certModal.member && (
        <CertificateModal
          isOpen={certModal.isOpen}
          onClose={() => setCertModal((prev) => ({ ...prev, isOpen: false }))}
          member={certModal.member}
          awardTier={certModal.awardTier}
          completedItemsCount={certModal.completedCount}
          totalItemsCount={certModal.totalCount}
          signedByLeader={`${currentMember.name} (${currentMember.councilRole})`}
        />
      )}
    </div>
  );
};
