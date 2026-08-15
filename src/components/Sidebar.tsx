import React, { useState } from 'react';
import { Member, PortalSettings } from '../types';
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
  Building2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Lock,
  FileText,
  CreditCard,
  History,
  Crown,
  ShieldCheck,
  LogOut,
  LogIn,
  Vote,
} from 'lucide-react';
import { hasPermission } from '../utils/permissions';

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
  | 'payments'
  | 'disciplinary'
  | 'audit'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentMember: Member | null;
  allMembers?: Member[];
  onSelectMember?: (member: Member) => void;
  onLogout?: () => void;
  onOpenLoginModal?: () => void;
  settings?: PortalSettings;
  unresolvedIncidentsCount?: number;
  theme?: 'dark' | 'light';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentMember,
  onLogout,
  onOpenLoginModal,
  settings = { aiEnabled: true, smsNotificationsEnabled: true, emailNotificationsEnabled: true, activeTerm: '1' },
  theme = 'dark',
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  const isSuperAdmin = currentMember?.isSuperAdmin || currentMember?.councilRole === 'Superadmin';
  const isAdvisor = currentMember?.councilRole === 'Rover Advisor' && !isSuperAdmin;
  const isCouncil = !!currentMember && (currentMember.councilRole !== 'Member' || isSuperAdmin);
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
      ? [{ id: 'superadmin' as TabType, label: 'Organisation Directory', icon: <Building2 className="w-5 h-5 text-purple-600" />, category: 'Main' as const, badge: 'Portal Admin' }]
      : []),
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" />, category: 'Main' },
    { id: 'members', label: 'Members Directory', icon: <Users className="w-5 h-5" />, category: 'Main' },
    { id: 'syllabus', label: 'Awards & Syllabus', icon: <Award className="w-5 h-5" />, category: 'Main' },
    { id: 'journals', label: 'Portfolio Notebook', icon: <BookOpen className="w-5 h-5" />, category: 'Main', badge: settings?.aiEnabled ? 'AI' : undefined },
    { id: 'events', label: 'Events & Calendar', icon: <Calendar className="w-5 h-5" />, category: 'Operations' },
    { id: 'attendance', label: 'Attendance Portal', icon: <CheckSquare className="w-5 h-5" />, category: 'Operations' },
    { id: 'minutes', label: 'Meeting Minutes', icon: <FileText className="w-5 h-5" />, category: 'Operations' },
    { id: 'policy', label: 'Operating Policy & Polls', icon: <Vote className="w-5 h-5 text-amber-600" />, category: 'Operations' },
    { id: 'payments', label: 'Payments & Crew Dues', icon: <CreditCard className="w-5 h-5 text-emerald-600" />, category: 'Operations' },
    ...((isCouncil || isSuperAdmin)
      ? [
          { id: 'disciplinary' as TabType, label: 'Disciplinary Log', icon: <ShieldAlert className="w-5 h-5" />, category: 'Operations' as const, restricted: true },
          { id: 'audit' as TabType, label: 'Audit Trail & Logs', icon: <History className="w-5 h-5 text-indigo-600" />, category: 'Operations' as const },
        ]
      : []),
    { id: 'settings', label: (isCouncil || isSuperAdmin) ? 'Crew & Council Settings' : 'Personal Settings', icon: <Settings className="w-5 h-5" />, category: 'System' },
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
      <div className="lg:hidden bg-white border-b border-[#FFD0D0] p-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-slate-800 hover:text-[#800000] bg-[#FFF0F0] hover:bg-[#FFE5E5] rounded-xl transition cursor-pointer"
            aria-label="Open Sidebar Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#800000] via-[#800000] to-[#FF3333] flex items-center justify-center text-white shadow-xs">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-[#800000]">Meyvaa Portal</span>
          </div>
        </div>

        {currentMember && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-800 text-xs truncate max-w-[120px]">
              {currentMember.name.split(' ')[0]}
            </span>
            <span className="bg-[#FFF0F0] text-[#800000] border border-[#FFB3B3] text-[10px] font-bold px-1.5 py-0.5 rounded font-mono">
              {isSuperAdmin ? 'Admin' : currentMember.councilRole}
            </span>
          </div>
        )}
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white border-r border-[#FFD0D0] text-slate-800 flex flex-col transition-all duration-300 shadow-xs ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-4 border-b border-[#FFD0D0] flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#800000] via-[#800000] to-[#FF3333] text-white border border-[#FF3333]/40 flex items-center justify-center shadow-xs flex-shrink-0 relative">
              <Compass className="w-6 h-6 text-white" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0">
                <h1 className="font-bold text-sm text-[#800000] truncate leading-tight">
                  Meyvaa Portal
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isSuperAdmin ? (
                    <span className="bg-[#800000] text-white border border-[#800000] text-[9px] font-bold px-1.5 py-0.2 rounded font-mono flex items-center gap-0.5 !text-white">
                      <Crown className="w-2.5 h-2.5 text-white" />
                      <span className="text-white font-bold !text-white">Superadmin</span>
                    </span>
                  ) : (
                    <>
                      <span className="text-[10px] text-[#800000] font-mono font-semibold">ASG • Term {settings?.activeTerm || '1'}</span>
                      {isAdvisor ? (
                        <span className="bg-[#800000] text-white border border-[#800000] text-[9px] font-bold px-1.5 py-0.2 rounded font-mono flex items-center gap-0.5 !text-white">
                          <Crown className="w-2.5 h-2.5 text-white" />
                          <span className="text-white font-bold !text-white">Rover Advisor</span>
                        </span>
                      ) : isCouncil ? (
                        <span className="bg-[#FFF0F0] text-[#800000] border border-[#FF9999] text-[9px] font-bold px-1.5 py-0.2 rounded font-mono flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5 text-[#FF3333]" />
                          Council
                        </span>
                      ) : (
                        <span className="bg-[#FFF0F0] text-[#800000] border border-[#FFB3B3] text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                          Member
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-[#800000] hover:bg-[#FFF0F0] rounded-lg transition cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-[#800000] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Categories & Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 no-scrollbar">
          {categories.map((cat) => {
            const catItems = navItems.filter((item) => item.category === cat);
            return (
              <div key={cat} className="space-y-1">
                {(!isCollapsed || isMobileOpen) && (
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#800000]/70 px-2 mb-1">
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition group relative cursor-pointer ${
                        isActive
                          ? 'bg-[#FFF0F0] text-[#800000] border border-[#FF9999] shadow-2xs font-bold'
                          : isRestrictedDisabled
                          ? 'text-slate-400 hover:bg-slate-50 cursor-not-allowed opacity-60'
                          : 'text-slate-700 hover:bg-[#FFF0F0] hover:text-[#800000]'
                      }`}
                    >
                      <span className={isActive ? 'text-[#800000]' : 'text-slate-500 group-hover:text-[#800000]'}>
                        {item.icon}
                      </span>

                      {(!isCollapsed || isMobileOpen) && (
                        <span className="flex-1 text-left truncate">{item.label}</span>
                      )}

                      {(!isCollapsed || isMobileOpen) && item.badge && (
                        <span className="bg-[#FF3333] text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono border border-[#FF3333]">
                          {item.badge}
                        </span>
                      )}

                      {item.restricted && (
                        <Lock className="w-3.5 h-3.5 text-[#FF3333] flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Minimal Footer */}
        <div className="p-3 border-t border-[#FFD0D0] bg-white">
          {currentMember && onLogout ? (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 text-slate-700 hover:text-[#800000] hover:bg-[#FFF0F0] border border-[#FFD0D0] hover:border-[#FF9999] p-2 rounded-xl transition text-xs font-semibold cursor-pointer"
              title="Log out of current portal session"
            >
              <LogOut className="w-4 h-4 text-slate-500 group-hover:text-[#800000]" />
              {(!isCollapsed || isMobileOpen) && <span>Log Out Session</span>}
            </button>
          ) : !currentMember && onOpenLoginModal ? (
            <button
              onClick={onOpenLoginModal}
              className="w-full flex items-center justify-center gap-2 bg-[#800000] hover:bg-[#660000] text-white font-bold p-2 rounded-xl transition text-xs shadow-xs cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              {(!isCollapsed || isMobileOpen) && <span>Log In Portal</span>}
            </button>
          ) : null}
        </div>
      </aside>
    </>
  );
};
