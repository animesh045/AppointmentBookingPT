'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, Appointment, Order, UserProfile } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { CartDrawer } from '@/components/CartDrawer';
import { jsPDF } from 'jspdf';
import { 
  Calendar, 
  ShoppingBag, 
  MessageSquare, 
  PhoneCall, 
  CreditCard, 
  Download, 
  Video, 
  CheckCircle, 
  Clock, 
  XCircle,
  FileText,
  Truck,
  Package,
  Activity,
  AlertCircle,
  Phone,
  User as UserIcon,
  MapPin
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

export default function ConsumerDashboard() {
  const { user, appointments, payConsultationFee, orders, medicines, updateAppointmentStatus, updateProfile } = useApp();
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);

  // Razorpay Simulation States
  const [activePaymentApt, setActivePaymentApt] = useState<Appointment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Prescription Viewer State
  const [activeViewPrescriptionApt, setActiveViewPrescriptionApt] = useState<Appointment | null>(null);

  // Profile Modification States
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileAge, setProfileAge] = useState(25);
  const [profileGender, setProfileGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [profilePasscode, setProfilePasscode] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const handleOpenProfileModal = () => {
    if (!user) return;
    setProfileName(user.name);
    setProfileEmail(user.email || '');
    setProfileAge(user.age);
    setProfileGender(user.gender);
    setProfilePasscode(user.passcode);
    setProfileAddress(user.address);
    setProfileOpen(true);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          if (data && data.display_name) {
            setProfileAddress(data.display_name);
          } else {
            setProfileAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } catch (error) {
          console.error(error);
          alert('Could not fetch address details. Falling back to coordinates.');
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error(error);
        alert(`Location Access Error: ${error.message}. Please enter manually.`);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      alert('Full Name is required');
      return;
    }
    if (!/^\d{4}$/.test(profilePasscode)) {
      alert('Security PIN must be a 4-digit number');
      return;
    }
    if (!profileAddress.trim()) {
      alert('Residential Address is required');
      return;
    }

    updateProfile({
      name: profileName,
      email: profileEmail || undefined,
      age: Number(profileAge),
      gender: profileGender,
      passcode: profilePasscode,
      address: profileAddress
    });

    setProfileOpen(false);
    alert('Your patient profile was successfully updated!');
  };



  // Redirect to landing page if not logged in or role is different
  useEffect(() => {
    if (!user) {
      router.push('/');
    } else if (user.role === 'admin') {
      router.push('/admin');
    } else if (user.role === 'doctor') {
      router.push('/doctor');
    }
  }, [user, router]);



  if (!user || user.role !== 'consumer') return null;

  // Filter lists for current patient
  const patientApts = appointments.filter((a) => a.patientId === user.uid);
  const patientOrders = orders.filter((o) => o.patientId === user.uid);

  // Trigger simulated payment
  const handleOpenPayment = (apt: Appointment) => {
    setActivePaymentApt(apt);
  };

  const handleProcessPayment = async () => {
    if (!activePaymentApt) return;
    setPaymentProcessing(true);
    // Simulate Razorpay secure token processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await payConsultationFee(activePaymentApt.id, paymentMethod);
    setPaymentProcessing(false);
    setActivePaymentApt(null);
  };

  // ==========================================
  // PDF GENERATION (RECEIPTS & PRESCRIPTIONS)
  // ==========================================

  // 1. Payment Receipt PDF
  const downloadReceiptPdf = (apt: Appointment) => {
    const doc = new jsPDF();
    
    // Header Branding
    doc.setFillColor(13, 148, 136); // Teal-600
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('ANANYA ENTERPRISES', 15, 20);
    doc.setFontSize(10);
    doc.text('HEALTHCARE CONSULTATION INVOICE RECEIPT', 15, 30);

    // Invoice Metadata
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE TO:', 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${apt.patientName}`, 15, 62);
    doc.text(`Mobile: +91 ${apt.patientMobile}`, 15, 68);
    doc.text(`Age/Gender: ${user.age} yrs / ${user.gender}`, 15, 74);

    doc.setFont('helvetica', 'bold');
    doc.text('RECEIPT DETAILS:', 120, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Receipt ID: ${apt.paymentId || 'MOCK_ID'}`, 120, 62);
    doc.text(`Date Issued: ${new Date(apt.createdAt).toLocaleDateString()}`, 120, 68);
    doc.text(`Status: PAID (Razorpay)`, 120, 74);

    // Table divider line
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 85, 195, 85);

    // Items Header
    doc.setFont('helvetica', 'bold');
    doc.text('Consultation Services Description', 15, 95);
    doc.text('Professional Fee (INR)', 160, 95);
    doc.line(15, 100, 195, 100);

    // Table Content
    doc.setFont('helvetica', 'normal');
    doc.text(`Video Consultation with ${apt.doctorName}`, 15, 110);
    doc.text(`Specialty: ${apt.specialty}`, 15, 116);
    doc.text(`Appt Date: ${apt.date} @ ${apt.timeSlot}`, 15, 122);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${apt.fees}.00`, 160, 110);

    doc.line(15, 130, 195, 130);

    // Total Settle box
    doc.setFillColor(240, 240, 240);
    doc.rect(130, 140, 65, 30, 'F');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.text('Subtotal:', 135, 148);
    doc.text('GST (18%):', 135, 154);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total:', 135, 162);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rs. ${apt.fees}.00`, 170, 148);
    doc.text(`Included`, 170, 154);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 148, 136); // Teal
    doc.text(`Rs. ${apt.fees}.00`, 170, 162);

    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for choosing Ananya Enterprises. This is a computer generated bill requiring no signature.', 15, 270);

    doc.save(`Invoice_${apt.id}.pdf`);
  };

  // 2. Prescription PDF
  const downloadPrescriptionPdf = (apt: Appointment) => {
    const doc = new jsPDF();
    
    // Header Banner
    doc.setFillColor(13, 148, 136); // Teal-600
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('ANANYA HEALTHCARE SERVICES', 15, 22);
    doc.setFontSize(10);
    doc.text('ANANYA ENTERPRISES • PHARMACY & CLINIC HUB', 15, 32);

    // Doctor & Patient Grid
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PRACTITIONER DETAILS:', 15, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(apt.doctorName, 15, 67);
    doc.text(apt.specialty, 15, 73);
    doc.text('Ananya Medical Center Complex', 15, 79);

    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT DOSSIER:', 120, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`Patient Name: ${apt.patientName}`, 120, 67);
    doc.text(`Age/Sex: ${user.age} yrs / ${user.gender}`, 120, 73);
    doc.text(`Mobile: +91 ${apt.patientMobile}`, 120, 79);

    // Divider Line
    doc.setDrawColor(13, 148, 136);
    doc.setLineWidth(1);
    doc.line(15, 88, 195, 88);

    // Medical Symbol Rx
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(13, 148, 136);
    doc.text('Rx', 15, 105);

    // Consultation Notes / Recommendations
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Diagnoses & Clinical Notes:', 15, 118);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    // Notes content
    const notesText = apt.notes || 'Patient complained of mild cardiovascular fatigue. Advised resting, routine active exercises, and hydration. Re-check scheduled for next month. Adjust dosages as required.';
    const splitNotes = doc.splitTextToSize(notesText, 180);
    doc.text(splitNotes, 15, 126);

    if (!apt.notes) {
      // Medication table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Prescribed Medicines & Schedule:', 15, 160);
      doc.line(15, 165, 195, 165);
      
      doc.setFontSize(10);
      doc.text('Medicine Name', 15, 172);
      doc.text('Dosage Schedule', 90, 172);
      doc.text('Duration', 160, 172);
      doc.line(15, 176, 195, 176);

      doc.setFont('helvetica', 'normal');
      doc.text('1. Atorvastatin 10mg (Lipitor)', 15, 184);
      doc.text('Once daily (Before bedtime)', 90, 184);
      doc.text('30 Days', 160, 184);

      doc.text('2. Revital H Multivitamin Capsule', 15, 194);
      doc.text('Once daily (After breakfast)', 90, 194);
      doc.text('15 Days', 160, 194);

      doc.text('3. Paracetamol 650mg (Dolo)', 15, 204);
      doc.text('As needed (SOS for fever/body pain)', 90, 204);
      doc.text('5 Days', 160, 204);

      doc.line(15, 214, 195, 214);
    }

    // Signature Block
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.text('Digitally Authorized by:', 130, 240);
    doc.setFont('helvetica', 'bold');
    doc.text(apt.doctorName, 130, 248);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Ananya Medical Registry Signature Verified', 130, 253);

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.text('Please present this prescription at the Ananya Enterprises Pharmacy desk for a 10% discount on stocks.', 15, 280);

    doc.save(`Prescription_${apt.id}.pdf`);
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full"><CheckCircle className="h-3 w-3" /> Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full"><XCircle className="h-3 w-3" /> Rejected</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full"><CheckCircle className="h-3 w-3" /> Completed</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full"><Clock className="h-3 w-3" /> Pending</span>;
    }
  };

  const getOrderStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'processing':
        return <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase">Processing</span>;
      case 'dispatched':
        return <span className="bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase">Dispatched</span>;
      case 'delivered':
        return <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase">Delivered</span>;
      default:
        return <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase">Pending</span>;
    }
  };

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-950 transition-colors">
      <Navbar onOpenCart={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 animate-in fade-in duration-300">
        
        {/* Welcome Banner */}
        <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/10 rounded-full filter blur-3xl" />
          <div className="space-y-1 text-left relative">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100">
              Welcome back, {user.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-xs text-slate-400">
              Manage your consult bookings, download medical records, and track reservations.
            </p>
          </div>
          <div className="flex gap-3 relative">
            <a
              href="tel:9717098219"
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all shadow justify-center"
            >
              <PhoneCall className="h-3.5 w-3.5 text-teal-500 dark:text-teal-600" />
              Call Pharmacy Desk
            </a>
            <button
              onClick={handleOpenProfileModal}
              className="py-2.5 px-4 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-350 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all shadow justify-center"
            >
              <UserIcon className="h-3.5 w-3.5 text-teal-500" />
              Edit Profile
            </button>
            <button
              onClick={() => router.push('/dashboard/appointments')}
              className="py-2.5 px-4 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-teal-500/15"
            >
              <Calendar className="h-3.5 w-3.5" />
              Book New Consult
            </button>
          </div>
        </div>

        {/* Dashboard Grid split: Appointments on Left, Pharmacy Orders on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* APPOINTMENTS PANEL (Left - Col Span 7) */}
          <section className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" /> 
                Clinical Consultation Roster ({patientApts.length})
              </h2>
            </div>

            {patientApts.length === 0 ? (
              <div className="glass-card p-12 text-center rounded-3xl space-y-3">
                <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-300">No appointments scheduled</h3>
                <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                  Book a specialized consultant for custom advice.
                </p>
                <button
                  onClick={() => router.push('/dashboard/appointments')}
                  className="py-2 px-4 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
                >
                  Schedule Appointment
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {patientApts.map((apt) => (
                  <div
                    key={apt.id}
                    className="glass-card p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 hover:shadow-md transition-all relative overflow-hidden text-left"
                  >
                    {/* Status Badge */}
                    <div className="flex justify-between items-center pb-3.5 border-b border-slate-100 dark:border-slate-800/60">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold font-mono uppercase">{apt.id}</span>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{apt.doctorName}</h3>
                      </div>
                      {getStatusBadge(apt.status)}
                    </div>

                    {/* Metadata details */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400">Specialty</span>
                        <p className="font-bold mt-0.5">{apt.specialty}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Date & Slot</span>
                        <p className="font-bold mt-0.5">{apt.date} • {apt.timeSlot}</p>
                      </div>
                      <div className="col-span-2 border-t border-dashed border-slate-100 dark:border-slate-800/60 pt-2 mt-1">
                        <span className="text-slate-400">Reason for Visit</span>
                        <p className="font-semibold text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{apt.reason}</p>
                      </div>
                    </div>

                    {/* Bottom Action Section depending on status */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap gap-2 justify-between items-center">
                      
                      {/* Pricing badge */}
                      <span className="text-xs font-bold text-slate-500">
                        Consult Fee: <span className="text-teal-600 dark:text-teal-400 text-sm font-extrabold">₹{apt.fees}</span>
                      </span>

                      <div className="flex flex-wrap gap-2">
                        {/* 1. Payment Needed */}
                        {apt.status === 'approved' && apt.paymentStatus === 'pending' && (
                          <button
                            onClick={() => handleOpenPayment(apt)}
                            className="py-2 px-4 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/10 flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            Pay consultation Fee (₹{apt.fees})
                          </button>
                        )}

                        {/* 2. Paid & Approved: Ready to Join Room */}
                        {apt.status === 'approved' && apt.paymentStatus === 'paid' && (() => {
                          const timeInfo = getMeetingTimeInfo(apt.date, apt.timeSlot);
                          return (
                            <>
                              <button
                                onClick={() => downloadReceiptPdf(apt)}
                                className="py-2 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                                title="Download Payment receipt PDF"
                              >
                                <Download className="h-3.5 w-3.5" /> Receipt
                              </button>
                              
                              {timeInfo.isLive ? (
                                apt.meetingLink ? (
                                  <a
                                    href={apt.meetingLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-500/10 transition-all hover:scale-[1.02]"
                                  >
                                    <Video className="h-3.5 w-3.5 animate-pulse" />
                                    Join Meeting Room
                                  </a>
                                ) : (
                                  <span className="py-2 px-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl text-[10px] font-bold">
                                    Waiting for link from Admin
                                  </span>
                                )
                              ) : (timeInfo.isUpcoming || (timeInfo.isAptToday && !timeInfo.isLive)) ? (
                                <span className="py-2 px-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-bold flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {getTimerText(timeInfo.diffMs)}
                                </span>
                              ) : null}
                            </>
                          );
                        })()}

                        {/* 3. Real-Time Patient ↔ Doctor Chat Room */}
                        {(apt.status === 'approved' || apt.status === 'completed') && (() => {
                          const timeInfo = getMeetingTimeInfo(apt.date, apt.timeSlot);
                          const isFinished = apt.status === 'completed' || timeInfo.isPast;
                          return isFinished ? (
                            <button
                              disabled
                              className="py-2 px-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-50"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Chat Disabled
                            </button>
                          ) : (
                            <button
                              onClick={() => router.push(`/dashboard/chat/${apt.id}`)}
                              className="py-2 px-4 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 border border-teal-200/20 text-teal-600 dark:text-teal-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Live Chat Room
                            </button>
                          );
                        })()}

                        {/* 4. Consultation Complete: Download Prescription PDF */}
                        {apt.status === 'completed' && (
                          <>
                            <button
                              onClick={() => downloadReceiptPdf(apt)}
                              className="py-2 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 font-bold rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                            >
                              <Download className="h-3.5 w-3.5" /> Receipt
                            </button>
                            {apt.prescriptionReleased ? (
                              <>
                                <button
                                  onClick={() => setActiveViewPrescriptionApt(apt)}
                                  className="py-2 px-3.5 bg-teal-950/40 hover:bg-teal-900/40 border border-teal-800/60 text-teal-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                                >
                                  👁️ View Prescription
                                </button>
                                <button
                                  onClick={() => downloadPrescriptionPdf(apt)}
                                  className="py-2 px-4 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all hover:scale-[1.02]"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  Download PDF
                                </button>
                              </>
                            ) : (
                              <span className="py-2 px-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold rounded-xl text-[10px] flex items-center gap-1">
                                🔒 Locked (Awaiting Admin Release)
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* PHARMACY ORDERS TRACKER (Right - Col Span 5) */}
          <section className="lg:col-span-5 space-y-4 text-left">
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              Pharmacy Orders & Pickups ({patientOrders.length})
            </h2>

            {patientOrders.length === 0 ? (
              <div className="glass-card p-12 text-center rounded-3xl space-y-3">
                <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
                  <Package className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-300">No medicine orders placed</h3>
                <p className="text-xs text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                  Browse the pharmacy list and reserve stock.
                </p>
                <button
                  onClick={() => router.push('/dashboard/pharmacy')}
                  className="py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow transition-all"
                >
                  Visit Pharmacy
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {patientOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="glass-card p-4 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] text-slate-400 font-mono font-bold block">{ord.id}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {getOrderStatusBadge(ord.status)}
                    </div>

                    <div className="space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>{item.name} <span className="text-slate-400">x{item.quantity}</span></span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400">Order Method:</span>
                      <span className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold py-0.5 px-2 rounded">
                        {ord.fastBooking ? '⚡ Store Pick-up' : '🚚 Home Delivery'}
                      </span>
                    </div>

                    <div className="pt-2 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">
                        Paid: <span className="font-bold text-slate-700 dark:text-slate-300">{ord.paymentStatus === 'paid' ? '💳 Yes (Razorpay)' : '💵 COD'}</span>
                      </span>
                      <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400">
                        ₹{ord.totalAmount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>

      {/* ==========================================
          PROFILE EDIT MODAL DIALOG
          ========================================== */}
      {profileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-left">
            
            {/* Close */}
            <button
              onClick={() => setProfileOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <XCircle className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="h-10 w-10 bg-teal-500 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Update Patient Profile
                </h4>
                <p className="text-[10px] text-slate-400">Modify your secure clinic registration details.</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-semibold text-slate-800 dark:text-slate-100 animate-none"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Age</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    value={profileAge}
                    onChange={(e) => setProfileAge(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Gender</label>
                  <select
                    value={profileGender}
                    onChange={(e) => setProfileGender(e.target.value as 'Male' | 'Female' | 'Other')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">4-Digit Security PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={profilePasscode}
                    onChange={(e) => setProfilePasscode(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-semibold text-slate-800 dark:text-slate-100 font-mono tracking-widest text-center"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Residential Address</label>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className="text-[10px] font-bold text-teal-500 hover:text-teal-400 flex items-center gap-1 transition-colors"
                    >
                      📍 {locationLoading ? 'Fetching Location...' : 'Use Current Location'}
                    </button>
                  </div>
                  <textarea
                    required
                    rows={2}
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-semibold text-slate-800 dark:text-slate-100 min-h-[50px]"
                  />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="w-1/3 py-3 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          RAZORPAY SECURE PAYMENT DIALOG SIMULATOR
          ========================================== */}
      {activePaymentApt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-left">
            
            {/* Close */}
            <button
              onClick={() => setActivePaymentApt(null)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <XCircle className="h-5 w-5" />
            </button>

            {/* Logo header */}
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="h-10 w-10 bg-teal-500 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                R
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  Razorpay Checkout <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[8px] font-extrabold px-2 py-0.5 rounded uppercase">Sandbox</span>
                </h4>
                <p className="text-[10px] text-slate-400">Securing payment to Ananya Enterprises</p>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-4 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{activePaymentApt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Consultant:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{activePaymentApt.doctorName}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2 mt-1 font-bold">
                  <span>Grand Total:</span>
                  <span className="text-teal-600 dark:text-teal-400">₹{activePaymentApt.fees}.00</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Choose Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                      paymentMethod === 'card'
                        ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    💳 Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                      paymentMethod === 'upi'
                        ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    📱 UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                      paymentMethod === 'netbanking'
                        ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    🏦 NetBanking
                  </button>
                </div>
              </div>

              {paymentMethod === 'upi' && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1.5 animate-in slide-in-from-top-2 duration-200 text-xs">
                  <label className="text-[10px] font-bold text-slate-400">Virtual Payment Address (VPA)</label>
                  <input
                    type="text"
                    placeholder="9999999999@paytm"
                    defaultValue={`${user.mobile}@upi`}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={paymentProcessing}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white rounded-2xl font-bold text-sm shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                {paymentProcessing ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting Razorpay Network...
                  </>
                ) : (
                  `Secure Pay ₹${activePaymentApt.fees}.00`
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          REAL-TIME PRESCRIPTION VIEWER OVERLAY
          ========================================== */}
      {activeViewPrescriptionApt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <FileText className="h-5 w-5 text-teal-500 dark:text-teal-400 animate-pulse" /> 
                Clinical Prescription Record
              </h3>
              <button
                onClick={() => setActiveViewPrescriptionApt(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Doctor Details Summary Box */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs">
                <div className="h-10 w-10 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center rounded-xl font-bold border border-teal-100 dark:border-teal-900/50">
                  🩺
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{activeViewPrescriptionApt.doctorName}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{activeViewPrescriptionApt.specialty}</p>
                </div>
                <div className="ml-auto text-right text-[10px] text-slate-400 dark:text-slate-500">
                  <p>Date: {activeViewPrescriptionApt.date}</p>
                  <p className="font-mono mt-0.5">{activeViewPrescriptionApt.id}</p>
                </div>
              </div>

              {/* Prescription Body Text Box */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Clinical Directives & Prescriptions:</span>
                <div className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955/30 text-xs font-mono leading-relaxed whitespace-pre-wrap min-h-[150px] text-slate-800 dark:text-slate-300 select-text">
                  {activeViewPrescriptionApt.notes || "No custom diagnostic notes recorded by doctor yet."}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 text-xs">
                <button
                  onClick={() => setActiveViewPrescriptionApt(null)}
                  className="py-2.5 px-4 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    downloadPrescriptionPdf(activeViewPrescriptionApt);
                    setActiveViewPrescriptionApt(null);
                  }}
                  className="py-2.5 px-5 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Save PDF Copy
                </button>
              </div>
            </div>
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
