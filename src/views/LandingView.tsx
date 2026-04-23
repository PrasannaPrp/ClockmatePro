/**
 * Public landing page for ClockMate.
 * Highlights key value propositions and provides entry points for login/registration.
 */
import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { PublicFooter } from '../components/public/PublicFooter';
import { PublicHeader } from '../components/public/PublicHeader';

interface LandingViewProps {
  onJoin: () => void;
  onLogin: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onJoin, onLogin }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <PublicHeader onLogin={onLogin} />
      <main className="grid lg:grid-cols-2 flex-grow">
        {/* Left Column: Value Proposition and CTAs */}
        <div className="p-8 lg:p-24 flex flex-col justify-center bg-white shadow-xl z-20">
          <h1 className="text-6xl lg:text-7xl font-extrabold leading-none tracking-tighter mb-8 text-slate-900">
            Time tracking <br/><span className="text-brand-600">reimagined.</span>
          </h1>
          
          <p className="text-xl text-slate-500 mb-12 max-w-lg leading-relaxed text-slate-400 italic font-medium">
            ClockMate combines GPS geofencing, smart approvals, and instant exports so managers save hours and teams clock in without friction.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={onJoin}
              className="px-8 py-4 bg-brand-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-brand-700 shadow-md shadow-brand-600/20 transition-all font-black uppercase tracking-widest text-xs"
            >
              Start free <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={onLogin}
              className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-lg font-bold hover:bg-slate-50 transition-colors uppercase tracking-widest text-xs"
            >
              Login to dashboard
            </button>
          </div>

          {/* Hero Features / Trust Signals */}
          <div className="mt-24 grid grid-cols-2 sm:grid-cols-3 gap-8 pt-8 border-t border-slate-100">
            <div>
              <div className="text-2xl font-bold text-slate-900">99.8%</div>
              <div className="text-sm text-slate-500">Uptime guarantee</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">Secure</div>
              <div className="text-sm text-slate-500">AES-256 Encryption</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">4.9/5</div>
              <div className="text-sm text-slate-500">User rating</div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Component / Product Preview */}
        <div className="hidden lg:flex bg-slate-900 p-12 items-center justify-center relative overflow-hidden">
          {/* Abstract Background Effects */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px]" />
          </div>

          {/* Dashboard Preview UI */}
          <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Live Attendance</div>
                <div className="text-white flex items-center gap-2 font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  CleanPro HQ
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">18</div>
                <div className="text-xs text-slate-400">On-site now</div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { name: 'Sara Miller', status: 'On-site', time: '09:02', dist: '23m' },
                { name: 'Lee Chen', status: 'On-site', time: '08:59', dist: '18m' },
                { name: 'Maya Rose', status: 'Late', time: '09:18', dist: '2.1km', error: true },
              ].map((emp, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white/50">
                      {emp.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{emp.name}</div>
                      <div className="text-xs text-slate-400">{emp.time} • {emp.dist}</div>
                    </div>
                  </div>
                  <div className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase ${emp.error ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                    {emp.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};
