'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { CartDrawer } from '@/components/CartDrawer';
import { 
  Phone, 
  Lock, 
  UserPlus, 
  MapPin, 
  Mail, 
  User as UserIcon, 
  Calendar, 
  PhoneCall, 
  Activity, 
  HeartHandshake, 
  ShieldCheck, 
  Users, 
  Clock, 
  Heart,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';

export default function Home() {
  const { user, login, registerUser, users } = useApp();
  const router = useRouter();

  // Navigation Cart Toggle
  const [cartOpen, setCartOpen] = useState(false);

  // Auth States
  const [mobile, setMobile] = useState('');
  const [passcode, setPasscode] = useState('');
  const [step, setStep] = useState<'mobile' | 'passcode' | 'register'>('mobile');
  const [loading, setLoading] = useState(false);
  
  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regAge, setRegAge] = useState<number>(25);
  const [regPasscode, setRegPasscode] = useState('');



  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'doctor') router.push('/doctor');
      else router.push('/dashboard');
    }
  }, [user, router]);



  const handleCheckMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobile)) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setLoading(false);
    
    // Check if the user already exists in the system
    const userExists = users.some((u) => u.mobile === mobile) || mobile === '8368825928';
    if (userExists) {
      setStep('passcode');
    } else {
      setStep('register');
    }
  };

  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(passcode)) {
      alert('Please enter a valid 4-digit PIN Passcode');
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const success = await login(mobile, passcode);
    setLoading(false);

    if (success) {
      // Redirection handled by useEffect
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      alert('Name is required');
      return;
    }
    if (!/^\d{4}$/.test(regPasscode)) {
      alert('Please create a 4-digit PIN Passcode using numbers only.');
      return;
    }
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    await registerUser({
      name: regName,
      mobile,
      passcode: regPasscode,
      email: regEmail || undefined,
      address: regAddress,
      gender: regGender,
      age: Number(regAge)
    });
    setLoading(false);
    // Redirection handled by useEffect
  };

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar onOpenCart={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* ==========================================
          HERO & AUTH SPLIT SECTION
          ========================================== */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Pitch / Left Grid */}
        <div className="lg:col-span-7 space-y-6 text-left animate-in fade-in slide-in-from-left-6 duration-500">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100/50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border border-teal-200/30">
            <HeartHandshake className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Doctor appointment booking app - Ananya enterprises</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Ananya Enterprises <br />
            <span className="bg-gradient-to-r from-teal-500 via-emerald-500 to-sky-600 bg-clip-text text-transparent">
              Doctor appointment booking app
            </span>
          </h1>

          <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            Welcome to **Ananya Enterprises**. Book digital consultations with specialized doctors, access real-time medical chatrooms, order medications with express home delivery, and manage patient files through our state-of-the-art clinic ecosystem.
          </p>

          {/* Quick Roster Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 max-w-lg">
            <div className="glass-card p-4 rounded-2xl flex flex-col">
              <span className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                99% <TrendingUp className="h-4 w-4 text-emerald-400" />
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Accuracy Rating</span>
            </div>
            <div className="glass-card p-4 rounded-2xl flex flex-col">
              <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-200">10k+</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Prescriptions</span>
            </div>
            <div className="glass-card p-4 rounded-2xl flex flex-col">
              <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-200">24/7</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Support</span>
            </div>
          </div>

          {/* Call Store & Fast Booking Widgets */}
          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="tel:9717098219"
              className="px-6 py-3.5 bg-slate-900 dark:bg-white text-slate-100 dark:text-slate-950 rounded-2xl font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 group justify-center"
            >
              <PhoneCall className="h-4 w-4 text-teal-500 dark:text-teal-600 group-hover:animate-bounce" />
              Call Pharmacy Desk
            </a>
            <a
              href="https://maps.app.goo.gl/FgzC3vY9Z7fbrquf6"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-350 transition-all flex items-center gap-1.5 justify-center"
            >
              <MapPin className="h-4 w-4 text-teal-500" />
              Get Directions
            </a>
          </div>
        </div>

        {/* Authentication Card / Right Grid */}
        <div className="lg:col-span-5 animate-in fade-in slide-in-from-right-6 duration-500">
          <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-teal-500/10 rounded-full filter blur-2xl glow-bg" />

            {/* Mobile / Check Account Form */}
            {step === 'mobile' && (
              <form onSubmit={handleCheckMobile} className="space-y-5 relative">
                <div className="text-center space-y-1.5 mb-6">
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Secure Clinic Gateway</h3>
                  <p className="text-xs text-slate-400">Enter your mobile number to sign in or register instantly.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-semibold select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="99999 99999"
                      maxLength={10}
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-teal-500 focus:outline-none text-sm font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-teal-500/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <ChevronRight className="h-4 w-4" />
                  {loading ? 'Checking Account...' : 'Continue'}
                </button>
              </form>
            )}

            {/* Passcode Verification Form */}
            {step === 'passcode' && (
              <form onSubmit={handleVerifyPasscode} className="space-y-5">
                <div className="text-center space-y-1.5 mb-6">
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Passcode Verification</h3>
                  <p className="text-xs text-slate-400">Enter your 4-digit PIN Passcode to sign in securely.</p>
                  <p className="text-[11px] text-teal-600 dark:text-teal-400 font-mono font-bold">Demo passcode: 1234</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">4-Digit PIN Passcode</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      placeholder="••••"
                      maxLength={4}
                      required
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-teal-500 focus:outline-none text-sm font-semibold text-center tracking-widest font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setStep('mobile'); setPasscode(''); }}
                    className="py-3 px-2 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 rounded-2xl transition-all"
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="col-span-2 py-3 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white rounded-2xl font-bold text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {loading ? 'Authenticating...' : 'Verify Session'}
                  </button>
                </div>
              </form>
            )}

            {/* Registration Form */}
            {step === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                <div className="text-center space-y-1.5 mb-4 sticky top-0 bg-white dark:bg-slate-900 pb-2 z-10">
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1 justify-center">
                    <UserPlus className="h-5 w-5 text-teal-600" /> Create Patient Profile
                  </h3>
                  <p className="text-xs text-slate-400">First time logging in? Let's build your clinic record.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Full Name *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Rahul Sharma"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-teal-500 focus:outline-none text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Create 4-Digit PIN Passcode *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      placeholder="Choose 4-digit PIN (e.g. 5678)"
                      maxLength={4}
                      required
                      value={regPasscode}
                      onChange={(e) => setRegPasscode(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-teal-500 focus:outline-none text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">Age *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={120}
                      value={regAge}
                      onChange={(e) => setRegAge(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-teal-500 focus:outline-none text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">Gender *</label>
                    <select
                      value={regGender}
                      onChange={(e: any) => setRegGender(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-teal-500 focus:outline-none text-xs font-semibold"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Email Address (Optional)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      placeholder="rahul@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-teal-500 focus:outline-none text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Residential Address *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start text-slate-400">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <textarea
                      placeholder="Flat 402, Block C, Green Park, New Delhi"
                      required
                      rows={2}
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-teal-500 focus:outline-none text-xs font-semibold min-h-[50px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white rounded-xl font-bold text-xs shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="h-4 w-4" />
                  {loading ? 'Submitting Registration...' : 'Complete & Log In'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* ==========================================
          STORE FRONT BANNER & INFORMATIONAL BLOCKS
          ========================================== */}
      <section id="pharmacy-intro" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-slate-200/50 dark:border-slate-900/50">
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Our Verticals</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100">Care and Medicine Combined</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Discover our dual operations: premium clinical consultancy with top-tier practitioners and a fully stocked pharmacy offering fast reservation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Medical Portal card */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl flex flex-col justify-between hover:scale-[1.01] hover:border-teal-500/20 transition-all duration-300">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-teal-100/50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-inner">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Personal Consultation Suite</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Connect with highly certified physicians. Select appropriate consult slots, request approval, settle booking fees easily, and connect via secure Google Meet or Zoom URLs directly.
              </p>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-6 flex justify-between items-center text-xs text-slate-400">
              <span>Appointment statuses updated in real time</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* Pharmacy card */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl flex flex-col justify-between hover:scale-[1.01] hover:border-sky-500/20 transition-all duration-300">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-sky-100/50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-inner">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Integrated Pharmacy Desk</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Browse, search, and filter premium vitamins, medications, and general healthcare devices. Reserve stocks prior to your clinic visit with a single click to assure stock availability.
              </p>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-6 flex justify-between items-center text-xs text-slate-400">
              <span>Home delivery & fast booking available</span>
              <span className="h-2 w-2 rounded-full bg-sky-500" />
            </div>
          </div>
        </div>
      </section>



      {/* Footer Branding */}
      <footer className="py-6 border-t border-slate-200/50 dark:border-slate-900/50 text-center text-xs text-slate-400 bg-white/60 dark:bg-slate-950">
        <p className="font-bold text-slate-500 dark:text-slate-400">ANANYA ENTERPRISES SYSTEM</p>
        <p className="mt-1 text-[10px]">Created by Animesh • Secure Clinic and Stock Platform</p>
      </footer>
    </div>
  );
}
