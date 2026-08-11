import React, { useState } from 'react';
import { Member, PortalSettings, CouncilPermissionKey } from '../types';
import {
  PERMISSIONS_LIST,
  DEFAULT_ROLE_PERMISSIONS,
  hasPermission,
  PermissionDefinition,
} from '../utils/permissions';
import {
  Shield,
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Key,
  BookOpen,
  Award,
  Users as UsersIcon,
  Calendar,
  ShieldAlert,
  Settings,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react';

interface CouncilPermissionsManagerProps {
  councilPositions: string[];
  members: Member[];
  settings: PortalSettings;
  onUpdateSettings: (newSettings: PortalSettings) => void;
  onUpdateMember?: (member: Member) => void;
  onCreateRole: () => void;
  onEditRole: (index: number, roleName: string) => void;
  onDeleteRole: (index: number, roleName: string) => void;
}

export const CouncilPermissionsManager: React.FC<CouncilPermissionsManagerProps> = ({
  councilPositions = [],
  members = [],
  settings,
  onUpdateSettings,
  onUpdateMember,
  onCreateRole,
  onEditRole,
  onDeleteRole,
}) => {
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<string>(councilPositions[0] || 'Chairperson');
  const [assignmentSearch, setAssignmentSearch] = useState<string>('');
  const [assignmentCrewFilter, setAssignmentCrewFilter] = useState<string>('All');
  const [matrixViewMode, setMatrixViewMode] = useState<'single' | 'full'>('full');

  // Helper to get active permissions for a specific role
  const getRolePermissions = (roleName: string): CouncilPermissionKey[] => {
    if (settings.rolePermissions && settings.rolePermissions[roleName]) {
      return settings.rolePermissions[roleName];
    }
    return DEFAULT_ROLE_PERMISSIONS[roleName] || ['monitorProgress', 'assignCourses'];
  };

  // Toggle permission for a role
  const handleTogglePermission = (roleName: string, permKey: CouncilPermissionKey) => {
    const currentPerms = getRolePermissions(roleName);
    const hasIt = currentPerms.includes(permKey);
    const updatedPerms = hasIt
      ? currentPerms.filter((p) => p !== permKey)
      : [...currentPerms, permKey];

    const currentMap = settings.rolePermissions || { ...DEFAULT_ROLE_PERMISSIONS };
    const newMap = {
      ...currentMap,
      [roleName]: updatedPerms,
    };

    onUpdateSettings({
      ...settings,
      rolePermissions: newMap,
    });
  };

  // Grant all permissions to a role
  const handleGrantAll = (roleName: string) => {
    const allKeys = PERMISSIONS_LIST.map((p) => p.key);
    const currentMap = settings.rolePermissions || { ...DEFAULT_ROLE_PERMISSIONS };
    onUpdateSettings({
      ...settings,
      rolePermissions: {
        ...currentMap,
        [roleName]: allKeys,
      },
    });
  };

  // Reset role to default permissions
  const handleResetDefaults = (roleName: string) => {
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[roleName] || ['monitorProgress', 'assignCourses'];
    const currentMap = settings.rolePermissions || { ...DEFAULT_ROLE_PERMISSIONS };
    onUpdateSettings({
      ...settings,
      rolePermissions: {
        ...currentMap,
        [roleName]: defaultPerms,
      },
    });
  };

  // Assign a council role to a member
  const handleAssignRole = (member: Member, newRole: string) => {
    if (!onUpdateMember) return;
    const updatedMember: Member = {
      ...member,
      councilRole: newRole,
    };
    onUpdateMember(updatedMember);
  };

  // Icon mapper for permission categories
  const getPermIcon = (key: CouncilPermissionKey) => {
    switch (key) {
      case 'createSyllabus':
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
      case 'assignCourses':
        return <Award className="w-4 h-4 text-teal-400" />;
      case 'monitorProgress':
        return <CheckCircle2 className="w-4 h-4 text-sky-400" />;
      case 'addMembers':
        return <UsersIcon className="w-4 h-4 text-amber-400" />;
      case 'manageEvents':
        return <Calendar className="w-4 h-4 text-indigo-400" />;
      case 'manageDisciplinary':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'manageSettings':
        return <Settings className="w-4 h-4 text-purple-400" />;
      default:
        return <Key className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Governance Exemption Jurisdiction Notice */}
      <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Governance Jurisdictions & Duty Exemptions</span>
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                Exempt Overseers
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              <strong className="text-purple-300">Superadmin:</strong> Only administers portal-level operations (national organisation management, multi-tenant billing, portal permissions). Exempt from local crew assembly attendance, council role assignments, and syllabus work.<br />
              <strong className="text-amber-300">Rover Advisor:</strong> Manages organisation-level governance (crew setup, executive overrides, council supervision). Exempt from local crew assembly attendance obligations and candidate syllabus badge completion.
            </p>
          </div>
        </div>
      </div>

      {/* 1. SECTION HEADER & ROLE MANAGEMENT */}
      <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-slate-100">
                Council Member Settings & Role Permissions
              </h3>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                RBAC Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Define council positions, assign permissions (who gets to create syllabus, add members, monitor progress, assign courses, manage events, etc.), and allocate roles to members.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCreateRole}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Council Position</span>
            </button>
          </div>
        </div>

        {/* Council Positions List Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {councilPositions.map((roleName, index) => {
            const assignedMembers = members.filter((m) => m.councilRole === roleName);
            const activePermsCount = getRolePermissions(roleName).length;
            const isSelected = selectedRoleForMatrix === roleName;

            return (
              <div
                key={`${roleName}-${index}`}
                onClick={() => setSelectedRoleForMatrix(roleName)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-xs text-slate-100 block">{roleName}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {assignedMembers.length} {assignedMembers.length === 1 ? 'member' : 'members'} assigned
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRole(index, roleName);
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition"
                      title="Edit Position Name"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRole(index, roleName);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                      title="Delete Position"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/80">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Key className="w-3 h-3 text-emerald-400" />
                    {activePermsCount} of {PERMISSIONS_LIST.length} capabilities
                  </span>
                  <span className={`font-semibold ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isSelected ? 'Active Filter' : 'Click to inspect'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CAPABILITIES PERMISSION MATRIX BY COUNCIL ROLE */}
      <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-slate-100">
                Council Role Permission Matrix
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure fine-grained permissions for <strong className="text-emerald-400 font-mono">{selectedRoleForMatrix}</strong>. Members in this role inherit these permissions automatically.
            </p>
          </div>

          {/* Matrix Actions */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => handleGrantAll(selectedRoleForMatrix)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold transition border border-slate-700"
            >
              Grant All Capabilities
            </button>
            <button
              onClick={() => handleResetDefaults(selectedRoleForMatrix)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition border border-slate-700"
            >
              Reset to Role Defaults
            </button>
            <button
              onClick={() => setMatrixViewMode(matrixViewMode === 'full' ? 'single' : 'full')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold transition border border-slate-700"
            >
              {matrixViewMode === 'full' ? 'Focus View' : 'Full Matrix View'}
            </button>
          </div>
        </div>

        {/* CAPABILITY GRID FOR SELECTED ROLE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {PERMISSIONS_LIST.map((perm) => {
            const activePerms = getRolePermissions(selectedRoleForMatrix);
            const isEnabled = activePerms.includes(perm.key);

            return (
              <div
                key={perm.key}
                onClick={() => handleTogglePermission(selectedRoleForMatrix, perm.key)}
                className={`p-4 rounded-xl border transition cursor-pointer space-y-2 flex flex-col justify-between ${
                  isEnabled
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-100">
                      {getPermIcon(perm.key)}
                      <span>{perm.label}</span>
                    </div>

                    {/* Toggle Switch UI */}
                    <div
                      className={`w-9 h-5 rounded-full flex items-center p-0.5 transition ${
                        isEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    {perm.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 uppercase font-mono tracking-wider">{perm.category}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded font-mono ${
                      isEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isEnabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* FULL MATRIX TABLE PREVIEW (When in Full Mode) */}
        {matrixViewMode === 'full' && (
          <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              Complete Council Capability Overview Matrix
            </h4>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#12151B] text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Council Position</th>
                    {PERMISSIONS_LIST.map((p) => (
                      <th key={p.key} className="py-2.5 px-2 text-center" title={p.description}>
                        {p.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {councilPositions.map((role) => {
                    const rolePerms = getRolePermissions(role);
                    const isCurrentFilter = role === selectedRoleForMatrix;

                    return (
                      <tr
                        key={role}
                        onClick={() => setSelectedRoleForMatrix(role)}
                        className={`hover:bg-slate-800/40 cursor-pointer transition ${
                          isCurrentFilter ? 'bg-emerald-950/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-200 whitespace-nowrap">
                          {role}
                          {isCurrentFilter && (
                            <span className="ml-2 text-[10px] text-emerald-400 font-mono">(Editing)</span>
                          )}
                        </td>
                        {PERMISSIONS_LIST.map((p) => {
                          const has = rolePerms.includes(p.key);
                          return (
                            <td key={p.key} className="py-2.5 px-2 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePermission(role, p.key);
                                }}
                                className={`p-1 rounded transition ${
                                  has
                                    ? 'text-emerald-400 hover:bg-emerald-500/20'
                                    : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                                }`}
                                title={`Toggle ${p.label} for ${role}`}
                              >
                                {has ? (
                                  <CheckCircle2 className="w-4 h-4 inline-block" />
                                ) : (
                                  <XCircle className="w-4 h-4 inline-block opacity-40" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 3. ASSIGN COUNCIL ROLES & DELEGATION TO MEMBERS */}
      <div className="bg-[#1A1E26] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-bold text-slate-100">
                Assign Council Roles & Active Capabilities to Members
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select who holds each Council position. Assigned members inherit capability permissions immediately.
            </p>
          </div>

          {/* Search & Crew Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search member name..."
                value={assignmentSearch}
                onChange={(e) => setAssignmentSearch(e.target.value)}
                className="bg-[#161920] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Member Delegation List */}
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {members
            .filter((m) => {
              if (assignmentSearch.trim()) {
                const q = assignmentSearch.toLowerCase();
                return (m.name || '').toLowerCase().includes(q) || (m.idCard || '').toLowerCase().includes(q) || (m.councilRole || '').toLowerCase().includes(q);
              }
              return true;
            })
            .map((m) => {
              const isCouncil = m.councilRole !== 'Member';
              const memberPerms = getRolePermissions(m.councilRole);

              return (
                <div
                  key={m.id}
                  className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                >
                  {/* Left Member Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400 flex-shrink-0 shadow-sm">
                      {m.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-200 text-sm truncate flex items-center gap-2">
                        <span>{m.name}</span>
                        {isCouncil ? (
                          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                            {m.councilRole}
                          </span>
                        ) : (
                          <span className="bg-slate-800 text-slate-400 text-[9px] font-medium px-1.5 py-0.2 rounded">
                            General Member
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {m.section} • {m.crewName} • ID: <span className="font-mono text-slate-300">{m.idCard}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Perm Pills */}
                  {isCouncil && (
                    <div className="flex flex-wrap items-center gap-1.5 my-1 md:my-0 max-w-md">
                      {PERMISSIONS_LIST.map((p) => {
                        const canDo = memberPerms.includes(p.key);
                        if (!canDo) return null;
                        return (
                          <span
                            key={p.key}
                            className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[9px] font-semibold px-2 py-0.5 rounded-md font-mono"
                          >
                            ✓ {p.label}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Right Assign Role Selector */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-auto">
                    <span className="text-[10px] text-slate-400">Assigned Role:</span>
                    <select
                      value={m.councilRole}
                      onChange={(e) => handleAssignRole(m, e.target.value)}
                      className="bg-[#161920] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
                    >
                      <option value="Member">Member (Standard Access)</option>
                      <optgroup label="Council Leadership Roles">
                        {councilPositions.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
