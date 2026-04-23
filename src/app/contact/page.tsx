import React from 'react';
import { PublicHeader } from '../../components/public/PublicHeader';
import { PublicFooter } from '../../components/public/PublicFooter';
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PublicHeader />

      <main className="max-w-6xl mx-auto py-20 px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Get in touch</h1>
          <p className="text-slate-500 font-medium italic">We're here to help your workforce stay on track.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
             <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail size={24} />
             </div>
             <h3 className="font-bold text-slate-900 mb-2">Email Us</h3>
             <p className="text-sm text-slate-500 mb-4 italic">Expect a reply within 2 hours</p>
             <a href="mailto:support@clockmate.io" className="text-brand-600 font-bold hover:underline">support@clockmate.io</a>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone size={24} />
             </div>
             <h3 className="font-bold text-slate-900 mb-2">Call Us</h3>
             <p className="text-sm text-slate-500 mb-4 italic">Mon-Fri from 9am to 6pm</p>
             <a href="tel:+18882562562" className="text-emerald-600 font-bold hover:underline">+1 (888) 256-2562</a>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
             <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin size={24} />
             </div>
             <h3 className="font-bold text-slate-900 mb-2">Office</h3>
             <p className="text-sm text-slate-500 mb-4 italic">Global Headquarters</p>
             <p className="font-bold text-slate-900">71-75 Shelton Street, London, WC2H 9JQ</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">First Name</label>
                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-brand-500" placeholder="John" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Name</label>
                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-brand-500" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message</label>
              <textarea rows={4} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-brand-500" placeholder="How can we help your business?"></textarea>
            </div>
            <button className="w-full py-5 bg-brand-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20">Send Message</button>
          </form>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
