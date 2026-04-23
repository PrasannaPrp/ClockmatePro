import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Users, Calendar, Loader2 } from 'lucide-react';

interface LaborAnalyticsProps {
  token: string;
}

export const LaborAnalytics: React.FC<LaborAnalyticsProps> = ({ token }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/labor', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(async res => {
      const ct = res.headers.get('content-type');
      if (res.ok && ct && ct.includes('application/json')) {
        return res.json();
      }
      return null;
    })
    .then(res => {
      if (res && res.success) setData(res);
    })
    .catch(err => console.error("Labor analytics sync error:", err))
    .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="h-64 bg-white rounded-2xl border border-slate-200 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-600" size={32} />
      </div>
    );
  }

  if (!data || data.chartData.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <TrendingUp size={48} className="mx-auto text-slate-200 mb-4" />
        <h3 className="text-lg font-bold text-slate-900">Analytics Loading...</h3>
        <p className="text-slate-400 text-sm">Labor cost trends will appear here after your first few payroll runs.</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Chart Card */}
      <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
           <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Financial Velocity</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gross Expenditure / Month</p>
           </div>
           <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black">
              <TrendingUp size={12}/> TRENDING UP
           </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chartData}>
              <defs>
                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}}
                tickFormatter={(val) => `$${val/1000}k`}
              />
              <Tooltip 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                cursor={{stroke: '#4F46E5', strokeWidth: 1}}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#4F46E5" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAmt)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Micro-Cards */}
      <div className="space-y-6">
         <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-slate-900/20">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
              <DollarSign size={20} className="text-emerald-400" />
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Labor Investment</div>
            <div className="text-3xl font-black tracking-tighter">${data.summary.totalSpent.toLocaleString()}</div>
         </div>

         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-slate-50 group-hover:scale-110 transition-transform">
               <Users size={120} strokeWidth={1} />
            </div>
            <div className="relative z-10 font-bold">
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Monthly Run</div>
               <div className="text-2xl font-black text-slate-900">${data.summary.avgMonthly.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
               <div className="text-xs text-emerald-500 font-bold mt-1">Across {data.summary.runCount} cycles</div>
            </div>
         </div>
      </div>
    </div>
  );
};
