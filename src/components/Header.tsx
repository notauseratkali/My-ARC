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
  settings = { aiEnabled: true, smsNotificationsEnabled: true, emailNotificationsEnabled: true, activeTerm: '1' },
  theme = 'dark',
  onToggleTheme,
}) => {
  const isAdvisor = currentMember?.councilRole === 'Rover Advisor';
  const isCouncil = !!currentMember && currentMember.councilRole !== 'Member';

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
    <header className="bg-[#161920] border-b border-slate-800 text-slate-100 sticky top-0 z-30 backdrop-blur-md bg-opacity-95">
      {/* Top Branding Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#002B7F] via-[#800020] to-[#006B3F] flex items-center justify-center text-white shadow-md shadow-black/40 border border-[#FFC72C]/40 relative group">
            <Compass className="w-6 h-6 text-amber-300" />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FFC72C] border border-slate-900"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg bg-gradient-to-r from-amber-300 via-emerald-400 to-sky-400 bg-clip-text text-transparent tracking-tight leading-none">
                Arabiyya Rovers
              </h1>
              <span className="bg-[#002B7F]/30 text-amber-300 border border-[#FFC72C]/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                ASG • Term {settings?.activeTerm || '1'}
              </span>

              {/* Council vs Member Access Indicator Badge */}
              {isAdvisor ? (
                <span className="hidden sm:inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                  <Crown className="w-3 h-3 text-purple-300" />
                  <span>Rover Advisor • Supreme Admin</span>
                </span>
              ) : isCouncil ? (
                <span className="hidden sm:inline-flex items-center gap-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span>Council Admin Mode</span>
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 bg-sky-500/10 text-sky-300 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                  <User className="w-3 h-3 text-sky-400" />
                  <span>Personal Assigned View</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Rover Operating Policy • Explorers & Rovers Management System
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
              className="flex items-center gap-1.5 bg-[#1A1E26] hover:bg-slate-800 text-amber-400 border border-slate-800 hover:border-slate-700 text-xs px-2.5 py-1.5 rounded-lg transition font-medium shadow-sm"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline text-slate-300">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="hidden md:inline text-slate-700">Dark</span>
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
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-800 pt-1 pb-1">
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
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium transition whitespace-nowrap relative ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : isDisciplinaryDisabled
                    ? 'text-slate-500 hover:bg-slate-800/40 cursor-not-allowed opacity-75'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>

                {item.badge && (
                  <span className="bg-teal-900/80 text-teal-300 text-[9px] font-semibold px-1.5 py-0.2 rounded font-mono">
                    {item.badge}
                  </span>
                )}

                {item.restricted && (
                  <span title="Executive Council Restricted">
                    <Lock className="w-3 h-3 text-amber-500/80 inline ml-0.5" />
                  </span>
                )}

                {isActive && (
                  <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
