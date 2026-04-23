import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Mail, Clock, CreditCard, Calendar, MapPin, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmployeeProfileProps {
  employeeId: string;
  token: string;
  onBack: () => void;
}

export const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ employeeId, token, onBack }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    hourly_rate: 0,
    status: 'Active'
  });

  const fetchProfile = () => {
    setLoading(true);
    fetch(`/api/employees/${employeeId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        setData(res);
        setEditForm({
          name: res.employee.name,
          email: res.employee.email,
          hourly_rate: res.employee.hourly_rate,
          status: res.employee.status || 'Active'
        });
      }
    })
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, [employeeId, token]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(editForm)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsEditing(false);
        fetchProfile();
      } else {
        alert(data.error || 'Failed to update employee profile.');
      }
    } catch (err: any) {
      console.error('Update failed:', err);
      alert('A network error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = data.employee.status === 'Active' ? 'Suspended' : 'Active';
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const resData = await res.json();
      
      if (res.ok) {
        fetchProfile();
      } else {
        alert(resData.error || 'Failed to change employee status.');
      }
    } catch (err) {
      console.error('Status toggle failed:', err);
      alert('A network error occurred while toggling status.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-brand-600" size={48} />
      </div>
    );
  }

  if (!data) return <div className="p-20 text-center text-slate-500">Employee data not found.</div>;

  const { employee, attendance, payrollHistory } = data;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-6xl mx-auto space-y-10 pb-20"
    >
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all font-bold text-sm"
        >
          <ArrowLeft size={18} /> Back to Team
        </button>
        <div className="flex items-center gap-2">
           <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${employee.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
             {employee.status}
           </span>
        </div>
      </div>

      {/* Hero Profile Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row items-center gap-10">
        <div className="w-32 h-32 rounded-3xl bg-slate-900 text-white flex items-center justify-center font-black text-5xl shadow-2xl shadow-slate-900/20">
          {employee.name[0]}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{employee.name}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-6 text-slate-500 font-medium">
             <div className="flex items-center gap-2"><Mail size={16} className="text-brand-600"/> {employee.email}</div>
             <div className="flex items-center gap-2"><TrendingUp size={16} className="text-emerald-500"/> ${employee.hourly_rate.toFixed(2)} / hour</div>
             <div className="flex items-center gap-2"><Calendar size={16} className="text-brand-600"/> Joined {format(new Date(employee.created_at), 'MMMM yyyy')}</div>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 bg-slate-100 text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-all border border-slate-200"
          >
            Edit Profile
          </button>
          <button 
            disabled={saving}
            onClick={handleStatusToggle}
            className={`px-6 py-3 rounded-xl font-bold transition-all border ${
              employee.status === 'Active' 
              ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' 
              : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
            }`}
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : (employee.status === 'Active' ? 'Suspend' : 'Activate')}
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200"
            >
              <h3 className="text-2xl font-black mb-1 text-slate-900">Update Profile</h3>
              <p className="text-slate-500 text-sm mb-8 font-medium">Modify employee information and pay rate.</p>
              
              <form onSubmit={handleUpdate} className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Full Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full p-4 text-sm font-bold rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 outline-none transition-all" 
                    value={editForm.name} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    className="w-full p-4 text-sm font-bold rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 outline-none transition-all" 
                    value={editForm.email} 
                    onChange={e => setEditForm({...editForm, email: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Hourly Rate ($)</label>
                  <input 
                    required
                    type="number" 
                    step="0.5" 
                    className="w-full p-4 text-sm font-bold rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 outline-none transition-all" 
                    value={editForm.hourly_rate} 
                    onChange={e => setEditForm({...editForm, hourly_rate: Number(e.target.value)})} 
                  />
                </div>
                
                <div className="flex gap-3 mt-10">
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)} 
                    className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="flex-1 py-4 bg-brand-600 text-white rounded-xl font-bold shadow-xl shadow-brand-600/20 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="animate-spin" size={18} />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Attendance Column */}
        <div className="lg:col-span-2 space-y-8">
           <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <Clock className="text-brand-600" size={24} /> Recent Attendance Logs
           </h3>
           <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Time</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {attendance.map((log: any, i: number) => (
                   <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-600">
                         {format(new Date(log.clock_in_time), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-sm font-bold text-slate-900">
                            {format(new Date(log.clock_in_time), 'HH:mm')} - {log.clock_out_time ? format(new Date(log.clock_out_time), 'HH:mm') : '--:--'}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${log.status === 'Valid' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {log.status}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                         {log.latitude ? (
                           <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                             <MapPin size={10} /> {log.latitude.toFixed(2)}, {log.longitude.toFixed(2)}
                           </div>
                         ) : '-'}
                      </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             {attendance.length === 0 && <div className="p-12 text-center text-slate-400 italic">No attendance records recorded yet.</div>}
           </div>
        </div>

        {/* Payroll History Column */}
        <div className="space-y-8">
           <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <CreditCard className="text-brand-600" size={24} /> Payout History
           </h3>
           <div className="space-y-4">
             {payrollHistory.map((pay: any, i: number) => (
               <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-brand-600 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       {format(new Date(pay.period_start), 'MMM d')} - {format(new Date(pay.period_end), 'MMM d')}
                     </div>
                     <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black">PAID</span>
                  </div>
                  <div className="flex justify-between items-end">
                     <div>
                        <div className="text-xs text-slate-500 font-medium">{pay.total_hours} Hours @ ${pay.hourly_rate}</div>
                        <div className="text-2xl font-black text-slate-900 tracking-tighter">${(pay.net_pay || 0).toFixed(2)}</div>
                     </div>
                     <div className="flex items-center gap-1 py-1 px-2 bg-red-50 text-red-600 rounded-lg text-[9px] font-bold">
                       <AlertTriangle size={10} /> -${(pay.tax || 0).toFixed(2)} Tax
                     </div>
                  </div>
               </div>
             ))}
             {payrollHistory.length === 0 && (
               <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-sm">
                 No payroll distributions found for this employee.
               </div>
             )}
           </div>
        </div>
      </div>
    </motion.div>
  );
};
