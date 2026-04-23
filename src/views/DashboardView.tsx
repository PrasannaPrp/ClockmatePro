/**
 * Main application dashboard view.
 * Dynamically renders different tabs (Home, Employees, Payroll)
 * and adapts content based on the user's role (Admin vs Staff).
 */
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Users, MapPin, AlertCircle, Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { User, Stat } from '../types';
import { Sidebar } from '../components/dashboard/Sidebar';
import { StatCard } from '../components/ui/StatCard';
import { EmployeeActions } from '../components/dashboard/EmployeeActions';
import { AdminLiveFeed } from '../components/dashboard/AdminLiveFeed';
import { EmployeeManagement } from '../components/dashboard/EmployeeManagement';
import { PayrollManagement } from '../components/dashboard/PayrollManagement';
import { CompanySettings } from '../components/dashboard/CompanySettings';
import { ShiftScheduling } from '../components/dashboard/ShiftScheduling';
import { LaborAnalytics } from '../components/dashboard/LaborAnalytics';
import { EmployeeSettings } from '../components/dashboard/EmployeeSettings';
import { TimeApproval } from '../components/dashboard/TimeApproval';
import { motion, AnimatePresence } from 'motion/react';
import { PublicHeader } from '../components/public/PublicHeader';

interface DashboardViewProps {
  user: User;
  token: string;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, token, onLogout }) => {
  // Navigation state for the internal dashboard tabs
  const [activeTab, setActiveTab] = useState<'home' | 'employees' | 'approvals' | 'payroll' | 'settings' | 'schedules' | 'history'>('home');
  const [stats, setStats] = useState<Stat | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [companyName, setCompanyName] = useState('');

  // Fetch aggregate company stats on mount or when token changes
  useEffect(() => {
    fetch('/api/dashboard/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(async res => {
      const ct = res.headers.get('content-type');
      if (res.ok && ct && ct.includes('application/json')) {
        return res.json();
      }
      return null;
    })
    .then(data => {
      if (data) setStats(data);
    })
    .catch(err => console.error("Dashboard stats fetch failed:", err));
  }, [token]);

  // Poll pending approvals count every 60s so the badge stays live
  useEffect(() => {
    if (user.role !== 'Admin') return;
    const fetchPending = async () => {
      try {
        const res = await fetch('/api/attendance/approve', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          const count = data.records.filter((r: any) => r.approval_status === 'Pending').length;
          setPendingApprovals(count);
        }
      } catch {}
    };
    fetchPending();
    const interval = setInterval(fetchPending, 60000);
    return () => clearInterval(interval);
  }, [token, user.role]);

  // Fetch company branding for the portal header
  useEffect(() => {
    fetch('/api/company/settings', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.company) {
        setCompanyName(data.company.name);
      }
    });
  }, [token]);

  /**
   * Navigate to the payroll tab.
   */
  const handleGeneratePayroll = () => {
    setActiveTab('payroll');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <PublicHeader 
        companyName={companyName} 
        userName={user.name} 
        onLogout={onLogout} 
      />
      <div className="flex flex-1 font-sans text-slate-900 relative overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ x: -200 }}
                animate={{ x: 0 }}
                exit={{ x: -200 }}
                className="absolute inset-y-0 left-0 w-64 bg-white shadow-2xl"
              >
                <Sidebar 
                  user={user} 
                  activeTab={activeTab} 
                  onTabChange={setActiveTab} 
                  onLogout={onLogout} 
                  onClose={() => setIsSidebarOpen(false)}
                  pendingApprovals={pendingApprovals}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 border-r border-slate-200 bg-white shadow-sm">
          <Sidebar 
            user={user} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            onLogout={onLogout}
            pendingApprovals={pendingApprovals}
          />
        </div>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Sub-header for navigation context */}
          <div className="h-14 bg-white/50 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 z-20">
            <div className="flex items-center gap-4 text-sm">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 uppercase tracking-[0.1em] text-[10px] bg-slate-200/50 px-3 py-1 rounded-full">
                  {activeTab === 'home' ? (user.role === 'Admin' ? 'Management Overview' : 'Punch Clock') : activeTab === 'employees' ? 'Company Workforce' : activeTab === 'approvals' ? 'Shift Approvals' : activeTab === 'payroll' ? 'Payroll Management' : activeTab === 'schedules' ? 'Shift Scheduling' : activeTab === 'history' ? 'My Attendance' : 'System Settings'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {user.role === 'Admin' && activeTab === 'home' && (
                <button 
                  onClick={handleGeneratePayroll}
                  className="px-4 py-1.5 bg-brand-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-600/10 hover:bg-brand-700 transition-all border border-brand-600 hidden sm:block"
                >
                  Run Payroll
                </button>
              )}
              <div className="text-[10px] font-black text-slate-400 hidden sm:block uppercase tracking-widest">
                {format(new Date(), 'MMM d, yyyy')}
              </div>
            </div>
          </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-auto p-8">
          {activeTab === 'home' && (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Stats Grid */}
              {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <StatCard label="Total Staff" value={stats.totalEmployees} icon={<Users className="text-brand-600"/>} trend="+2 new" />
                  <StatCard label="Active Today" value={stats.activeToday} icon={<MapPin className="text-emerald-500"/>} trend="95% capacity" />
                  <StatCard label="Pending Approval" value={stats.pendingApprovals} icon={<AlertCircle className="text-amber-500"/>} trend="Needs review" />
                </div>
              )}

              {/* Conditional Main Feature based on Role */}
              <div className="grid grid-cols-1 gap-8">
                {user.role === 'Staff' ? (
                  <EmployeeActions token={token} />
                ) : (
                  <>
                    <LaborAnalytics token={token} />
                    <AdminLiveFeed token={token} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Employee Management Tab (Admin Only via Sidebar constraints) */}
          {activeTab === 'employees' && <EmployeeManagement token={token} />}
          
          {/* Shift Approvals Tab (Admin Only) */}
          {activeTab === 'approvals' && user.role === 'Admin' && (
            <TimeApproval token={token} />
          )}

          {/* Personal Timesheet Tab (Staff Dashboard or Admin Personal) */}
          {activeTab === 'history' && <EmployeeActions token={token} />}

          {/* Payroll Management Tab */}
          {activeTab === 'payroll' && <PayrollManagement token={token} user={user} />}

          {/* Shift Scheduling Tab */}
          {activeTab === 'schedules' && <ShiftScheduling token={token} user={user} />}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            user.role === 'Admin' ? (
              <CompanySettings token={token} user={user} />
            ) : (
              <EmployeeSettings token={token} user={user} />
            )
          )}
        </div>
      </main>
    </div>
  </div>
  );
};
