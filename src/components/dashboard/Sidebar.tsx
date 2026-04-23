/**
 * Persistent sidebar for dashboard navigation.
 * Includes branding, main links, and user profile/logout controls.
 */
import React from 'react';
import { Clock, Users, FileText, Settings, LogOut, Calendar, ShieldCheck, Activity } from 'lucide-react';
import { User } from '../../types';

// Sub-component for individual navigation links
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, badge }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all group ${
      active 
        ? 'bg-brand-50 text-brand-600 shadow-sm' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <span className={`${active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`}>{icon}</span>
    <span className="flex-1 text-left">{label}</span>
    {badge != null && badge > 0 && (
      <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
        {badge}
      </span>
    )}
  </button>
);

interface SidebarProps {
  user: User;
  activeTab: string;
  onTabChange: (tab: any) => void;
  onLogout: () => void;
  onClose?: () => void;
  pendingApprovals?: number;
  companyName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, onTabChange, onLogout, onClose, pendingApprovals, companyName }) => {
  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    if (onClose) onClose();
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Brand Header */}
      <div 
        onClick={() => { handleTabClick('home'); }}
        className="p-6 border-b border-slate-100 cursor-pointer group hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm shadow-brand-600/30 group-hover:scale-110 transition-transform">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 truncate">
            {companyName || 'ClockMate'}
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        <NavItem 
          icon={<Clock size={20}/>} 
          label="Punch Clock" 
          active={activeTab === 'home'} 
          onClick={() => handleTabClick('home')} 
        />
        {user.role === 'Admin' && (
          <NavItem 
            icon={<Activity size={20}/>} 
            label="Overview" 
            active={activeTab === 'overview'} 
            onClick={() => handleTabClick('overview')} 
          />
        )}

        {user.role === 'Admin' && (
          <NavItem 
            icon={<Users size={20}/>} 
            label="Team" 
            active={activeTab === 'employees'} 
            onClick={() => handleTabClick('employees')} 
          />
        )}
        {user.role === 'Admin' && (
          <NavItem 
            icon={<ShieldCheck size={20}/>} 
            label="Approvals" 
            active={activeTab === 'approvals'} 
            onClick={() => handleTabClick('approvals')}
            badge={pendingApprovals}
          />
        )}
        <NavItem 
          icon={<FileText size={20}/>} 
          label="Payroll" 
          active={activeTab === 'payroll'} 
          onClick={() => handleTabClick('payroll')} 
        />
        <NavItem 
          icon={<Calendar size={20}/>} 
          label="Schedules" 
          active={activeTab === 'schedules'} 
          onClick={() => handleTabClick('schedules')} 
        />
        <NavItem 
          icon={<Settings size={20}/>} 
          label="Settings" 
          active={activeTab === 'settings'} 
          onClick={() => handleTabClick('settings')} 
        />
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-brand-600 flex items-center justify-center font-bold border border-slate-200">
            {user.name[0]}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{user.name}</div>
            <div className="text-xs text-slate-500 font-medium">{user.role}</div>
          </div>
        </div>
        <button 
          onClick={onLogout} 
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 font-medium hover:bg-red-50 hover:text-red-500 rounded-lg transition-all group"
        >
          <LogOut size={18} className="group-hover:translate-x-1 transition-transform" /> Sign Out
        </button>
      </div>
    </aside>
  );
};
