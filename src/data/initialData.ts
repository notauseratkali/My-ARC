import {
  Member,
  SyllabusRequirement,
  JournalEntry,
  CrewEvent,
  AttendanceRecord,
  DisciplinaryIncident,
  SubCrew,
  PortalSettings,
  MemberRequirementProgress,
  MeetingMinutes,
  Organisation,
  RoverOperatingPolicy,
  PolicyAmendmentPoll,
  FeeRequest,
  CrewPaymentTransaction,
} from '../types';
import { getPlaceholderAvatar } from '../utils/avatarUtils';

export const INITIAL_ORGANISATIONS: Organisation[] = [
  {
    id: 'org-kushafah',
    name: 'Kushafah Portal Crew Network',
    code: 'KUSHAFAH',
    roverAdvisorName: 'Dr. Hussain Farooq',
    roverAdvisorEmail: 'advisor.farooq@kushafah.scout.mv',
    roverAdvisorNid: 'A100999',
    roverAdvisorPhone: '+960 7700112',
    plan: 'Free',
    status: 'Active',
    createdAt: '2025-01-01',
    approvedAt: '2025-01-01',
    planValidUntil: 'Indefinite',
    renewalStatus: 'None',
  },
  {
    id: 'org-aminiya',
    name: 'Aminiya Rover Crew',
    code: 'AMINIYA',
    roverAdvisorName: 'Aishath Mariyam',
    roverAdvisorEmail: 'advisor.mariyam@aminiya.scout.mv',
    roverAdvisorNid: 'A200888',
    roverAdvisorPhone: '+960 7700223',
    plan: 'Monthly',
    status: 'Active',
    createdAt: '2026-02-10',
    approvedAt: '2026-02-11',
    paymentReceiptName: 'BML_Transfer_20MVR_Feb2026.pdf',
    paymentNotes: 'Monthly subscription transfer receipt',
    planValidUntil: '2026-08-30',
    renewalStatus: 'None',
  },
  {
    id: 'org-chse',
    name: 'CHSE Rover Crew',
    code: 'CHSE',
    roverAdvisorName: 'Ahmed Zahir',
    roverAdvisorEmail: 'advisor.zahir@chse.scout.mv',
    roverAdvisorNid: 'A300777',
    roverAdvisorPhone: '+960 7700334',
    plan: 'Monthly',
    status: 'Active',
    createdAt: '2026-01-15',
    approvedAt: '2026-01-16',
    paymentReceiptName: 'CHSE_Jan_Payment.pdf',
    paymentNotes: 'Initial registration payment',
    planValidUntil: '2026-07-31',
    renewalStatus: 'Pending Verification',
    renewalReceiptName: 'BML_Renewal_Transfer_CHSE_MVR20.pdf',
    renewalNotes: 'Uploaded monthly renewal receipt for Term 2.',
    renewalRequestedTerm: '+1 Month',
    renewalSubmittedAt: '2026-08-01',
  },
];

export const INITIAL_CREWS: SubCrew[] = [
  {
    id: 'male-city',
    name: 'Male City Crew',
    location: "Male' City",
    crewLeaderId: '',
    crewLeaderName: 'Unassigned',
    description: 'Primary crew operating out of Male Central Scout Headquarters.',
  },
  {
    id: 'hulhumale',
    name: 'Hulhumale Crew',
    location: "Hulhumale' Phase 1 & 2",
    crewLeaderId: '',
    crewLeaderName: 'Unassigned',
    description: 'Deploys outdoor and urban service activities in Hulhumale.',
  },
  {
    id: 'villimale',
    name: 'Villimale Coastal Crew',
    location: "Villimale'",
    crewLeaderId: '',
    crewLeaderName: 'Unassigned',
    description: 'Focuses on marine conservation and coastal disaster readiness.',
  },
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm-superadmin',
    organisationId: 'global',
    isSuperAdmin: true,
    name: 'Ahmed Nazih Nafiz',
    idCard: 'SUPERADMIN',
    dob: '1980-01-01',
    age: 46,
    gender: 'Male',
    section: 'National Portal',
    crewId: 'portal-admin',
    crewName: '',
    councilRole: 'Superadmin',
    investitureDate: '2005-01-01',
    status: 'Active',
    term: 'Indefinite (Portal Superadmin)',
    email: 'nazihnafiz@gmail.com',
    mobile: '+960 7000000',
    phone: '+960 3000000',
    permAddress: 'National Scout HQ, Male City',
    currAddress: 'National Scout HQ, Male City',
    emergencyContactName: 'Kushafah Portal Admin HQ',
    emergencyContactNumber: '+960 3000000',
    attendanceUnexcused: 0,
    attendanceExcused: 0,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  },
  {
    id: 'm-0',
    organisationId: 'org-kushafah',
    name: 'Dr. Hussain Farooq',
    idCard: 'A100999',
    dob: '1988-04-12',
    age: 38,
    gender: 'Male',
    section: 'Rover',
    crewId: 'male-city',
    crewName: 'Male City Crew',
    councilRole: 'Rover Advisor',
    investitureDate: '2012-05-10',
    status: 'Active',
    term: '2025-2026',
    email: 'advisor.farooq@kushafah.scout.mv',
    mobile: '+960 7700112',
    phone: '+960 3310000',
    permAddress: 'M. Everest, Male City',
    currAddress: 'M. Everest, Male City',
    telegram: '@rover_advisor_farooq',
    whatsapp: '+960 7700112',
    emergencyContactName: 'Fatimat Niuma (Wife)',
    emergencyContactNumber: '+960 7700113',
    attendanceUnexcused: 0,
    attendanceExcused: 0,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  },
];

export const INITIAL_SYLLABUS: SyllabusRequirement[] = [
  // President's Scout Award (Explorer Focus)
  {
    id: 'ps-1',
    awardType: "President's Scout Award",
    category: 'Leadership',
    title: 'Patrol Leadership & Crew Dynamics',
    description: 'Demonstrate active leadership of an Explorer Patrol for 6 consecutive months, conducting patrol council meetings and project planning.',
    tasks: [
      { id: 'pst-1', text: 'Serve 6 months in a Patrol Leader or Assistant Patrol Leader capacity.' },
      { id: 'pst-2', text: 'Organize and execute 3 Patrol outdoor excursions.' },
      { id: 'pst-3', text: 'Maintain Patrol logbooks and attendance records.' },
    ],
    minHours: 40,
    badgeIcon: 'Crown',
    submissionType: 'report',
    requiresReport: true,
    requiresPhotos: false,
    requiresDocument: false,
    submissionInstructions: 'Submit a 6-month leadership reflection summary detailing patrol activities and leadership growth.',
  },
  {
    id: 'ps-2',
    awardType: "President's Scout Award",
    category: 'Outdoor Skills',
    title: 'Advanced Wilderness Survival & Navigation',
    description: 'Master compass navigation, night orienteering, shelter building, and survival techniques under tropical island conditions.',
    tasks: [
      { id: 'pst-4', text: 'Complete a 30km wilderness hike with bearings and topographical mapping.' },
      { id: 'pst-5', text: 'Construct a bivouac shelter using natural and lashings materials.' },
      { id: 'pst-6', text: 'Demonstrate fire-making without matches and water purification.' },
    ],
    minHours: 30,
    badgeIcon: 'Compass',
    submissionType: 'mixed',
    requiresReport: true,
    requiresPhotos: true,
    requiresDocument: true,
    submissionInstructions: 'Upload route map PDF, photo evidence of shelter construction, and a 250-word reflection report.',
  },
  {
    id: 'ps-3',
    awardType: "President's Scout Award",
    category: 'Community Service',
    title: 'Island Community Impact Project',
    description: 'Design and execute a 30-hour community service campaign addressing local environmental or social needs.',
    tasks: [
      { id: 'pst-7', text: 'Submit project proposal to Scout Leader.' },
      { id: 'pst-8', text: 'Lead a team of at least 5 Explorers in executing the project.' },
      { id: 'pst-9', text: 'Present a final report with photo evidence and impact metrics.' },
    ],
    minHours: 30,
    badgeIcon: 'HeartHandshake',
    submissionType: 'mixed',
    requiresReport: true,
    requiresPhotos: true,
    requiresDocument: false,
    submissionInstructions: 'Submit a written report on community impact and attach photo gallery of event.',
  },

  // Baden-Powell (BP) Award (Rover Focus)
  {
    id: 'bp-1',
    awardType: 'Baden-Powell (BP) Award',
    category: 'Leadership',
    title: 'Rover Crew Executive Administration',
    description: 'Plan, budget, and oversee major Crew initiatives while mentoring Explorer patrols and junior Rovers.',
    tasks: [
      { id: 'bpt-1', text: 'Serve at least 1 full term as an Executive Council officer or Crew Leader.' },
      { id: 'bpt-2', text: 'Formulate an annual operational plan and financial budget.' },
      { id: 'bpt-3', text: 'Conduct leadership training workshops for incoming Explorers.' },
    ],
    minHours: 60,
    badgeIcon: 'Award',
    submissionType: 'report',
    requiresReport: true,
    requiresPhotos: false,
    requiresDocument: true,
    submissionInstructions: 'Upload budget/proposal PDF and write an executive administration thesis.',
  },
  {
    id: 'bp-2',
    awardType: 'Baden-Powell (BP) Award',
    category: 'Outdoor Skills',
    title: 'Rover 100km Expedition & Maritime Trek',
    description: 'Complete a continuous 100km multi-island or sea-kayaking expedition carrying all self-sustained equipment.',
    tasks: [
      { id: 'bpt-4', text: 'Plan route, risk assessment, tide schedules, and emergency protocols.' },
      { id: 'bpt-5', text: 'Complete the 100km trek/voyage within designated time frame.' },
      { id: 'bpt-6', text: 'Publish a detailed expedition logbook with environmental observation data.' },
    ],
    minHours: 80,
    badgeIcon: 'MapPin',
    submissionType: 'mixed',
    requiresReport: true,
    requiresPhotos: true,
    requiresDocument: true,
    submissionInstructions: 'Upload GPS log file, waypoint photos, and complete written logbook report.',
  },
  {
    id: 'bp-3',
    awardType: 'Baden-Powell (BP) Award',
    category: 'Community Service',
    title: 'Sustainable National Service Initiative',
    description: 'Spearhead a major long-term community project contributing to the UN Sustainable Development Goals (SDGs).',
    tasks: [
      { id: 'bpt-7', text: 'Log 50+ hours of verified community service.' },
      { id: 'bpt-8', text: 'Partner with a national NGO or government body (e.g., Environment Ministry).' },
      { id: 'bpt-9', text: 'Achieve measurable community impact (e.g. 500kg plastic collected or 200 trees planted).' },
    ],
    minHours: 50,
    badgeIcon: 'ShieldCheck',
    submissionType: 'mixed',
    requiresReport: true,
    requiresPhotos: true,
    requiresDocument: true,
    submissionInstructions: 'Attach partner endorsement letter, photo proof, and a 400-word impact report.',
  },
  {
    id: 'bp-4',
    awardType: 'Baden-Powell (BP) Award',
    category: 'Scoutcraft',
    title: 'Scouting Heritage & World Scout Movement',
    description: 'Demonstrate deep knowledge of BP heritage, Kushafah Rovers history, international Scouting, and WOSM governance.',
    tasks: [
      { id: 'bpt-10', text: 'Write a thesis or paper on the evolution of Rovering in the Maldives.' },
      { id: 'bpt-11', text: 'Participate in or organize an international Jamboree or JOTA-JOTI station.' },
    ],
    minHours: 25,
    badgeIcon: 'BookOpen',
    submissionType: 'report',
    requiresReport: true,
    requiresPhotos: false,
    requiresDocument: false,
    submissionInstructions: 'Write and submit your Scouting Heritage thesis/paper.',
  },
];

export const INITIAL_PROGRESS: MemberRequirementProgress[] = [];

export const INITIAL_JOURNALS: JournalEntry[] = [];

export const INITIAL_EVENTS: CrewEvent[] = [
  {
    id: 'ev-1',
    title: 'National Rover Survival Expedition 2026',
    type: 'Camp',
    crewId: 'all',
    crewName: 'All Crews',
    location: 'Baa Atoll Uninhabited Island',
    startDate: '2026-08-15T08:00',
    endDate: '2026-08-18T18:00',
    description: 'Annual flagship survival camp focusing on BP Award 100km trek requirements, maritime navigation, and leadership challenges.',
    targetAudience: 'All Active Rovers & Explorers (Compulsory)',
    isCompulsory: true,
    scopeFilters: {
      crewId: 'all',
      section: 'All',
    },
    createdBy: 'Dr. Hussain Farooq (Rover Advisor)',
    notificationSent: true,
    notificationLogs: [
      { timestamp: '2026-07-25 10:00', channel: 'SMS', recipientCount: 48 },
      { timestamp: '2026-07-25 10:00', channel: 'Email', recipientCount: 48 },
    ],
  },
  {
    id: 'ev-2',
    title: 'Male City Rovers Monthly General Meeting',
    type: 'Meeting',
    crewId: 'male-city',
    crewName: 'Male City Crew',
    location: 'Kushafah Scout HQ Conference Room',
    startDate: '2026-08-05T20:00',
    endDate: '2026-08-05T22:00',
    description: 'Monthly operational assembly for Male City Rovers. Reviewing President Scout Award submissions and financial statements.',
    targetAudience: 'Male City Crew Members',
    isCompulsory: true,
    scopeFilters: {
      crewId: 'male-city',
    },
    createdBy: 'Dr. Hussain Farooq (Rover Advisor)',
    notificationSent: true,
    notificationLogs: [
      { timestamp: '2026-08-01 09:00', channel: 'SMS', recipientCount: 22 },
    ],
  },
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_DISCIPLINARY: DisciplinaryIncident[] = [];

export const INITIAL_MEETING_MINUTES: MeetingMinutes[] = [
  {
    id: 'mm-1',
    title: 'Council Executive Meeting #08 - Q3 Operations & Expedition Planning',
    meetingNumber: 'MM-2025/08',
    meetingType: 'Council Executive Meeting',
    date: '2026-08-01',
    time: '20:00 - 22:15 MVT',
    location: 'Kushafah Scout HQ Conference Room & Online Sync',
    chairperson: 'Dr. Hussain Farooq (Rover Advisor)',
    secretary: 'Rover Council Secretary',
    attendees: [
      'Dr. Hussain Farooq',
      'Executive Council Members',
    ],
    absenteeList: [],
    agenda: [
      '1. Review and approval of previous minutes (MM-2025/07)',
      '2. Finalizing Q3 Annual Expedition Budget & Logistics',
      '3. Rover Baden-Powell Award Syllabus Verification Sign-offs',
      '4. Attendance Policy Compliance & Disciplinary Case Reviews',
    ],
    resolutions: [
      'UNANIMOUSLY APPROVED: Q3 Annual Expedition allocation of MVR 24,500 for Hulhumale and Villimale sub-crews.',
      'APPROVED: Progress verification workflow speedups for President Scout badge submissions.',
    ],
    actionItems: [
      {
        id: 'act-1',
        task: 'Submit revised transport quotes for Baa Atoll Expedition',
        assignedTo: 'Event Coordinator',
        dueDate: '2026-08-12',
        status: 'In Progress',
      },
    ],
    content: `# Council Executive Meeting #08
**Date:** August 1st, 2026  
**Chaired By:** Dr. Hussain Farooq (Rover Advisor)  

## Executive Summary
The Council met to review active sub-crew operations, progression rates for Baden-Powell (BP) and President Scout candidates, and finalize logistics for the upcoming Baa Atoll Marine Survival Expedition.`,
    attachments: [],
    status: 'Published',
    publishedAt: '2026-08-02 09:00',
    createdAt: '2026-08-01 22:30',
    updatedAt: '2026-08-02 09:00',
    authorId: 'm-0',
  },
];

export const INITIAL_SETTINGS: PortalSettings = {
  aiEnabled: true,
  smsNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  activeTerm: '2025-2026',
  crewName: 'Kushafah Rover Crew',
  networkName: 'Kushafah Rover Network',
  councilPositions: [
    'Rover Advisor',
    'Chairperson',
    'Vice Chairperson',
    'Secretary',
    'Treasurer',
    'Event Coordinator',
    'Progress Coordinator',
    'Media Coordinator',
    'Crew Leader',
  ],
  paymentDetails: {
    accountName: 'Kushafah Crew Official Account',
    accountNumber: '7730000123456',
    bankName: 'Bank of Maldives (BML)',
  },
};

export const INITIAL_ROVER_POLICY: RoverOperatingPolicy = {
  id: 'pol-1',
  organisationId: 'org-kushafah',
  version: 'v2.4 (2026 Revision)',
  title: 'Kushafah Portal Crew Operating Policy & Bylaws',
  lastUpdated: '2026-07-01',
  updatedBy: 'Council Executive Committee',
  content: `# Kushafah Portal Crew Operating Policy & Bylaws

## Article I: Governance & Council Authority
1. **Council Access & Amendments**: The Rover Council holds full authority to draft and propose amendments to the Operating Policy.
2. **Referendum Mandate**: Any policy edit or new clause proposed by the Council MUST be submitted to a crew-wide referendum vote.
3. **Voting Period**: A minimum voting duration of **one (1) week (7 days)** is mandatory for all policy referendums.
4. **Implementation Threshold**: If the number of **Yea** (In Favor) votes exceeds the **Nay** (Against) votes upon sum up, the amendment shall be officially implemented as active policy.
5. **Secretary Coordination**: The Crew Secretary is responsible for initiating, coordinating, verifying, and publishing all policy referendum polls.

## Article II: Crew Membership & Code of Conduct
1. Every active Rover Scout shall uphold the Scout Law and Promise at all activities.
2. Minimum attendance requirement for active status is 75% for compulsory events and drills.
3. Disciplinary actions shall follow the progressive warning system governed by the Council.

## Article III: Financial Management
1. Monthly membership contributions shall be recorded by the Treasurer.
2. Event budgets exceeding 2,000 MVR require Council approval.`,
};

export const INITIAL_POLICY_POLLS: PolicyAmendmentPoll[] = [
  {
    id: 'poll-101',
    organisationId: 'org-kushafah',
    title: 'Amendment on Mandatory Referendum Period for Policy Changes',
    proposedBySecretaryName: 'Dr. Hussain Farooq',
    proposedBySecretaryId: 'm-0',
    originalPolicyVersion: 'v2.3 (2025)',
    proposedPolicyContent: `Added mandatory 7-day referendum voting requirement for all Operating Policy edits by Council. Secretary coordinates all crew-wide polls.`,
    rationale: 'To ensure all Rovers have a democratic voice in crew governance before any bylaws are changed.',
    startDate: '2026-08-01',
    votingDeadline: '2026-08-15',
    status: 'Active Voting',
    votes: [],
    createdAt: '2026-08-01',
  },
];

export const INITIAL_FEE_REQUESTS: FeeRequest[] = [
  {
    id: 'fee-101',
    organisationId: 'org-kushafah',
    title: 'Annual Crew Membership Contribution 2026',
    category: 'Annual Dues',
    amountMvr: 150,
    dueDate: '2026-09-30',
    description: 'Mandatory annual contribution for active Rover Scouts to cover badge insurance and crew portal levies.',
    createdBy: 'Dr. Hussain Farooq',
    createdAt: '2026-08-01',
  },
];

export const INITIAL_PAYMENT_TRANSACTIONS: CrewPaymentTransaction[] = [];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'log-1',
    organisationId: 'org-kushafah',
    action: 'Organisation Subscription Approved',
    category: 'System' as const,
    performedByMemberId: 'superadmin-1',
    performedByMemberName: 'National Superadmin',
    performedByRole: 'Superadmin',
    targetName: 'Ameeniyya Rover Scout Organisation',
    details: 'Approved Monthly Plan (MVR 20) registration after verifying BML bank transfer receipt.',
    timestamp: '2026-02-11 10:15',
  },
  {
    id: 'log-2',
    organisationId: 'org-kushafah',
    action: 'Rover Advisor Assigned',
    category: 'Council Governance' as const,
    performedByMemberId: 'superadmin-1',
    performedByMemberName: 'National Superadmin',
    performedByRole: 'Superadmin',
    targetName: 'Nazih Nafiz',
    details: 'Assigned as Rover Advisor and Lead Administrator for Ameeniyya Rover Crew.',
    timestamp: '2026-02-11 10:20',
  },
  {
    id: 'log-3',
    organisationId: 'org-kushafah',
    action: 'Annual Fee Drive Opened',
    category: 'Finance' as const,
    performedByMemberId: 'm-1',
    performedByMemberName: 'Nazih Nafiz',
    performedByRole: 'Rover Advisor',
    targetName: '2026 Annual Member Dues',
    details: 'Opened fee drive for MVR 150 per member.',
    timestamp: '2026-02-12 14:00',
  },
  {
    id: 'log-4',
    organisationId: 'org-chse',
    action: 'Plan Extension Processed',
    category: 'System' as const,
    performedByMemberId: 'superadmin-1',
    performedByMemberName: 'National Superadmin',
    performedByRole: 'Superadmin',
    targetName: 'CHSE Rover Crew',
    details: 'Verified MVR 20 bank receipt for 1-Month Term Extension.',
    timestamp: '2026-08-01 09:30',
  },
];


