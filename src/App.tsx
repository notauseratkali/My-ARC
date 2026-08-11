import React, { useState, useEffect } from 'react';
import { Crown, LogOut, LogIn, Shield, Building2, RefreshCw } from 'lucide-react';
import {
  INITIAL_ORGANISATIONS,
  INITIAL_MEMBERS,
  INITIAL_CREWS,
  INITIAL_SYLLABUS,
  INITIAL_PROGRESS,
  INITIAL_JOURNALS,
  INITIAL_EVENTS,
  INITIAL_ATTENDANCE,
  INITIAL_DISCIPLINARY,
  INITIAL_MEETING_MINUTES,
  INITIAL_SETTINGS,
  INITIAL_ROVER_POLICY,
  INITIAL_POLICY_POLLS,
  INITIAL_FEE_REQUESTS,
  INITIAL_PAYMENT_TRANSACTIONS,
  INITIAL_AUDIT_LOGS,
} from './data/initialData';
import {
  Organisation,
  Member,
  SubCrew,
  SyllabusRequirement,
  MemberRequirementProgress,
  JournalEntry,
  CrewEvent,
  AttendanceRecord,
  DisciplinaryIncident,
  MeetingMinutes,
  PortalSettings,
  RoverOperatingPolicy,
  PolicyAmendmentPoll,
  PolicyVote,
  FeeRequest,
  CrewPaymentTransaction,
  AuditLogEntry,
} from './types';
import {
  initializeFirestoreDatabase,
  subscribeToCollection,
  subscribeToDocument,
  subscribeToSyncStatus,
  type SyncStatus,
  saveDocumentToFirestore,
  saveBatchToFirestore,
  deleteDocumentFromFirestore,
  saveSettingsToFirestore,
} from './lib/firestoreSync';

import { Sidebar } from './components/Sidebar';
import { UserSwitcher } from './components/UserSwitcher';
import { LoginModal } from './components/LoginModal';
import { OrganisationSignupModal } from './components/OrganisationSignupModal';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { DashboardView } from './components/DashboardView';
import { MemberDirectory } from './components/MemberDirectory';
import { SyllabusEngine } from './components/SyllabusEngine';
import { PortfolioJournal } from './components/PortfolioJournal';
import { EventsCalendar } from './components/EventsCalendar';
import { AttendancePortal } from './components/AttendancePortal';
import { MeetingMinutesModule } from './components/MeetingMinutesModule';
import { DisciplinaryModule } from './components/DisciplinaryModule';
import { SettingsCrewModule } from './components/SettingsCrewModule';
import { RoverPolicyModule } from './components/RoverPolicyModule';
import { PaymentsModule } from './components/PaymentsModule';
import { AuditLogModule } from './components/AuditLogModule';
import { PlanRenewalModal } from './components/PlanRenewalModal';
import { RequireAuth } from './components/RequireAuth';
import { useToast } from './components/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';

function getURLRouteState() {
  const path = (window.location.pathname || '').toLowerCase();
  const hash = (window.location.hash || '').toLowerCase();
  const search = (window.location.search || '').toLowerCase();
  const isLoggedIn = !!localStorage.getItem('arabiya_logged_member_id');

  let tab = 'dashboard';
  let showLogin = !isLoggedIn;
  let showSignup = false;

  if (path.includes('login') || hash.includes('login') || search.includes('login')) {
    showLogin = true;
    showSignup = false;
  } else if (path.includes('signup') || path.includes('register') || hash.includes('signup') || search.includes('signup')) {
    showSignup = true;
    showLogin = false;
  } else if (path.includes('auth') || hash.includes('auth') || search.includes('auth')) {
    showLogin = true;
    showSignup = false;
  } else if (path.includes('members') || hash.includes('members') || search.includes('members')) {
    tab = 'members';
    if (isLoggedIn) showLogin = false;
  } else if (path.includes('attendance') || hash.includes('attendance') || search.includes('attendance')) {
    tab = 'attendance';
    if (isLoggedIn) showLogin = false;
  } else if (path.includes('syllabus') || hash.includes('syllabus') || search.includes('syllabus')) {
    tab = 'syllabus';
    if (isLoggedIn) showLogin = false;
  } else if (path.includes('events') || hash.includes('events') || search.includes('events')) {
    tab = 'events';
    if (isLoggedIn) showLogin = false;
  } else if (path.includes('minutes') || hash.includes('minutes') || search.includes('minutes')) {
    tab = 'minutes';
    if (isLoggedIn) showLogin = false;
  } else if (path.includes('policy') || hash.includes('policy') || search.includes('policy')) {
    tab = 'policy';
    if (isLoggedIn) showLogin = false;
  } else if (path.includes('payment') || hash.includes('payment') || search.includes('payment')) {
    tab = 'payments';
    if (isLoggedIn) showLogin = false;
  } else if (path.includes('disciplinary') || hash.includes('disciplinary') || search.includes('disciplinary')) {
    tab = 'disciplinary';
    if (isLoggedIn) showLogin = false;
  } else if (path.includes('portfolio') || hash.includes('portfolio') || search.includes('portfolio')) {
    tab = 'portfolio';
    if (isLoggedIn) showLogin = false;
  } else if (path.includes('settings') || hash.includes('settings') || search.includes('settings')) {
    tab = 'settings';
    if (isLoggedIn) showLogin = false;
  } else if (path.includes('superadmin') || hash.includes('superadmin') || search.includes('superadmin')) {
    tab = 'superadmin';
    if (isLoggedIn) showLogin = false;
  }

  return { tab, showLogin, showSignup };
}

export default function App() {
  const { toastSuccess, toastInfo, toastWarning, toastError, toastSync } = useToast();

  const initialRoute = getURLRouteState();

  // Master State
  const [organisations, setOrganisations] = useState<Organisation[]>(INITIAL_ORGANISATIONS);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [crews, setCrews] = useState<SubCrew[]>(INITIAL_CREWS);
  const [syllabus, setSyllabus] = useState<SyllabusRequirement[]>(INITIAL_SYLLABUS);
  const [progressList, setProgressList] = useState<MemberRequirementProgress[]>(INITIAL_PROGRESS);
  const [journals, setJournals] = useState<JournalEntry[]>(INITIAL_JOURNALS);
  const [events, setEvents] = useState<CrewEvent[]>(INITIAL_EVENTS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [incidents, setIncidents] = useState<DisciplinaryIncident[]>(INITIAL_DISCIPLINARY);
  const [meetingMinutes, setMeetingMinutes] = useState<MeetingMinutes[]>(INITIAL_MEETING_MINUTES);
  const [policy, setPolicy] = useState<RoverOperatingPolicy>(INITIAL_ROVER_POLICY);
  const [polls, setPolls] = useState<PolicyAmendmentPoll[]>(INITIAL_POLICY_POLLS);
  const [feeRequests, setFeeRequests] = useState<FeeRequest[]>(INITIAL_FEE_REQUESTS);
  const [paymentTransactions, setPaymentTransactions] = useState<CrewPaymentTransaction[]>(INITIAL_PAYMENT_TRANSACTIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [settings, setSettings] = useState<PortalSettings>(INITIAL_SETTINGS);

  // Real-time Firestore Sync Status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const prevSyncStatusRef = React.useRef<SyncStatus>('synced');
  const isInitialSyncRef = React.useRef<boolean>(true);

  // Active Tab & Current Logged-In Persona Switcher
  const [activeTab, setActiveTab] = useState<string>(initialRoute.tab);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(() => {
    return localStorage.getItem('arabiya_logged_member_id') || null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(initialRoute.showLogin);
  const [isOrgSignupOpen, setIsOrgSignupOpen] = useState<boolean>(initialRoute.showSignup);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState<boolean>(false);
  const [activeOrgContext, setActiveOrgContext] = useState<string>('all');

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('arabiya_theme');
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  });

  const verifiedMember = React.useMemo(() => {
    if (!currentMemberId) return null;
    return members.find((m) => m.id === currentMemberId) || null;
  }, [currentMemberId, members]);

  const currentMember = verifiedMember || members[0];
  const isSuperAdmin = verifiedMember ? (verifiedMember.isSuperAdmin || verifiedMember.councilRole === 'Superadmin') : false;
  const isCouncil = verifiedMember ? (verifiedMember.councilRole !== 'Member' || isSuperAdmin) : false;

  // Filter members by organisation context if set
  const filteredMembers = React.useMemo(() => {
    if (activeOrgContext !== 'all') {
      return members.filter((m) => m.organisationId === activeOrgContext || m.isSuperAdmin);
    }
    if (!isSuperAdmin && currentMember?.organisationId) {
      return members.filter((m) => m.organisationId === currentMember.organisationId || m.isSuperAdmin);
    }
    return members;
  }, [members, activeOrgContext, isSuperAdmin, currentMember]);

  const activeOrgObj = organisations.find((o) => o.id === (activeOrgContext !== 'all' ? activeOrgContext : currentMember?.organisationId));

  const handleLogin = (member: Member) => {
    setCurrentMemberId(member.id);
    localStorage.setItem('arabiya_logged_member_id', member.id);
    setIsLoginModalOpen(false);

    // Update members list & sync to Firestore if member details (e.g. password) were updated during login
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === member.id) {
          saveDocumentToFirestore('members', member);
          return member;
        }
        return m;
      })
    );

    if (member.isSuperAdmin || member.councilRole === 'Superadmin') {
      setActiveTab('superadmin');
    }
  };

  const handleLogout = () => {
    setCurrentMemberId(null);
    localStorage.removeItem('arabiya_logged_member_id');
    setIsLoginModalOpen(true);
  };

  // Apply Light/Dark class to document element and body
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
      document.body.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  // Sync URL state and handle popstate browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const route = getURLRouteState();
      setActiveTab(route.tab);
      setIsLoginModalOpen(route.showLogin);
      setIsOrgSignupOpen(route.showSignup);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    try {
      let targetFile = `${activeTab}.html`;
      if (!currentMemberId) {
        targetFile = isOrgSignupOpen ? 'signup.html' : 'login.html';
      } else if (isOrgSignupOpen) {
        targetFile = 'signup.html';
      } else if (isLoginModalOpen) {
        targetFile = 'login.html';
      }
      const currentPath = window.location.pathname;
      if (!currentPath.endsWith(targetFile)) {
        window.history.replaceState(null, '', `./${targetFile}`);
      }
    } catch {
      // Ignore security/origin constraints if running in restricted context
    }
  }, [activeTab, isLoginModalOpen, isOrgSignupOpen, currentMemberId]);

  // Initialize Firestore and real-time synchronization
  useEffect(() => {
    initializeFirestoreDatabase();

    const unsubOrgs = subscribeToCollection<Organisation>('organisations', (data) => {
      setOrganisations(data);
    });

    const unsubMembers = subscribeToCollection<Member>('members', (data) => {
      if (data.length > 0) {
        const sanitized = data.map((m) => {
          if (m.isSuperAdmin || m.id === 'm-superadmin' || m.councilRole === 'Superadmin') {
            const updatedSuperadmin = {
              ...m,
              isSuperAdmin: true,
              councilRole: 'Superadmin' as const,
              name: 'Ahmed Nazih Nafiz',
              email: 'nazihnafiz@gmail.com',
              section: 'National Portal' as const,
              crewName: 'N/A (National Superadmin)',
              crewId: 'portal-admin',
            };
            if (m.name !== 'Ahmed Nazih Nafiz' || m.email !== 'nazihnafiz@gmail.com' || m.crewName !== 'N/A (National Superadmin)') {
              saveDocumentToFirestore('members', updatedSuperadmin);
            }
            return updatedSuperadmin;
          }
          return m;
        });
        setMembers(sanitized);
      } else {
        setMembers(data);
      }
    });

    const unsubCrews = subscribeToCollection<SubCrew>('crews', (data) => {
      setCrews(data);
    });

    const unsubSyllabus = subscribeToCollection<SyllabusRequirement>('syllabus', (data) => {
      setSyllabus(data);
    });

    const unsubProgress = subscribeToCollection<MemberRequirementProgress>('progress', (data) => {
      setProgressList(data);
    });

    const unsubEvents = subscribeToCollection<CrewEvent>('events', (data) => {
      setEvents(data);
    });

    const unsubAttendance = subscribeToCollection<AttendanceRecord>('attendance', (data) => {
      setAttendance(data);
    });

    const unsubJournals = subscribeToCollection<JournalEntry>('journals', (data) => {
      setJournals(data);
    });

    const unsubDisciplinary = subscribeToCollection<DisciplinaryIncident>('disciplinary', (data) => {
      setIncidents(data);
    });

    const unsubMinutes = subscribeToCollection<MeetingMinutes>('minutes', (data) => {
      setMeetingMinutes(data);
    });

    const unsubPolicy = subscribeToCollection<RoverOperatingPolicy>('policy', (data) => {
      if (data.length > 0) setPolicy(data[0]);
    });

    const unsubPolls = subscribeToCollection<PolicyAmendmentPoll>('polls', (data) => {
      setPolls(data);
    });

    const unsubFeeRequests = subscribeToCollection<FeeRequest>('fee_requests', (data) => {
      setFeeRequests(data);
    });

    const unsubTransactions = subscribeToCollection<CrewPaymentTransaction>('payment_transactions', (data) => {
      setPaymentTransactions(data);
    });

    const unsubAuditLogs = subscribeToCollection<AuditLogEntry>('audit_logs', (data) => {
      setAuditLogs(data);
    });

    const unsubSettings = subscribeToDocument<PortalSettings>('settings', 'portal', (data) => {
      if (data) setSettings(data);
    });

    const unsubSyncStatus = subscribeToSyncStatus((status, time) => {
      setSyncStatus(status);
      if (time) setLastSyncedAt(time);

      if (status === 'synced') {
        const timeStr = time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'just now';
        if (isInitialSyncRef.current) {
          isInitialSyncRef.current = false;
          toastSync('Cloud Sync Active', 'Initial portal data synchronized with Cloud Firestore.');
        } else if (prevSyncStatusRef.current !== 'synced') {
          toastSync('Sync Completed', `Database records updated at ${timeStr}.`);
        }
      }
      prevSyncStatusRef.current = status;
    });

    return () => {
      unsubOrgs();
      unsubMembers();
      unsubCrews();
      unsubSyllabus();
      unsubProgress();
      unsubEvents();
      unsubAttendance();
      unsubJournals();
      unsubDisciplinary();
      unsubMinutes();
      unsubPolicy();
      unsubPolls();
      unsubFeeRequests();
      unsubTransactions();
      unsubAuditLogs();
      unsubSettings();
      unsubSyncStatus();
    };
  }, []);

  // POLICY & REFERENDUM POLL HANDLERS
  const handleUpdatePolicy = (updatedPolicy: RoverOperatingPolicy) => {
    setPolicy(updatedPolicy);
    saveDocumentToFirestore('policy', updatedPolicy);
    toastInfo('Operating Policy Revised', `Policy version ${updatedPolicy.version} saved.`);
  };

  const handleCreatePoll = (newPoll: PolicyAmendmentPoll) => {
    setPolls((prev) => [newPoll, ...prev]);
    saveDocumentToFirestore('polls', newPoll);
    toastSuccess('Referendum Poll Opened', `"${newPoll.title}" is now active for democratic voting.`);
  };

  const handleCastVote = (pollId: string, vote: PolicyVote) => {
    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;
        const filteredVotes = p.votes.filter((v) => v.memberId !== vote.memberId);
        const updatedPoll: PolicyAmendmentPoll = {
          ...p,
          votes: [...filteredVotes, vote],
        };
        saveDocumentToFirestore('polls', updatedPoll);
        return updatedPoll;
      })
    );
    toastSuccess('Vote Registered', `Your vote for choice "${vote.choice}" has been recorded.`);
  };

  const handleFinalizePoll = (
    pollId: string,
    outcome: 'Passed & Implemented' | 'Defeated',
    newPolicyContent?: string
  ) => {
    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;
        const updatedPoll: PolicyAmendmentPoll = {
          ...p,
          status: outcome,
          resolvedAt: new Date().toISOString().split('T')[0],
        };
        saveDocumentToFirestore('polls', updatedPoll);
        return updatedPoll;
      })
    );

    if (outcome === 'Passed & Implemented' && newPolicyContent) {
      const updatedPolicy: RoverOperatingPolicy = {
        ...policy,
        version: `v${(parseFloat((policy?.version || 'v2.4').replace(/[^0-9.]/g, '')) + 0.1).toFixed(1)} (Amended)`,
        content: newPolicyContent,
        lastUpdated: new Date().toISOString().split('T')[0],
        updatedBy: 'Referendum Vote Passed',
      };
      setPolicy(updatedPolicy);
      saveDocumentToFirestore('policy', updatedPolicy);
      toastSuccess('Referendum Passed & Implemented', 'Policy document has been updated automatically.');
    } else {
      toastInfo('Referendum Closed', `Outcome: ${outcome}`);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('arabiya_theme', nextTheme);
  };

  // ORGANISATION HANDLERS
  const handleOrgSignupSubmit = (newOrgData: Omit<Organisation, 'id' | 'createdAt' | 'status'>) => {
    const newOrg: Organisation = {
      ...newOrgData,
      id: `org-${Date.now()}`,
      status: 'Pending Approval',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setOrganisations((prev) => [newOrg, ...prev]);
    saveDocumentToFirestore('organisations', newOrg);
  };

  const handleApproveOrg = (orgId: string) => {
    const targetOrg = organisations.find((o) => o.id === orgId);
    if (!targetOrg) return;

    const updatedOrg: Organisation = {
      ...targetOrg,
      status: 'Active',
      approvedAt: new Date().toISOString().split('T')[0],
    };
    setOrganisations((prev) => prev.map((o) => (o.id === orgId ? updatedOrg : o)));
    saveDocumentToFirestore('organisations', updatedOrg);

    // Auto-provision Rover Advisor Member account for this organisation
    const newAdvisorMember: Member = {
      id: `m-advisor-${Date.now()}`,
      organisationId: targetOrg.id,
      name: targetOrg.roverAdvisorName,
      idCard: targetOrg.roverAdvisorNid,
      dob: '1990-01-01',
      age: 36,
      gender: 'Male',
      section: 'Rover',
      crewId: 'male-city',
      crewName: `${targetOrg.name} Primary Crew`,
      councilRole: 'Rover Advisor',
      investitureDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      term: '2025-2026',
      email: targetOrg.roverAdvisorEmail,
      mobile: targetOrg.roverAdvisorPhone,
      permAddress: `${targetOrg.name} HQ`,
      currAddress: `${targetOrg.name} HQ`,
      emergencyContactName: 'Scout Headquarters',
      emergencyContactNumber: targetOrg.roverAdvisorPhone,
      attendanceUnexcused: 0,
      attendanceExcused: 0,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    };

    setMembers((prev) => [newAdvisorMember, ...prev]);
    saveDocumentToFirestore('members', newAdvisorMember);

    alert(`Organisation "${targetOrg.name}" approved! Rover Advisor account provisioned for ${targetOrg.roverAdvisorName} (${targetOrg.roverAdvisorEmail}).`);
  };

  const handleRejectOrg = (orgId: string) => {
    setOrganisations((prev) =>
      prev.map((o) => {
        if (o.id === orgId) {
          const updated: Organisation = { ...o, status: 'Rejected' };
          saveDocumentToFirestore('organisations', updated);
          return updated;
        }
        return o;
      })
    );
  };

  const handleUpdateOrgValidity = (orgId: string, newValidity: string) => {
    setOrganisations((prev) =>
      prev.map((o) => {
        if (o.id === orgId) {
          const updated: Organisation = {
            ...o,
            planValidUntil: newValidity,
            renewalStatus: 'Approved',
          };
          saveDocumentToFirestore('organisations', updated);
          return updated;
        }
        return o;
      })
    );
    toastSuccess('Plan Extended', `Organisation validity updated to ${newValidity}.`);
  };

  const handleUploadOrgRenewalReceipt = (
    orgId: string,
    receiptUrl: string,
    receiptName: string,
    requestedTerm: string,
    notes?: string
  ) => {
    setOrganisations((prev) =>
      prev.map((o) => {
        if (o.id === orgId) {
          const updated: Organisation = {
            ...o,
            renewalStatus: 'Pending Verification',
            renewalReceiptUrl: receiptUrl,
            renewalReceiptName: receiptName,
            renewalRequestedTerm: requestedTerm,
            renewalNotes: notes || '',
            renewalSubmittedAt: new Date().toISOString().split('T')[0],
          };
          saveDocumentToFirestore('organisations', updated);
          return updated;
        }
        return o;
      })
    );
    toastSuccess('Renewal Submitted', 'Receipt uploaded and submitted to Superadmin for verification.');
  };

  const handleRejectOrgRenewal = (orgId: string) => {
    setOrganisations((prev) =>
      prev.map((o) => {
        if (o.id === orgId) {
          const updated: Organisation = {
            ...o,
            renewalStatus: 'Rejected',
          };
          saveDocumentToFirestore('organisations', updated);
          return updated;
        }
        return o;
      })
    );
    toastWarning('Renewal Rejected', 'Organisation renewal request was rejected.');
  };

  const handleUpdateOrg = (updatedOrg: Organisation) => {
    setOrganisations((prev) =>
      prev.map((o) => (o.id === updatedOrg.id ? updatedOrg : o))
    );
    saveDocumentToFirestore('organisations', updatedOrg);
    toastSuccess('Organisation Updated', `Organisation "${updatedOrg.name}" details saved successfully.`);
  };

  const handleDeleteOrg = (orgId: string) => {
    const target = organisations.find((o) => o.id === orgId);
    setOrganisations((prev) => prev.filter((o) => o.id !== orgId));
    deleteDocumentFromFirestore('organisations', orgId);
    toastWarning('Organisation Deleted', `Organisation "${target?.name || orgId}" was removed.`);
  };

  const handleAddDirectOrg = (newOrgData: Omit<Organisation, 'id' | 'createdAt' | 'approvedAt'>) => {
    const newOrg: Organisation = {
      ...newOrgData,
      id: `org-${Date.now()}`,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
      approvedAt: new Date().toISOString().split('T')[0],
    };
    setOrganisations((prev) => [newOrg, ...prev]);
    saveDocumentToFirestore('organisations', newOrg);

    // Auto-provision Rover Advisor Member account
    const newAdvisorMember: Member = {
      id: `m-advisor-${Date.now()}`,
      organisationId: newOrg.id,
      name: newOrg.roverAdvisorName,
      idCard: newOrg.roverAdvisorNid,
      dob: '1990-01-01',
      age: 36,
      gender: 'Male',
      section: 'Rover',
      crewId: 'male-city',
      crewName: `${newOrg.name} Primary Crew`,
      councilRole: 'Rover Advisor',
      investitureDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      term: '2025-2026',
      email: newOrg.roverAdvisorEmail,
      mobile: newOrg.roverAdvisorPhone,
      permAddress: `${newOrg.name} HQ`,
      currAddress: `${newOrg.name} HQ`,
      emergencyContactName: 'Scout Headquarters',
      emergencyContactNumber: newOrg.roverAdvisorPhone,
      attendanceUnexcused: 0,
      attendanceExcused: 0,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    };

    setMembers((prev) => [newAdvisorMember, ...prev]);
    saveDocumentToFirestore('members', newAdvisorMember);

    alert(`Organisation "${newOrg.name}" created and active! Rover Advisor ${newOrg.roverAdvisorName} provisioned.`);
  };

  // MEMBER MANAGEMENT HANDLERS
  const handleAddMember = (newMemberData: Omit<Member, 'id' | 'attendanceUnexcused' | 'attendanceExcused'>) => {
    const newId = `m-${Date.now()}`;
    const crewObj = crews.find((c) => c.id === newMemberData.crewId);
    const newMember: Member = {
      ...newMemberData,
      id: newId,
      organisationId: currentMember?.organisationId || 'org-kushafah',
      crewName: crewObj ? crewObj.name : 'Unassigned Crew',
      attendanceUnexcused: 0,
      attendanceExcused: 0,
    };
    setMembers((prev) => [newMember, ...prev]);
    saveDocumentToFirestore('members', newMember);
    toastSuccess('Member Registered', `${newMemberData.name} added to roster.`);
  };

  const handleUpdateMember = (updatedMember: Member) => {
    const crewObj = crews.find((c) => c.id === updatedMember.crewId);
    const finalMember = {
      ...updatedMember,
      crewName: crewObj ? crewObj.name : updatedMember.crewName,
    };
    setMembers((prev) => prev.map((m) => (m.id === finalMember.id ? finalMember : m)));
    saveDocumentToFirestore('members', finalMember);
  };

  const handleDeleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    deleteDocumentFromFirestore('members', id);
  };

  const handleStatusChange = (memberId: string, status: Member['status']) => {
    const target = members.find((m) => m.id === memberId);
    if (target) {
      const updated = { ...target, status };
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
      saveDocumentToFirestore('members', updated);
    }
  };

  // SYLLABUS HANDLERS
  const handleAddRequirement = (reqData: Omit<SyllabusRequirement, 'id'>) => {
    const newReq: SyllabusRequirement = {
      ...reqData,
      id: `syl-${Date.now()}`,
    };
    setSyllabus((prev) => [...prev, newReq]);
    saveDocumentToFirestore('syllabus', newReq);
    toastSuccess('Requirement Added', `Requirement "${newReq.title}" saved.`);
  };

  const handleUpdateRequirement = (updatedReq: SyllabusRequirement) => {
    setSyllabus((prev) => prev.map((s) => (s.id === updatedReq.id ? updatedReq : s)));
    saveDocumentToFirestore('syllabus', updatedReq);
    toastInfo('Requirement Updated', `Requirement "${updatedReq.title}" updated.`);
  };

  const handleDeleteRequirement = (id: string) => {
    setSyllabus((prev) => prev.filter((s) => s.id !== id));
    deleteDocumentFromFirestore('syllabus', id);
    toastInfo('Requirement Removed', 'Requirement deleted.');
  };

  const handleUpdateProgress = (prog: MemberRequirementProgress) => {
    setProgressList((prev) => {
      const idx = prev.findIndex((p) => p.id === prog.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = prog;
        return copy;
      }
      return [...prev, prog];
    });
    saveDocumentToFirestore('progress', prog);
  };

  // JOURNAL HANDLERS
  const handleAddJournal = (entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newEntry: JournalEntry = {
      ...entryData,
      id: `j-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setJournals((prev) => [newEntry, ...prev]);
    saveDocumentToFirestore('journals', newEntry);
    toastSuccess('Journal Entry Saved', `"${entryData.title}" recorded in logbook.`);
  };

  const handleUpdateJournal = (updatedEntry: JournalEntry) => {
    setJournals((prev) => prev.map((j) => (j.id === updatedEntry.id ? updatedEntry : j)));
    saveDocumentToFirestore('journals', updatedEntry);
    toastInfo('Journal Updated', `"${updatedEntry.title}" updated.`);
  };

  const handleDeleteJournal = (id: string) => {
    setJournals((prev) => prev.filter((j) => j.id !== id));
    deleteDocumentFromFirestore('journals', id);
    toastInfo('Journal Removed', 'Entry deleted from portfolio.');
  };

  // EVENT HANDLERS
  const handleAddEvent = (eventData: Omit<CrewEvent, 'id' | 'notificationSent' | 'notificationLogs'>) => {
    const newEvent: CrewEvent = {
      ...eventData,
      id: `ev-${Date.now()}`,
      notificationSent: false,
      notificationLogs: [],
    };
    setEvents((prev) => [newEvent, ...prev]);
    saveDocumentToFirestore('events', newEvent);
    toastSuccess('New Event Created', `"${newEvent.title}" scheduled for ${newEvent.startDate.split('T')[0]}.`);
  };

  const handleUpdateEvent = (updatedEvent: CrewEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
    saveDocumentToFirestore('events', updatedEvent);
    toastInfo('Event Updated', `"${updatedEvent.title}" details revised.`);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    deleteDocumentFromFirestore('events', id);
    toastInfo('Event Removed', 'Event cancelled and deleted.');
  };

  const handleSendNotifications = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    const targetMembers = filteredMembers.filter((m) => {
      if (m.status !== 'Active') return false;
      if (event.crewId !== 'all' && m.crewId !== event.crewId) return false;
      return true;
    });

    const newLog = {
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recipientCount: targetMembers.length,
      channel: settings.smsNotificationsEnabled && settings.emailNotificationsEnabled
        ? 'SMS & Email'
        : settings.smsNotificationsEnabled
        ? 'SMS'
        : 'Email',
    };

    const updatedEvent = {
      ...event,
      notificationSent: true,
      notificationLogs: [...(event.notificationLogs || []), newLog],
    };

    setEvents((prev) => prev.map((e) => (e.id === eventId ? updatedEvent : e)));
    saveDocumentToFirestore('events', updatedEvent);

    toastSuccess('Notifications Dispatched', `Broadcast sent to ${targetMembers.length} active crew members.`);
  };

  // ATTENDANCE HANDLERS
  const handleSaveAttendance = (records: AttendanceRecord[]) => {
    setAttendance((prev) => {
      if (records.length === 0) return prev;
      const targetEventId = records[0].eventId;
      const filtered = prev.filter((r) => r.eventId !== targetEventId);
      return [...filtered, ...records];
    });

    saveBatchToFirestore('attendance', records);

    // Recalculate Member Attendance Statistics
    const updatedMembersList = members.map((m) => {
      const memberRecords = records.filter((r) => r.memberId === m.id);
      if (memberRecords.length === 0) return m;

      let unexcusedAdd = 0;
      let excusedAdd = 0;

      memberRecords.forEach((r) => {
        if (r.status === 'Unexcused') unexcusedAdd++;
        if (r.status === 'Excused') excusedAdd++;
      });

      return {
        ...m,
        attendanceUnexcused: (m.attendanceUnexcused || 0) + unexcusedAdd,
        attendanceExcused: (m.attendanceExcused || 0) + excusedAdd,
      };
    });

    setMembers(updatedMembersList);
    saveBatchToFirestore('members', updatedMembersList);
    toastSuccess('Attendance Saved', `Attendance updated for ${records.length} members.`);
  };

  // DISCIPLINARY HANDLERS
  const handleAddIncident = (incidentData: Omit<DisciplinaryIncident, 'id' | 'loggedBy'>) => {
    const newInc: DisciplinaryIncident = {
      ...incidentData,
      id: `inc-${Date.now()}`,
      loggedBy: currentMember.name,
    };
    setIncidents((prev) => [newInc, ...prev]);
    saveDocumentToFirestore('disciplinary', newInc);
    toastWarning('Disciplinary Log Created', `Incident report filed for ${incidentData.memberName}.`);
  };

  const handleUpdateIncident = (updatedInc: DisciplinaryIncident) => {
    setIncidents((prev) => prev.map((inc) => (inc.id === updatedInc.id ? updatedInc : inc)));
    saveDocumentToFirestore('disciplinary', updatedInc);
  };

  const handleDeleteIncident = (id: string) => {
    setIncidents((prev) => prev.filter((inc) => inc.id !== id));
    deleteDocumentFromFirestore('disciplinary', id);
  };

  // SUB-CREW & SETTINGS HANDLERS
  const handleAddCrew = (crewData: Omit<SubCrew, 'id'>) => {
    const newCrew: SubCrew = {
      ...crewData,
      id: `crew-${Date.now()}`,
    };
    setCrews((prev) => [...prev, newCrew]);
    saveDocumentToFirestore('crews', newCrew);
    toastSuccess('Sub-Crew Created', `Sub-crew "${newCrew.name}" saved.`);
  };

  const handleDeleteCrew = (id: string) => {
    setCrews((prev) => prev.filter((c) => c.id !== id));
    deleteDocumentFromFirestore('crews', id);
    toastInfo('Sub-Crew Deleted', 'Sub-crew removed.');
  };

  const handleUpdateSettings = (newSettings: PortalSettings) => {
    setSettings(newSettings);
    saveSettingsToFirestore(newSettings);
    toastSuccess('Settings Saved', 'Portal configuration and preferences updated.');
  };

  const handleTriggerManualSync = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    toastSync('Cloud Sync Verified', `All portal collections are in sync with Firestore at ${timeStr}.`);
  };

  // PAYMENTS & DUES HANDLERS
  const handleCreateFeeRequest = (newFee: FeeRequest) => {
    setFeeRequests((prev) => [newFee, ...prev]);
    saveDocumentToFirestore('fee_requests', newFee);
    toastSuccess('Fee Drive Created', `"${newFee.title}" (MVR ${newFee.amountMvr}) opened for collection.`);
  };

  const handleSubmitPayment = (newTx: CrewPaymentTransaction) => {
    setPaymentTransactions((prev) => [newTx, ...prev]);
    saveDocumentToFirestore('payment_transactions', newTx);
    toastSuccess('Payment Submitted', `Payment receipt for MVR ${newTx.amountMvr} submitted for verification.`);
  };

  const handleVerifyPayment = (txId: string, status: 'Verified' | 'Rejected', notes?: string) => {
    setPaymentTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== txId) return tx;
        const updated: CrewPaymentTransaction = {
          ...tx,
          status,
          verifiedBy: currentMember?.name || 'Council Member',
          verifiedAt: new Date().toISOString().split('T')[0],
          notes: notes ? `${tx.notes || ''} [Verification Note: ${notes}]` : tx.notes,
        };
        saveDocumentToFirestore('payment_transactions', updated);
        return updated;
      })
    );
    if (status === 'Verified') {
      toastSuccess('Payment Verified', 'Payment status updated to Verified.');
    } else {
      toastWarning('Payment Rejected', 'Payment transaction marked as Rejected.');
    }
  };

  const handleClearLocalData = () => {
    if (window.confirm('Are you sure you want to clear all local saved data, session tokens, and member information? Cloud Firestore records will remain safe.')) {
      localStorage.clear();
      setCurrentMemberId(null);
      setIsLoginModalOpen(true);
      toastInfo('Local Storage Cleared', 'All local cached data and member session tokens have been cleared.');
    }
  };

  return (
    <ErrorBoundary>
      <div className={`min-h-screen bg-[#0F1115] text-slate-200 flex flex-col lg:flex-row font-sans selection:bg-emerald-500 selection:text-slate-950 ${theme === 'light' ? 'light-mode' : ''}`}>
      {/* Left Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab as any}
        setActiveTab={(tab) => setActiveTab(tab)}
        currentMember={currentMemberId ? verifiedMember : null}
        allMembers={filteredMembers}
        onSelectMember={(m) => handleLogin(m)}
        onLogout={handleLogout}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenOrgSignup={() => setIsOrgSignupOpen(true)}
        settings={settings}
        unresolvedIncidentsCount={(incidents || []).filter((i) => i.status !== 'Resolved').length}
        theme={theme}
        onToggleTheme={toggleTheme}
        syncStatus={syncStatus}
        lastSyncedAt={lastSyncedAt}
        onTriggerSync={handleTriggerManualSync}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Minimal View Bar */}
        <header className="hidden lg:flex items-center justify-between px-6 py-3.5 bg-[#161920]/80 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-100 tracking-tight">
              {activeTab === 'superadmin' && 'Superadmin Portal Administration'}
              {activeTab === 'dashboard' && 'Rover Crew Overview'}
              {(activeTab === 'directory' || activeTab === 'members') && 'Members Directory'}
              {activeTab === 'syllabus' && 'Awards & Syllabus Engine'}
              {(activeTab === 'journal' || activeTab === 'journals') && 'Portfolio Notebook'}
              {activeTab === 'events' && 'Events & Calendar'}
              {activeTab === 'attendance' && 'Attendance & Absentee Reports'}
              {activeTab === 'minutes' && 'Secretary Meeting Minutes'}
              {activeTab === 'policy' && 'Rover Operating Policy & Democratic Referendums'}
              {activeTab === 'payments' && 'Payments & Crew Dues Management'}
              {activeTab === 'disciplinary' && 'Disciplinary Incident Log'}
              {activeTab === 'audit' && 'Audit Trails & Change Logs'}
              {activeTab === 'settings' && (isCouncil ? 'Crew Settings & Council Permissions' : 'Personal Profile Settings')}
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              | {activeOrgObj ? activeOrgObj.name : 'Kushafah Portal'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {activeOrgObj && activeOrgObj.plan !== 'Free' && (
              <button
                onClick={() => setIsRenewalModalOpen(true)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                  activeOrgObj.renewalStatus === 'Pending Verification'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    : (activeOrgObj.planValidUntil && activeOrgObj.planValidUntil !== 'Indefinite' && activeOrgObj.planValidUntil < new Date().toISOString().split('T')[0])
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  Plan Valid: <strong>{activeOrgObj.planValidUntil || 'Pending'}</strong>
                </span>
              </button>
            )}

            <button
              onClick={() => setIsOrgSignupOpen(true)}
              className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Sign Up Organisation</span>
            </button>

            <UserSwitcher
              currentMember={currentMemberId ? verifiedMember : null}
              allMembers={filteredMembers}
              onSelectMember={(m) => handleLogin(m)}
              onLogout={handleLogout}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onClearLocalData={handleClearLocalData}
            />
          </div>
        </header>

        {/* Primary View Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          <RequireAuth
            currentMemberId={currentMemberId}
            members={members}
            onRedirectToLogin={() => setIsLoginModalOpen(true)}
          >
            {activeTab === 'superadmin' && isSuperAdmin && (
              <SuperAdminDashboard
                organisations={organisations}
                members={members}
                onApproveOrg={handleApproveOrg}
                onRejectOrg={handleRejectOrg}
                onAddDirectOrg={handleAddDirectOrg}
                onSelectActiveOrgContext={(orgId) => setActiveOrgContext(orgId)}
                activeOrgContext={activeOrgContext}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onUpdateOrgValidity={handleUpdateOrgValidity}
                onRejectOrgRenewal={handleRejectOrgRenewal}
                onUpdateOrg={handleUpdateOrg}
                onDeleteOrg={handleDeleteOrg}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardView
                members={filteredMembers}
                crews={crews}
                events={events}
                attendance={attendance}
                journals={journals}
                incidents={incidents}
                syllabus={syllabus}
                progressList={progressList}
                currentMember={currentMember}
                settings={settings}
                setActiveTab={setActiveTab}
              />
            )}

            {(activeTab === 'directory' || activeTab === 'members') && (
              <MemberDirectory
                members={filteredMembers}
                crews={crews}
                currentMember={currentMember}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                progressList={progressList}
                syllabus={syllabus}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
              />
            )}

            {activeTab === 'syllabus' && (
              <SyllabusEngine
                syllabus={syllabus}
                progressList={progressList}
                members={filteredMembers}
                currentMember={currentMember}
                onAddRequirement={handleAddRequirement}
                onUpdateRequirement={handleUpdateRequirement}
                onDeleteRequirement={handleDeleteRequirement}
                onUpdateProgress={handleUpdateProgress}
              />
            )}

            {(activeTab === 'journal' || activeTab === 'journals') && (
              <PortfolioJournal
                journals={journals}
                events={events}
                currentMember={currentMember}
                allMembers={filteredMembers}
                settings={settings}
                onAddJournal={handleAddJournal}
                onUpdateJournal={handleUpdateJournal}
                onDeleteJournal={handleDeleteJournal}
              />
            )}

            {activeTab === 'events' && (
              <EventsCalendar
                events={events}
                crews={crews}
                members={filteredMembers}
                currentMember={currentMember}
                settings={settings}
                onAddEvent={handleAddEvent}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
                onSendNotifications={handleSendNotifications}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendancePortal
                events={events}
                attendance={attendance}
                members={filteredMembers}
                crews={crews}
                currentMember={currentMember}
                onSaveAttendance={handleSaveAttendance}
              />
            )}

            {activeTab === 'minutes' && (
              <MeetingMinutesModule
                currentMember={currentMember}
                members={filteredMembers}
                minutesList={meetingMinutes}
                onSaveMinutes={(m) => {
                  setMeetingMinutes((prev) => {
                    const exists = prev.some((item) => item.id === m.id);
                    if (exists) {
                      return prev.map((item) => (item.id === m.id ? m : item));
                    }
                    return [m, ...prev];
                  });
                  saveDocumentToFirestore('minutes', m);
                  toastSuccess('Meeting Minutes Recorded', `"${m.title}" saved to archive.`);
                }}
                onDeleteMinutes={(id) => {
                  setMeetingMinutes((prev) => prev.filter((item) => item.id !== id));
                  deleteDocumentFromFirestore('minutes', id);
                  toastInfo('Minutes Deleted', 'Meeting record removed.');
                }}
                settings={settings}
              />
            )}

            {activeTab === 'policy' && (
              <RoverPolicyModule
                policy={policy}
                polls={polls}
                currentMember={currentMember}
                allMembers={filteredMembers}
                onUpdatePolicy={handleUpdatePolicy}
                onCreatePoll={handleCreatePoll}
                onCastVote={handleCastVote}
                onFinalizePoll={handleFinalizePoll}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentsModule
                currentMember={currentMember}
                members={filteredMembers}
                feeRequests={feeRequests}
                paymentTransactions={paymentTransactions}
                transactions={paymentTransactions}
                onAddFeeRequest={handleCreateFeeRequest}
                onCreateFeeRequest={handleCreateFeeRequest}
                onSubmitPayment={handleSubmitPayment}
                onVerifyPayment={handleVerifyPayment}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                activeOrgContext={activeOrgContext}
              />
            )}

            {activeTab === 'disciplinary' && (
              isCouncil ? (
                <DisciplinaryModule
                  incidents={incidents}
                  members={filteredMembers}
                  currentMember={currentMember}
                  onAddIncident={handleAddIncident}
                  onUpdateIncident={handleUpdateIncident}
                  onDeleteIncident={handleDeleteIncident}
                />
              ) : (
                <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto my-12 shadow-xl">
                  <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
                    <span className="font-bold text-2xl">🔒</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">Disciplinary Module Restricted</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Access to the Disciplinary Incident Log is confidential and strictly restricted to Executive Council Officers. Standard crew members do not have permission to view or manage disciplinary records.
                  </p>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
                  >
                    Return to Overview Dashboard
                  </button>
                </div>
              )
            )}

            {activeTab === 'audit' && (
              <AuditLogModule
                currentMember={currentMember}
                auditLogs={auditLogs}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsCrewModule
                crews={crews}
                settings={settings}
                members={filteredMembers}
                currentMember={currentMember}
                onAddCrew={handleAddCrew}
                onDeleteCrew={handleDeleteCrew}
                onUpdateSettings={handleUpdateSettings}
                onUpdateMember={handleUpdateMember}
              />
            )}
          </RequireAuth>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-[#161920] py-4 text-center text-xs text-slate-400 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200">
                {isSuperAdmin
                  ? 'National Scout Organisation Superadmin Portal'
                  : activeOrgObj
                  ? activeOrgObj.name
                  : 'Kushafah Scouting Portal'}
              </span>
              <span className="text-slate-500">
                {isSuperAdmin ? '• Global Portal Administration' : '• Governed by Rover Operating Policy'}
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              {isSuperAdmin ? (
                <span className="text-purple-300 font-semibold font-mono">National Administration Scope</span>
              ) : (
                <span>Governance Term: <strong className="text-emerald-400 font-mono">{settings.activeTerm}</strong></span>
              )}
            </div>
          </div>
        </footer>
      </div>

      {/* Login Modal Dialog */}
      <LoginModal
        isOpen={isLoginModalOpen || !currentMemberId}
        onClose={() => {
          if (currentMemberId) {
            setIsLoginModalOpen(false);
          }
        }}
        allowClose={!!currentMemberId}
        members={members}
        onLogin={handleLogin}
        onOpenOrgSignup={() => setIsOrgSignupOpen(true)}
      />

      {/* Organisation Sign Up Modal */}
      <OrganisationSignupModal
        isOpen={isOrgSignupOpen}
        onClose={() => setIsOrgSignupOpen(false)}
        onSignupSubmit={handleOrgSignupSubmit}
        onOpenLogin={() => {
          setIsOrgSignupOpen(false);
          setIsLoginModalOpen(true);
        }}
        settings={settings}
      />

      {/* Plan Renewal & Validity Modal */}
      {activeOrgObj && (
        <PlanRenewalModal
          isOpen={isRenewalModalOpen}
          onClose={() => setIsRenewalModalOpen(false)}
          organisation={activeOrgObj}
          onSubmitRenewal={handleUploadOrgRenewalReceipt}
        />
      )}
    </div>
    </ErrorBoundary>
  );
}
