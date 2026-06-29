'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
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
  const { user, logout, notifications, markNotificationRead, cart, language, setLanguage } = useApp();
  const pathname = usePathname();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const unreadNotifs = notifications.filter((n) => !n.read && (user ? n.userId === user.uid : false));

  if (!mounted) {
    return <div className="h-16 bg-slate-50 border-b border-slate-200/40" />;
  }

  // Dynamic Navigation Links based on role
  const getNavLinks = () => {
    if (!user) {
      return [];
    }

    if (user.role === 'admin') {
      return [
        { label: language === 'en' ? 'Admin Dashboard' : 'एडमिन डैशबोर्ड', href: '/admin' }
      ];
    }

    if (user.role === 'doctor') {
      return [
        { label: language === 'en' ? 'Doctor Schedule' : 'डॉक्टर शेड्यूल', href: '/doctor' }
      ];
    }

    // Default: Consumer/Patient
    return [
      { label: language === 'en' ? 'Dashboard' : 'डैशबोर्ड', href: '/dashboard' },
      { label: language === 'en' ? 'Book Appointment' : 'अपॉइंटमेंट बुक करें', href: '/dashboard/appointments' },
      { label: language === 'en' ? 'Pharmacy' : 'फार्मेसी', href: '/dashboard/pharmacy' }
    ];
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">

      {/* ==========================================
          MAIN NAVIGATION BAR
          ========================================== */}
      <div className="glass border-b border-slate-200/40 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand spacer */}
          <div className="flex-1" />

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
                      ? 'text-blue-600 font-bold'
                      : 'text-slate-600 hover:text-blue-500'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-green-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Action Utilities */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* Right-aligned Brand Name */}
            <div className="flex flex-col items-end mr-2">
              <span className="font-extrabold text-sm leading-none bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent uppercase tracking-wider">
                Ananya
              </span>
              <span className="text-[9px] tracking-widest text-slate-500 font-bold uppercase leading-none mt-0.5">
                Enterprises
              </span>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  language === 'hi'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                हिंदी
              </button>
            </div>

            {/* Shopping Cart Button */}
            {(!user || user.role === 'consumer') && (
              <button
                onClick={onOpenCart}
                className="relative p-2.5 rounded-xl border border-slate-200/50 bg-white/60 hover:bg-slate-50 transition-all duration-200 text-slate-600 hover:scale-105 active:scale-95 shadow-sm"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 flex items-center justify-center bg-orange-500 text-white text-[10px] font-extrabold rounded-full border-2 border-white animate-bounce">
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
                  className="relative p-2.5 rounded-xl border border-slate-200/50 bg-white/60 hover:bg-slate-50 transition-all duration-200 text-slate-600 hover:scale-105 active:scale-95 shadow-sm"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white animate-ping" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifsOpen && (
                  <div className="absolute right-0 mt-3 w-80 glass-card rounded-2xl p-4 shadow-xl z-50 border border-slate-200/60">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                      <span className="font-bold text-sm text-slate-800">Live Notifications</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
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
                                  ? 'bg-blue-50 border-blue-100'
                                  : 'bg-transparent border-transparent hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <h4 className={`text-xs font-bold ${!notif.read ? 'text-blue-600' : 'text-slate-700'}`}>
                                  {notif.title}
                                </h4>
                                {!notif.read && <span className="h-1.5 w-1.5 bg-blue-500 rounded-full mt-1 flex-shrink-0" />}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-normal">
                                {notif.body}
                              </p>
                              <span className="text-[9px] text-slate-400 mt-1 block">
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
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-slate-200/50 bg-white/60 hover:bg-slate-50 transition-all duration-200 shadow-sm"
                >
                  <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shadow-inner uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex flex-col items-start hidden lg:flex">
                    <span className="text-xs font-bold text-slate-700 leading-tight">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider leading-none">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-56 glass-card rounded-2xl p-2 shadow-xl z-50 border border-slate-200/60">
                    <div className="p-3 border-b border-slate-100 mb-1">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-xs font-bold text-slate-700 truncate mt-0.5">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.mobile}</p>
                    </div>

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                      {language === 'en' ? 'Sign Out' : 'साइन आउट'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/#auth-section"
                className="px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/10 hover:scale-[1.02] transition-all"
              >
                {language === 'en' ? 'Login' : 'लॉगिन'}
              </Link>
            )}

          </div>

          {/* Mobile Menu Toggler */}
          <div className="flex items-center gap-2.5 md:hidden">
            {/* Mobile Brand Name */}
            <div className="flex flex-col items-end mr-1 select-none">
              <span className="font-extrabold text-[10px] leading-none bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent uppercase tracking-wider">
                Ananya
              </span>
              <span className="text-[7px] tracking-widest text-slate-500 font-bold uppercase leading-none mt-0.5">
                Enterprises
              </span>
            </div>

            {/* Language Selector Mobile */}
            <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200 scale-90">
              <button
                onClick={() => setLanguage('en')}
                className={`px-1.5 py-0.5 text-[10px] font-black rounded transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-1.5 py-0.5 text-[10px] font-black rounded transition-all cursor-pointer ${
                  language === 'hi'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                हिंदी
              </button>
            </div>

            {(!user || user.role === 'consumer') && (
              <button onClick={onOpenCart} className="relative p-2 text-slate-600">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-orange-500 text-white text-[9px] font-extrabold rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600"
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
        <div className="md:hidden glass border-b border-slate-200 p-4 space-y-3 shadow-lg max-h-screen overflow-y-auto animate-in slide-in-from-top-4 duration-200">
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
                      ? 'bg-blue-50 text-blue-600 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {user ? (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="px-3 py-2">
                <p className="text-xs text-slate-400">Account Role: <span className="font-extrabold text-blue-600 uppercase">{user.role}</span></p>
                <p className="text-xs font-bold text-slate-700 mt-0.5 truncate">{user.name}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
              >
                <LogOut className="h-4 w-4" />
                {language === 'en' ? 'Sign Out' : 'साइन आउट'}
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100">
              <Link
                href="/#auth-section"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
              >
                {language === 'en' ? 'Login' : 'लॉगिन'}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
