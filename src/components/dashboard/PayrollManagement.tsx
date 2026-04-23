import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ReceiptText, FileDown, Play, Loader2, Calendar, CheckCircle2, X, ShieldCheck, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../../types';
import { exportToCSV } from '../../lib/export';

interface PayrollManagementProps {
  token: string;
  user: User;
}

/** Mirrors the backend fortnightly anchor logic */
function getCurrentFortnight(): { start: Date; end: Date } {
  const anchor = new Date('2025-01-06T00:00:00');
  const msPerFortnight = 14 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const diff = now.getTime() - anchor.getTime();
  const periodsElapsed = Math.floor(diff / msPerFortnight);
  const start = new Date(anchor.getTime() + periodsElapsed * msPerFortnight);
  const end = new Date(start.getTime() + msPerFortnight - 1);
  return { start, end };
}

const fmt = (d: Date) => format(d, 'dd MMM yyyy');
const currency = (n: number) => `$${(n || 0).toFixed(2)}`;

export const PayrollManagement: React.FC<PayrollManagementProps> = ({ token, user }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [company, setCompany] = useState<any>(null);

  const fortnight = getCurrentFortnight();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payroll/calculate', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.history) setHistory(data.history);
    } catch (err) {
      console.error('Failed to load payroll history:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompany = async () => {
    try {
      const res = await fetch('/api/company/settings', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setCompany(data.settings);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    fetchHistory();
    fetchCompany();
  }, [token]);

  const handleRunPayroll = async () => {
    if (calculating) return;
    setCalculating(true);
    try {
      const res = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          startDate: fortnight.start.toISOString(),
          endDate: fortnight.end.toISOString()
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowSuccess(true);
        fetchHistory();
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        alert(data.error || 'Payroll calculation failed. Ensure all shifts are approved.');
      }
    } catch (err) {
      console.error('Payroll run failed:', err);
      alert('Network error occurred during payroll run.');
    } finally {
      setCalculating(false);
    }
  };

  const generatePDF = (record: any, periodRange: string, approvedBy: string = 'COMPANY ADMIN') => {
    const doc = new jsPDF();
    const cName = company?.name || 'ClockMate Workforce';
    
    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYSLIP', 20, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(cName, 20, 35);
    doc.text(`Period: ${periodRange}`, 20, 42);

    // Employee & Company Details
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('EMPLOYEE INFORMATION', 20, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${record.user_name}`, 20, 72);
    doc.text(`Base Rate: ${currency(record.hourly_rate)}/hr`, 20, 78);

    // Shift Breakdown Table (Daily work time with Penalties)
    if (record.daily_shifts && record.daily_shifts.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('DETAILED TIMESHEET & PENALTIES', 20, 95);
      autoTable(doc, {
        startY: 100,
        head: [['Date', 'Clock In/Out', 'Ord.', 'OT', 'Eve.', 'Night', 'PH', 'Total']],
        body: record.daily_shifts.map((s: any) => [
          format(new Date(s.date), 'EEE, dd MMM'),
          `${format(new Date(s.clock_in), 'HH:mm')} - ${format(new Date(s.clock_out), 'HH:mm')}`,
          `${(s.reg_hrs || 0).toFixed(1)}h`,
          `${(s.ot_hrs || 0).toFixed(1)}h`,
          `${(s.eve_hrs || 0).toFixed(1)}h`,
          `${(s.night_hrs || 0).toFixed(1)}h`,
          `${(s.ph_hrs || 0).toFixed(1)}h`,
          `${s.hours.toFixed(2)}h`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105], fontSize: 7, halign: 'center' },
        styles: { fontSize: 7, halign: 'center' },
        columnStyles: { 0: { halign: 'left', fontStyle: 'bold' }, 1: { halign: 'left' } }
      });
    }

    const nextY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : 100;

    // Financial Summary
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT SUMMARY', 20, nextY);
    autoTable(doc, {
      startY: nextY + 5,
      head: [['Description', 'Units', 'Rate', 'Amount']],
      body: [
        ['Ordinary Hours', `${(record.reg_hours || 0).toFixed(2)}h`, currency(record.hourly_rate), currency(record.base_pay)],
        ['Overtime (150%)', `${(record.ot_hours || 0).toFixed(2)}h`, currency(record.hourly_rate * 1.5), currency(record.ot_pay)],
        ['evening/Night Loading', '-', '-', currency((record.evening_loading || 0) + (record.night_loading || 0))],
        ['Public Holiday', `${(record.public_holiday_hours || 0).toFixed(2)}h`, currency(record.hourly_rate * 2.5), currency(record.public_holiday_pay)],
        ['Gross Total', '-', '-', currency(record.gross_pay)],
        ['PAYG Tax withheld', '-', '-', `-${currency(record.tax)}`],
        ['NET PAYABLE', '-', '-', currency(record.net_pay)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
      styles: { fontSize: 9, fontStyle: 'bold' },
      columnStyles: { 3: { halign: 'right' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;

    // Approval Section
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('AUTHORISATION', 20, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Approved By: ${(approvedBy || 'COMPANY ADMIN').toUpperCase()}`, 20, finalY + 8);
    doc.text(`Status: Electronic verification complete`, 20, finalY + 14);

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('© 2026 ClockMate Workforce Management. This is a system-generated payslip.', 105, pageHeight - 15, { align: 'center' });
    
    doc.save(`payslip_${record.user_name.replace(/\s/g, '_')}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-emerald-500 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-500/20">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="font-black tracking-tight">Payroll Sequence Complete! Distributions saved to library.</div>
               </div>
               <button onClick={() => setShowSuccess(false)}><X size={16}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
            <Calendar size={18} className="text-indigo-600" />
          </div>
          <div>
            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Current Pay Fortnight</div>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {fmt(fortnight.start)} — {fmt(fortnight.end)}
            </div>
          </div>
        </div>
      </div>

      {user.role === 'Admin' && (
        <div className="bg-slate-900 rounded-2xl p-10 overflow-hidden relative border border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 p-12 text-slate-800 opacity-20 transform translate-x-12 -translate-y-12 rotate-12">
            <ReceiptText size={320} strokeWidth={1} />
          </div>
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-600/10 border border-brand-600/20 rounded-full text-brand-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              <ShieldCheck size={12} /> Admin Control
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter mb-4 leading-none">Payroll Sequence</h2>
            <p className="text-slate-400 text-base font-medium mb-8">Calculate and distribute payments for the current cycle.</p>
            
            <button 
              onClick={handleRunPayroll}
              disabled={calculating}
              className="px-10 py-5 bg-brand-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-brand-600/40 hover:bg-brand-700 transition-all border border-brand-600 flex items-center gap-3 disabled:opacity-50"
            >
              {calculating ? (
                <><Loader2 className="animate-spin" size={24} /> Processing...</>
              ) : showSuccess ? (
                <><CheckCircle2 size={24} /> Success!</>
              ) : (
                <><Play size={24} fill="currentColor" /> Run Fortnightly Payroll</>
              )}
            </button>
          </div>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            {user.role === 'Admin' ? <ReceiptText className="text-brand-600" /> : <UserCheck className="text-brand-600" />}
            {user.role === 'Admin' ? 'Accounting Library' : 'Personal Payslips'}
          </h3>
          {user.role === 'Admin' && history.length > 0 && (
            <button 
              onClick={() => {
                // Flatten data for CSV
                const flattened = history.flatMap(cycle => 
                  cycle.employee_records.map((rec: any) => ({
                    period_start: fmt(new Date(cycle.period_start)),
                    period_end: fmt(new Date(cycle.period_end)),
                    employee: rec.user_name,
                    hours: rec.hours.toFixed(2),
                    gross: rec.gross_pay.toFixed(2),
                    tax: rec.tax.toFixed(2),
                    net: rec.net_pay.toFixed(2)
                  }))
                );
                exportToCSV(flattened, 'clockmate_payroll_history');
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
            >
              <FileDown size={14} /> Export All (CSV)
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center text-slate-400">
             No payroll records found.
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((cycle: any) => (
              <div key={cycle._id} className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {fmt(new Date(cycle.period_start))} — {fmt(new Date(cycle.period_end))}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">Distributed to {cycle.employee_records?.length || 0} staff members</div>
                  </div>
                  <button 
                    onClick={() => setExpandedCycle(expandedCycle === cycle._id ? null : cycle._id)}
                    className="text-brand-600 font-bold text-sm"
                  >
                    {expandedCycle === cycle._id ? 'Hide' : 'Show Details'}
                  </button>
                </div>
                
                {expandedCycle === cycle._id && (
                  <div className="mt-8 space-y-4 pt-6 border-t border-slate-50">
                    {cycle.employee_records?.map((rec: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <div className="font-bold text-slate-900">{rec.user_name}</div>
                          <div className="text-xs text-slate-500 font-mono">${rec.net_pay.toFixed(2)} Net Pay</div>
                        </div>
                        <button 
                          onClick={() => generatePDF(rec, `${fmt(new Date(cycle.period_start))} - ${fmt(new Date(cycle.period_end))}`, cycle.approved_by_name)} 
                          className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 shadow-sm"
                        >
                           <FileDown size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
