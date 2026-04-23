/**
 * Company Registration view.
 * Allows new organizations to create an account and their initial admin profile.
 */
import React, { useState } from 'react';
import { ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { PublicFooter } from '../components/public/PublicFooter';

interface RegisterViewProps {
  onBack: () => void;
  onRegistered: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onBack, onRegistered }) => {
  // Local state for organization and admin details
  const [formData, setFormData] = useState({ name: '', email: '', password: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Submission handler for the registration form.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/register-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setLoading(false);
      
      if (data.success) {
        onRegistered(); // Trigger redirect to login view
      } else {
        setError(data.error);
      }
    } catch (err) {
      setLoading(false);
      setError('Registration failed. Please check your connection.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <main className="flex-grow flex items-center justify-center py-20 px-6">
        <div className="max-w-md w-full">
          {/* Brand Reset Button */}
          <div className="flex justify-center mb-8">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 hover:scale-110 transition-transform cursor-pointer"
            >
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
                <Clock className="text-white" size={24} />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">ClockMate</span>
            </button>
          </div>

          {/* Navigation: Back to Landing */}
          <button onClick={onBack} className="text-slate-500 mb-8 hover:text-slate-900 flex items-center gap-1 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to home
          </button>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300">
            <h2 className="text-2xl font-bold mb-2 text-slate-900">Register Company</h2>
            <p className="text-slate-500 mb-8 font-medium">Setup your organization and admin account.</p>
            
            {/* Error Feedback */}
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg mb-6 text-sm flex items-center gap-2 border border-red-200"><AlertCircle size={16}/> {error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Company Name</label>
                <input required type="text" className="w-full p-4 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:bg-white transition-all text-slate-900" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Work Address</label>
                <input required type="text" className="w-full p-4 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:bg-white transition-all text-slate-900" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Admin Email</label>
                <input required type="email" className="w-full p-4 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:bg-white transition-all text-slate-900" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Password</label>
                <input required type="password" title="At least 8 characters" className="w-full p-4 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:bg-white transition-all text-slate-900" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <button disabled={loading} type="submit" className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold mt-4 hover:bg-brand-700 shadow-lg shadow-brand-600/10 transition-all disabled:opacity-50">
                {loading ? 'Creating...' : 'Register Organization'}
              </button>
            </form>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};
