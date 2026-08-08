export type Gender = 'Male' | 'Female' | 'Other';
export type Section = 'Explorer' | 'Rover';
export type CouncilRole = 
  | 'Superadmin'
  | 'Rover Advisor'
  | 'Chairperson'
  | 'Vice Chairperson'
  | 'Secretary'
  | 'Treasurer'
  | 'Event Coordinator'
  | 'Progress Coordinator'
  | 'Media Coordinator'
  | 'Crew Leader'
  | 'Member'
  | (string & {});

export type PlanType = 'Free' | 'Monthly' | 'Annual';
export type OrgStatus = 'Active' | 'Pending Approval' | 'Suspended' | 'Rejected';

export interface Organisation {
  id: string;
  name: string;
  code: string; // e.g. "ARABIYYA", "AMINIYA", "CHSE"
  roverAdvisorName: string;
  roverAdvisorEmail: string;
  roverAdvisorNid: string;
  roverAdvisorPhone: string;
  plan: PlanType;
  status: OrgStatus;
  createdAt: string;
  approvedAt?: string;
  paymentReceiptUrl?: string; // photo / base64 preview
  paymentReceiptName?: string;
  paymentNotes?: string;
  subscriptionRenewalDate?: string;
}

export type MemberStatus = 
  | 'Onboarding'
  | 'Active'
  | 'Suspended'
  | 'Terminated'
  | 'Resigned'
  | 'Rejected';

export interface Member {
  id: string;
  organisationId?: string; // Multi-tenant link
  isSuperAdmin?: boolean;
  name: string;
  idCard: string;
  dob: string;
  age: number;
  gender: Gender;
  section: Section;
  crewId: string;
  crewName: string;
  councilRole: CouncilRole;
  investitureDate: string;
  resignationDate?: string;
  status: MemberStatus;
  term: string;
  email: string;
  mobile: string;
  phone?: string;
  permAddress: string;
  currAddress: string;
  telegram?: string;
  whatsapp?: string;
  instagram?: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  attendanceUnexcused: number;
  attendanceExcused: number;
  avatar?: string;
  photoUrl?: string;
}

export type AwardType = "President's Scout Award" | 'Baden-Powell (BP) Award' | 'Auxiliary Badge';
export type CategoryType = 'Leadership' | 'Community Service' | 'Outdoor Skills' | 'Personal Development' | 'Scoutcraft' | 'Global Citizenship';
export type SubmissionType = 'checkbox' | 'report' | 'evidence_files' | 'mixed';

export interface SyllabusTask {
  id: string;
  text: string;
}

export interface SyllabusRequirement {
  id: string;
  awardType: AwardType;
  category: CategoryType;
  title: string;
  description: string;
  tasks: SyllabusTask[];
  minHours?: number;
  badgeIcon?: string;
  submissionType?: SubmissionType;
  requiresReport?: boolean;
  requiresPhotos?: boolean;
  requiresDocument?: boolean;
  submissionInstructions?: string;
  isPresetTemplate?: boolean;
}

export type RequirementStatus = 'Not Started' | 'In Progress' | 'Submitted' | 'Verified' | 'Completed';

export interface MemberRequirementProgress {
  id: string;
  memberId: string;
  requirementId: string;
  status: RequirementStatus;
  completedTasks: string[]; // task ids
  completionDate?: string;
  verifiedBy?: string;
  notes?: string;
  writtenReport?: string;
  proofUrl?: string;
  assignedBy?: string;
  assignedDate?: string;
  dueDate?: string;
  assignmentNotes?: string;
  evidenceFiles?: {
    id: string;
    fileName: string;
    fileUrl?: string;
    fileSize?: string;
    uploadedAt: string;
    notes?: string;
  }[];
}

export type JournalCategory = 
  | 'Personal Reflection' 
  | 'Meeting Notes' 
  | 'Camp Log' 
  | 'Hike Record' 
  | 'Service Project' 
  | 'Council Log';

export interface JournalEntry {
  id: string;
  memberId: string;
  title: string;
  category: JournalCategory;
  content: string;
  date: string;
  linkedEventId?: string;
  mediaUrls: string[];
  aiPolished: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EventType = 'Camp' | 'Community Service' | 'Meeting' | 'Course' | 'Special Activity' | 'Holiday/Deadline';

export interface CrewEvent {
  id: string;
  title: string;
  type: EventType;
  crewId: string; // 'all' or specific crew id
  crewName: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  targetAudience: string;
  isCompulsory: boolean;
  scopeFilters?: {
    gender?: Gender | 'All';
    location?: string;
    section?: Section | 'All';
    crewId?: string;
  };
  createdBy: string;
  notificationSent: boolean;
  notificationLogs?: {
    timestamp: string;
    channel: 'SMS' | 'Email';
    recipientCount: number;
  }[];
}

export type AttendanceStatus = 'Present' | 'Excused' | 'Unexcused' | 'Exempt';

export interface AttendanceRecord {
  id: string;
  eventId: string;
  memberId: string;
  status: AttendanceStatus;
  exemptionReason?: string;
  markedAt: string;
  markedBy: string;
}

export type InfractionCategory = 
  | 'Conduct Breach' 
  | 'Policy Violation' 
  | 'Attendance Neglect' 
  | 'Financial Irregularity' 
  | 'Safety Hazard' 
  | 'Other';

export type DisciplinaryAction = 
  | 'Warning Letter' 
  | 'Temporary Suspension' 
  | 'Mandatory Community Service' 
  | 'Council Probation' 
  | 'Termination';

export type DisciplinaryStatus = 'Open' | 'Under Review' | 'Resolved' | 'Escalated';

export interface DisciplinaryIncident {
  id: string;
  memberId: string;
  memberName: string;
  incidentDate: string;
  location: string;
  infractionCategory: InfractionCategory;
  narrativeNotes: string;
  actionTaken: DisciplinaryAction;
  effectiveStartDate: string;
  effectiveEndDate?: string;
  status: DisciplinaryStatus;
  followUpRemarks: string;
  loggedBy: string;
  confidential: boolean;
}

export interface SubCrew {
  id: string;
  name: string;
  location: string;
  crewLeaderId?: string;
  crewLeaderName?: string;
  description: string;
}

export type CouncilPermissionKey =
  | 'createSyllabus'
  | 'assignCourses'
  | 'monitorProgress'
  | 'addMembers'
  | 'manageEvents'
  | 'manageDisciplinary'
  | 'manageMinutes'
  | 'manageSettings';

export type MeetingType =
  | 'Council Executive Meeting'
  | 'General Crew Assembly'
  | 'Sub-Crew Leader Sync'
  | 'Emergency Council Meeting'
  | 'Annual General Meeting (AGM)';

export type MeetingMinutesStatus = 'Draft' | 'Published' | 'Archived';

export interface ActionItem {
  id: string;
  task: string;
  assignedTo: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface MeetingMinutesAttachment {
  id: string;
  name: string;
  url: string;
  caption?: string;
  size?: string;
}

export interface MeetingMinutes {
  id: string;
  title: string;
  meetingNumber: string; // e.g. "MM-2025/08"
  meetingType: MeetingType;
  date: string;
  time: string;
  location: string;
  chairperson: string;
  secretary: string;
  attendees: string[];
  absenteeList?: string[];
  agenda: string[];
  resolutions: string[];
  actionItems: ActionItem[];
  content: string; // Rich text / formatted content
  attachments: MeetingMinutesAttachment[];
  status: MeetingMinutesStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
}

export interface PolicyVote {
  memberId: string;
  memberName: string;
  choice: 'Yea' | 'Nay';
  votedAt: string;
}

export type PolicyPollStatus = 'Active Voting' | 'Passed & Implemented' | 'Defeated';

export interface PolicyAmendmentPoll {
  id: string;
  organisationId?: string;
  title: string;
  proposedBySecretaryName: string;
  proposedBySecretaryId: string;
  originalPolicyVersion: string;
  proposedPolicyContent: string;
  rationale: string;
  startDate: string;
  votingDeadline: string; // Minimum 1 week (7 days)
  status: PolicyPollStatus;
  votes: PolicyVote[];
  createdAt: string;
  resolvedAt?: string;
}

export interface RoverOperatingPolicy {
  id: string;
  organisationId?: string;
  version: string;
  title: string;
  lastUpdated: string;
  updatedBy: string;
  content: string; // Full text of policy
}

export interface PaymentDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
}

export interface PortalSettings {
  aiEnabled: boolean;
  smsNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  activeTerm: string;
  crewName?: string;
  networkName?: string;
  councilPositions?: string[];
  rolePermissions?: Record<string, CouncilPermissionKey[]>;
  paymentDetails?: PaymentDetails;
}

