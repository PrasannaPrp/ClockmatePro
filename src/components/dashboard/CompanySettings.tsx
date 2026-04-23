import React, { useState, useEffect } from 'react';
import { MapPin, Shield, CheckCircle2, Loader2, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../../types';

interface CompanySettingsProps {
  token: string;
  user: User;
}

export const CompanySettings: React.FC<CompanySettingsProps> = ({ token, user }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState({
    geofence_enabled: false,
    lat: 0,
    lng: 0,
    geofence_radius: 500,
    ot_rate: 1.5,
    evening_loading: 0.15,
    night_loading: 0.30,
    holiday_rate: 2.5
  });

  useEffect(() => {
    if (user.role === 'Admin') {
      setLoading(true);
      fetch('/api/company/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(async res => {
        const ct = res.headers.get('content-type');
        if (res.ok && ct && ct.includes('application/json')) return res.json();
        return null;
      })
      .then(data => {
        if (data && data.success) {
          setSettings({
            geofence_enabled: data.settings.geofence_enabled || false,
            lat: data.settings.lat || 0,
            lng: data.settings.lng || 0,
            geofence_radius: data.settings.geofence_radius || 500,
            ot_rate: data.settings.ot_rate || 1.5,
            evening_loading: data.settings.evening_loading || 0.15,
            night_loading: data.settings.night_loading || 0.30,
            holiday_rate: data.settings.holiday_rate || 2.5
          });
        }
      })
      .finally(() => setLoading(false));
    }
  }, [token, user.role]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/company/settings', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const [locating, setLocating] = useState(false);

  const useCurrentLocation = async () => {
    setLocating(true);
    
    const getPos = (highAccuracy: boolean, timeout: number): Promise<GeolocationPosition> =>
      new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: highAccuracy,
          timeout,
          maximumAge: 30000
        })
      );

    try {
      let lat: number | null = null;
      let lng: number | null = null;

      const geoSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

      if (geoSupported) {
        try {
          // Tier 1: High-Accuracy
          console.log('📡 Attempting High-Accuracy Location Fix...');
          const pos = await getPos(true, 10000);
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (err: any) {
          if (err.code === 1) throw err; // Permission denied
          try {
            // Tier 2: Standard Accuracy
            console.warn('⚠️ High-Accuracy failed, falling back to Standard Accuracy...');
            const pos = await getPos(false, 12000);
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          } catch {
            // Tier 3: IP-based fallback
            console.warn('📍 GPS failed/timed out. Falling back to IP-based approximate location...');
            const ipRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
            const ipData = await ipRes.json();
            if (ipData.latitude && ipData.longitude) {
              lat = ipData.latitude;
              lng = ipData.longitude;
            } else {
              throw new Error('IP_LOOKUP_FAILED');
            }
          }
        }
      } else {
        // No navigator.geolocation support
        const ipRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
        const ipData = await ipRes.json();
        lat = ipData.latitude;
        lng = ipData.longitude;
      }

      if (lat !== null && lng !== null) {
        console.log('✅ Location Acquired:', lat, lng);
        setSettings(prev => ({
          ...prev,
          lat: Number(lat!.toFixed(6)),
          lng: Number(lng!.toFixed(6))
        }));
      } else {
        throw new Error('All location methods failed.');
      }

    } catch (err: any) {
      console.error('❌ Geolocation Final Failure — code:', err?.code, '| message:', err?.message ?? err);
      let errorMsg = 'Could not retrieve your location.';
      
      if (err.code === 1) {
        const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        if (isIOS) {
          errorMsg = 'Location denied. On iPhone: Settings → Privacy & Security → Location Services → Your Browser → While Using App.';
        } else if (isAndroid) {
          errorMsg = 'Location denied. On Android: tap the 🔒 lock icon in the address bar → Permissions → Location → Allow.';
        } else {
          errorMsg = 'Permission Denied. Please check your browser site settings and allow location access.';
        }
      } else {
        errorMsg = 'Failed to get location from GPS or Network. Please enter coordinates manually.';
      }
      
      alert(errorMsg);
    } finally {
      setLocating(false);
    }
  };

  if (user.role !== 'Admin') {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-2xl border border-slate-200">
        <Shield size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-xl font-bold text-slate-900">Personal Settings</h3>
        <p className="text-slate-500 mt-2">Employee-level settings and profile management are coming soon.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Organization Settings</h2>
        <p className="text-slate-500 font-medium">Configure company-wide policies, security boundaries, and GPS verification.</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center p-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="animate-spin text-brand-600" size={32} />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* GPS Verification Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">GPS Geofencing</h3>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Attendance Security</p>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.geofence_enabled}
                  onChange={e => setSettings({...settings, geofence_enabled: e.target.checked})}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            <div className={`p-8 space-y-8 transition-opacity ${!settings.geofence_enabled ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Office Coordinates</label>
                    <div className="space-y-3">
                       <div className="flex gap-4">
                          <div className="flex-1">
                            <span className="text-[10px] text-slate-400 mb-1 block">Latitude</span>
                            <input 
                              type="number" step="any"
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                              value={settings.lat}
                              onChange={e => setSettings({...settings, lat: parseFloat(e.target.value)})}
                            />
                          </div>
                          <div className="flex-1">
                            <span className="text-[10px] text-slate-400 mb-1 block">Longitude</span>
                            <input 
                              type="number" step="any"
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                              value={settings.lng}
                              onChange={e => setSettings({...settings, lng: parseFloat(e.target.value)})}
                            />
                          </div>
                       </div>
                       <button 
                        type="button"
                        disabled={locating}
                        onClick={useCurrentLocation}
                        className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
                       >
                          {locating ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />} 
                          {locating ? 'Acquiring Signal...' : 'Use My Current Location'}
                       </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">
                      Geofence Radius ({settings.geofence_radius >= 1000 ? `${(settings.geofence_radius / 1000).toFixed(1)}km` : `${settings.geofence_radius}m`})
                    </label>
                    <input 
                      type="range" min="50" max="5000" step="50"
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-600"
                      value={settings.geofence_radius}
                      onChange={e => setSettings({...settings, geofence_radius: parseInt(e.target.value)})}
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                       <span>Tight (50m)</span>
                       <span>Mid-Range (2.5km)</span>
                       <span>Wide (5km)</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-100">
                    💡 Employees who clock in outside of this {settings.geofence_radius}m radius will have their shifts flagged as "Off-site" in your live feed and payroll records.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payroll Rates Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
                <Navigation size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Payroll Rates & Penalties</h3>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Enterprise Agreement Compliance</p>
              </div>
            </div>

            <div className="p-8 grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Overtime Rate (Multiplier)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="number" step="0.1"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
                      value={settings.ot_rate}
                      onChange={e => setSettings({...settings, ot_rate: parseFloat(e.target.value)})}
                    />
                    <span className="text-slate-400 text-xs font-medium whitespace-nowrap">e.g. 1.5 = Time & Half</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Public Holiday Rate (Multiplier)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="number" step="0.1"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
                      value={settings.holiday_rate}
                      onChange={e => setSettings({...settings, holiday_rate: parseFloat(e.target.value)})}
                    />
                    <span className="text-slate-400 text-xs font-medium whitespace-nowrap">e.g. 2.5 = Double & Half</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Evening Loading (+ %)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="number" step="0.01"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
                      value={settings.evening_loading}
                      onChange={e => setSettings({...settings, evening_loading: parseFloat(e.target.value)})}
                    />
                    <span className="text-slate-400 text-xs font-medium whitespace-nowrap">e.g. 0.15 = 15% bonus</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Night Loading (+ %)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="number" step="0.01"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
                      value={settings.night_loading}
                      onChange={e => setSettings({...settings, night_loading: parseFloat(e.target.value)})}
                    />
                    <span className="text-slate-400 text-xs font-medium whitespace-nowrap">e.g. 0.30 = 30% bonus</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-end gap-4 mt-8">
            <AnimatePresence>
              {success && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-emerald-500 font-bold flex items-center gap-2"
                >
                  <CheckCircle2 size={18} /> Settings Synchronized
                </motion.div>
              )}
            </AnimatePresence>
            <button 
              disabled={saving}
              className="px-10 py-4 bg-brand-600 text-white rounded-xl font-bold flex items-center gap-3 hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : null}
              Save Configuration
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
