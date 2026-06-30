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
  ClipboardList,
  Trash2
} from 'lucide-react';

export const parseAppointmentDateTime = (dateStr: string, slotStr: string): Date => {
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date();
    const [year, month, day] = parts.map(Number);
    let hours = 9;
    let minutes = 0;
    if (slotStr) {
      const match = slotStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        const modifier = match[3].toUpperCase();
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
      }
    }
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  } catch (e) {
    return new Date(dateStr);
  }
};

const getMeetingTimeInfo = (dateStr: string, slotStr: string) => {
  const now = new Date();
  const apptTime = parseAppointmentDateTime(dateStr, slotStr);
  const diffMs = apptTime.getTime() - now.getTime();
  
  const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  const isAptToday = dateStr === today;
  const isPast = !isAptToday && apptTime.getTime() < now.getTime();
  const isUpcoming = !isAptToday && apptTime.getTime() > now.getTime();

  // Live 2 hours before the schedule
  const twoHoursMs = 2 * 60 * 60 * 1000;
  const isLive = isAptToday && (diffMs <= twoHoursMs);

  return {
    isLive,
    isAptToday,
    isUpcoming,
    isPast,
    diffMs,
    apptTime
  };
};

const getTimerText = (diffMs: number) => {
  const liveTimeMs = diffMs - (2 * 60 * 60 * 1000); // Time until 2 hours before appt
  if (liveTimeMs <= 0) {
    return "Live soon";
  }
  const totalMinutes = Math.floor(liveTimeMs / (60 * 1000));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  if (days > 0) {
    const remainingHours = totalHours % 24;
    return `Live in ${days}d ${remainingHours}h`;
  } else {
    const minutes = totalMinutes % 60;
    return `Live in ${totalHours}h ${minutes}m`;
  }
};

interface PrescribedItem {
  name: string;
  qtyValue: string;
  qtyUnit: string;
  frequency: string;
  foodTiming: string;
  mealTiming?: string;
}

export default function DoctorDashboard() {
  const { user, appointments, updateAppointmentStatus, doctors, updateDoctor, medicines } = useApp();
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);

  // Prescription Writer Modal
  const [activePrescribingApt, setActivePrescribingApt] = useState<Appointment | null>(null);
  const [clinicNotes, setClinicNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Structured prescription states
  const [prescribedItems, setPrescribedItems] = useState<PrescribedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [qtyValue, setQtyValue] = useState('1');
  const [qtyUnit, setQtyUnit] = useState<'tablet' | 'ml' | 'spoon'>('tablet');
  const [frequency, setFrequency] = useState<'1' | '2' | '3'>('1');
  const [foodTiming, setFoodTiming] = useState<'before' | 'after'>('after');
  const [mealTiming, setMealTiming] = useState<'breakfast' | 'lunch' | 'dinner'>('breakfast');

  // Derived suggestions from search input
  const suggestions = searchQuery.trim() === '' 
    ? [] 
    : medicines.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSelectMed = (name: string) => {
    setSearchQuery(name);
    setShowSuggestions(false);
  };

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      alert('Please enter or select a medicine name');
      return;
    }
    const newItem = {
      name: searchQuery.trim(),
      qtyValue,
      qtyUnit,
      frequency,
      foodTiming,
      mealTiming: frequency === '1' ? mealTiming : undefined
    };
    setPrescribedItems([...prescribedItems, newItem]);
    
    // Reset selection fields
    setSearchQuery('');
    setQtyValue('1');
    setQtyUnit('tablet');
    setFrequency('1');
    setFoodTiming('after');
    setMealTiming('breakfast');
  };

  const handleRemoveItem = (index: number) => {
    setPrescribedItems(prescribedItems.filter((_, i) => i !== index));
  };

  // Availability Settings States
  const doctorProfile = doctors.find((d) => d.uid === user?.uid);
  const [editDays, setEditDays] = useState<string[]>([]);
  const [editSlots, setEditSlots] = useState<string[]>([]);

  useEffect(() => {
    if (doctorProfile) {
      const timer = setTimeout(() => {
        setEditDays(doctorProfile.availability.days);
        setEditSlots(doctorProfile.availability.slots);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [doctorProfile]);

  // Security Redirects
  useEffect(() => {
    if (!user) {
      router.push('/admin-login');
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
    // Parse notes to retrieve only clinical notes if we previously formatted it, or load raw notes
    const rawNotes = apt.notes || '';
    const cleanNotes = rawNotes.includes('DIAGNOSIS & CLINICAL NOTES:')
      ? rawNotes.split('DIAGNOSIS & CLINICAL NOTES:')[1].split('PRESCRIBED MEDICINES:')[0].trim()
      : rawNotes;
    setClinicNotes(cleanNotes);
    setPrescribedItems(apt.prescriptionMedicines || []);
  };

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePrescribingApt) return;
    if (!clinicNotes.trim() && prescribedItems.length === 0) {
      alert('Please enter clinical diagnostic notes or add at least one medicine.');
      return;
    }

    setLoading(true);
    // Simulate prescription network sync
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let formattedNotes = clinicNotes.trim();
    if (prescribedItems.length > 0) {
      const medListText = prescribedItems.map((item, idx) => {
        const timingText = item.foodTiming === 'before' ? 'Before Food' : 'After Food';
        const mealText = item.mealTiming ? ` (${item.mealTiming.toUpperCase()})` : '';
        return `${idx + 1}. ${item.name} -- ${item.qtyValue} ${item.qtyUnit}(s), ${item.frequency} times a day [${timingText}${mealText}]`;
      }).join('\n');
      
      formattedNotes = `DIAGNOSIS & CLINICAL NOTES:\n${clinicNotes.trim() || 'General medical review.'}\n\nPRESCRIBED MEDICINES:\n${medListText}`;
    }

    updateAppointmentStatus(activePrescribingApt.id, 'completed', formattedNotes, undefined, {
      prescriptionMedicines: prescribedItems,
      prescriptionReleased: false
    });

    setLoading(false);
    setActivePrescribingApt(null);
    setClinicNotes('');
    setPrescribedItems([]);
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
              <span className="text-slate-400">Today&apos;s Schedule</span>
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
              Today&apos;s Consultation Schedule ({todayApts.length})
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
                      {apt.status === 'approved' && (() => {
                        const timeInfo = getMeetingTimeInfo(apt.date, apt.timeSlot);
                        return (
                          <div className="flex flex-wrap gap-2">
                            {timeInfo.isPast ? (
                              <button
                                disabled
                                className="py-2 px-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-50"
                              >
                                <MessageSquare className="h-3.5 w-3.5" /> Chat Disabled
                              </button>
                            ) : (
                              <button
                                onClick={() => router.push(`/dashboard/chat/${apt.id}`)}
                                className="py-2 px-4 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 border border-teal-200/20 text-teal-600 dark:text-teal-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                              >
                                <MessageSquare className="h-3.5 w-3.5" /> Patient Chat
                              </button>
                            )}

                            {timeInfo.isLive ? (
                              apt.meetingLink ? (
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
                              )
                            ) : (timeInfo.isUpcoming || (timeInfo.isAptToday && !timeInfo.isLive)) ? (
                              <span className="py-2 px-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-bold flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> {getTimerText(timeInfo.diffMs)}
                              </span>
                            ) : null}

                            <button
                              onClick={() => handleOpenPrescriptionWriter(apt)}
                              className="py-2 px-4 bg-slate-900 dark:bg-white text-slate-100 dark:text-slate-950 rounded-xl text-xs font-bold transition-all shadow hover:scale-[1.01]"
                            >
                              📝 Complete & Prescribe
                            </button>
                          </div>
                        );
                      })()}

                      {/* COMPLETED STATUS */}
                      {apt.status === 'completed' && (
                        <div className="flex gap-2">
                          <button
                            disabled
                            className="py-2 px-3 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-50"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Chat Disabled
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

            {/* CLINIC AVAILABILITY CALENDAR MANAGER */}
            {doctorProfile && (
              <div className="glass-card p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-5 mt-6 text-left">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
                  <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-purple-500" />
                    Manage Consultation Calendar
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Configure your working days and daily consultation slots dynamically.</p>
                </div>

                {/* Days Editor */}
                <div className="space-y-2 text-xs">
                  <label className="text-slate-400 font-bold block">Available Days *</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                      const isChecked = editDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setEditDays(editDays.filter((d) => d !== day));
                            } else {
                              setEditDays([...editDays, day]);
                            }
                          }}
                          className={`py-1.5 px-3 rounded-lg border text-[9px] font-bold uppercase transition-all ${
                            isChecked
                              ? 'bg-purple-950/40 border-purple-500 text-purple-400 font-extrabold'
                              : 'border-slate-800 bg-transparent text-slate-400 hover:border-slate-850'
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slots Editor */}
                <div className="space-y-2 text-xs">
                  <label className="text-slate-400 font-bold block">Time Slots *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 10:30 AM"
                      id="doc-new-slot-input"
                      className="flex-1 p-2 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-semibold text-slate-255"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val && !editSlots.includes(val)) {
                            setEditSlots([...editSlots, val]);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('doc-new-slot-input') as HTMLInputElement;
                        const val = input?.value.trim();
                        if (val && !editSlots.includes(val)) {
                          setEditSlots([...editSlots, val]);
                          input.value = '';
                        }
                      }}
                      className="py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 pt-1.5 max-h-36 overflow-y-auto pr-1">
                    {editSlots.length === 0 ? (
                      <span className="text-[10px] text-slate-500">No time slots configured.</span>
                    ) : (
                      editSlots.map((slot) => (
                        <span
                          key={slot}
                          className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 text-slate-350 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold"
                        >
                          {slot}
                          <button
                            type="button"
                            onClick={() => setEditSlots(editSlots.filter((s) => s !== slot))}
                            className="text-red-500 hover:text-red-400 ml-1 font-bold text-xs"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (editDays.length === 0) {
                      alert('Please select at least one available day.');
                      return;
                    }
                    if (editSlots.length === 0) {
                      alert('Please add at least one available time slot.');
                      return;
                    }
                    updateDoctor(doctorProfile.uid, {
                      availability: { days: editDays, slots: editSlots }
                    });
                    alert('Your clinical schedule and available time slots have been successfully updated!');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all hover:scale-[1.01]"
                >
                  Save Clinic Schedule
                </button>
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
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-left max-h-[90vh] overflow-y-auto">
            
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
                  <span className="text-slate-400 block text-[9px] font-bold uppercase">Patient Name</span>
                  <span className="font-bold">{activePrescribingApt.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase">Ref Code</span>
                  <span className="font-mono font-bold">{activePrescribingApt.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase">Appt Date</span>
                  <span className="font-bold">{activePrescribingApt.date}</span>
                </div>
              </div>

              {/* Consultation Notes text area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-450 dark:text-slate-350">Diagnostic Summary & General Advice</label>
                <textarea
                  placeholder="Enter patient diagnosis summary or clinical recommendations..."
                  rows={2}
                  disabled={activePrescribingApt.status === 'completed'}
                  value={clinicNotes}
                  onChange={(e) => setClinicNotes(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500 font-sans leading-relaxed"
                />
              </div>

              {/* Structured Medication Builder */}
              {activePrescribingApt.status !== 'completed' && (
                <div className="p-4 bg-slate-50/50 dark:bg-slate-850/30 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                    ⚕️ Add Prescribed Medication
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Medicine Search Autocomplete */}
                    <div className="space-y-1.5 relative">
                      <label className="text-[10px] font-bold text-slate-400">Search Medicine Formulation</label>
                      <input
                        type="text"
                        placeholder="Type to search (e.g. Paracetamol, Lipitor...)"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowSuggestions(true);
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-550"
                      />
                      
                      {/* Suggestion list */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-[110] text-[11px]">
                          {suggestions.map((m) => (
                            <div
                              key={m.id}
                              onClick={() => handleSelectMed(m.name)}
                              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer font-semibold border-b border-slate-100 dark:border-slate-850 last:border-b-0 text-slate-700 dark:text-slate-200"
                            >
                              💊 {m.name} <span className="text-[9px] text-slate-400 font-normal">({m.category})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quantity & Unit */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400">Quantity & Unit</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. 1, 5, 10"
                          value={qtyValue}
                          onChange={(e) => setQtyValue(e.target.value)}
                          className="w-20 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none text-center focus:ring-1 focus:ring-teal-550"
                        />
                        <div className="flex-1 flex gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
                          {['tablet', 'ml', 'spoon'].map((unit) => (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => setQtyUnit(unit as 'tablet' | 'ml' | 'spoon')}
                              className={`flex-1 py-1 px-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                                qtyUnit === unit
                                  ? 'bg-teal-500 text-white dark:bg-teal-600 shadow'
                                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                              }`}
                            >
                              {unit}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Frequency */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400">Daily Frequency</label>
                      <div className="flex gap-1.5">
                        {['1', '2', '3'].map((freq) => (
                          <button
                            key={freq}
                            type="button"
                            onClick={() => setFrequency(freq as '1' | '2' | '3')}
                            className={`flex-1 py-2 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                              frequency === freq
                                ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400'
                                : 'border-slate-200 dark:border-slate-750 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
                            }`}
                          >
                            {freq} Time(s) daily
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timing (Before/After Food) */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400">Timing (Before/After Food)</label>
                      <div className="flex gap-1.5">
                        {['before', 'after'].map((timing) => (
                          <button
                            key={timing}
                            type="button"
                            onClick={() => setFoodTiming(timing as 'before' | 'after')}
                            className={`flex-1 py-2 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                              foodTiming === timing
                                ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400'
                                : 'border-slate-200 dark:border-slate-750 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
                            }`}
                          >
                            {timing === 'before' ? 'Before Food' : 'After Food'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Meal Specific Timing (Specially for Frequency 1) */}
                  {frequency === '1' && (
                    <div className="space-y-1.5 max-w-md">
                      <label className="text-[10px] font-bold text-slate-450 dark:text-slate-350">Meal Timing Option (Required for 1x Daily)</label>
                      <div className="flex gap-1.5">
                        {['breakfast', 'lunch', 'dinner'].map((meal) => (
                          <button
                            key={meal}
                            type="button"
                            onClick={() => setMealTiming(meal as 'breakfast' | 'lunch' | 'dinner')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                              mealTiming === meal
                                ? 'bg-teal-550/20 border-teal-500 text-teal-650 dark:text-teal-400 font-extrabold'
                                : 'border-slate-200 dark:border-slate-750 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
                            }`}
                          >
                            {meal.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="py-2 px-4 bg-teal-650 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                    >
                      <span>➕ Add to Prescription List</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Active Prescribed Medicines Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  Prescribed Medication List ({prescribedItems.length})
                </h4>
                {prescribedItems.length === 0 ? (
                  <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-[10px] text-slate-400 font-semibold">
                    No medications added yet. Use the tool above to add drugs to the prescription sheet.
                  </div>
                ) : (
                  <div className="border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-slate-950/20">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-850/40 text-slate-400 font-bold">
                          <th className="py-2 px-3">Medicine</th>
                          <th className="py-2 px-3">Dosage Qty</th>
                          <th className="py-2 px-3">Frequency & Timing</th>
                          {activePrescribingApt.status !== 'completed' && <th className="py-2 px-3 text-right">Remove</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {prescribedItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-100/40 dark:hover:bg-slate-800/20 font-medium">
                            <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">{item.name}</td>
                            <td className="py-2.5 px-3 font-mono">{item.qtyValue} {item.qtyUnit}(s)</td>
                            <td className="py-2.5 px-3 text-[10px]">
                              <span className="capitalize">{item.frequency} times daily</span>
                              <span className="text-slate-400 capitalize"> ({item.foodTiming} food{item.mealTiming ? ` - ${item.mealTiming}` : ''})</span>
                            </td>
                            {activePrescribingApt.status !== 'completed' && (
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 p-1 rounded-lg transition-all"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActivePrescribingApt(null);
                    setClinicNotes('');
                    setPrescribedItems([]);
                  }}
                  className="py-2.5 px-4 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 text-xs font-bold rounded-xl"
                >
                  Close
                </button>
                {activePrescribingApt.status !== 'completed' && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 px-5 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
