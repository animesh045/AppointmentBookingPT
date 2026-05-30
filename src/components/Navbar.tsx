'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ThemeToggle } from './ThemeToggle';
import { 
  Activity, 
  ShoppingCart, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X, 
  ShieldAlert, 
  CheckCircle,
  FileText,
  Calendar,
  MessageSquare,
  Clock,
  Heart,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  onOpenCart?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart }) => {
  const { user, logout, notifications, markNotificationRead, devLoginAs, cart } = useApp();
  const pathname = usePathname();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [devPanelExpanded, setDevPanelExpanded] = useState(true);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const unreadNotifs = notifications.filter((n) => !n.read && (user ? n.userId === user.uid : false));

  const handleDevSwitch = (role: 'consumer' | 'doctor' | 'admin') => {
    devLoginAs(role);
    setMobileMenuOpen(false);
    setProfileOpen(false);
  };

  // Dynamic Navigation Links based on role
  const getNavLinks = () => {
    if (!user) {
      return [
        { label: 'Home', href: '/' },
        { label: 'Doctors', href: '#doctors' },
        { label: 'Pharmacy', href: '#pharmacy' }
      ];
    }

    if (user.role === 'admin') {
      return [
        { label: 'Admin Dashboard', href: '/admin' }
      ];
    }

    if (user.role === 'doctor') {
      return [
        { label: 'Doctor Schedule', href: '/doctor' }
      ];
    }

    // Default: Consumer/Patient
    return [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Book Appointment', href: '/dashboard/appointments' },
      { label: 'Pharmacy', href: '/dashboard/pharmacy' }
    ];
  };

  const navLinks = getNavLinks();

  const appRole = process.env.NEXT_PUBLIC_APP_ROLE;

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      {/* ==========================================
          PREMIUM DEV TOOLBAR (ROLE QUICK SWITCHER)
          ========================================== */}
      {!appRole && (
        <div className="bg-slate-900 text-slate-100 text-xs px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-300">Ananya Developer Controls:</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono">Mock OTP & Payments Active</span>
          </div>
          
          {devPanelExpanded ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 hidden sm:inline">Active User Simulator:</span>
              <button
                onClick={() => handleDevSwitch('consumer')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  user?.role === 'consumer'
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                👤 Patient (Rahul)
              </button>
              <button
                onClick={() => handleDevSwitch('doctor')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  user?.role === 'doctor'
                    ? 'bg-blue-500 text-white font-bold shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                🥼 Doctor (Ananya)
              </button>
              <button
                onClick={() => handleDevSwitch('admin')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  user?.role === 'admin'
                    ? 'bg-purple-500 text-white font-bold shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                🔑 Admin (Animesh)
              </button>
              <button
                onClick={() => setDevPanelExpanded(false)}
                className="text-slate-500 hover:text-slate-300 ml-2"
                title="Minimize panel"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDevPanelExpanded(true)}
              className="text-emerald-400 hover:underline font-medium hover:text-emerald-300 transition-all"
            >
              Expand Sandbox Controls ⚙️
            </button>
          )}
        </div>
      )}

      {/* ==========================================
          MAIN NAVIGATION BAR
          ========================================== */}
      <div className="glass border-b border-slate-200/40 dark:border-slate-800/40 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <Link href={user ? (user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor' : '/dashboard') : '/'} className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-600 flex items-center justify-center text-white shadow-md shadow-teal-500/10 group-hover:scale-105 transition-all duration-300">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg leading-none bg-gradient-to-r from-teal-600 to-sky-700 dark:from-teal-400 dark:to-sky-500 bg-clip-text text-transparent">
                ANANYA
              </span>
              <span className="text-[10px] tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                ENTERPRISES
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-sm font-semibold transition-all relative py-1.5 ${
                    isActive
                      ? 'text-teal-600 dark:text-teal-400 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-teal-500 dark:hover:text-teal-400'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-sky-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Action Utilities */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Shopping Cart Button */}
            {(!user || user.role === 'consumer') && (
              <button
                onClick={onOpenCart}
                className="relative p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200 text-slate-600 dark:text-slate-300 hover:scale-105 active:scale-95 shadow-sm"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 flex items-center justify-center bg-teal-500 text-slate-950 text-[10px] font-extrabold rounded-full border-2 border-white dark:border-slate-950 animate-bounce">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Notification Center */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifsOpen(!notifsOpen);
                    setProfileOpen(false);
                  }}
                  className="relative p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200 text-slate-600 dark:text-slate-300 hover:scale-105 active:scale-95 shadow-sm"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-950 animate-ping" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifsOpen && (
                  <div className="absolute right-0 mt-3 w-80 glass-card rounded-2xl p-4 shadow-xl z-50 border border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Live Notifications</span>
                      <span className="text-[10px] bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full font-bold">
                        {unreadNotifs.length} Unread
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {notifications.filter((n) => n.userId === user.uid).length === 0 ? (
                        <p className="text-xs text-center text-slate-400 py-6">No new notifications</p>
                      ) : (
                        notifications
                          .filter((n) => n.userId === user.uid)
                          .map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => markNotificationRead(notif.id)}
                              className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                                !notif.read
                                  ? 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/30'
                                  : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <h4 className={`text-xs font-bold ${!notif.read ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {notif.title}
                                </h4>
                                {!notif.read && <span className="h-1.5 w-1.5 bg-teal-500 rounded-full mt-1 flex-shrink-0" />}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-normal">
                                {notif.body}
                              </p>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 block">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setNotifsOpen(false);
                  }}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200 shadow-sm"
                >
                  <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold text-sm shadow-inner uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex flex-col items-start hidden lg:flex">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider leading-none">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-56 glass-card rounded-2xl p-2 shadow-xl z-50 border border-slate-200/60 dark:border-slate-800/60">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate mt-0.5">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.mobile}</p>
                    </div>

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white rounded-xl shadow-md shadow-teal-500/10 hover:scale-[1.02] transition-all"
              >
                Sign In
              </Link>
            )}

          </div>

          {/* Mobile Menu Toggler */}
          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            {(!user || user.role === 'consumer') && (
              <button onClick={onOpenCart} className="relative p-2 text-slate-600 dark:text-slate-300">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-teal-500 text-slate-950 text-[9px] font-extrabold rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* ==========================================
          MOBILE NAVIGATION PANEL
          ========================================== */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-b border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-lg max-h-screen overflow-y-auto animate-in slide-in-from-top-4 duration-200">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {user ? (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="px-3 py-2">
                <p className="text-xs text-slate-400">Account Role: <span className="font-extrabold text-teal-600 dark:text-teal-400 uppercase">{user.role}</span></p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5 truncate">{user.name}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-red-600 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 rounded-xl transition-all"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2.5 text-sm font-bold bg-teal-500 hover:bg-teal-600 text-slate-950 rounded-xl shadow-md"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
