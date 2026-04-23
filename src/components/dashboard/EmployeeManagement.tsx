/**
 * Component for managing the workforce.
 * Admins can view employees, invite new ones, and set hourly rates.
 */
import React, { useState, useEffect } from 'react';
import { Users, Search, ChevronRight, Loader2, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmployeeProfile } from './EmployeeProfile';

interface EmployeeManagementProps {
  token: string;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ token }) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: 'Password123!', role: 'Staff', hourly_rate: 25 });
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load the full employee directory for the company
  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } });
      const ct = res.headers.get('content-type');
      if (res.ok && ct && ct.includes('application/json')) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error('Fetch Employees Error:', err);
    }
  };

  useEffect(() => { fetchEmployees(); }, [token]);

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Handler to submit the 'Add Employee' form.
   */
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
        fetchEmployees();
        setFormData({ name: '', email: '', password: 'Password123!', role: 'Staff', hourly_rate: 25 });
        setTimeout(() => {
          setIsAdding(false);
          setSuccess(false);
        }, 2500);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to add employee.');
      }
    } catch (err) {
      console.error('Add Employee Error:', err);
      alert('A network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (selectedEmployeeId) {
    return (
      <EmployeeProfile 
        employeeId={selectedEmployeeId} 
        token={token} 
        onBack={() => setSelectedEmployeeId(null)} 
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header section with add button */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Workforce Directory</h2>
          <p className="text-slate-500 font-medium mt-1">Manage employee profiles, access roles, and hourly compensation.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search team..." 
              className="pl-10 p-2.5 bg-white border border-slate-200 rounded-xl text-sm w-64 focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 outline-none transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-bold shadow-xl shadow-brand-600/20 flex items-center gap-2 hover:bg-brand-700 transition-all border border-brand-600"
          >
            <Users size={16} /> Add Member
          </button>
        </div>
      </header>

      {/* Modal Overlay for Adding Employees */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 text-center"
                  >
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <CheckCircle2 size={40} />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mb-2">Member Registered!</h4>
                    <p className="text-slate-500 font-medium tracking-tight px-6">Their profile is now live and instructions have been sent to their email.</p>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Invite Member</h3>
                        <p className="text-slate-500 text-sm font-medium">Set up their core profile and pay rate.</p>
                      </div>
                      <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                        <X size={20} />
                      </button>
                    </div>
                    
                    <form onSubmit={handleAdd} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Full Name</label>
                        <input required type="text" className="w-full p-4 text-sm font-bold rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-brand-600 transition-all font-sans" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Email Address</label>
                        <input required type="email" className="w-full p-4 text-sm font-bold rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-brand-600 transition-all font-sans" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Initial Role</label>
                          <select className="w-full p-4 text-sm font-bold rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-brand-600 transition-all appearance-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                            <option value="Staff">Staff</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Rate / Hour ($)</label>
                          <input required type="number" step="0.5" className="w-full p-4 text-sm font-bold rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-brand-600 transition-all font-sans" value={formData.hourly_rate} onChange={e => setFormData({...formData, hourly_rate: Number(e.target.value)})} />
                        </div>
                      </div>
                      
                      <div className="flex gap-3 mt-10">
                        <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                        <button 
                          type="submit" 
                          disabled={submitting}
                          className="flex-1 py-4 bg-brand-600 text-white rounded-xl font-bold shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all border border-brand-600 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Create Profile'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((emp, i) => (
          <div 
            key={emp._id || i} 
            onClick={() => setSelectedEmployeeId(emp._id)}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:-translate-y-1 hover:border-brand-600/30 transition-all flex flex-col cursor-pointer"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xl text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 border border-slate-200 transition-all">
                {emp.name[0]}
              </div>
              <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${emp.role === 'Admin' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                {emp.role}
              </div>
            </div>
            
            <h4 className="text-lg font-bold text-slate-900 tracking-tight mb-0.5 group-hover:text-brand-600 transition-colors font-sans">{emp.name}</h4>
            <div className="text-xs text-slate-400 mb-8 font-medium truncate font-sans">{emp.email}</div>

            <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-50 font-sans">
              <div>
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-0.5">Pay / hr</div>
                <div className="text-lg font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors font-sans">${emp.hourly_rate.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2 text-brand-600 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity font-sans">
                View Profile <ChevronRight size={14} />
              </div>
            </div>
          </div>
        ))}
        {filteredEmployees.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100 text-center text-slate-400 font-sans">
            No team members found in the directory.
          </div>
        )}
      </div>
    </div>
  );
};
