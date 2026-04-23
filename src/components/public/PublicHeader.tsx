'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Menu, X } from 'lucide-react';

interface PublicHeaderProps {
  onLogin?: () => void;
  onLogout?: () => void;
  companyName?: string;
  userName?: string;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ onLogin, onLogout, companyName, userName }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const navLinks = [
    { name: 'About', href: '/about' },
    { name: 'Meet the Team', href: '/team' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo / Company Identity */}
        <Link href={onLogout ? "#" : "/"} className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20 group-hover:scale-110 transition-transform">
            <Clock className="text-white w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-2xl tracking-tighter">
              {companyName || 'ClockMate'}
            </span>
            {companyName && (
              <div className="text-[10px] font-black text-brand-600 uppercase tracking-widest -mt-1 opacity-70">
                Staff Portal
              </div>
            )}
          </div>
        </Link>

        {/* Action Area */}
        <div className="flex items-center gap-6">
          {/* Desktop Nav - Hide in Portal Mode */}
          {!companyName && (
            <div className="hidden md:flex items-center gap-10 mr-10">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className="text-sm font-bold text-slate-500 hover:text-brand-600 transition-colors uppercase tracking-widest"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          )}

          {onLogout ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-black text-slate-900 uppercase tracking-tighter leading-none">{userName}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Active Session</div>
              </div>
              <button 
                onClick={onLogout}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-slate-900/10"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={onLogin || (() => window.location.href = '/')}
              className="hidden md:block px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20"
            >
              Enter Dashboard
            </button>
          )}
        </div>

        {/* Mobile Toggle (Only if not in portal mode) */}
        {!companyName && (
          <button className="md:hidden text-slate-900" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
      </nav>

      {/* Mobile Menu */}
      {isOpen && !companyName && (
        <div className="md:hidden bg-white border-b border-slate-100 p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              className="block text-lg font-black text-slate-900 tracking-tight"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <button 
            className="block w-full py-4 bg-brand-600 text-white text-center rounded-xl font-black uppercase tracking-widest text-sm"
            onClick={() => {
              setIsOpen(false);
              if (onLogin) onLogin();
              else window.location.href = '/';
            }}
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </header>
  );
};
