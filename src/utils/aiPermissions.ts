import { Member, PortalSettings } from '../types';

/**
 * Checks if a member has permission to see, access, and use the AI Assistant Chatbot.
 * Superadmin can always access.
 * Non-superadmin users can only access if explicitly granted or if their role is permitted by Superadmin.
 */
export function canAccessAIAssistant(
  member: Member | null,
  settings?: PortalSettings
): boolean {
  if (!member) return false;

  // Superadmin always has full access
  if (member.isSuperAdmin || member.councilRole === 'Superadmin') {
    return true;
  }

  // Check if AI features are disabled globally
  if (settings?.aiEnabled === false) {
    return false;
  }

  const aiConfig = settings?.aiAssistantConfig;
  // If config is not defined yet, default to active
  if (!aiConfig) {
    return true;
  }
  if (aiConfig.enabled === false) {
    return false;
  }

  // Check if Superadmin enabled "Allow All Members" (or default true)
  if (aiConfig.allowAllMembers !== false) {
    return true;
  }

  // Check direct user ID allocation by Superadmin
  if (Array.isArray(aiConfig.allowedUserIds) && aiConfig.allowedUserIds.includes(member.id)) {
    return true;
  }

  // Check role-based allocation by Superadmin
  if (
    member.councilRole &&
    Array.isArray(aiConfig.allowedRoles) &&
    aiConfig.allowedRoles.includes(member.councilRole)
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if a member has Superadmin permissions to train and allocate the AI Assistant.
 * ONLY Superadmin can train the AI Assistant and allocate access.
 */
export function canManageAIAssistant(member: Member | null): boolean {
  if (!member) return false;
  return Boolean(member.isSuperAdmin || member.councilRole === 'Superadmin');
}

/**
 * Returns descriptive status and rationale of a member's AI Assistant access for the Superadmin matrix.
 */
export function getMemberAIAccessStatus(
  member: Member,
  settings?: PortalSettings
): {
  hasAccess: boolean;
  source: 'Superadmin' | 'Direct Member Grant' | 'Role Grant' | 'All Members Allowed' | 'Restricted';
  badgeColor: string;
} {
  if (member.isSuperAdmin || member.councilRole === 'Superadmin') {
    return {
      hasAccess: true,
      source: 'Superadmin',
      badgeColor: 'bg-[#800000] text-white',
    };
  }

  const aiConfig = settings?.aiAssistantConfig;
  if (!aiConfig || aiConfig.enabled === false || settings?.aiEnabled === false) {
    return {
      hasAccess: false,
      source: 'Restricted',
      badgeColor: 'bg-slate-200 text-slate-700',
    };
  }

  if (aiConfig.allowAllMembers) {
    return {
      hasAccess: true,
      source: 'All Members Allowed',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    };
  }

  if (Array.isArray(aiConfig.allowedUserIds) && aiConfig.allowedUserIds.includes(member.id)) {
    return {
      hasAccess: true,
      source: 'Direct Member Grant',
      badgeColor: 'bg-purple-100 text-purple-800',
    };
  }

  if (
    member.councilRole &&
    Array.isArray(aiConfig.allowedRoles) &&
    aiConfig.allowedRoles.includes(member.councilRole)
  ) {
    return {
      hasAccess: true,
      source: 'Role Grant',
      badgeColor: 'bg-blue-100 text-blue-800',
    };
  }

  return {
    hasAccess: false,
    source: 'Restricted',
    badgeColor: 'bg-rose-100 text-rose-800',
  };
}
