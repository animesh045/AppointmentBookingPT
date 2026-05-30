'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, Appointment } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { CartDrawer } from '@/components/CartDrawer';
import { 
  Calendar, 
  Check, 
  X, 
  CheckCircle, 
  Video, 
  MessageSquare, 
  User, 
  Clock, 
  FileSpreadsheet, 
  Activity, 
  Stethoscope, 
  ChevronRight,
  ClipboardList
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user, appointments, updateAppointmentStatus } = useApp();
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);

  // Prescription Writer Modal
  const [activePrescribingApt, setActivePrescribingApt] = useState<Appointment | null>(null);
  const [clinicNotes, setClinicNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Security Redirects
  useEffect(() => {
    if (!user) {
      router.push('/');
    } else if (user.role === 'consumer') {
      router.push('/dashboard');
    } else if (user.role === 'admin') {
      router.push('/admin');
    }
  }, [user, router]);

  if (!user || user.role !== 'doctor') return null;

  // Filter appointments assigned to this doctor
  const doctorApts = appointments.filter((a) => a.doctorId === user.uid);
  
  const todayString = new Date().toISOString().split('T')[0];
  const todayApts = doctorApts.filter((a) => a.date === todayString && a.status !== 'rejected');
  const upcomingApts = doctorApts.filter((a) => a.date !== todayString && a.status !== 'rejected');

  const handleApprove = (id: string) => {
    updateAppointmentStatus(id, 'approved');
  };

  const handleReject = (id: string) => {
    updateAppointmentStatus(id, 'rejected');
  };

  const handleOpenPrescriptionWriter = (apt: Appointment) => {
    setActivePrescribingApt(apt);
    setClinicNotes(apt.notes || '');
  };

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePrescribingApt) return;
    if (!clinicNotes.trim()) {
      alert('Please enter clinical diagnostic notes or prescription details.');
      return;
    }

    setLoading(true);
    // Simulate prescription network sync
    await new Promise((resolve) => setTimeout(resolve, 1000));
    updateAppointmentStatus(activePrescribingApt.id, 'completed', clinicNotes);
    setLoading(false);
    setActivePrescribingApt(null);
    setClinicNotes('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar onOpenCart={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 animate-in fade-in duration-300">
        
        {/* Practitioner Banner */}
        <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/10 rounded-full filter blur-3xl" />
          <div className="space-y-1 relative">
            <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Medical Wing Portal</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100">
              Welcome, {user.name}! 🩺
            </h1>
            <p className="text-xs text-slate-400">
              Access your daily clinical list, review patient notes, and update prescriptions.
            </p>
          </div>
          <div className="flex gap-4 items-center bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl relative text-xs">
            <div>
              <span className="text-slate-400">Today's Schedule</span>
              <p className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mt-0.5">{todayApts.filter(a=>a.status === 'approved').length} Active</p>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-slate-400">Pending Requests</span>
              <p className="font-extrabold text-amber-500 text-sm mt-0.5">{doctorApts.filter(a=>a.status === 'pending').length} Requests</p>
            </div>
          </div>
        </div>

        {/* Schedule Splitting Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* TODAY'S CONSULTATIONS PANEL (Col Span 7) */}
          <section className="lg:col-span-7 space-y-4">
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Stethoscope className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
              Today's Consultation Schedule ({todayApts.length})
            </h2>

            {todayApts.length === 0 ? (
              <div className="glass-card p-12 text-center rounded-3xl space-y-2">
                <ClipboardList className="h-8 w-8 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 dark:text-slate-300">No appointments scheduled today</h3>
                <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                  Patient bookings scheduled for today will surface here immediately.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayApts.map((apt) => (
                  <div
                    key={apt.id}
                    className="glass-card p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 hover:shadow text-left"
                  >
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/60">
                      <div>
                        <span className="text-[9px] text-slate-400 font-mono font-bold uppercase">{apt.id}</span>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{apt.patientName}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Mobile: +91 {apt.patientMobile}</p>
                      </div>
                      
                      {/* Booking status badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        apt.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' :
                        apt.status === 'completed' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' :
                        'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      }`}>
                        {apt.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-400">Scheduled Time</span>
                          <p className="font-bold mt-0.5">🕒 {apt.timeSlot}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Consultation Fee</span>
                          <p className="font-bold text-teal-600 dark:text-teal-400 mt-0.5">₹{apt.fees} ({apt.paymentStatus === 'paid' ? 'Paid' : 'Pending'})</p>
                        </div>
                      </div>
                      <div className="border-t border-slate-100 dark:border-slate-800/60 pt-2">
                        <span className="text-slate-400">Complaint / Visit Reason</span>
                        <p className="font-semibold text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                          {apt.reason}
                        </p>
                      </div>
                    </div>

                    {/* Action Block */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap gap-2 justify-end">
                      
                      {/* PENDING APPROVAL CONTROLS */}
                      {apt.status === 'pending' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleReject(apt.id)}
                            className="flex-1 sm:flex-initial py-2 px-4 border border-red-200 dark:border-red-950 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                          <button
                            onClick={() => handleApprove(apt.id)}
                            className="flex-1 sm:flex-initial py-2 px-5 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md shadow-teal-500/10"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve Booking
                          </button>
                        </div>
                      )}

                      {/* APPROVED & ACTIVE CONTROLS */}
                      {apt.status === 'approved' && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/chat/${apt.id}`)}
                            className="py-2 px-4 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 border border-teal-200/20 text-teal-600 dark:text-teal-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Patient Chat
                          </button>

                          {apt.meetingLink ? (
                            <a
                              href={apt.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all"
                            >
                              <Video className="h-3.5 w-3.5" /> Join Meet Video
                            </a>
                          ) : (
                            <span className="py-2 px-3 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-400 rounded-xl flex items-center">
                              No meeting link assigned
                            </span>
                          )}

                          <button
                            onClick={() => handleOpenPrescriptionWriter(apt)}
                            className="py-2 px-4 bg-slate-900 dark:bg-white text-slate-100 dark:text-slate-950 rounded-xl text-xs font-bold transition-all shadow hover:scale-[1.01]"
                          >
                            📝 Complete & Prescribe
                          </button>
                        </div>
                      )}

                      {/* COMPLETED STATUS */}
                      {apt.status === 'completed' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/chat/${apt.id}`)}
                            className="py-2 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Chat Archive
                          </button>
                          <button
                            onClick={() => handleOpenPrescriptionWriter(apt)}
                            className="py-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all"
                          >
                            👁️ View Prescription Record
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* UPCOMING CLINICAL SESSIONS (Col Span 5 - Right) */}
          <section className="lg:col-span-5 space-y-4 text-left">
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
              Upcoming Consultation Grid ({upcomingApts.length})
            </h2>

            {upcomingApts.length === 0 ? (
              <div className="glass-card p-12 text-center rounded-3xl space-y-2">
                <Clock className="h-8 w-8 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 dark:text-slate-300">No upcoming consultations</h3>
                <p className="text-xs text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                  Bookings scheduled for future dates will render here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingApts.map((apt) => (
                  <div
                    key={apt.id}
                    className="glass-card p-4 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block font-mono">{apt.id}</span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{apt.patientName}</h4>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        apt.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' :
                        'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                      }`}>
                        {apt.status}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400">Date</span>
                        <p className="font-bold mt-0.5">📅 {apt.date}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Time Slot</span>
                        <p className="font-bold mt-0.5">🕒 {apt.timeSlot}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>

      {/* ==========================================
          IMMERSIVE PRESCRIPTION WRITER MODAL
          ========================================== */}
      {activePrescribingApt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <ClipboardList className="h-5 w-5 text-teal-600" /> 
                Clinical Prescription Writer
              </h3>
              <button
                onClick={() => setActivePrescribingApt(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrescription} className="space-y-4">
              {/* Patient mini summary card */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Patient Name</span>
                  <span className="font-bold">{activePrescribingApt.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ref Code</span>
                  <span className="font-mono font-bold">{activePrescribingApt.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Appt Date</span>
                  <span className="font-bold">{activePrescribingApt.date}</span>
                </div>
              </div>

              {/* Consultation Notes text area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Diagnostic Summary & Prescription Formulations *</label>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Define the diagnosis, write general patient notes, and specify exact drug schedules (e.g. Lipitor 10mg: Once daily, Dolo 650mg: SOS pain).
                </p>
                <textarea
                  placeholder="Enter patient diagnosis summary. Write names, dosages, and guidelines..."
                  required
                  rows={8}
                  disabled={activePrescribingApt.status === 'completed'}
                  value={clinicNotes}
                  onChange={(e) => setClinicNotes(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActivePrescribingApt(null)}
                  className="py-2.5 px-4 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 text-xs font-bold rounded-xl"
                >
                  Close
                </button>
                {activePrescribingApt.status !== 'completed' && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 px-5 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow"
                  >
                    {loading ? 'Submitting Form...' : 'Seal & Send Consultation'}
                  </button>
                )}
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="py-6 border-t border-slate-200/50 dark:border-slate-900/50 text-center text-xs text-slate-400 bg-white/60 dark:bg-slate-950 mt-auto">
        <p className="font-bold text-slate-500 dark:text-slate-400">ANANYA ENTERPRISES SYSTEM</p>
        <p className="mt-1 text-[10px]">Created by Animesh • Secure Clinic and Stock Platform</p>
      </footer>
    </div>
  );
}
