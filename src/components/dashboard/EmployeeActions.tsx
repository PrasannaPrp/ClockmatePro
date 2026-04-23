/**
 * View for employees to perform daily attendance actions.
 * Features a large "Punch Clock" and a history of recent shifts.
 */
import React, { useState, useEffect } from 'react';
import { Clock, LogOut, Calendar, CheckCircle2, AlertCircle, Loader2, Smartphone, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface EmployeeActionsProps {
  token: string;
}

export const EmployeeActions: React.FC<EmployeeActionsProps> = ({ token }) => {
  // UI states for feedback and loading
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [nextShift, setNextShift] = useState<any>(null);

  // Retrieves attendance logs and upcoming shifts
  const fetchData = async () => {
    try {
      const [histRes, shiftRes] = await Promise.all([
        fetch('/api/attendance/history?personal=true', { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' }),
        fetch('/api/shifts', { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' })
      ]);
      
      const parseSafe = async (res: Response) => {
        const ct = res.headers.get('content-type');
        if (res.ok && ct && ct.includes('application/json')) return res.json();
        return null;
      };

      const histData = await parseSafe(histRes);
      if (histData) setHistory(Array.isArray(histData) ? histData : []);
      
      const shiftData = await parseSafe(shiftRes);
      if (shiftData) {
        const futureShifts = (shiftData.shifts || [])
          .filter((s: any) => new Date(s.start_time) > new Date())
          .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        
        if (futureShifts.length > 0) setNextShift(futureShifts[0]);
      }
    } catch (err) {
      console.error('Fetch Data Error:', err);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  /**
   * Robust cross-browser / mobile geolocation with 3-tier fallback:
   * 1. High-accuracy GPS (ideal — works on all modern mobile browsers)
   * 2. Standard accuracy (for desktops without GPS)
   * 3. IP-based fallback via ipapi.co (for Opera Mini, etc.)
   * Manual bypass is always available if all else fails.
   */
  const handleAction = async (type: 'clock-in' | 'clock-out', bypassGps = false) => {
    setStatus('loading');
    setErrorMessage('');
    
    try {
      let coords = { latitude: null as number | null, longitude: null as number | null };

      if (!bypassGps) {
        const geoSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

        if (geoSupported) {
          const getPos = (highAccuracy: boolean, timeout: number): Promise<GeolocationPosition> =>
            new Promise((res, rej) =>
              navigator.geolocation.getCurrentPosition(res, rej, {
                enableHighAccuracy: highAccuracy,
                timeout,
                maximumAge: 30000
              })
            );

          try {
            // Tier 1: High-accuracy (GPS chip on mobile, or fine location on desktop)
            const pos = await getPos(true, 8000);
            coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          } catch (err1: any) {
            if (err1.code === 1) {
              // Permission denied — show platform-specific guidance
              const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
              const isAndroid = /Android/.test(navigator.userAgent);
              if (isIOS) {
                throw new Error('Location denied. On iPhone: Settings → Privacy & Security → Location Services → Your Browser → While Using App.');
              } else if (isAndroid) {
                throw new Error('Location denied. On Android: tap the 🔒 lock icon in the address bar → Permissions → Location → Allow.');
              } else {
                throw new Error('Location denied. Click the 🔒 lock icon in the address bar and allow Location access.');
              }
            }
            try {
              // Tier 2: Standard accuracy (lower power, works on most desktops)
              const pos = await getPos(false, 12000);
              coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            } catch {
              // Tier 3: IP-based approximate location (works on Opera Mini, old browsers)
              try {
                const ipRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
                const ipData = await ipRes.json();
                if (ipData.latitude && ipData.longitude) {
                  coords = { latitude: ipData.latitude, longitude: ipData.longitude };
                  console.warn('📍 Using IP-based location (approximate). Accuracy ~1–5km.');
                } else {
                  throw new Error('GPS_ALL_FAILED');
                }
              } catch {
                throw new Error('Could not get your location via GPS or network. Use Manual Bypass to continue.');
              }
            }
          }
        } else {
          // Browser doesn't support geolocation at all (Opera Mini, very old browser)
          // Try IP fallback directly
          try {
            const ipRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
            const ipData = await ipRes.json();
            if (ipData.latitude) {
              coords = { latitude: ipData.latitude, longitude: ipData.longitude };
              console.warn('📍 GPS not supported. Using IP-based location (approximate).');
            } else {
              throw new Error('GPS_UNSUPPORTED');
            }
          } catch {
            throw new Error('Your browser does not support location. Use Manual Bypass.');
          }
        }
      }
      
      const res = await fetch(`/api/attendance/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ lat: coords.latitude, lng: coords.longitude })
      });
      
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (text.includes('Rate exceeded') || text.includes('Too many requests')) {
           data = { error: isClockedIn ? 'Punch out already recorded or in progress.' : 'Punch in already recorded or in progress.' };
        } else {
           data = { error: text || 'An unexpected error occurred' };
        }
      }
      
      if (res.ok) {
        setStatus('success');
        fetchData();
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        throw new Error(data.error || 'Server rejected the request');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Operation failed');
    }
  };

  // State derivation: index 0 is always the most recent record
  const isClockedIn = history.length > 0 && !history[0].clock_out_time;

  return (
    <div className="space-y-6">
      {/* Next Shift Banner */}
      <AnimatePresence>
        {nextShift && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-600 p-4 rounded-2xl text-white flex items-center justify-between shadow-lg shadow-brand-600/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Next Scheduled Shift</div>
                <div className="font-bold">{format(new Date(nextShift.start_time), 'EEEE, MMM d')} at {format(new Date(nextShift.start_time), 'p')}</div>
              </div>
            </div>
            <div className="hidden md:block text-right">
               <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Duration</div>
               <div className="font-bold">{nextShift.title || 'Work Shift'}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Primary Action Card */}
        <div className="bg-slate-900 p-8 rounded-2xl text-white flex flex-col justify-between shadow-xl shadow-slate-900/20">
          <div>
            <h3 className="text-2xl font-bold mb-2">Punch Clock</h3>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              Ensure you are at the correct job site before clocking in. GPS is captured automatically — works on <strong className="text-slate-300">mobile & desktop</strong>.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-4">
              <Smartphone size={12} className="text-brand-400 shrink-0" />
              <span>On mobile, tap <em>Allow</em> when the browser asks for location.</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            {!isClockedIn ? (
              <button 
                onClick={() => handleAction('clock-in')}
                disabled={status === 'loading'}
                className="py-12 bg-brand-600 rounded-xl text-4xl font-black uppercase tracking-tighter hover:bg-brand-700 transition-all flex flex-col items-center gap-4 active:scale-[0.98] shadow-lg shadow-brand-600/30 disabled:opacity-50"
              >
                {status === 'loading' ? <Loader2 size={48} className="animate-spin" /> : <Clock size={48} />}
                {status === 'loading' ? 'Verifying...' : 'Clock In'}
              </button>
            ) : (
              <button 
                onClick={() => handleAction('clock-out')}
                disabled={status === 'loading'}
                className="py-12 bg-red-600 rounded-xl text-4xl font-black uppercase tracking-tighter hover:bg-red-700 transition-all flex flex-col items-center gap-4 active:scale-[0.98] shadow-lg shadow-red-600/30 disabled:opacity-50"
              >
                {status === 'loading' ? <Loader2 size={48} className="animate-spin" /> : <LogOut size={48} />}
                {status === 'loading' ? 'Verifying...' : 'Clock Out'}
              </button>
            )}

            <AnimatePresence>
              {status === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-emerald-400 text-center flex items-center justify-center gap-2 font-bold py-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20"
                >
                  <CheckCircle2 size={16}/> Attendance recorded
                </motion.div>
              )}
              {status === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-red-400 text-center flex flex-col items-center justify-center gap-1 font-bold py-3 bg-red-500/10 rounded-xl border border-red-500/20"
                >
                  <div className="flex items-center gap-2"><AlertCircle size={16}/> Update Failed</div>
                  <div className="text-[10px] font-medium opacity-80 mb-2">{errorMessage}</div>
                  
                  {/* Manual Bypass Button */}
                  <button 
                    onClick={() => handleAction(isClockedIn ? 'clock-out' : 'clock-in', true)}
                    className="text-xs px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  >
                    Use Manual Bypass (No GPS)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Historical List Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
            <h3 className="font-bold flex items-center gap-2 text-slate-800">
              <Calendar size={18} className="text-brand-600" /> Recent Activity
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last 50 Records</span>
          </div>
          <div className="space-y-4 overflow-auto max-h-[360px] pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <Calendar size={20} />
                </div>
                <div className="text-slate-400 italic text-sm">No records found</div>
              </div>
            ) : (
              history.map((record, i) => (
                <div key={record._id || i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100 transition-colors">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{format(new Date(record.clock_in_time), 'MMM d, yyyy')}</div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="font-mono text-sm">{format(new Date(record.clock_in_time), 'HH:mm')}</span> 
                      <span className="text-slate-300">→</span>
                      <span className="font-mono text-sm">{record.clock_out_time ? format(new Date(record.clock_out_time), 'HH:mm') : '--:--'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                      record.clock_out_time 
                        ? (
                            record.approval_status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            record.approval_status === 'Rejected' ? 'bg-red-50 text-red-500 border-red-200' :
                            'bg-amber-50 text-amber-600 border-amber-200'
                          )
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse'
                    }`}>
                      {record.clock_out_time ? (
                        <>
                          {record.approval_status === 'Approved' && <CheckCircle2 size={10} />}
                          {record.approval_status === 'Rejected' && <XCircle size={10} />}
                          {record.approval_status === 'Pending' && <Clock size={10} />}
                          {record.approval_status || 'Pending'}
                        </>
                      ) : 'On-site'}
                    </div>

                    {record.status === 'Off-site' && (
                      <div className="text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider border bg-red-50 text-red-500 border-red-100">
                        Off-site
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
