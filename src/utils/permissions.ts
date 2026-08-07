import { Member, PortalSettings, CouncilPermissionKey } from '../types';

export interface PermissionDefinition {
  key: CouncilPermissionKey;
  label: string;
  description: string;
  category: 'Syllabus & Training' | 'Membership' | 'Operations & Events' | 'Governance & Settings';
}

export const PERMISSIONS_LIST: PermissionDefinition[] = [
  {
    key: 'createSyllabus',
    label: 'Create & Edit Syllabus',
    description: 'Create, modify, and delete badge requirements and award syllabus items',
    category: 'Syllabus & Training',
  },
  {
    key: 'assignCourses',
    label: 'Assign Courses & Milestones',
    description: 'Assign syllabus requirements and award training modules to members',
    category: 'Syllabus & Training',
  },
  {
    key: 'monitorProgress',
    label: 'Monitor & Sign-off Progress',
    description: 'Verify requirement completion, approve progress sign-offs, and inspect journals',
    category: 'Syllabus & Training',
  },
  {
    key: 'addMembers',
    label: 'Add & Manage Members',
    description: 'Register new members, edit member details, and update active/onboarding status',
    category: 'Membership',
  },
  {
    key: 'manageEvents',
    label: 'Manage Events & Attendance',
    description: 'Schedule crew assemblies, create calendar events, and record attendance logs',
    category: 'Operations & Events',
  },
  {
    key: 'manageDisciplinary',
    label: 'Disciplinary Action Log',
    description: 'Access, record, and resolve confidential disciplinary incident reports',
    category: 'Governance & Settings',
  },
  {
    key: 'manageMinutes',
    label: 'Meeting Minutes & Records',
    description: 'Record, edit, and publish official council meeting minutes and action items',
    category: 'Governance & Settings',
  },
  {
    key: 'manageSettings',
    label: 'Crew & Council Settings',
    description: 'Configure active term, sub-crews, and customize council role permissions',
    category: 'Governance & Settings',
  },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, CouncilPermissionKey[]> = {
  'Rover Advisor': [
    'createSyllabus',
    'assignCourses',
    'monitorProgress',
    'addMembers',
    'manageEvents',
    'manageDisciplinary',
    'manageMinutes',
    'manageSettings',
  ],
  Chairperson: [
    'createSyllabus',
    'assignCourses',
    'monitorProgress',
    'addMembers',
    'manageEvents',
    'manageDisciplinary',
    'manageMinutes',
    'manageSettings',
  ],
  'Vice Chairperson': [
    'createSyllabus',
    'assignCourses',
    'monitorProgress',
    'addMembers',
    'manageEvents',
    'manageDisciplinary',
    'manageMinutes',
    'manageSettings',
  ],
  Secretary: [
    'addMembers',
    'manageEvents',
    'monitorProgress',
    'assignCourses',
    'manageMinutes',
  ],
  Treasurer: [
    'manageEvents',
    'manageSettings',
  ],
  'Progress Coordinator': [
    'createSyllabus',
    'assignCourses',
    'monitorProgress',
  ],
  'Event Coordinator': [
    'manageEvents',
    'monitorProgress',
  ],
  'Media Coordinator': [
    'monitorProgress',
  ],
  'Crew Leader': [
    'monitorProgress',
    'assignCourses',
    'manageEvents',
  ],
};

export function hasPermission(
  member: Member | undefined | null,
  permission: CouncilPermissionKey,
  settings?: PortalSettings
): boolean {
  if (!member) return false;
  // Rover Advisor is the supreme network authority
  if (member.councilRole === 'Rover Advisor') return true;
  if (member.councilRole === 'Member') return false;

  // Check if custom configured in settings
  const configured = settings?.rolePermissions?.[member.councilRole];
  if (configured) {
    return configured.includes(permission);
  }

  // Fallback to default role map
  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[member.councilRole];
  if (defaultPerms) {
    return defaultPerms.includes(permission);
  }

  // Fallback for new custom roles if not configured in settings:
  // Chairperson / Vice Chairperson or any admin title gets full, others get basic progress/courses
  if (
    member.councilRole.toLowerCase().includes('chair') ||
    member.councilRole.toLowerCase().includes('leader')
  ) {
    return true;
  }

  return permission === 'monitorProgress' || permission === 'assignCourses';
}
