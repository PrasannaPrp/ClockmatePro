/**
 * TimeApproval component — Admin-only shift approval queue.
 * Shows all completed shifts with their approval status.
 * Admins can approve or reject each shift before payroll is run.
 * Every action is stamped with the approver's name and timestamp.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { CheckCircle2, XCircle, Clock, Filter, ShieldCheck, AlertTriangle, Loader2, UserCheck, Edit2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportToCSV } from '../../lib/export';

interface TimeApprovalProps {
  token: string;
}

type FilterType = 'All' | 'Pending' | 'Approved' | 'Rejected';

const statusStyles: Record<string, string> = {
  Pending:  'bg-amber-50  text-amber-600  border-amber-200',
  Approved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Rejected: 'bg-red-50    text-red-500    border-red-200',
};

const statusIcons: Record<string, React.ReactNode> = {
  Pending:  <Clock size={12} />,
  Approved: <CheckCircle2 size={12} />,
  Rejected: <XCircle size={12} />,
};

function calcDuration(clockIn: string, clockOut: string | null): string {
  if (!clockOut) return 'Active';
  const mins = differenceInMinutes(new Date(clockOut), new Date(clockIn));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export const TimeApproval: React.FC<TimeApprovalProps> = ({ token }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('Pending');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editIn, setEditIn] = useState('');
  const [editOut, setEditOut] = useState('');
  const [lastAction, setLastAction] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/attendance/approve', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store' // 🛑 Bypass Next.js cache to ensure fresh status
      });
      const data = await res.json();
      if (data.success) setRecords(data.records);
    } catch (err) {
      console.error('Failed to fetch approval queue:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleAction = async (attendanceId: string, action?: 'Approved' | 'Rejected' | 'Pending', times?: { in: string, out: string }) => {
    setActioningId(attendanceId);
    try {
      const res = await fetch('/api/attendance/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          attendanceId, 
          action, 
          clockInTime: times?.in, 
          clockOutTime: times?.out 
        })
      });
      const data = await res.json();
      if (data.success) {
        setRecords(prev => prev.map(r =>
          r._id === attendanceId ? data.record : r
        ));
        setLastAction(`Shift ${status} successfully!`);
        setTimeout(() => setLastAction(null), 3000);
        setEditingId(null);
      }
    } catch (err) {
      console.error('Approval action failed:', err);
    } finally {
      setActioningId(null);
    }
  };

  const startEdit = (row: any) => {
    setEditingId(row._id);
    setEditIn(new Date(row.clock_in_time).toISOString().slice(0, 16));
    setEditOut(row.clock_out_time ? new Date(row.clock_out_time).toISOString().slice(0, 16) : '');
  };

  const filtered = records.filter(r => {
    if (filter === 'All') return true;
    const stat = r.approval_status || 'Pending';
    return stat === filter;
  });

  const counts = {
    All: records.length,
    Pending: records.filter(r => !r.approval_status || r.approval_status === 'Pending').length,
    Approved: records.filter(r => r.approval_status === 'Approved').length,
    Rejected: records.filter(r => r.approval_status === 'Rejected').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <AnimatePresence>
        {lastAction && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-xl">
               <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="text-sm font-bold tracking-tight">{lastAction}</span>
               </div>
               <button onClick={() => setLastAction(null)}><X size={14} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Shift Approvals</h2>
          <p className="text-slate-500 font-medium mt-1">
            Review and approve completed shifts before running fortnightly payroll. Only <strong>Approved</strong> shifts count toward pay.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
          <AlertTriangle size={14} />
          {counts.Pending} shift{counts.Pending !== 1 ? 's' : ''} awaiting approval
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {(['Pending', 'Approved', 'Rejected', 'All'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                filter === f
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}
            >
              {f} <span className="opacity-60">({counts[f]})</span>
            </button>
          ))}
        </div>

        {filtered.length > 0 && (
          <button 
            onClick={() => {
              const exportData = filtered.map(r => ({
                employee: r.user_id?.name || 'Unknown',
                date: format(new Date(r.clock_in_time), 'yyyy-MM-dd'),
                clock_in: format(new Date(r.clock_in_time), 'HH:mm'),
                clock_out: r.clock_out_time ? format(new Date(r.clock_out_time), 'HH:mm') : 'Active',
                duration: calcDuration(r.clock_in_time, r.clock_out_time),
                status: r.approval_status || 'Pending',
                verified_by: r.approved_by_name || 'N/A'
              }));
              exportToCSV(exportData, `shift_approvals_${filter.toLowerCase()}`);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            Export Results (CSV)
          </button>
        )}
      </div>

      {/* Records List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse border border-slate-200" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center">
          <ShieldCheck size={40} className="mx-auto text-slate-300 mb-4" />
          <h4 className="text-xl font-bold text-slate-900 mb-1">All Clear</h4>
          <p className="text-slate-400">No {filter !== 'All' ? filter.toLowerCase() + ' ' : ''}shifts to display.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((row, i) => {
              const isActioning = actioningId === row._id;
              const isPending = !row.approval_status || row.approval_status === 'Pending';
              const duration = calcDuration(row.clock_in_time, row.clock_out_time);

              return (
                <motion.div
                  key={row._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-white border rounded-2xl p-5 transition-all ${
                    isPending ? 'border-amber-200 shadow-sm shadow-amber-50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                    {/* Employee + Shift Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 border border-slate-200 text-sm shrink-0">
                        {row.user_id?.name?.[0] || '?'}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-sm">{row.user_id?.name || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{row.user_id?.role}</div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600">
                          <span className="font-mono font-bold">
                            {format(new Date(row.clock_in_time), 'EEE dd MMM')}
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="font-mono">
                            {editingId === row._id ? (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <div className="space-y-1">
                                  <label className="block text-[9px] font-black uppercase text-slate-400">Clock In</label>
                                  <input 
                                    type="datetime-local" 
                                    value={editIn} 
                                    onChange={e => setEditIn(e.target.value)}
                                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono focus:outline-brand-600"
                                  />
                                </div>
                                <div className="text-slate-300 hidden sm:block mt-4">→</div>
                                <div className="space-y-1">
                                  <label className="block text-[9px] font-black uppercase text-slate-400">Clock Out</label>
                                  <input 
                                    type="datetime-local" 
                                    value={editOut} 
                                    onChange={e => setEditOut(e.target.value)}
                                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono focus:outline-brand-600"
                                  />
                                </div>
                                <div className="flex gap-1 ml-auto sm:mt-4">
                                  <button 
                                    onClick={() => handleAction(row._id, undefined, { in: editIn, out: editOut })}
                                    className="p-1.5 bg-brand-600 text-white rounded hover:bg-brand-700 transition-colors"
                                    title="Save changes"
                                  >
                                    <Save size={14} />
                                  </button>
                                  <button 
                                    onClick={() => setEditingId(null)}
                                    className="p-1.5 bg-white border border-slate-200 text-slate-400 rounded hover:bg-slate-50 transition-colors"
                                    title="Cancel"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {format(new Date(row.clock_in_time), 'HH:mm')}
                                {' → '}
                                {row.clock_out_time ? format(new Date(row.clock_out_time), 'HH:mm') : '...'}
                              </>
                            )}
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="font-bold text-slate-700">{duration}</span>
                          {row.status === 'Off-site' && (
                            <span className="text-[9px] font-black text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded uppercase">⚠ Off-site</span>
                          )}
                          {editingId !== row._id && (
                            <button 
                              onClick={() => startEdit(row)}
                              className="p-1 text-slate-400 hover:text-brand-600 transition-colors ml-1"
                              title="Edit shift times"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                        </div>

                        {/* Audit trail — who approved and when */}
                        {row.approved_by_name && row.approved_at && (
                          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-medium">
                            <UserCheck size={11} />
                            <span>
                              {row.approval_status === 'Approved' ? 'Approved' : 'Rejected'} by{' '}
                              <strong className="text-slate-600">{row.approved_by_name}</strong>
                              {' on '}
                              {format(new Date(row.approved_at), 'dd MMM yyyy, HH:mm')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status + Actions */}
                    <div className="flex items-center gap-3 ml-14 sm:ml-0">
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusStyles[row.approval_status]}`}>
                        {statusIcons[row.approval_status]}
                        {row.approval_status}
                      </span>

                      {isPending && (
                        <div className="flex gap-2">
                          <button
                            disabled={isActioning}
                            onClick={() => handleAction(row._id, 'Approved')}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm shadow-emerald-600/20"
                          >
                            {isActioning ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            Approve
                          </button>
                          <button
                            disabled={isActioning}
                            onClick={() => handleAction(row._id, 'Rejected')}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-500 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-50 transition-all disabled:opacity-50"
                          >
                            {isActioning ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                            Reject
                          </button>
                        </div>
                      )}

                      {/* Re-action buttons for already-decided shifts */}
                      {!isPending && (
                        <button
                          disabled={isActioning}
                          onClick={() => handleAction(row._id, row.approval_status === 'Approved' ? 'Rejected' : 'Approved')}
                          className="px-3 py-1.5 text-[10px] font-bold text-slate-400 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50"
                        >
                          {isActioning ? <Loader2 size={10} className="animate-spin inline" /> : '↩ Undo'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
