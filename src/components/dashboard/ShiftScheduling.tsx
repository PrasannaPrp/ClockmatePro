import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Clock, User as UserIcon, Trash2, Loader2, ChevronLeft, ChevronRight, X, Copy, Check, AlertCircle } from 'lucide-react';
import { format, startOfWeek, addDays, endOfWeek, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isWithinInterval, differenceInMinutes } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../../types';

interface ShiftSchedulingProps {
  token: string;
  user: User;
}

// Colour coding by shift start hour
function getShiftColor(startTime: string) {
  const h = new Date(startTime).getHours();
  if (h < 12) return 'bg-brand-50 border-brand-100 text-brand-700';
  if (h < 17) return 'bg-amber-50 border-amber-100 text-amber-700';
  return 'bg-slate-800 border-slate-700 text-slate-100';
}

export const ShiftScheduling: React.FC<ShiftSchedulingProps> = ({ token, user }) => {
  const [shifts, setShifts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Copy last week state
  const [isCopying, setIsCopying] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyPreview, setCopyPreview] = useState<any[]>([]);       // Shifts from last week to copy
  const [copyOffset, setCopyOffset] = useState(0);                  // Days to shift (default 7 = next week)
  const [copySelected, setCopySelected] = useState<Set<string>>(new Set()); // Which ones to copy
  const [copySuccess, setCopySuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    user_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '17:00',
    title: 'General Shift',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shiftsRes, empRes] = await Promise.all([
        fetch('/api/shifts', { headers: { 'Authorization': `Bearer ${token}` } }),
        user.role === 'Admin' ? fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } }) : null
      ]);
      
      const shiftsData = await shiftsRes.json();
      setShifts(shiftsData.shifts || []);
      
      if (empRes) {
        const empData = await empRes.json();
        setEmployees(empData);
        if (empData.length > 0) setFormData(prev => ({ ...prev, user_id: empData[0]._id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const start = new Date(`${formData.date}T${formData.start_time}`);
      const end = new Date(`${formData.date}T${formData.end_time}`);
      
      const isEditing = !!editingShiftId;
      const url = isEditing ? `/api/shifts/${editingShiftId}` : '/api/shifts';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          user_id: formData.user_id,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          title: formData.title,
          notes: formData.notes
        })
      });
      
      if (res.ok) {
        setIsAdding(false);
        setEditingShiftId(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditShift = (shift: any) => {
    if (user.role !== 'Admin') return;
    setFormData({
      user_id: shift.user_id?._id || shift.user_id,
      date: format(new Date(shift.start_time), 'yyyy-MM-dd'),
      start_time: format(new Date(shift.start_time), 'HH:mm'),
      end_time: format(new Date(shift.end_time), 'HH:mm'),
      title: shift.title,
      notes: shift.notes || ''
    });
    setEditingShiftId(shift._id);
    setIsAdding(true);
  };

  const handleDeleteShift = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;
    try {
      const res = await fetch(`/api/shifts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Copy Last Week Logic ─────────────────────────────────────────────────
  const openCopyModal = () => {
    // Find shifts from last week (Mon–Sun of the previous 7 days)
    const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(lastWeekStart, { weekStartsOn: 1 });

    const lastWeekShifts = shifts.filter(s =>
      isWithinInterval(new Date(s.start_time), { start: lastWeekStart, end: lastWeekEnd })
    );

    setCopyPreview(lastWeekShifts);
    setCopySelected(new Set(lastWeekShifts.map((s: any) => s._id)));
    setCopyOffset(7);
    setCopySuccess(false);
    setIsCopying(true);
  };

  const toggleCopySelect = (id: string) => {
    setCopySelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCopyWeek = async () => {
    const selected = copyPreview.filter(s => copySelected.has(s._id));
    if (selected.length === 0) return;

    setCopyLoading(true);
    try {
      const promises = selected.map(shift => {
        const newStart = new Date(new Date(shift.start_time).getTime() + copyOffset * 86400000);
        const newEnd   = new Date(new Date(shift.end_time).getTime()   + copyOffset * 86400000);
        return fetch('/api/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            user_id: shift.user_id?._id || shift.user_id,
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
            title: shift.title,
            notes: shift.notes
          })
        });
      });

      await Promise.all(promises);
      setCopySuccess(true);
      fetchData();
      setTimeout(() => setIsCopying(false), 1800);
    } catch (err) {
      console.error('Copy week failed:', err);
    } finally {
      setCopyLoading(false);
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getShiftsForDay = (day: Date) => shifts.filter(shift => isSameDay(new Date(shift.start_time), day));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Shift Scheduler</h2>
          <p className="text-slate-500 font-medium">Plan and manage your workforce attendance cycles.</p>
        </div>
        
        {user.role === 'Admin' && (
          <div className="flex items-center gap-3">
            {/* Copy Last Week Button */}
            <button
              onClick={openCopyModal}
              className="px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-2 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <Copy size={16} className="text-slate-500" /> Copy Last Week
            </button>
            <button 
              onClick={() => {
                setEditingShiftId(null);
                setFormData({
                  user_id: employees.length > 0 ? employees[0]._id : '',
                  date: format(new Date(), 'yyyy-MM-dd'),
                  start_time: '09:00',
                  end_time: '17:00',
                  title: 'General Shift',
                  notes: ''
                });
                setIsAdding(true);
              }}
              className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all border border-brand-600"
            >
              <Plus size={20} /> Schedule Shift
            </button>
          </div>
        )}
      </header>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft size={20}/></button>
          <h3 className="text-xl font-bold text-slate-900 min-w-[150px] text-center">{format(currentMonth, 'MMMM yyyy')}</h3>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight size={20}/></button>
        </div>
        <div className="hidden md:flex gap-4">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-400 capitalize"><div className="w-3 h-3 bg-brand-100 rounded-sm"></div> Morning</div>
           <div className="flex items-center gap-2 text-xs font-bold text-slate-400 capitalize"><div className="w-3 h-3 bg-amber-100 rounded-sm"></div> Afternoon</div>
           <div className="flex items-center gap-2 text-xs font-bold text-slate-400 capitalize"><div className="w-3 h-3 bg-slate-900 rounded-sm"></div> Night</div>
        </div>
      </div>

      {loading ? (
        <div className="h-96 bg-white rounded-3xl border border-slate-200 flex items-center justify-center">
          <Loader2 className="animate-spin text-brand-600" size={48} />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="bg-slate-50 p-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
          ))}
          {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-white/50 h-40"></div>
          ))}
          {days.map(day => (
            <div key={day.toISOString()} className="bg-white min-h-[160px] p-3 hover:bg-slate-50/50 transition-colors">
              <div className={`text-sm font-bold mb-3 ${isSameDay(day, new Date()) ? 'inline-flex w-7 h-7 items-center justify-center bg-brand-600 text-white rounded-full' : 'text-slate-400'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-2">
                {getShiftsForDay(day).map((shift, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleEditShift(shift)}
                    className={`group relative p-2 border rounded-lg ${user.role === 'Admin' ? 'cursor-pointer hover:ring-2 hover:ring-brand-400' : ''} ${getShiftColor(shift.start_time)}`}
                  >
                    <div className="text-[10px] font-black truncate">{shift.title}</div>
                    <div className="text-[10px] font-bold opacity-70">{format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}</div>
                    <div className="text-[9px] opacity-50 font-medium truncate italic">{shift.user_id?.name}</div>
                    
                    {user.role === 'Admin' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteShift(shift._id); }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X size={10} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          </div>

          {/* Upcoming Shifts List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
            <h3 className="font-bold flex items-center gap-2 text-slate-800 mb-4">
              <CalendarIcon size={18} className="text-brand-600" /> Upcoming Shifts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shifts.filter(s => new Date(s.start_time) > new Date()).sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()).map(shift => (
                <div key={shift._id} className={`p-4 border rounded-xl flex flex-col justify-between hover:bg-slate-50 transition-colors ${getShiftColor(shift.start_time)}`}>
                   <div>
                      <div className="font-black text-sm">{shift.title}</div>
                      <div className="text-xs font-bold opacity-70 mb-2">{format(new Date(shift.start_time), 'EEEE, MMM d, yyyy')}</div>
                      <div className="text-xs font-bold opacity-80 flex items-center gap-1">
                         <Clock size={12} /> {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                      </div>
                   </div>
                   <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between">
                     <div className="text-xs font-bold flex items-center gap-2">
                        <UserIcon size={12} /> {shift.user_id?.name || 'Unassigned'}
                     </div>
                   </div>
                </div>
              ))}
              {shifts.filter(s => new Date(s.start_time) > new Date()).length === 0 && (
                <div className="col-span-full text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">No upcoming shifts scheduled.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Copy Last Week Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isCopying && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Copy Last Week's Shifts</h3>
                  <p className="text-slate-500 text-sm mt-1">Select which shifts to carry over, then adjust the offset. Each shift will be recreated on the same day of the new week.</p>
                </div>
                <button onClick={() => setIsCopying(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X /></button>
              </div>

              {copyPreview.length === 0 ? (
                <div className="py-12 text-center">
                  <AlertCircle size={36} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">No shifts found from last week (Mon–Sun).</p>
                  <p className="text-slate-400 text-sm mt-1">Create some shifts this week first, then use this button next week.</p>
                </div>
              ) : (
                <>
                  {/* Offset Selector */}
                  <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                      Copy forward by how many days?
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min={1} max={28} step={1}
                        value={copyOffset}
                        onChange={e => setCopyOffset(Number(e.target.value))}
                        className="flex-1 accent-brand-600"
                      />
                      <span className="w-20 text-center font-black text-slate-900 text-sm bg-white border border-slate-200 rounded-lg px-3 py-2">
                        +{copyOffset}d
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">
                      Shifts will be created starting from <strong className="text-slate-700">
                        {format(addDays(new Date(copyPreview[0]?.start_time || new Date()), copyOffset), 'EEE dd MMM')}
                      </strong>
                    </p>
                  </div>

                  {/* Shift checkboxes */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {copySelected.size} of {copyPreview.length} selected
                      </span>
                      <button
                        className="text-xs font-bold text-brand-600 hover:underline"
                        onClick={() =>
                          copySelected.size === copyPreview.length
                            ? setCopySelected(new Set())
                            : setCopySelected(new Set(copyPreview.map((s: any) => s._id)))
                        }
                      >
                        {copySelected.size === copyPreview.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    {copyPreview.map(shift => {
                      const isSelected = copySelected.has(shift._id);
                      const newDate = addDays(new Date(shift.start_time), copyOffset);
                      return (
                        <div
                          key={shift._id}
                          onClick={() => toggleCopySelect(shift._id)}
                          className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all select-none ${
                            isSelected
                              ? 'border-brand-300 bg-brand-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          {/* Checkbox */}
                          <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-all ${
                            isSelected ? 'bg-brand-600 border-brand-600' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 text-sm">{shift.title}</span>
                              <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">
                                {shift.user_id?.name || 'Unknown'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                              {format(new Date(shift.start_time), 'EEE dd MMM, HH:mm')} → {format(new Date(shift.end_time), 'HH:mm')}
                            </div>
                          </div>

                          {/* Arrow to new date */}
                          <div className="text-right shrink-0">
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">→ copies to</div>
                            <div className="text-xs font-black text-brand-600">{format(newDate, 'EEE dd MMM')}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsCopying(false)}
                      className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCopyWeek}
                      disabled={copyLoading || copySelected.size === 0 || copySuccess}
                      className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-700 transition-all disabled:opacity-50 shadow-lg shadow-brand-600/20"
                    >
                      {copySuccess ? (
                        <><Check size={16} /> {copySelected.size} Shifts Copied!</>
                      ) : copyLoading ? (
                        <><Loader2 size={16} className="animate-spin" /> Copying...</>
                      ) : (
                        <><Copy size={16} /> Copy {copySelected.size} Shift{copySelected.size !== 1 ? 's' : ''}</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Add Shift Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                     {editingShiftId ? 'Edit Work Shift' : 'Create Work Shift'}
                   </h3>
                   <p className="text-slate-500 text-sm font-medium">
                     {editingShiftId ? 'Update hours for this team member.' : 'Assign specific hours to your team members.'}
                   </p>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X/></button>
              </div>

              <form onSubmit={handleSaveShift} className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Employee</label>
                  <select 
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                    value={formData.user_id}
                    onChange={e => setFormData({...formData, user_id: e.target.value})}
                  >
                    {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} ({emp.email})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Date</label>
                      <input 
                        type="date" required
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Shift Title</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Start Time</label>
                      <input 
                        type="time" required
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                        value={formData.start_time}
                        onChange={e => setFormData({...formData, start_time: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">End Time</label>
                      <input 
                        type="time" required
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                        value={formData.end_time}
                        onChange={e => setFormData({...formData, end_time: e.target.value})}
                      />
                   </div>
                </div>

                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Notes (Optional)</label>
                   <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium h-24"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                   />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                  <button 
                    disabled={submitting}
                    type="submit" 
                    className="flex-1 py-4 bg-brand-600 text-white rounded-xl font-bold shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all border border-brand-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="animate-spin" size={18} />}
                    {editingShiftId ? 'Update Shift' : 'Save Shift'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
