/**
 * Component for Admins to monitor employee attendance in real-time.
 * Displays a list of recent punch events with status and timestamps.
 */
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface AdminLiveFeedProps {
  token: string;
}

export const AdminLiveFeed: React.FC<AdminLiveFeedProps> = ({ token }) => {
  const [history, setHistory] = React.useState<any[]>([]);

  // Fetch all attendance records for the company
  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/attendance/history', { headers: { 'Authorization': `Bearer ${token}` } });
      const ct = res.headers.get('content-type');
      if (res.ok && ct && ct.includes('application/json')) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err: any) {
      // In AI Studio dev environment, "Failed to fetch" is common during reloads/rate limits.
      // We log it only if it's NOT a transient network failure to keep the console clean.
      if (err.message !== 'Failed to fetch') {
        console.error('Admin Feed Sync Error:', err);
      }
    }
  };

  React.useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 30000); // Poll every 30 seconds to avoid AI Studio rate limits
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Feed Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
        <h3 className="font-bold flex items-center gap-2 text-slate-900">
          <TrendingUp size={18} className="text-brand-600" /> Live Workforce Feed
        </h3>
        <button className="text-[10px] font-bold uppercase tracking-widest text-brand-600 hover:underline">View All Records</button>
      </div>

      {/* Scrollable Data Table */}
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 bg-slate-50/95 backdrop-blur-sm">Employee</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 bg-slate-50/95 backdrop-blur-sm">Status</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 bg-slate-50/95 backdrop-blur-sm">Punch In</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 bg-slate-50/95 backdrop-blur-sm">Punch Out</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 bg-slate-50/95 backdrop-blur-sm">Acc.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {history.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-slate-400 italic text-sm">No live feed available</td></tr>
            ) : (
              history.map((row, i) => (
                <tr key={i} className="hover:bg-brand-50/20 transition-colors group">
                  {/* User Identifier */}
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">
                      {row.user_id?.name || 'Unknown User'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{format(new Date(row.clock_in_time), 'LLL d')}</div>
                  </td>
                  
                  {/* Status Badge */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider w-fit ${row.clock_out_time ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                        {row.clock_out_time ? 'Offline' : 'Active'}
                      </span>
                      {row.status === 'Off-site' && (
                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter animate-pulse">
                          ⚠️ Off-site
                        </span>
                      )}
                      {row.status === 'No-GPS' && (
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter bg-slate-100 px-1 rounded">
                          🚫 No-GPS
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* Timestamps */}
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{format(new Date(row.clock_in_time), 'HH:mm')}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400 font-medium">{row.clock_out_time ? format(new Date(row.clock_out_time), 'HH:mm') : '--:--'}</td>
                  
                  {/* Accuracy or Meta info placeholder */}
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-400 tracking-tight">14m</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
