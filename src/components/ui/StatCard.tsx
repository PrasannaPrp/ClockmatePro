/**
 * Reusable card component for displaying numerical dashboard statistics.
 * Supports icons and trend indicators.
 */
import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between group hover:border-brand-600/30 transition-all">
      <div>
        {/* Label and Value */}
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-brand-600 transition-colors">
          {label}
        </div>
        <div className="text-3xl font-extrabold text-slate-900 mb-1">{value}</div>
        
        {/* Trend Indicator (Optional) */}
        {trend && <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{trend}</div>}
      </div>
      
      {/* Icon with hover effects */}
      <div className="p-2.5 bg-slate-50 rounded-lg group-hover:bg-brand-50 transition-colors border border-slate-100 group-hover:border-brand-100">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { size: 18 } as any) : icon}
      </div>
    </div>
  );
};
