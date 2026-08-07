import React, { useState } from 'react';
import { Member, PortalSettings } from '../types';
import { UserSwitcher } from './UserSwitcher';
import {
  LayoutDashboard,
  Users,
  Award,
  BookOpen,
  Calendar,
  CheckSquare,
  ShieldAlert,
  Settings,
  Compass,
  Sparkles,
  Sun,
  Moon,
  ShieldCheck,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Lock,
  FileText,
  MapPin,
} from 'lucide-react';
import { hasPermission } from '../utils/permissions';

import { Crown, LogOut, LogIn } from 'lucide-react';

export type TabType =
  | 'superadmin'
  | 'dashboard'
  | 'members'
  | 'syllabus'
  | 'journals'
  | 'events'
  | 'attendance'
  | 'minutes'
  | 'policy'
  | 'disciplinary'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentMember: Member | null;
  allMembers?: Member[];
  onSelectMember?: (member: Member) => void;
  onLogout?: () => void;
  onOpenLoginModal?: () => void;
  onOpenOrgSignup?: () => void;
  settings?: PortalSettings;
  unresolvedIncidentsCount?: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentMember,
  allMembers = [],
  onSelectMember = (_m: Member) => {},
  onLogout,
  onOpenLoginModal,
  onOpenOrgSignup,
  settings = { aiEnabled: true, smsNotificationsEnabled: true, emailNotificationsEnabled: true, activeTerm: '1' },
  theme = 'dark',
  onToggleTheme,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  const isSuperAdmin = currentMember?.isSuperAdmin || currentMember?.councilRole === 'Superadmin';
  const isAdvisor = currentMember?.councilRole === 'Rover Advisor';
  const isCouncil = !!currentMember && currentMember.councilRole !== 'Member';
  const canAccessDisciplinary = currentMember ? hasPermission(currentMember, 'manageDisciplinary', settings) : false;

  interface NavItem {
    id: TabType;
    label: string;
    icon: React.ReactNode;
    category: 'Main' | 'Operations' | 'System';
    badge?: string;
    restricted?: boolean;
  }

  const navItems: NavItem[] = [
    ...(isSuperAdmin
      ? [{ id: 'superadmin' as TabType, label: 'Superadmin Console', icon: <ShieldCheck className="w-5 h-5 text-purple-400" />, category: 'Main' as const, badge: 'Portal Admin' }]
      : []),
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" />, category: 'Main' },
    { id: 'members', label: 'Members Directory', icon: <Users className="w-5 h-5" />, category: 'Main' },
    { id: 'syllabus', label: 'Awards & Syllabus', icon: <Award className="w-5 h-5" />, category: 'Main' },
    { id: 'journals', label: 'Portfolio Notebook', icon: <BookOpen className="w-5 h-5" />, category: 'Main', badge: settings?.aiEnabled ? 'AI' : undefined },
    { id: 'events', label: 'Events & Calendar', icon: <Calendar className="w-5 h-5" />, category: 'Operations' },
    { id: 'attendance', label: 'Attendance Portal', icon: <CheckSquare className="w-5 h-5" />, category: 'Operations' },
    { id: 'minutes', label: 'Meeting Minutes', icon: <FileText className="w-5 h-5" />, category: 'Operations' },
    { id: 'policy', label: 'Operating Policy & Polls', icon: <Vote className="w-5 h-5 text-amber-400" />, category: 'Operations' },
    ...(isCouncil ? [{ id: 'disciplinary' as TabType, label: 'Disciplinary Log', icon: <ShieldAlert className="w-5 h-5" />, category: 'Operations' as const, restricted: true }] : []),
    { id: 'settings', label: isCouncil ? 'Crew & Council Settings' : 'Personal Settings', icon: <Settings className="w-5 h-5" />, category: 'System' },
  ];

  const categories = ['Main', 'Operations', 'System'] as const;

  const handleNavClick = (item: NavItem) => {
    if (item.restricted && !canAccessDisciplinary) {
      alert('Access Restricted: Disciplinary Action log is accessible only to Council members with Disciplinary permission.');
      return;
    }
    setActiveTab(item.id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Header Bar with Hamburger */}
      <div className="lg:hidden bg-[#161920] border-b border-slate-800 p-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl"
            aria-label="Open Sidebar Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm text-emerald-400">Arabiyya Rovers</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <UserSwitcher
            currentMember={currentMember}
            allMembers={allMembers}
            onSelectMember={onSelectMember}
          />
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-[#161920] border-r border-slate-800 text-slate-200 flex flex-col transition-all duration-300 shadow-xl ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-md border border-emerald-500/30 flex-shrink-0">
              <Compass className="w-6 h-6 text-emerald-100" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0">
                <h1 className="font-bold text-sm text-emerald-400 truncate leading-tight">
                  Arabiyya Rovers
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-400 font-mono">Term {settings?.activeTerm || '1'}</span>
                  {isAdvisor ? (
                    <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono flex items-center gap-0.5">
                      <Crown className="w-2.5 h-2.5 text-purple-300" />
                      Rover Advisor
                    </span>
                  ) : isCouncil ? (
                    <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5 text-amber-400" />
                      Council
                    </span>
                  ) : (
                    <span className="bg-sky-500/10 text-sky-300 border border-sky-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                      Member
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Persona Switcher Section */}
        <div className="p-3 border-b border-slate-800 bg-[#12151B]">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 px-1 flex items-center justify-between">
            {(!isCollapsed || isMobileOpen) && <span>Logged Persona</span>}
          </div>
          <UserSwitcher
            currentMember={currentMember}
            allMembers={allMembers}
            onSelectMember={onSelectMember}
            onLogout={onLogout}
            onOpenLoginModal={onOpenLoginModal}
          />
        </div>

        {/* Navigation Categories & Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 no-scrollbar">
          {categories.map((cat) => {
            const catItems = navItems.filter((item) => item.category === cat);
            return (
              <div key={cat} className="space-y-1">
                {(!isCollapsed || isMobileOpen) && (
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-1.5">
                    {cat}
                  </div>
                )}

                {catItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const isRestrictedDisabled = item.restricted && !canAccessDisciplinary;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item)}
                      title={isCollapsed && !isMobileOpen ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition group relative ${
                        isActive
                          ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                          : isRestrictedDisabled
                          ? 'text-slate-500 hover:bg-slate-800/40 cursor-not-allowed opacity-75'
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                      }`}
                    >
                      <span className={isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}>
                        {item.icon}
                      </span>

                      {(!isCollapsed || isMobileOpen) && (
                        <span className="flex-1 text-left truncate">{item.label}</span>
                      )}

                      {(!isCollapsed || isMobileOpen) && item.badge && (
                        <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                          {item.badge}
                        </span>
                      )}

                      {item.restricted && (
                        <Lock className="w-3.5 h-3.5 text-amber-500/80 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer: Theme & AI Status */}
        <div className="p-3 border-t border-slate-800 bg-[#12151B] space-y-2">
          {settings?.aiEnabled && (!isCollapsed || isMobileOpen) && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] p-2 rounded-xl font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse flex-shrink-0" />
              <span className="truncate">AI Polish Active</span>
            </div>
          )}

          {currentMember && onLogout ? (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 p-2 rounded-xl transition text-xs font-semibold"
              title="Log out of current portal session"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              {(!isCollapsed || isMobileOpen) && <span>Log Out Session</span>}
            </button>
          ) : !currentMember && onOpenLoginModal ? (
            <button
              onClick={onOpenLoginModal}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold p-2 rounded-xl transition text-xs"
            >
              <LogIn className="w-4 h-4" />
              {(!isCollapsed || isMobileOpen) && <span>Log In Portal</span>}
            </button>
          ) : null}

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="w-full flex items-center justify-center gap-2 bg-[#1A1E26] hover:bg-slate-800 text-slate-300 border border-slate-800 p-2 rounded-xl transition text-xs font-semibold"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  {(!isCollapsed || isMobileOpen) && <span>Light Mode</span>}
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-400" />
                  {(!isCollapsed || isMobileOpen) && <span>Dark Mode</span>}
                </>
              )}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
