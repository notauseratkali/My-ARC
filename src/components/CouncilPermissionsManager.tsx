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
        return <BookOpen className="w-4 h-4 text-[#002B7F]" />;
      case 'assignCourses':
        return <Award className="w-4 h-4 text-[#006B3F]" />;
      case 'monitorProgress':
        return <CheckCircle2 className="w-4 h-4 text-[#002B7F]" />;
      case 'addMembers':
        return <UsersIcon className="w-4 h-4 text-[#800020]" />;
      case 'manageEvents':
        return <Calendar className="w-4 h-4 text-[#002B7F]" />;
      case 'manageDisciplinary':
        return <ShieldAlert className="w-4 h-4 text-[#800020]" />;
      case 'manageSettings':
        return <Settings className="w-4 h-4 text-slate-700" />;
      default:
        return <Key className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Governance Exemption Jurisdiction Notice */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-[#002B7F] shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Governance Jurisdictions & Duty Exemptions</span>
              <span className="bg-blue-100 text-[#002B7F] border border-blue-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                Exempt Overseers
              </span>
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              <strong className="text-[#002B7F]">Superadmin:</strong> Only administers portal-level operations (organisation management, multi-crew billing, portal permissions). Exempt from local crew assembly attendance, council role assignments, and syllabus work.<br />
              <strong className="text-[#800020]">Rover Advisor:</strong> Manages organisation-level governance (crew setup, executive overrides, council supervision). Exempt from local crew assembly attendance obligations and candidate syllabus badge completion.
            </p>
          </div>
        </div>
      </div>

      {/* 1. SECTION HEADER & ROLE MANAGEMENT */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#002B7F]" />
              <h3 className="text-base font-bold text-slate-900">
                Council Member Settings & Role Permissions
              </h3>
              <span className="bg-emerald-50 text-[#006B3F] border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                RBAC Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Define council positions, assign permissions (who gets to create syllabus, add members, monitor progress, assign courses, manage events, etc.), and allocate roles to members.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCreateRole}
              className="bg-[#002B7F] hover:bg-blue-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
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
                    ? 'bg-blue-50 border-[#002B7F] shadow-xs ring-1 ring-[#002B7F]/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{roleName}</span>
                    <span className="text-[10px] text-[#006B3F] font-mono font-semibold">
                      {assignedMembers.length} {assignedMembers.length === 1 ? 'member' : 'members'} assigned
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRole(index, roleName);
                      }}
                      className="p-1 text-slate-400 hover:text-[#002B7F] hover:bg-slate-100 rounded transition cursor-pointer"
                      title="Edit Position Name"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRole(index, roleName);
                      }}
                      className="p-1 text-slate-400 hover:text-[#800020] hover:bg-slate-100 rounded transition cursor-pointer"
                      title="Delete Position"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-200">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Key className="w-3 h-3 text-[#002B7F]" />
                    {activePermsCount} of {PERMISSIONS_LIST.length} capabilities
                  </span>
                  <span className={`font-semibold ${isSelected ? 'text-[#002B7F]' : 'text-slate-400'}`}>
                    {isSelected ? 'Active Filter' : 'Click to inspect'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CAPABILITIES PERMISSION MATRIX BY COUNCIL ROLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-[#002B7F]" />
              <h3 className="text-base font-bold text-slate-900">
                Council Role Permission Matrix
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure fine-grained permissions for <strong className="text-[#002B7F] font-mono">{selectedRoleForMatrix}</strong>. Members in this role inherit these permissions automatically.
            </p>
          </div>

          {/* Matrix Actions */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => handleGrantAll(selectedRoleForMatrix)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#006B3F] font-semibold transition border border-slate-200 cursor-pointer"
            >
              Grant All Capabilities
            </button>
            <button
              onClick={() => handleResetDefaults(selectedRoleForMatrix)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold transition border border-slate-200 cursor-pointer"
            >
              Reset to Role Defaults
            </button>
            <button
              onClick={() => setMatrixViewMode(matrixViewMode === 'full' ? 'single' : 'full')}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#002B7F] font-semibold transition border border-slate-200 cursor-pointer"
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
                    ? 'bg-blue-50/60 border-blue-300 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                      {getPermIcon(perm.key)}
                      <span>{perm.label}</span>
                    </div>

                    {/* Toggle Switch UI */}
                    <div
                      className={`w-9 h-5 rounded-full flex items-center p-0.5 transition ${
                        isEnabled ? 'bg-[#002B7F] justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform" />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    {perm.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 uppercase font-mono tracking-wider">{perm.category}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded font-mono ${
                      isEnabled
                        ? 'bg-blue-100 text-[#002B7F] border border-blue-200'
                        : 'bg-slate-200 text-slate-600'
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
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-[#002B7F]" />
              Complete Council Capability Overview Matrix
            </h4>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-mono text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Council Position</th>
                    {PERMISSIONS_LIST.map((p) => (
                      <th key={p.key} className="py-2.5 px-2 text-center" title={p.description}>
                        {p.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {councilPositions.map((role) => {
                    const rolePerms = getRolePermissions(role);
                    const isCurrentFilter = role === selectedRoleForMatrix;

                    return (
                      <tr
                        key={role}
                        onClick={() => setSelectedRoleForMatrix(role)}
                        className={`hover:bg-slate-50 cursor-pointer transition ${
                          isCurrentFilter ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {role}
                          {isCurrentFilter && (
                            <span className="ml-2 text-[10px] text-[#002B7F] font-mono">(Editing)</span>
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
                                className={`p-1 rounded transition cursor-pointer ${
                                  has
                                    ? 'text-[#006B3F] hover:bg-emerald-50'
                                    : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                                }`}
                                title={`Toggle ${p.label} for ${role}`}
                              >
                                {has ? (
                                  <CheckCircle2 className="w-4 h-4 inline-block text-[#006B3F]" />
                                ) : (
                                  <XCircle className="w-4 h-4 inline-block opacity-40 text-slate-400" />
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
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#002B7F]" />
              <h3 className="text-base font-bold text-slate-900">
                Assign Council Roles & Active Capabilities to Members
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select who holds each Council position. Assigned members inherit capability permissions immediately.
            </p>
          </div>

          {/* Search & Crew Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search member name..."
                value={assignmentSearch}
                onChange={(e) => setAssignmentSearch(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs"
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
                  className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:border-slate-300 transition"
                >
                  {/* Left Member Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-xs text-[#002B7F] flex-shrink-0 shadow-xs">
                      {m.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-2">
                        <span>{m.name}</span>
                        {isCouncil ? (
                          <span className="bg-blue-100 text-[#002B7F] border border-blue-200 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                            {m.councilRole}
                          </span>
                        ) : (
                          <span className="bg-slate-200 text-slate-600 text-[9px] font-medium px-1.5 py-0.2 rounded">
                            General Member
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {m.section} • {m.crewName} • ID: <span className="font-mono text-slate-700">{m.idCard}</span>
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
                            className="bg-emerald-50 text-[#006B3F] border border-emerald-200 text-[9px] font-semibold px-2 py-0.5 rounded-md font-mono"
                          >
                            ✓ {p.label}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Right Assign Role Selector */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-auto">
                    <span className="text-[10px] text-slate-500">Assigned Role:</span>
                    <select
                      value={m.councilRole}
                      onChange={(e) => handleAssignRole(m, e.target.value)}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 cursor-pointer shadow-xs"
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
