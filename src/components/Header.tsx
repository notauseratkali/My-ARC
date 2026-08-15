import React from 'react';
import { Member, PortalSettings } from '../types';
import { UserSwitcher } from './UserSwitcher';
import { FirebaseAuthModal } from './FirebaseAuthModal';
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
  Lock,
  Sun,
  Moon,
  ShieldCheck,
  User,
  FileText,
} from 'lucide-react';

import { Crown, LogOut, LogIn } from 'lucide-react';

export type TabType = 
  | 'dashboard' 
  | 'members' 
  | 'syllabus' 
  | 'journals' 
  | 'events' 
  | 'attendance' 
  | 'minutes'
  | 'disciplinary' 
  | 'settings';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentMember: Member | null;
  allMembers?: Member[];
  onSelectMember?: (member: Member) => void;
  onLogout?: () => void;
  onOpenLoginModal?: () => void;
  onClearLocalData?: () => void;
  settings?: PortalSettings;
  unresolvedIncidentsCount?: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentMember,
  allMembers = [],
  onSelectMember = (_m: Member) => {},
  onLogout,
  onOpenLoginModal,
  onClearLocalData,
  settings = { aiEnabled: true, smsNotificationsEnabled: true, emailNotificationsEnabled: true, activeTerm: '1' },
  theme = 'dark',
  onToggleTheme,
}) => {
  const isSuperAdmin = currentMember?.isSuperAdmin || currentMember?.councilRole === 'Superadmin';
  const isAdvisor = currentMember?.councilRole === 'Rover Advisor' && !isSuperAdmin;
  const isCouncil = !!currentMember && currentMember.councilRole !== 'Member' && !isSuperAdmin;

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string; restricted?: boolean }[] = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'members', label: 'Members Directory', icon: <Users className="w-4 h-4" /> },
    { id: 'syllabus', label: 'Awards & Syllabus', icon: <Award className="w-4 h-4" /> },
    { id: 'journals', label: 'Portfolio Notebook', icon: <BookOpen className="w-4 h-4" />, badge: settings?.aiEnabled ? 'AI Ready' : undefined },
    { id: 'events', label: 'Events & Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'attendance', label: 'Attendance', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'minutes', label: 'Meeting Minutes', icon: <FileText className="w-4 h-4" /> },
    ...(isCouncil ? [{ id: 'disciplinary' as TabType, label: 'Disciplinary Log', icon: <ShieldAlert className="w-4 h-4" />, restricted: true }] : []),
    { id: 'settings', label: isCouncil ? 'Crew Settings' : 'Personal Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-white border-b border-[#FFD0D0] text-slate-900 sticky top-0 z-30 backdrop-blur-md shadow-xs">
      {/* Top Branding Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#800000] via-[#800000] to-[#FF3333] text-white border border-[#FF3333]/40 flex items-center justify-center relative shadow-sm">
            <Compass className="w-6 h-6 text-white" />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3333] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF3333] border border-white"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-[#800000] tracking-tight leading-none">
                My Rovers
              </h1>
              {isSuperAdmin ? (
                <span className="bg-[#800000] text-white border border-[#800000] text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Crown className="w-3 h-3 text-white" />
                  <span>Superadmin</span>
                </span>
              ) : (
                <>
                  <span className="bg-[#FFF0F0] text-[#800000] border border-[#FFB3B3] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ASG • Term {settings?.activeTerm || '1'}
                  </span>

                  {/* Council vs Member Access Indicator Badge */}
                  {isAdvisor ? (
                    <span className="hidden sm:inline-flex items-center gap-1 bg-[#800000] text-white border border-[#800000] text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                      <Crown className="w-3 h-3 text-white" />
                      <span>Rover Advisor • Supreme Admin</span>
                    </span>
                  ) : isCouncil ? (
                    <span className="hidden sm:inline-flex items-center gap-1 bg-[#FFF0F0] text-[#800000] border border-[#FF9999] text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                      <ShieldCheck className="w-3 h-3 text-[#FF3333]" />
                      <span>Council Admin Mode</span>
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1 bg-[#FFF0F0] text-[#800000] border border-[#FFB3B3] text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                      <User className="w-3 h-3 text-[#800000]" />
                      <span>Personal Assigned View</span>
                    </span>
                  )}
                </>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {isSuperAdmin
                ? 'Portal Administration'
                : 'Rover Operating Policy • Explorers & Rovers Management System'}
            </p>
          </div>
        </div>

        {/* Theme Toggle, Firebase Auth & User Persona Switcher */}
        <div className="flex items-center gap-2.5">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              id="theme-toggle-btn"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="flex items-center gap-1.5 bg-[#FFF0F0] hover:bg-[#FFE5E5] text-[#800000] border border-[#FFB3B3] text-xs px-2.5 py-1.5 rounded-lg transition font-bold shadow-xs cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-[#FF3333]" />
                  <span className="hidden md:inline text-[#800000]">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#800000]" />
                  <span className="hidden md:inline text-[#800000]">Dark</span>
                </>
              )}
            </button>
          )}

          {/* Real Firebase Auth Dialog */}
          {currentMember && (
            <FirebaseAuthModal
              members={allMembers}
              currentMember={currentMember}
              onSelectMember={onSelectMember}
            />
          )}

          <UserSwitcher
            currentMember={currentMember}
            allMembers={allMembers}
            onSelectMember={onSelectMember}
            onLogout={onLogout}
            onOpenLoginModal={onOpenLoginModal}
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-[#FFD0D0] pt-1 pb-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isDisciplinaryDisabled = item.restricted && !isCouncil;

            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => {
                  if (isDisciplinaryDisabled) {
                    alert('Access Restricted: Disciplinary Action module is accessible exclusively to authorized Executive Council officers.');
                    return;
                  }
                  setActiveTab(item.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap relative cursor-pointer ${
                  isActive
                    ? 'bg-[#FFF0F0] text-[#800000] border border-[#FF9999] font-bold shadow-xs'
                    : isDisciplinaryDisabled
                    ? 'text-slate-400 hover:bg-slate-50 cursor-not-allowed opacity-60'
                    : 'text-slate-700 hover:bg-[#FFF0F0] hover:text-[#800000]'
                }`}
              >
                <span className={isActive ? 'text-[#800000]' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>

                {item.badge && (
                  <span className="bg-[#FF3333] text-white border border-[#FF3333] text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                    {item.badge}
                  </span>
                )}

                {item.restricted && (
                  <span title="Executive Council Restricted">
                    <Lock className="w-3 h-3 text-[#FF3333] inline ml-0.5" />
                  </span>
                )}

                {isActive && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#800000] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
