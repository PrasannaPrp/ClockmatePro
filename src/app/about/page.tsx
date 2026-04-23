import React from 'react';
import type { Metadata } from 'next';
import { PublicHeader } from '../../components/public/PublicHeader';
import { PublicFooter } from '../../components/public/PublicFooter';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import teamData from '../../data/team.json';

export const metadata: Metadata = {
  title: "About ClockMate | Our Mission & Vision",
  description: "Learn how ClockMate is revolutionizing workforce management with precision time tracking and automated payroll systems.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <main className="max-w-6xl mx-auto py-24 px-6">
        <div className="max-w-4xl mx-auto text-center mb-32">
          <div className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] mb-4">Our Mission</div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-8 italic">Precision in every second.</h1>
          <div className="space-y-6 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto italic font-medium">
            <p>
              ClockMate was born out of a simple realization: workforce management shouldn't be a chore. It should be the heartbeat of your business.
            </p>
            <p>
              We've spent thousands of hours perfecting an interface that employees love to use and administrators can rely on. Our goal is to eliminate the friction between "work done" and "pay received."
            </p>
          </div>
        </div>

        {/* Integrated Team Section */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-3 italic">Meet the Leadership</h2>
            <p className="text-slate-500 font-medium italic">The expert team responsible for the ClockMate ecosystem.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamData.map((m, i) => (
              <div key={i} className="text-center group">
                <div className={`w-20 h-20 ${m.color} text-white rounded-3xl flex items-center justify-center text-xl font-black mx-auto mb-6 shadow-xl shadow-slate-200 transition-transform group-hover:-rotate-6 duration-500`}>
                  {m.initials}
                </div>
                <h4 className="font-black text-slate-900">{m.name}</h4>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 mb-1">{m.studentId}</div>
                <p className="text-[10px] font-black text-brand-600 uppercase tracking-[0.15em]">{m.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <div className="bg-slate-50 rounded-[3rem] p-16 text-center border border-slate-100">
           <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4 italic">Ready to transform your workforce?</h3>
           <Link href="/" className="inline-flex py-4 px-10 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">
              Get Started with ClockMate
           </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
