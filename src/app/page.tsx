/**
 * Root Next.js page that powers the ClockMate SPA logic.
 * Wraps the existing modular architecture (Landing, Login, Register, Dashboard)
 * into a Next.js Client Component.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { LandingView } from '@/views/LandingView';
import { LoginView } from '@/views/LoginView';
import { RegisterView } from '@/views/RegisterView';
import { DashboardView } from '@/views/DashboardView';

export default function Home() {
  // Global state for user identity and auth token
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Current view controller
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard'>('landing');

  // On mount, check local storage for existing session
  useEffect(() => {
    const savedToken = localStorage.getItem('cm_token');
    const savedUser = localStorage.getItem('cm_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setView('dashboard');
    }
  }, []);

  /**
   * Post-login handler to persist session and update state.
   */
  const handleLogin = (token: string, userData: User) => {
    localStorage.setItem('cm_token', token);
    localStorage.setItem('cm_user', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
    setView('dashboard');
  };

  /**
   * Logout handler to clear session and redirect to landing.
   */
  const handleLogout = () => {
    localStorage.removeItem('cm_token');
    localStorage.removeItem('cm_user');
    setToken(null);
    setUser(null);
    setView('landing');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Conditional Rendering of Views */}
      {view === 'landing' && (
        <LandingView onJoin={() => setView('register')} onLogin={() => setView('login')} />
      )}
      
      {view === 'login' && (
        <LoginView 
          onBack={() => setView('landing')} 
          onLogin={handleLogin} 
          onGoToRegister={() => setView('register')} 
        />
      )}
      
      {view === 'register' && (
        <RegisterView onBack={() => setView('landing')} onRegistered={() => setView('login')} />
      )}
      
      {view === 'dashboard' && user && token && (
        <DashboardView user={user} token={token} onLogout={handleLogout} />
      )}
    </div>
  );
}
