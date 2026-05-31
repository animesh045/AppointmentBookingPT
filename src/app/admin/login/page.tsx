'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { 
  Phone, 
  Lock, 
  ShieldCheck, 
  ArrowLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  const { user, login } = useApp();
  const router = useRouter();

  // Auth States
  const [mobile, setMobile] = useState('');
  const [passcode, setPasscode] = useState('');
  const [step, setStep] = useState<'mobile' | 'passcode'>('mobile');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  const handleCheckMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mobile !== '8368825928') {
      setErrorMsg('Access Denied. Only the designated administrator is permitted to authenticate through this gateway.');
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setLoading(false);
    setStep('passcode');
  };

  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!/^\d{4}$/.test(passcode)) {
      setErrorMsg('Please enter a valid 4-digit PIN Passcode.');
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const success = await login(mobile, passcode);
    setLoading(false);

    if (success) {
      router.push('/admin');
    } else {
      setErrorMsg('Invalid administrative PIN code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 h-72 w-72 bg-purple-500/10 rounded-full filter blur-3xl glow-bg" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 bg-indigo-500/10 rounded-full filter blur-3xl glow-bg" />

        <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 relative z-10">
          
          {/* Back button to consumer landing */}
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-teal-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Consumer Portal
          </Link>

          <div className="glass-card p-8 rounded-3xl shadow-2xl relative overflow-hidden border border-purple-500/15">
            <div className="absolute top-0 right-0 h-24 w-24 bg-purple-500/5 rounded-full filter blur-xl" />

            <div className="text-center space-y-2 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto shadow-inner mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">Administrative Terminal</h1>
              <p className="text-xs text-slate-400">Secure entry gateway for clinic control room systems.</p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/30 border border-red-500/30 text-red-400 rounded-2xl text-xs font-medium leading-relaxed mb-6 flex gap-2 items-start animate-in shake duration-300">
                <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {step === 'mobile' && (
              <form onSubmit={handleCheckMobile} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Admin Mobile Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-semibold select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="83688 25928"
                      maxLength={10}
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-800 bg-slate-900/40 focus:ring-1 focus:ring-purple-500 focus:outline-none text-sm font-semibold text-slate-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-500/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Verifying Admin Registry...' : 'Request Access'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </form>
            )}

            {step === 'passcode' && (
              <form onSubmit={handleVerifyPasscode} className="space-y-5">
                <div className="text-center space-y-1 bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800 mb-2">
                  <span className="text-[10px] text-slate-400 block font-bold">Authenticated Number</span>
                  <span className="text-sm font-mono font-bold text-purple-400">+91 {mobile}</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Administrative PIN code</label>
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
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-800 bg-slate-900/40 focus:ring-1 focus:ring-purple-500 focus:outline-none text-sm font-semibold text-center tracking-widest font-mono text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setStep('mobile'); setPasscode(''); setErrorMsg(''); }}
                    className="py-3 px-2 border border-slate-800 text-xs font-bold text-slate-400 rounded-2xl hover:bg-slate-900/50 transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="col-span-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {loading ? 'Securing Portal...' : 'Unlock Console'}
                  </button>
                </div>
              </form>
            )}

            <div className="pt-6 border-t border-slate-850 mt-6 text-center">
              <span className="text-[10px] text-slate-500">
                Authorized Personnel Only • IP & Session Logged
              </span>
            </div>

          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500 bg-slate-950">
        <p className="font-bold text-slate-400">ANANYA ENTERPRISES SYSTEM</p>
        <p className="mt-1 text-[10px]">Created by Animesh • Secure Clinic and Stock Platform</p>
      </footer>
    </div>
  );
}
