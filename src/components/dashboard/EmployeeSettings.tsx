import React, { useState } from 'react';
import { User as UserIcon, Lock, Mail, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { User } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface EmployeeSettingsProps {
  user: User;
  token: string;
}

export const EmployeeSettings: React.FC<EmployeeSettingsProps> = ({ user, token }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage('Profile updated successfully!');
        // Update local storage to persist name change if needed
        const savedUser = JSON.parse(localStorage.getItem('cm_user') || '{}');
        localStorage.setItem('cm_user', JSON.stringify({...savedUser, name: formData.name, email: formData.email}));
      } else {
        setStatus('error');
        setMessage(data.error || 'Update failed');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error');
    } finally {
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Personal Settings</h2>
        <p className="text-slate-500 font-medium">Manage your digital identity and security preferences.</p>
      </header>

      <form onSubmit={handleUpdate} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl">
               {formData.name[0]}
             </div>
             <div>
                <h3 className="font-bold text-slate-900">Profile Information</h3>
                <p className="text-xs text-slate-400 font-medium">Basic details visible to your administrator.</p>
             </div>
          </div>
          
          <div className="grid gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="text" 
                  className="w-full pl-12 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="email" 
                  className="w-full pl-12 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
               <Lock size={24} />
             </div>
             <div>
                <h3 className="font-bold text-slate-900">Password & Security</h3>
                <p className="text-xs text-slate-400 font-medium">Leave blank if you don't wish to change password.</p>
             </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">New Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                value={formData.newPassword}
                onChange={e => setFormData({...formData, newPassword: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Confirm Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <AnimatePresence>
            {status !== 'idle' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-center gap-2 text-sm font-bold ${status === 'success' ? 'text-emerald-500' : 'text-red-500'}`}
              >
                {status === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                {message}
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            type="submit"
            disabled={status === 'loading'}
            className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {status === 'loading' ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
            Save Transitions
          </button>
        </div>
      </form>
    </div>
  );
};
