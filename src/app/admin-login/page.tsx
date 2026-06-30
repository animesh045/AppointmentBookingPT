'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Lock, Phone, ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  const { user, login, logout, users } = useApp();
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'doctor') {
        router.push('/doctor');
      } else {
        // Logged in as normal patient: warn and redirect
        alert('You are logged in as a Patient. Please use the patient portal.');
        logout();
        router.push('/');
      }
    }
  }, [user, router, logout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!/^\d{10}$/.test(mobile)) {
      setErrorMsg('Please enter a valid 10-digit mobile number / User ID.');
      return;
    }
    if (!/^\d{4}$/.test(passcode)) {
      setErrorMsg('Passcode must be a 4-digit PIN number.');
      return;
    }

    // Verify role before logging in (only admins and doctors are allowed on this portal)
    const targetUser = users.find((u) => u.mobile === mobile);
    if (targetUser && targetUser.role === 'consumer') {
      alert('Patient accounts must log in via the patient portal.');
      router.push('/');
      return;
    }

    setLoading(true);
    try {
      const success = await login(mobile, passcode);
      if (!success) {
        setErrorMsg('Authentication failed. Invalid credentials.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An error occurred during sign-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans relative overflow-hidden px-4 sm:px-6">
      {/* Background Decorative Radial Gradients */}
      <div className="absolute top-[-10%] left-[-10%] h-[50vh] w-[50vh] rounded-full bg-purple-600/10 filter blur-[120px] animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[50vh] w-[50vh] rounded-full bg-teal-600/10 filter blur-[120px] animate-pulse duration-[8000ms]" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Back Link */}
        <div className="text-left">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Patient Portal
          </Link>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-2xl shadow-xl shadow-purple-500/5 mb-2">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
            Staff & Clinician Portal
          </h1>
          <p className="text-xs text-slate-400">
            Secure administrative control room and clinician workspace.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {errorMsg && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-2.5 text-left text-xs text-red-400 animate-in fade-in duration-200">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* User ID / Mobile */}
            <div className="space-y-1.5">
              <label htmlFor="mobile" className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Staff Mobile Number / User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="mobile"
                  name="mobile"
                  type="text"
                  required
                  placeholder="e.g. 8888888888"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-purple-500 text-slate-100 rounded-2xl text-sm transition-all focus:outline-none placeholder-slate-600 focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Passcode / Password */}
            <div className="space-y-1.5">
              <label htmlFor="passcode" className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Security PIN Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="passcode"
                  name="passcode"
                  type="password"
                  required
                  placeholder="4-Digit security PIN"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  disabled={loading}
                  maxLength={4}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-purple-500 text-slate-100 rounded-2xl text-sm transition-all focus:outline-none placeholder-slate-600 focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Admin Demo Mobile: 8368825928, PIN: 1234 | Doctor Demo Mobile: 8888888888, PIN: 1234
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-750 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold rounded-2xl text-xs transition-all shadow-lg hover:shadow-purple-500/10 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Authenticating Credentials...
                </>
              ) : (
                'Secure Sign In 🔓'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-[10px] text-slate-600">
            Ananya Enterprises Healthcare Services Admin Panel. Authorized access only.
          </p>
        </div>
      </div>
    </div>
  );
}
