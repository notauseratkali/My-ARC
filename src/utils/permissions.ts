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

export interface PageAllocation {
  id: string;
  label: string;
  description: string;
  category: 'Main' | 'Operations' | 'Governance' | 'System';
  accessLevel: 'full' | 'view_only' | 'own_only' | 'manage';
  requiredRoleOrPermission?: string;
}

export const PORTAL_PAGES: PageAllocation[] = [
  {
    id: 'superadmin',
    label: 'Organisation Directory & Superadmin Hub',
    description: 'Multi-organisation management, platform-wide license validity, sync control, and database administration.',
    category: 'Governance',
    accessLevel: 'full',
    requiredRoleOrPermission: 'Superadmin only',
  },
  {
    id: 'dashboard',
    label: 'Rover Crew Overview',
    description: 'General crew statistics, progression summaries, notices, and quick action cards.',
    category: 'Main',
    accessLevel: 'full',
  },
  {
    id: 'ai-assistant',
    label: 'AI Scout Advisor',
    description: 'Interactive intelligent assistant grounded in scout curriculum, bylaws, and council directives.',
    category: 'Main',
    accessLevel: 'full',
  },
  {
    id: 'members',
    label: 'Members Directory',
    description: 'Crew roster, member contact info, rank profiles, and credential verification.',
    category: 'Main',
    accessLevel: 'full',
    requiredRoleOrPermission: 'addMembers (to edit/create)',
  },
  {
    id: 'syllabus',
    label: 'Awards & Syllabus Engine',
    description: 'Scout badge curriculum tracks (Baden-Powell, President Scout, Auxiliary) and requirement progress tracker.',
    category: 'Main',
    accessLevel: 'full',
    requiredRoleOrPermission: 'createSyllabus / monitorProgress (for sign-offs)',
  },
  {
    id: 'journals',
    label: 'Portfolio Notebook',
    description: 'Personal scouting reflection logbooks, camp expedition journals, and photo evidence archives.',
    category: 'Main',
    accessLevel: 'own_only',
    requiredRoleOrPermission: 'monitorProgress (to verify others)',
  },
  {
    id: 'events',
    label: 'Events & Calendar',
    description: 'Crew assemblies, camps, community service drives, and RSVP/excusal submissions.',
    category: 'Operations',
    accessLevel: 'full',
    requiredRoleOrPermission: 'manageEvents (to create/edit events)',
  },
  {
    id: 'attendance',
    label: 'Attendance Portal',
    description: 'Assembly roll-call logging, exemption/excusal requests, and individual attendance tracking.',
    category: 'Operations',
    accessLevel: 'full',
    requiredRoleOrPermission: 'manageEvents (to mark roll call)',
  },
  {
    id: 'minutes',
    label: 'Meeting Minutes',
    description: 'Official Council Executive minutes, resolution records, parliamentary motions, and action items.',
    category: 'Operations',
    accessLevel: 'full',
    requiredRoleOrPermission: 'manageMinutes (to draft/publish)',
  },
  {
    id: 'policy',
    label: 'Operating Policy & Democratic Referendums',
    description: 'Active crew bylaws, constitution rules, and 7-day referendum voting ballots.',
    category: 'Operations',
    accessLevel: 'full',
  },
  {
    id: 'payments',
    label: 'Payments & Crew Dues',
    description: 'Monthly term dues, expedition fee submissions, receipt verification, and financial status ledger.',
    category: 'Operations',
    accessLevel: 'full',
    requiredRoleOrPermission: 'manageSettings (Treasurer / Council to verify transactions)',
  },
  {
    id: 'disciplinary',
    label: 'Disciplinary Incident Log',
    description: 'Confidential council disciplinary incident records, hearings, and resolution logs.',
    category: 'Governance',
    accessLevel: 'manage',
    requiredRoleOrPermission: 'manageDisciplinary permission or Superadmin',
  },
  {
    id: 'audit',
    label: 'Audit Trails & Change Logs',
    description: 'System-wide activity logs, credential updates, permission modifications, and sync history.',
    category: 'Governance',
    accessLevel: 'view_only',
    requiredRoleOrPermission: 'Council Executive or Superadmin',
  },
  {
    id: 'settings',
    label: 'Settings & Profile Management',
    description: 'Council term configuration, crew unit management, custom permissions, or personal profile settings.',
    category: 'System',
    accessLevel: 'full',
    requiredRoleOrPermission: 'manageSettings (for council settings)',
  },
];

export function hasPermission(
  member: Member | undefined | null,
  permission: CouncilPermissionKey,
  settings?: PortalSettings
): boolean {
  if (!member) return false;
  // Superadmin & Rover Advisor have supreme authority
  if (member.isSuperAdmin || member.councilRole === 'Superadmin' || member.councilRole === 'Rover Advisor') return true;
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
  if (
    member.councilRole.toLowerCase().includes('chair') ||
    member.councilRole.toLowerCase().includes('leader')
  ) {
    return true;
  }

  return permission === 'monitorProgress' || permission === 'assignCourses';
}

export function canAccessPage(
  member: Member | undefined | null,
  pageId: string,
  settings?: PortalSettings
): boolean {
  if (!member) return false;
  const isSuperAdmin = Boolean(member.isSuperAdmin || member.councilRole === 'Superadmin');
  if (isSuperAdmin) return true;

  const isCouncil = member.councilRole !== 'Member';

  switch (pageId) {
    case 'superadmin':
      return isSuperAdmin;
    case 'disciplinary':
      return hasPermission(member, 'manageDisciplinary', settings);
    case 'audit':
      return isCouncil;
    case 'minutes':
      // Regular members can view, but council with manageMinutes can manage
      return true;
    case 'dashboard':
    case 'ai-assistant':
    case 'members':
    case 'directory':
    case 'syllabus':
    case 'journals':
    case 'journal':
    case 'events':
    case 'attendance':
    case 'policy':
    case 'payments':
    case 'settings':
      return true;
    default:
      return true;
  }
}

export function getAllocatedPagesForMember(
  member: Member | undefined | null,
  settings?: PortalSettings
): PageAllocation[] {
  if (!member) return [];
  return PORTAL_PAGES.filter((page) => canAccessPage(member, page.id, settings));
}

export function getRestrictedPagesForMember(
  member: Member | undefined | null,
  settings?: PortalSettings
): PageAllocation[] {
  if (!member) return [];
  return PORTAL_PAGES.filter((page) => !canAccessPage(member, page.id, settings));
}

