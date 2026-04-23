/**
 * User Login view with integrated Password Reset flow.
 * Authenticates users and handles 8-digit PIN recovery via Gmail SMTP.
 */
import React, { useState } from 'react';
import { ChevronRight, AlertCircle, Clock, ShieldCheck, Mail, ArrowRight, Lock } from 'lucide-react';
import { User } from '../types';
import { PublicFooter } from '../components/public/PublicFooter';

interface LoginViewProps {
  onBack: () => void;
  onLogin: (t: string, u: User) => void;
  onGoToRegister: () => void;
}

type ViewMode = 'login' | 'forgot' | 'reset-pin';

export const LoginView: React.FC<LoginViewProps> = ({ onBack, onLogin, onGoToRegister }) => {
  const [mode, setMode] = useState<ViewMode>('login');
  const [formData, setFormData] = useState({ email: '', password: '', pin: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) onLogin(data.token, data.user);
      else setError(data.error);
    } catch (err) {
      setLoading(false);
      setError('Connection failed. Please try again.');
    }
  };

  const handleRequestPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        setSuccessMsg("PIN sent! Check your Gmail.");
        setMode('reset-pin');
      } else setError(data.error);
    } catch (err) {
      setLoading(false);
      setError('Failed to send PIN.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          pin: formData.pin, 
          newPassword: formData.newPassword 
        })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        setSuccessMsg("Password updated! Please login.");
        setMode('login');
      } else setError(data.error);
    } catch (err) {
      setLoading(false);
      setError('Failed to reset password.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <main className="flex-grow flex items-center justify-center py-20 px-6">
        <div className="max-w-md w-full">
          <div className="flex justify-center mb-8">
            <button onClick={onBack} className="flex items-center gap-2 hover:scale-110 transition-transform">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
                <Clock className="text-white" size={24} />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">ClockMate</span>
            </button>
          </div>

          <button onClick={onBack} className="text-slate-500 mb-8 hover:text-slate-900 flex items-center gap-1 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to home
          </button>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            {mode === 'login' && (
              <>
                <h2 className="text-2xl font-bold mb-2 text-slate-900">Welcome back</h2>
                <p className="text-slate-500 mb-8 font-medium italic">Secure access to your workforce portal.</p>
                {successMsg && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg mb-6 text-sm border border-emerald-100">{successMsg}</div>}
                {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg mb-6 text-sm border border-red-100 flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email Address</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand-600/20 focus:bg-white focus:outline-none transition-all" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Password</label>
                       <button type="button" onClick={() => setMode('forgot')} className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline">Forgot?</button>
                    </div>
                    <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-4 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand-600/20 focus:bg-white focus:outline-none transition-all" />
                  </div>
                  <button disabled={loading} type="submit" className="w-full py-4 bg-brand-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all flex items-center justify-center gap-2">
                    {loading ? 'Verifying...' : <>Sign In <ArrowRight size={16}/></>}
                  </button>
                </form>
              </>
            )}

            {mode === 'forgot' && (
              <>
                <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center mb-6 border border-brand-100">
                   <ShieldCheck size={24} />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-slate-900">Forgot Password</h2>
                <p className="text-slate-500 mb-8 font-medium italic">Enter your account email to receive an 8-digit security PIN.</p>
                {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg mb-6 text-sm"><AlertCircle size={14} className="inline mr-2"/>{error}</div>}
                
                <form onSubmit={handleRequestPin} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Registration Email</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none" />
                  </div>
                  <button disabled={loading} type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                    {loading ? 'Sending...' : <>Request Reset PIN <Mail size={16}/></>}
                  </button>
                  <button type="button" onClick={() => setMode('login')} className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors py-2">Back to login</button>
                </form>
              </>
            )}

            {mode === 'reset-pin' && (
              <>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6 border border-amber-100">
                   <Lock size={24} />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-slate-900">Enter Security PIN</h2>
                <p className="text-slate-500 mb-8 font-medium italic">Submit the 8-digit code sent to your Gmail.</p>
                {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg mb-6 text-sm border border-red-100">{error}</div>}
                
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">8-Digit PIN</label>
                    <input required type="text" maxLength={8} value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} className="w-full p-4 text-center text-lg font-black tracking-[0.5em] bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-600 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">New Secure Password</label>
                    <input required type="password" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} className="w-full p-4 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none" />
                  </div>
                  <button disabled={loading} type="submit" className="w-full py-4 bg-brand-600 text-white rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                    {loading ? 'Resetting...' : 'Change Password'}
                  </button>
                  <button type="button" onClick={() => setMode('forgot')} className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors py-2">Resend PIN</button>
                </form>
              </>
            )}

            {mode === 'login' && (
              <p className="mt-8 text-center text-sm text-slate-500 font-medium italic">
                New to ClockMate? <button onClick={onGoToRegister} className="text-brand-600 font-bold hover:underline italic">Register company</button>
              </p>
            )}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};
