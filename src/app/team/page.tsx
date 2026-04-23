import React from 'react';
import type { Metadata } from 'next';
import { PublicFooter } from '../../components/public/PublicFooter';
import Link from 'next/link';
import { Github, Linkedin, Mail, GraduationCap } from 'lucide-react';
import teamData from '../../data/team.json';
import { PublicHeader } from '../../components/public/PublicHeader';

export const metadata: Metadata = {
  title: "Meet the ClockMate Team | The Visionaries",
  description: "Meet the experts behind ClockMate's enterprise-grade workforce management architecture.",
};

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <main className="max-w-6xl mx-auto py-24 px-6">
        <div className="text-center mb-20">
          <div className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] mb-4">ClockMate Development Team</div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-6 italic">Meet our creators.</h1>
          <p className="text-slate-500 max-w-xl mx-auto font-medium italic">
            A specialized group of engineers and designers dedicated to revolutionizing workforce management.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {teamData.map((m, i) => (
            <div key={i} className="group relative bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-all duration-500">
              <div className={`w-16 h-16 ${m.color} text-white rounded-2xl flex items-center justify-center text-xl font-black mb-6 shadow-lg shadow-brand-600/10`}>
                {m.initials}
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1">{m.name}</h3>
              <p className="text-brand-600 text-[10px] font-black uppercase tracking-widest mb-4">{m.role}</p>
              
              <div className="flex items-center gap-2 text-slate-400 mb-8 p-3 bg-slate-50 rounded-xl border border-slate-100">
                 <GraduationCap size={16} className="text-slate-400" />
                 <span className="text-xs font-bold font-mono">{m.studentId}</span>
              </div>
              
              <div className="flex gap-4 text-slate-300">
                 <a href="#" className="hover:text-brand-600 transition-colors"><Linkedin size={18} /></a>
                 <a href="#" className="hover:text-brand-600 transition-colors"><Github size={18} /></a>
                 <a href="#" className="hover:text-brand-600 transition-colors"><Mail size={18} /></a>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600 rounded-full blur-[100px]" />
           </div>
           <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tighter mb-6 italic relative z-10">Have a question for the team?</h2>
           <p className="text-slate-400 mb-10 max-w-lg mx-auto relative z-10">We're always here to support your implementation and scaling journey.</p>
           <Link href="/contact" className="inline-flex px-10 py-4 bg-brand-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20 relative z-10">
              Get in Touch
           </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
