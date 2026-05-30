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
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect to login if needed
  useEffect(() => {
    if (!user) {
      router.push('/');
    } else if (user.role !== 'consumer') {
      router.push('/');
    }
  }, [user, router]);

  if (!user || user.role !== 'consumer') return null;

  const handleSelectDoctor = (doc: any) => {
    setSelectedDoctor(doc);
    setSelectedSlot('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) {
      alert('Please choose a consultant first');
      return;
    }
    if (!selectedDate) {
      alert('Please select a preferred consultation date');
      return;
    }
    if (!selectedSlot) {
      alert('Please select an available consultation slot');
      return;
    }
    if (!reason.trim()) {
      alert('Please enter a brief reason for your clinical visit');
      return;
    }

    setLoading(true);
    try {
      await bookAppointment({
        doctorId: selectedDoctor.uid,
        doctorName: selectedDoctor.name,
        specialty: selectedDoctor.specialty,
        date: selectedDate,
        timeSlot: selectedSlot,
        reason: reason,
        fees: selectedDoctor.fees
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
              Your appointment request with <span className="font-extrabold text-slate-700 dark:text-slate-200">{selectedDoctor?.name}</span> has been logged. We will notify you instantly upon approval by clinical administration.
            </p>
            <p className="text-[10px] text-teal-500 font-bold animate-pulse">Redirecting you to dashboard...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
            
            {/* DOCTOR DIRECTORY SELECTOR (Col Span 7) */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Stethoscope className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
                Select a Specialized Consultant
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {doctors.map((doc) => {
                  const isSelected = selectedDoctor?.uid === doc.uid;
                  return (
                    <div
                      key={doc.uid}
                      onClick={() => handleSelectDoctor(doc)}
                      className={`glass-card p-5 rounded-3xl border cursor-pointer hover:shadow-md transition-all flex gap-4 ${
                        isSelected 
                          ? 'border-teal-500 ring-1 ring-teal-500/50 bg-teal-500/5 dark:bg-teal-950/10' 
                          : 'border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <img
                        src={doc.profilePicture}
                        alt={doc.name}
                        className="h-16 w-16 rounded-2xl object-cover shadow-inner flex-shrink-0 border border-slate-100 dark:border-slate-800"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{doc.name}</h3>
                          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-extrabold text-teal-600 dark:text-teal-400">
                            ₹{doc.fees}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{doc.specialty}</p>
                        
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold pt-1.5">
                          <span className="inline-flex items-center gap-0.5 text-amber-500">⭐ {doc.rating || 5.0}</span>
                          <span>•</span>
                          <span>{doc.availability.days.length} Days Available</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DATE & TIME SLOT BOOKING PANEL (Col Span 5) */}
            <div className="lg:col-span-5">
              <div className="glass-card p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-5">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800">
                  Appointment Parameters
                </h3>

                {selectedDoctor ? (
                  <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
                    
                    {/* Selected doctor summary badge */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 font-medium">Selected Consultant</p>
                        <p className="font-bold text-teal-600 dark:text-teal-400 mt-0.5">{selectedDoctor.name}</p>
                      </div>
                      <span className="text-[10px] bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-bold px-2 py-0.5 rounded-full uppercase">
                        {selectedDoctor.specialty.split(' ')[0]}
                      </span>
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
                        {selectedDoctor.availability.slots.map((slot: string) => {
                          const isPicked = selectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-2 px-3 border rounded-xl text-[11px] font-bold transition-all text-center ${
                                isPicked
                                  ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400'
                                  : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reason text */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" /> Reason for Clinical Visit
                      </label>
                      <textarea
                        placeholder="Detail symptoms or clinical queries (e.g., General health review, chest pain details, prescription refill...)"
                        required
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none min-h-[60px]"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-500/10 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                    >
                      {loading ? (
                        <>
                          <span className="h-4.5 w-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Logging Booking Request...
                        </>
                      ) : (
                        `Confirm Booking Request (₹${selectedDoctor.fees})`
                      )}
                    </button>

                  </form>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-medium px-4">
                      Please select a doctor from the roster directory to unlock the booking slots date control.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
