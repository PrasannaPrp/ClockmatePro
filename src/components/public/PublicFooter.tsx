import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Twitter, Clock } from 'lucide-react';

export const PublicFooter = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16 px-6 lg:px-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-600/20">
              <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
            </div>
            <span className="font-bold text-white text-xl tracking-tight">ClockMate</span>
          </div>
          <p className="text-sm leading-relaxed">
            The next generation of workforce management. Precision timing, automated payroll, and team empowerment in one unified platform.
          </p>
          <div className="flex items-center gap-4 text-white">
            <a href="#" className="hover:text-brand-400 transition-colors"><Facebook size={20} /></a>
            <a href="#" className="hover:text-brand-400 transition-colors"><Instagram size={20} /></a>
            <a href="#" className="hover:text-brand-400 transition-colors"><Linkedin size={20} /></a>
            <a href="#" className="hover:text-brand-400 transition-colors"><Twitter size={20} /></a>
          </div>
        </div>

        {/* Company Links */}
        <div>
          <h4 className="font-bold text-white uppercase tracking-widest text-[10px] mb-6">Company</h4>
          <ul className="space-y-4 text-sm">
            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/team" className="hover:text-white transition-colors">Meet the Team</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
          </ul>
        </div>

        {/* Support Detail */}
        <div>
          <h4 className="font-bold text-white uppercase tracking-widest text-[10px] mb-6">Support</h4>
          <ul className="space-y-4 text-sm">
            <li>Monday — Friday</li>
            <li>9:00 AM — 5:00 PM</li>
            <li className="text-white font-bold">support@clockmate.io</li>
            <li>+1 (888) CLOCK-MATE</li>
          </ul>
        </div>

        {/* Newsletter / CTA */}
        <div>
          <h4 className="font-bold text-white uppercase tracking-widest text-[10px] mb-6">Stay Timely</h4>
          <p className="text-xs mb-4">Subscribe to our newsletter for product updates and labor law tips.</p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Email address" 
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs flex-1 focus:outline-none focus:border-brand-500"
            />
            <button className="bg-brand-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-brand-700">Join</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
        <div>© 2026 ClockMate Workforce Systems</div>
        <div className="flex items-center gap-2">
          <span>POWERED BY</span>
          <div className="flex items-center gap-1 text-white">
            <Clock size={12} className="text-brand-500" />
            <span>ClockMate Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
