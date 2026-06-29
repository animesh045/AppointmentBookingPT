'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { CartDrawer } from '@/components/CartDrawer';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  FileText, 
  Stethoscope, 
  ChevronLeft, 
  Award, 
  AlertCircle,
  CheckCircle,
  ThumbsUp
} from 'lucide-react';

export default function BookAppointment() {
  const { user, doctors, bookAppointment } = useApp();
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);

  // Form States
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const DEFAULT_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

  // Redirect to login if needed
  useEffect(() => {
    if (!user) {
      router.push('/');
    } else if (user.role !== 'consumer') {
      router.push('/');
    }
  }, [user, router]);

  if (!user || user.role !== 'consumer') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      alert('Please select a preferred consultation date');
      return;
    }
    if (!selectedSlot) {
      alert('Please select an available consultation slot');
      return;
    }

    setLoading(true);
    try {
      await bookAppointment({
        doctorId: 'pending',
        doctorName: 'Pending Assignment',
        specialty: 'General Consultation',
        date: selectedDate,
        timeSlot: selectedSlot,
        reason: 'General Medical Consultation',
        fees: 0
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      alert('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  // Prevent selecting past dates
  const todayString = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar onOpenCart={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        
        {/* Back Link */}
        <div className="flex items-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-all"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </button>
        </div>

        {success ? (
          /* SUCCESS BANNER */
          <div className="glass-card p-12 text-center rounded-3xl space-y-4 max-w-md mx-auto animate-in zoom-in-95 duration-200">
            <div className="h-16 w-16 bg-teal-100 dark:bg-teal-900/40 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto">
              <CheckCircle className="h-10 w-10 animate-bounce" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Consultation Booked!</h2>
            <p className="text-xs text-slate-400 leading-relaxed px-4">
              Your appointment request has been logged. We will notify you instantly upon doctor assignment and approval by clinical administration.
            </p>
            <p className="text-[10px] text-teal-500 font-bold animate-pulse">Redirecting you to dashboard...</p>
          </div>
        ) : (
          <div className="max-w-md mx-auto text-left">
            <div className="glass-card p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-5">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <CalendarIcon className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
                Schedule Consultation
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
                
                {/* Info Box */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                  <span className="text-base leading-none">ℹ️</span>
                  <p className="leading-relaxed">
                    Select your preferred date and slot. A qualified clinical specialist will be assigned to your session by the administration.
                  </p>
                </div>

                {/* Choose Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <CalendarIcon className="h-3.5 w-3.5" /> Select Consultation Date
                  </label>
                  <input
                    type="date"
                    required
                    min={todayString}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Slot Picker Grid */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Available Consultation Slots
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {DEFAULT_SLOTS.map((slot: string) => {
                      const isPicked = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-3 border rounded-xl text-[11px] font-bold transition-all text-center ${
                            isPicked
                              ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400'
                              : 'border-slate-150 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-500/10 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 mt-2"
                >
                  {loading ? (
                    <>
                      <span className="h-4.5 w-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Logging Booking Request...
                    </>
                  ) : (
                    'Confirm Booking Request'
                  )}
                </button>

              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
