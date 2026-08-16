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
    id: 'org-arabiyya',
    name: 'Arabiyya Rover Crew',
    code: 'ARABIYYA',
    roverAdvisorName: 'Dr. Hussain Farooq',
    roverAdvisorEmail: 'advisor.farooq@scout.mv',
    roverAdvisorNid: 'A100999',
    roverAdvisorPhone: '+960 7700112',
    plan: 'Free',
    status: 'Active',
    createdAt: '2025-01-01',
    approvedAt: '2025-01-01',
    planValidUntil: 'Indefinite',
    renewalStatus: 'None',
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
    section: 'Rover',
    crewId: 'portal-admin',
    crewName: 'N/A (Superadmin)',
    councilRole: 'Superadmin',
    investitureDate: '2005-01-01',
    status: 'Active',
    term: 'Indefinite (Portal Superadmin)',
    email: 'nazihnafiz@gmail.com',
    mobile: '+960 7000000',
    phone: '+960 3000000',
    permAddress: 'Arabiyya Scout HQ, Male City',
    currAddress: 'Arabiyya Scout HQ, Male City',
    emergencyContactName: 'Arabiyya Rover Admin HQ',
    emergencyContactNumber: '+960 3000000',
    attendanceUnexcused: 0,
    attendanceExcused: 0,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  },
  {
    id: 'm-0',
    organisationId: 'org-arabiyya',
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
    email: 'advisor.farooq@meyvaa.scout.mv',
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
  // Rover Scout Progressive Scheme
  {
    id: 'rover-1',
    awardType: 'Baden-Powell Award',
    category: 'Personal Development',
    title: 'Rover Squire',
    description: 'Initial admission stage for new Rovers involving self-examination, Vigil, adult understanding of Scout Law & Promise, Crew constitution, and 3 months Squire service.',
    tasks: [
      { id: 'rs1-1', text: 'Conduct Self-Examination / Vigil on personal goals, service ethic, and adult interpretation of the Scout Promise and Law.' },
      { id: 'rs1-2', text: 'Demonstrate complete understanding of the Rover motto "Service", Rover Sign, Salute, and Emblem.' },
      { id: 'rs1-3', text: 'Master the Crew Constitution, Rover Movement History, and WOSM organizational structure.' },
      { id: 'rs1-4', text: 'Complete a minimum of 3 months satisfactory service as an invested Rover Squire in the Crew.' },
    ],
    minHours: 20,
    badgeIcon: 'UserCheck',
    submissionType: 'mixed',
    requiresReport: true,
    requiresPhotos: false,
    requiresDocument: true,
    submissionInstructions: 'Submit your Vigil reflection paper, Crew Constitution knowledge summary, and Crew Leader endorsement.',
  },
  {
    id: 'rover-2',
    awardType: 'Baden-Powell Award',
    category: 'Outdoor Skills',
    title: 'Rambler\'s Badge',
    description: 'Elite outdoor journey and first aid competence qualification required for Rover progression.',
    tasks: [
      { id: 'rs2-1', text: 'Complete a continuous journey over 4 consecutive days or two 48-hour journeys carrying self-sustained provisions and logging waypoints.' },
      { id: 'rs2-2', text: 'Hold First Aid qualification to at least Ambulance Badge standard.' },
      { id: 'rs2-3', text: 'Demonstrate competence to instruct and examine Senior Scouts in one outdoor/adventure badge.' },
    ],
    minHours: 45,
    badgeIcon: 'Compass',
    submissionType: 'mixed',
    requiresReport: true,
    requiresPhotos: true,
    requiresDocument: true,
    submissionInstructions: 'Upload GPS track log, waypoint photos, First Aid certification card, and comprehensive expedition logbook report.',
  },
  {
    id: 'rover-3',
    awardType: 'Baden-Powell Award',
    category: 'Scoutcraft',
    title: 'Scoutcraft Star',
    description: 'Demonstrate high-standard camping, fieldcraft, and instruction of Senior Scouts in specialized proficiency badges.',
    tasks: [
      { id: 'rs3-1', text: 'Camp on at least 10 separate occasions totaling at least 10 nights across 3 or more campsites, adhering strictly to "Camping Standards" and maintaining a camp logbook.' },
      { id: 'rs3-2', text: 'Instruct and examine Senior Scouts in at least two proficiency badges.' },
      { id: 'rs3-3', text: 'Alternative for Warrant Holders: Qualify at Preliminary Training Course / Wood Badge and give 6 months satisfactory service as a Scout Officer.' },
    ],
    minHours: 50,
    badgeIcon: 'Award',
    submissionType: 'mixed',
    requiresReport: true,
    requiresPhotos: true,
    requiresDocument: false,
    submissionInstructions: 'Upload official Camp Logbook with 10+ nights verified by Rover Scout Leader, and Senior Scout examination receipts.',
  },
  {
    id: 'rover-4',
    awardType: 'Baden-Powell Award',
    category: 'Leadership',
    title: 'Project Badge',
    description: 'Self-imposed 6-month project demanding technical skill, dedication, application, and continuous reporting.',
    tasks: [
      { id: 'rs4-1', text: 'Formulate and submit a detailed 6-month self-imposed project proposal to the Rover Scout Leader and Crew Council.' },
      { id: 'rs4-2', text: 'Dedicate a minimum of 6 months to execution with continuous records, logbooks, and exhibits.' },
      { id: 'rs4-3', text: 'Present progress reports to the R.S.L. and Crew at least 3 times during the project period.' },
    ],
    minHours: 60,
    badgeIcon: 'Shield',
    submissionType: 'mixed',
    requiresReport: true,
    requiresPhotos: true,
    requiresDocument: true,
    submissionInstructions: 'Submit final project report PDF with exhibits, photos, and Crew Council evaluation score sheet.',
  },
  {
    id: 'rover-5',
    awardType: 'Baden-Powell Award',
    category: 'Community Service',
    title: 'Service Training Star / Rover Instructor Badge',
    description: 'Satisfactory service as an Instructor or Scout Officer training junior troops or cub packs.',
    tasks: [
      { id: 'rs5-1', text: 'Complete the Preliminary Training Course or Wood Badge qualification.' },
      { id: 'rs5-2', text: 'Provide satisfactory service as an Instructor or Scout Officer to a Junior/Boy/Senior Scout troop or Cub pack for a minimum of 6 months.' },
      { id: 'rs5-3', text: 'Instruct scouts in First and Second Star/Step badges or First Class badge requirements.' },
    ],
    minHours: 40,
    badgeIcon: 'Users',
    submissionType: 'report',
    requiresReport: true,
    requiresPhotos: false,
    requiresDocument: true,
    submissionInstructions: 'Submit Group Scout Master recommendation letter, training course certificate, and officer service log.',
  },
  {
    id: 'rover-6',
    awardType: 'Baden-Powell Award',
    category: 'Global Citizenship',
    title: 'Baden-Powell Award Final Assessment and Board Review',
    description: 'Pinnacle award of the Rover Scout section, recognizing exemplary living of the Scout way of life and motto "Service".',
    tasks: [
      { id: 'rs6-1', text: 'Successfully hold Rambler\'s Badge, Scoutcraft Star, Project Badge, and Service Training Star / Rover Instructor Badge.' },
      { id: 'rs6-2', text: 'Demonstrate active living of the Rover motto "Service" through ongoing community leadership.' },
      { id: 'rs6-3', text: 'Pass the formal Baden-Powell Award Board of Review and interview with the Local Commissioner.' },
    ],
    minHours: 80,
    badgeIcon: 'Crown',
    submissionType: 'mixed',
    requiresReport: true,
    requiresPhotos: true,
    requiresDocument: true,
    submissionInstructions: 'Attach all 4 prerequisite badge certificates and submit Baden-Powell Award application dossier for Commissioner review.',
  },

  // Scout / Explorer Progressive Scheme
  {
    id: 'scout-1',
    awardType: "President's Scout Award",
    category: 'Scoutcraft',
    title: 'Membership Badge',
    description: 'Foundational membership requirements for Scout / Explorer investiture.',
    tasks: [
      { id: 'sc1-1', text: 'Recite and explain the Scout Law, Scout Promise, Motto "Be Prepared", Sign, Salute, and Emblem.' },
      { id: 'sc1-2', text: 'Demonstrate knowledge of Maldives Scouting history, Flag protocol, and World Scout Flag.' },
      { id: 'sc1-3', text: 'Master 6 basic knots: Reef Knot, Clove Hitch, Sheet Bend, Sheepshank, Bowline, Round Turn & Two Half Hitches.' },
    ],
    minHours: 15,
    badgeIcon: 'BookOpen',
    submissionType: 'checkbox',
    requiresReport: false,
    requiresPhotos: false,
    requiresDocument: false,
    submissionInstructions: 'Patrol Leader or Scout Leader practical sign-off on knotting, promise, and flag protocol.',
  },
  {
    id: 'scout-2',
    awardType: "President's Scout Award",
    category: 'Outdoor Skills',
    title: 'Scout Standard Badge',
    description: 'Second Class progression badge testing core practical scouting skills in first aid, camping, lashings, and mapping.',
    tasks: [
      { id: 'sc2-1', text: 'First Aid: Demonstrate emergency dressings, triangular bandage application, treatment for burns, shock, and bleeding.' },
      { id: 'sc2-2', text: 'Camping & Cooking: Pitch and strike a tent, cook a balanced meal over an open backwoods fire without utensils.' },
      { id: 'sc2-3', text: 'Pioneering: Demonstrate square, diagonal, and shear lashings; construct a tripod or camp table.' },
      { id: 'sc2-4', text: 'Mapping & Compass: Identify 16 cardinal points, read grid references, scale, and estimate distances by pacing.' },
    ],
    minHours: 25,
    badgeIcon: 'Compass',
    submissionType: 'mixed',
    requiresReport: true,
    requiresPhotos: true,
    requiresDocument: false,
    submissionInstructions: 'Submit camp logbook notes and photo evidence of backwoods cooking and pioneering lashing.',
  },
  {
    id: 'scout-3',
    awardType: "President's Scout Award",
    category: 'Outdoor Skills',
    title: 'Advanced Scout Standard Badge',
    description: 'First Class progression badge demanding advanced expedition, pioneering, and survival leadership.',
    tasks: [
      { id: 'sc3-1', text: '24-Hour Expedition: Plan and execute a 20km hike or sea journey with a route map, logbook, and detailed sketch map.' },
      { id: 'sc3-2', text: 'Advanced Pioneering: Construct a monkey bridge, signal tower, or raft with patrol team.' },
      { id: 'sc3-3', text: 'Survival & First Aid: Demonstrate CPR, patient transport with improvised stretchers, and water purification techniques.' },
      { id: 'sc3-4', text: 'Community Service: Complete 15+ hours of verified community service.' },
    ],
    minHours: 35,
    badgeIcon: 'MapPin',
    submissionType: 'mixed',
    requiresReport: true,
    requiresPhotos: true,
    requiresDocument: true,
    submissionInstructions: 'Upload 20km route map PDF, expedition logbook, and photo evidence of pioneering structure.',
  },
  {
    id: 'scout-4',
    awardType: "President's Scout Award",
    category: 'Leadership',
    title: 'Scout Cord',
    description: 'Prestigious cord worn on the shoulder earned by completing Advanced Scout Standard and specified proficiency badges.',
    tasks: [
      { id: 'sc4-1', text: 'Hold Advanced Scout Standard badge.' },
      { id: 'sc4-2', text: 'Earn at least 4 proficiency badges including Ambulance/First Aid, Pioneer, Public Service, and Conservation.' },
      { id: 'sc4-3', text: 'Demonstrate active leadership as a Patrol Leader or Senior Patrol Member.' },
    ],
    minHours: 40,
    badgeIcon: 'Award',
    submissionType: 'report',
    requiresReport: true,
    requiresPhotos: false,
    requiresDocument: true,
    submissionInstructions: 'Upload copies of 4 proficiency badge certificates and Patrol Leader service report.',
  },
  {
    id: 'scout-5',
    awardType: "President's Scout Award",
    category: 'Leadership',
    title: 'President\'s Scout Award Core Curriculum',
    description: 'The pinnacle award for Scouts and Explorers in the Maldives.',
    tasks: [
      { id: 'sc5-1', text: 'Serve at least 6 months as Patrol Leader or Assistant Patrol Leader with outstanding attendance and patrol logbooks.' },
      { id: 'sc5-2', text: 'Complete 3-Day Wilderness Expedition.' },
      { id: 'sc5-3', text: 'Spearhead a 30-hour Island Community Impact Project with measurable ecological or social outcomes.' },
      { id: 'sc5-4', text: 'Pass the President\'s Scout Interview & Board of Review.' },
    ],
    minHours: 60,
    badgeIcon: 'Crown',
    submissionType: 'mixed',
    requiresReport: true,
    requiresPhotos: true,
    requiresDocument: true,
    submissionInstructions: 'Submit full President\'s Scout dossier including expedition log, community impact report, and recommendation letter.',
  },

  // Auxiliary Proficiency Badges
  {
    id: 'aux-1',
    awardType: 'Auxiliary Badge',
    category: 'Outdoor Skills',
    title: 'Ambulance & Emergency First Aid Badge',
    description: 'Pass official First Aid qualification including CPR, fracture splinting, heat stroke management, and patient triage.',
    tasks: [
      { id: 'aux1-1', text: 'Demonstrate adult and infant CPR on manikin to trainer satisfaction.' },
      { id: 'aux1-2', text: 'Apply pressure bandages, arm slings, and improvised tourniquets.' },
      { id: 'aux1-3', text: 'Perform patient transport using improvised stretchers and fireman\'s carry.' },
    ],
    minHours: 16,
    badgeIcon: 'Shield',
    submissionType: 'evidence_files',
    requiresReport: false,
    requiresPhotos: true,
    requiresDocument: true,
    submissionInstructions: 'Upload official First Aid Certificate PDF or photo scan of completion card.',
  },
  {
    id: 'aux-2',
    awardType: 'Auxiliary Badge',
    category: 'Scoutcraft',
    title: 'Pioneer & Heavy Timber Engineering Badge',
    description: 'Design and construct a functional 15-foot pioneering signal tower or monkey bridge using natural spars and lashings.',
    tasks: [
      { id: 'aux2-1', text: 'Demonstrate square, diagonal, shear, and tripod lashings with proper tensioning.' },
      { id: 'aux2-2', text: 'Draft scale structural blueprint and load distribution calculations.' },
      { id: 'aux2-3', text: 'Construct and test tower or bridge with full crew safety gear.' },
    ],
    minHours: 20,
    badgeIcon: 'Shield',
    submissionType: 'mixed',
    requiresReport: true,
    requiresPhotos: true,
    requiresDocument: false,
    submissionInstructions: 'Submit structural photo proof showing the completed bridge/tower supporting team weight, and a brief report.',
  },
];

export const INITIAL_PROGRESS: MemberRequirementProgress[] = [];

export const INITIAL_JOURNALS: JournalEntry[] = [];

export const INITIAL_EVENTS: CrewEvent[] = [
  {
    id: 'ev-1',
    title: 'Rover Survival Expedition 2026',
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
    location: 'Scout HQ Conference Room',
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
    location: 'Scout HQ Conference Room & Online Sync',
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
The Council met to review active sub-crew operations, progression rates for Baden-Powell and President Scout candidates, and finalize logistics for the upcoming Baa Atoll Marine Survival Expedition.`,
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
  aiAssistantConfig: {
    enabled: true,
    name: 'Meyvaa AI Scout Advisor',
    tagline: 'Official AI Assistant for Meyvaa Portal - Grounded in Scouting Excellence',
    allowAllMembers: true,
    allowedUserIds: ['m-superadmin', 'm-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-5'],
    allowedRoles: [
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
    ],
    systemPrompt: `You are the Meyvaa Portal AI Scout Advisor, an expert AI assistant dedicated to assisting scout leaders, Rovers, explorers, and council members.
Your responsibilities:
1. Provide accurate guidance on Scout syllabus requirements (President's Scout Award, Baden-Powell Award, Auxiliary Badges).
2. Assist with drafting formal Scout Meeting Minutes, Event Agendas, Camp Plans, Risk Assessments, and Reflection Journals.
3. Explain group operating policies, referendum rules (minimum 7 days voting, majority Yea required for ratification), and attendance excusal policies.
4. Encourage leadership, community service, outdoor safety, and adherence to the Scout Promise and Scout Law.
Always respond in a structured, respectful, and motivating tone. Format responses with clear Markdown headings, bullet points, and actionable checklists.`,
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
      {
        id: 'kdoc-3',
        title: 'Attendance Protocol & Excusal Submissions',
        category: 'General Operations',
        content: 'Active membership requires minimum 75% attendance for compulsory events. If a member is unable to attend due to medical, academic, or work obligations, an Exemption Request must be logged prior to the event for Council review.',
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
      {
        id: 'tqa-2',
        question: 'What are the core requirements for the Baden-Powell Award?',
        answer: 'The Baden-Powell Award requires completing syllabus tasks across Outdoor Skills, Community Service, Leadership, and Personal Development, maintaining logged practical hours, submitting written reflection logbooks in the Portfolio Journal, and obtaining council verification.',
        category: 'Syllabus',
        createdAt: '2026-08-01',
      },
    ],
    lastTrainedAt: '2026-08-15',
    trainedBy: 'Superadmin (Ahmed Nazih Nafiz)',
  },
  smsNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  activeTerm: '2025-2026',
  crewName: 'Arabiyya Rover Crew',
  networkName: 'Arabiyya Rover Portal',
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
    accountName: 'Arabiyya Rover Crew Official Account',
    accountNumber: '7730000123456',
    bankName: 'Bank of Maldives (BML)',
  },
};

export const INITIAL_ROVER_POLICY: RoverOperatingPolicy = {
  id: 'pol-1',
  organisationId: 'org-arabiyya',
  version: 'v2.4 (2026 Revision)',
  title: 'Arabiyya Rover Crew Communication & Operating Guidelines',
  lastUpdated: '2026-07-01',
  updatedBy: 'Council Executive Committee',
  content: `# Arabiyya Rover Crew Communication & Operating Guidelines

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
    organisationId: 'org-meyvaa',
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
    organisationId: 'org-meyvaa',
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
    organisationId: 'org-arabiyya',
    action: 'Organisation Subscription Approved',
    category: 'System' as const,
    performedByMemberId: 'superadmin-1',
    performedByMemberName: 'Superadmin',
    performedByRole: 'Superadmin',
    targetName: 'Arabiyya Rover Crew',
    details: 'Approved Monthly Plan (MVR 20) registration after verifying BML bank transfer receipt.',
    timestamp: '2026-02-11 10:15',
  },
  {
    id: 'log-2',
    organisationId: 'org-arabiyya',
    action: 'Rover Advisor Assigned',
    category: 'Council Governance' as const,
    performedByMemberId: 'superadmin-1',
    performedByMemberName: 'Superadmin',
    performedByRole: 'Superadmin',
    targetName: 'Nazih Nafiz',
    details: 'Assigned as Rover Advisor and Lead Administrator for Arabiyya Rover Crew.',
    timestamp: '2026-02-11 10:20',
  },
  {
    id: 'log-3',
    organisationId: 'org-arabiyya',
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
    organisationId: 'org-arabiyya',
    action: 'Plan Extension Processed',
    category: 'System' as const,
    performedByMemberId: 'superadmin-1',
    performedByMemberName: 'Superadmin',
    performedByRole: 'Superadmin',
    targetName: 'Arabiyya Rover Crew',
    details: 'Verified MVR 20 bank receipt for 1-Month Term Extension.',
    timestamp: '2026-08-01 09:30',
  },
];


