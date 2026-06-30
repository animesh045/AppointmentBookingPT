'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, UserProfile, DoctorProfile, Medicine, Appointment, Order } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { CartDrawer } from '@/components/CartDrawer';
import { 
  Users, 
  Stethoscope, 
  ShoppingBag, 
  Calendar, 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit, 
  Video, 
  Check, 
  X, 
  AlertCircle, 
  Search, 
  Lock, 
  Unlock,
  ClipboardList,
  ShieldCheck,
  TrendingUp,
  PackageCheck,
  Clock
} from 'lucide-react';

export default function AdminPanel() {
  const { 
    user, 
    users, 
    doctors, 
    appointments, 
    orders, 
    medicines,
    suspendUser,
    unsuspendUser,
    deleteUser,
    changeUserRole,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    updateAppointmentStatus,
    assignDoctorToAppointment,
    addMedicine,
    updateMedicine,
    removeMedicine,
    updateOrderStatus,
    auditLogs
  } = useApp();
  
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'doctors' | 'pharmacy' | 'orders' | 'appointments'>('analytics');

  // Reorganized Meeting & Prescription States
  const [meetingFilter, setMeetingFilter] = useState<'today' | 'upcoming' | 'past'>('today');
  const [activeViewPrescriptionApt, setActiveViewPrescriptionApt] = useState<Appointment | null>(null);

  // Doctor CRUD States
  const [docFormOpen, setDocFormOpen] = useState(false);
  const [editingDocUid, setEditingDocUid] = useState<string | null>(null);
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [docFees, setDocFees] = useState(500);
  const [docDays, setDocDays] = useState<string[]>(['Monday', 'Wednesday', 'Friday']);
  const [docSlots, setDocSlots] = useState<string[]>(['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM']);
  const [docPic, setDocPic] = useState('https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80');
  const [docMobile, setDocMobile] = useState('');
  const [docPasscode, setDocPasscode] = useState('');

  // User Edit States
  const [userEditOpen, setUserEditOpen] = useState(false);
  const [editingUserUid, setEditingUserUid] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserMobile, setEditUserMobile] = useState('');
  const [editUserPasscode, setEditUserPasscode] = useState('');
  const [editUserRole, setEditUserRole] = useState<'consumer' | 'doctor' | 'admin'>('consumer');
  const [editUserAge, setEditUserAge] = useState(25);
  const [editUserGender, setEditUserGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [editUserAddress, setEditUserAddress] = useState('');

  // Medicine CRUD States
  const [medFormOpen, setMedFormOpen] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [medName, setMedName] = useState('');
  const [medPrice, setMedPrice] = useState(50);
  const [medQty, setMedQty] = useState(100);
  const [medDesc, setMedDesc] = useState('');
  const [medRx, setMedRx] = useState(false);
  const [medCat, setMedCat] = useState('Fever & Pain Relief');
  const [medImg, setMedImg] = useState('💊');

  // Meeting Link Assignment States
  const [meetingAptId, setMeetingAptId] = useState<string | null>(null);
  const [meetingUrl, setMeetingUrl] = useState('https://meet.google.com/');

  // Search Filter state
  const [searchFilter, setSearchFilter] = useState('');

  // Security Redirects
  useEffect(() => {
    if (!user) {
      router.push('/admin-login');
    } else if (user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') return null;

  // ==========================================
  // METRICS & CALCULATIONS
  // ==========================================
  const totalRevenue = appointments.filter(a => a.paymentStatus === 'paid').reduce((sum, a) => sum + a.fees, 0) +
                       orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.totalAmount, 0);
  
  const todayString = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter(a => a.date === todayString);
  const totalPatients = users.filter(u => u.role === 'consumer').length;
  
  const { updateUserProfile } = useApp();

  // Doctor CRUD logic
  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docSpecialty.trim()) {
      alert('Please fill out Name and Specialty');
      return;
    }

    if (editingDocUid) {
      updateDoctor(editingDocUid, {
        name: docName,
        specialty: docSpecialty,
        fees: Number(docFees),
        availability: { days: docDays, slots: docSlots },
        profilePicture: docPic
      });
    } else {
      if (!docMobile.trim() || !docPasscode.trim()) {
        alert('Please fill out Mobile Number and Passcode (PIN)');
        return;
      }
      if (!/^\d{4}$/.test(docPasscode)) {
        alert('Security PIN must be a 4-digit number');
        return;
      }
      addDoctor({
        name: docName,
        specialty: docSpecialty,
        fees: Number(docFees),
        availability: { days: docDays, slots: docSlots },
        profilePicture: docPic,
        mobile: docMobile,
        passcode: docPasscode
      });
    }

    // Reset Form
    setDocFormOpen(false);
    setEditingDocUid(null);
    setDocName('');
    setDocSpecialty('');
    setDocFees(500);
    setDocMobile('');
    setDocPasscode('');
  };

  const handleEditDoctor = (doc: DoctorProfile) => {
    setEditingDocUid(doc.uid);
    setDocName(doc.name);
    setDocSpecialty(doc.specialty);
    setDocFees(doc.fees);
    setDocDays(doc.availability.days);
    setDocSlots(doc.availability.slots);
    setDocPic(doc.profilePicture);
    const comp = users.find(u => u.uid === doc.uid);
    if (comp) {
      setDocMobile(comp.mobile);
      setDocPasscode(comp.passcode);
    } else {
      setDocMobile('');
      setDocPasscode('');
    }
    setDocFormOpen(true);
  };

  // User Edit logic
  const handleEditUser = (u: UserProfile) => {
    setEditingUserUid(u.uid);
    setEditUserName(u.name);
    setEditUserEmail(u.email || '');
    setEditUserMobile(u.mobile);
    setEditUserPasscode(u.passcode);
    setEditUserRole(u.role);
    setEditUserAge(u.age || 25);
    setEditUserGender(u.gender || 'Male');
    setEditUserAddress(u.address || '');
    setUserEditOpen(true);
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserUid) return;

    if (!editUserName.trim() || !editUserMobile.trim() || !editUserPasscode.trim()) {
      alert('Please fill out Name, Mobile Number, and Passcode');
      return;
    }

    if (!/^\d{4}$/.test(editUserPasscode)) {
      alert('Security PIN must be a 4-digit number');
      return;
    }

    await updateUserProfile(editingUserUid, {
      name: editUserName,
      email: editUserEmail || undefined,
      mobile: editUserMobile,
      passcode: editUserPasscode,
      role: editUserRole,
      age: Number(editUserAge),
      gender: editUserGender,
      address: editUserAddress
    });

    setUserEditOpen(false);
    setEditingUserUid(null);
    alert('User details updated successfully!');
  };

  // Medicine CRUD logic
  const handleSaveMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) {
      alert('Medicine name is required');
      return;
    }

    if (editingMedId) {
      updateMedicine(editingMedId, {
        name: medName,
        price: Number(medPrice),
        quantity: Number(medQty),
        description: medDesc,
        prescriptionRequired: medRx,
        category: medCat,
        image: medImg
      });
    } else {
      addMedicine({
        name: medName,
        price: Number(medPrice),
        quantity: Number(medQty),
        description: medDesc,
        prescriptionRequired: medRx,
        category: medCat,
        image: medImg
      });
    }

    // Reset Form
    setMedFormOpen(false);
    setEditingMedId(null);
    setMedName('');
    setMedDesc('');
    setMedPrice(50);
    setMedQty(100);
    setMedRx(false);
  };

  const handleEditMedicine = (med: Medicine) => {
    setEditingMedId(med.id);
    setMedName(med.name);
    setMedPrice(med.price);
    setMedQty(med.quantity);
    setMedDesc(med.description);
    setMedRx(med.prescriptionRequired);
    setMedCat(med.category);
    setMedImg(med.image);
    setMedFormOpen(true);
  };

  // Assign Meeting Link logic
  const handleAssignMeeting = (aptId: string) => {
    const manualMeet = prompt('Enter Google Meet or Zoom URL manually for this consultation:', 'https://meet.google.com/');
    if (manualMeet === null) return; // Cancelled
    if (!manualMeet.trim()) {
      alert('Meeting link cannot be empty.');
      return;
    }
    updateAppointmentStatus(aptId, 'approved', undefined, manualMeet.trim());
    alert('Meeting link successfully assigned manually!');
  };

  const getFilteredUsers = () => {
    return users.filter(u => u.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                             u.mobile.includes(searchFilter));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-950 transition-colors">
      <Navbar onOpenCart={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Main Layout Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 animate-in fade-in duration-300">
        
        {/* Admin Welcome Banner */}
        <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 h-40 w-40 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse" />
          <div className="space-y-1 relative">
            <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Administrative Control Room</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100">
              Ananya Enterprises Panel ⚙️
            </h1>
            <p className="text-xs text-slate-400">
              Complete oversight of clinician scheduling, user status control, medicine stocks, and pharmacy dispatching.
            </p>
          </div>
          <div className="flex gap-2 relative">
            {/* Tab navigation headers inside welcome banner */}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'analytics' ? 'bg-purple-600 text-white font-extrabold shadow' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Metrics
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'appointments' ? 'bg-purple-600 text-white font-extrabold shadow' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Consults
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'orders' ? 'bg-purple-600 text-white font-extrabold shadow' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Orders
            </button>
          </div>
        </div>

        {/* METRIC SUMMARIES */}
        <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="glass-card p-4 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left gap-1">
            <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{appointments.length}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Bookings</span>
          </div>
          <div className="glass-card p-4 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left gap-1">
            <Clock className="h-5 w-5 text-indigo-500" />
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{todayApts.length}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Today&apos;s List</span>
          </div>
          <div className="glass-card p-4 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left gap-1">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">₹{totalRevenue}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Revenue</span>
          </div>
          <div className="glass-card p-4 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left gap-1">
            <ShoppingBag className="h-5 w-5 text-sky-500" />
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{orders.length}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Stock Orders</span>
          </div>
          <div className="glass-card p-4 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left gap-1">
            <Users className="h-5 w-5 text-amber-500" />
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{totalPatients}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Patients List</span>
          </div>
          <div className="glass-card p-4 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left gap-1">
            <Stethoscope className="h-5 w-5 text-purple-500" />
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{doctors.length}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Doctors</span>
          </div>
        </section>

        {/* TAB NAVIGATION ROW */}
        <section className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200/50 dark:border-slate-850 scrollbar-none">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'analytics' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            📈 Growth Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'users' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            👤 User & Role Manager
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'doctors' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            🥼 Clinicians Registry
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'appointments' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            📅 Bookings Dispatch
          </button>
          <button
            onClick={() => setActiveTab('pharmacy')}
            className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'pharmacy' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            💊 Medicine Inventory
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'orders' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            🚚 Order Fulfillment
          </button>
        </section>

        {/* ==========================================
            TAB VIEW 1: GROWTH ANALYTICS & AUDIT LOGS
            ========================================== */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
            
            {/* Pure CSS Visualizer Box (Col Span 7) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="glass-card p-6 rounded-3xl text-left space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <TrendingUp className="h-4.5 w-4.5 text-teal-600" /> Revenue & growth distribution
                </h3>
                
                {/* Simulated pure CSS Bar Chart */}
                <div className="h-64 flex items-end justify-between gap-4 pt-6 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex flex-col items-center flex-1 gap-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-xl h-44 relative flex items-end justify-center group">
                      <div className="absolute top-[-24px] bg-teal-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow scale-0 group-hover:scale-100 transition-all">
                        ₹32k
                      </div>
                      <div className="bg-teal-500 w-full rounded-t-xl transition-all duration-500" style={{ height: '72%' }} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">General Med</span>
                  </div>

                  <div className="flex flex-col items-center flex-1 gap-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-xl h-44 relative flex items-end justify-center group">
                      <div className="absolute top-[-24px] bg-sky-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow scale-0 group-hover:scale-100 transition-all">
                        ₹24k
                      </div>
                      <div className="bg-sky-500 w-full rounded-t-xl transition-all duration-500" style={{ height: '54%' }} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">Pediatrics</span>
                  </div>

                  <div className="flex flex-col items-center flex-1 gap-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-xl h-44 relative flex items-end justify-center group">
                      <div className="absolute top-[-24px] bg-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow scale-0 group-hover:scale-100 transition-all">
                        ₹48k
                      </div>
                      <div className="bg-indigo-500 w-full rounded-t-xl transition-all duration-500" style={{ height: '90%' }} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">Cardiology</span>
                  </div>

                  <div className="flex flex-col items-center flex-1 gap-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-xl h-44 relative flex items-end justify-center group">
                      <div className="absolute top-[-24px] bg-amber-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow scale-0 group-hover:scale-100 transition-all">
                        ₹18k
                      </div>
                      <div className="bg-amber-500 w-full rounded-t-xl transition-all duration-500" style={{ height: '40%' }} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">Dermatology</span>
                  </div>

                  <div className="flex flex-col items-center flex-1 gap-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-xl h-44 relative flex items-end justify-center group">
                      <div className="absolute top-[-24px] bg-purple-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow scale-0 group-hover:scale-100 transition-all">
                        ₹12k
                      </div>
                      <div className="bg-purple-500 w-full rounded-t-xl transition-all duration-500" style={{ height: '28%' }} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">Pharmacy</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 pt-2">
                  <span>Visualizing Consultation Distribution splits</span>
                  <span className="font-bold text-slate-600 dark:text-slate-300">Total Analytics: Professional Fees Settle</span>
                </div>
              </div>
            </div>

            {/* System Audit logs (Col Span 5) */}
            <div className="lg:col-span-5 space-y-4 text-left">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <ClipboardList className="h-4.5 w-4.5 text-slate-500" /> Operational System Logs
              </h3>

              <div className="glass-card p-4 rounded-3xl max-h-[320px] overflow-y-auto space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <div key={log.id} className="pt-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-teal-600 dark:text-teal-400">{log.action}</span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{log.details}</p>
                    <span className="text-[9px] text-slate-400 mt-1 block">Staff: {log.userName}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            TAB VIEW 2: USER & PRIVILEGE MANAGER
            ========================================== */}
        {activeTab === 'users' && (
          <div className="glass-card p-6 rounded-3xl space-y-5 animate-in fade-in duration-200 text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">User Registry & Privilege Roles</h3>
              
              {/* Search user */}
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search user or mobile..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="py-3 px-4">Profile Details</th>
                    <th className="py-3 px-4">Contact Mobile</th>
                    <th className="py-3 px-4">System Role</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {getFilteredUsers().map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3.5 px-4">
                        <p className="font-bold">{u.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{u.email || 'No email registered'}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono">+91 {u.mobile}</td>
                      <td className="py-3.5 px-4">
                        {/* Role selector dropdown */}
                        <select
                          value={u.role}
                          onChange={(e) => changeUserRole(u.uid, e.target.value as 'consumer' | 'doctor' | 'admin')}
                          className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase text-slate-700 dark:text-slate-200"
                        >
                          <option value="consumer">Patient</option>
                          <option value="doctor">Doctor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                          u.status === 'suspended' ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleEditUser(u)}
                          className="p-1 text-purple-650 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded"
                          title="Edit User Details"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {u.status === 'suspended' ? (
                          <button
                            onClick={() => unsuspendUser(u.uid)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded"
                            title="Activate Account"
                          >
                            <Unlock className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => suspendUser(u.uid)}
                            className="p-1 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded"
                            title="Suspend Account"
                          >
                            <Lock className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(u.uid)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded"
                          title="Delete Account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB VIEW 3: CLINICIAN REGISTRY (DOCTORS CRUD)
            ========================================== */}
        {activeTab === 'doctors' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Practitioner Registry Directory</h3>
              <button
                onClick={() => {
                  setEditingDocUid(null);
                  setDocName('');
                  setDocSpecialty('');
                  setDocFees(500);
                  setDocFormOpen(true);
                }}
                className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow"
              >
                <Plus className="h-4 w-4" /> Add Doctor
              </button>
            </div>

            {/* Form Drawer / Grid Modal */}
            {docFormOpen && (
              <form onSubmit={handleSaveDoctor} className="glass-card p-6 rounded-3xl border border-purple-500/20 space-y-4">
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {editingDocUid ? 'Modify Practitioner Profile' : 'Register New Practitioner'}
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">Doctor Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. Vikram Malhotra"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">Medical Specialty *</label>
                    <input
                      type="text"
                      required
                      placeholder="Pediatrician / Dermatologist"
                      value={docSpecialty}
                      onChange={(e) => setDocSpecialty(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">Consultation Fee (INR) *</label>
                    <input
                      type="number"
                      required
                      value={docFees}
                      onChange={(e) => setDocFees(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">Picture URL</label>
                    <input
                      type="text"
                      value={docPic}
                      onChange={(e) => setDocPic(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  {!editingDocUid && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-bold">Mobile Number *</label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 9876543210"
                          value={docMobile}
                          onChange={(e) => setDocMobile(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-bold">Security PIN (4-Digit Passcode) *</label>
                        <input
                          type="password"
                          maxLength={4}
                          required
                          placeholder="e.g. 1234"
                          value={docPasscode}
                          onChange={(e) => setDocPasscode(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-purple-500 font-mono"
                        />
                      </div>
                    </>
                  )}

                  {/* Dynamic Availability Days */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-slate-400 font-bold">Available Consultation Days *</label>
                    <div className="flex flex-wrap gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                        const isChecked = docDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                setDocDays(docDays.filter((d) => d !== day));
                              } else {
                                setDocDays([...docDays, day]);
                              }
                            }}
                            className={`py-1.5 px-3 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                              isChecked
                                ? 'bg-purple-950/40 border-purple-500 text-purple-400'
                                : 'border-slate-850 bg-transparent text-slate-400 hover:border-slate-850'
                            }`}
                          >
                            {day.substring(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Availability Slots */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-slate-400 font-bold">Time Slots *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 09:30 AM or 12:15 PM"
                        id="new-slot-input"
                        className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-purple-500 text-xs font-semibold text-slate-200"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val && !docSlots.includes(val)) {
                              setDocSlots([...docSlots, val]);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('new-slot-input') as HTMLInputElement;
                          const val = input?.value.trim();
                          if (val && !docSlots.includes(val)) {
                            setDocSlots([...docSlots, val]);
                            input.value = '';
                          }
                        }}
                        className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {docSlots.length === 0 ? (
                        <span className="text-[10px] text-slate-500">No time slots added yet.</span>
                      ) : (
                        docSlots.map((slot) => (
                          <span
                            key={slot}
                            className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 text-slate-350 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold"
                          >
                            {slot}
                            <button
                              type="button"
                              onClick={() => setDocSlots(docSlots.filter((s) => s !== slot))}
                              className="text-red-500 hover:text-red-400 ml-1 font-bold text-xs"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => setDocFormOpen(false)}
                    className="py-2.5 px-4 border border-slate-200 dark:border-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow"
                  >
                    Save Listing
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map((doc) => (
                <div
                  key={doc.uid}
                  className="glass-card p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex gap-4 hover:shadow transition-all"
                >
                  <img
                    src={doc.profilePicture}
                    alt={doc.name}
                    className="h-16 w-16 rounded-2xl object-cover shadow-inner flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1 text-xs">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{doc.name}</h4>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEditDoctor(doc)}
                          className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteDoctor(doc.uid)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-500 font-semibold">{doc.specialty}</p>
                    <p className="font-bold text-teal-600 dark:text-teal-400">Consult Fee: ₹{doc.fees}</p>
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {doc.availability.days.map((day) => (
                        <span key={day} className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded text-[8px] font-bold">
                          {day.substring(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB VIEW 4: BOOKINGS DISPATCH (APPOINTMENTS APPR & MEETINGS)
            ========================================== */}
        {activeTab === 'appointments' && (() => {
          const todayString = new Date().toISOString().split('T')[0];
          const filteredAppointments = appointments.filter((apt) => {
            if (meetingFilter === 'today') {
              return apt.date === todayString && apt.status !== 'rejected';
            } else if (meetingFilter === 'upcoming') {
              return apt.date > todayString && apt.status !== 'completed' && apt.status !== 'rejected';
            } else {
              return apt.date < todayString || apt.status === 'completed' || apt.status === 'rejected';
            }
          });

          return (
            <div className="glass-card p-6 rounded-3xl space-y-5 animate-in fade-in duration-200 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Consultation Bookings Queue</h3>
                
                {/* Reorganized Meeting Sub-Tabs */}
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-850 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/45 w-max">
                  {(['today', 'upcoming', 'past'] as const).map((filter) => {
                    const label = filter === 'today' ? "Today" : filter === 'upcoming' ? "Upcoming" : "Past";
                    const isActive = meetingFilter === filter;
                    return (
                      <button
                        key={filter}
                        onClick={() => setMeetingFilter(filter)}
                        className={`py-1.5 px-3 rounded-lg text-[10px] font-extrabold transition-all uppercase tracking-wider ${
                          isActive
                            ? 'bg-purple-650 text-white shadow'
                            : 'text-slate-500 hover:bg-slate-200/40 dark:hover:bg-slate-800'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Patient Name</th>
                      <th className="py-3 px-4">Clinician</th>
                      <th className="py-3 px-4">Date & Slot</th>
                      <th className="py-3 px-4">Status / Paid</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAppointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="py-3.5 px-4 font-mono font-bold">{apt.id}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold">{apt.patientName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Mob: {apt.patientMobile}</p>
                        </td>
                        <td className="py-3.5 px-4 text-left">
                          {apt.doctorId === 'pending' ? (
                            <div className="flex flex-col gap-1 max-w-[150px]">
                              <span className="text-[9px] text-amber-500 font-extrabold uppercase">⚠️ Assign Doctor</span>
                              <select
                                onChange={(e) => assignDoctorToAppointment(apt.id, e.target.value)}
                                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                                defaultValue=""
                              >
                                <option value="" disabled>Choose...</option>
                                {doctors.map((d) => (
                                  <option key={d.uid} value={d.uid}>{d.name}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 max-w-[150px]">
                              <p className="font-bold">{apt.doctorName}</p>
                              <p className="text-[10px] text-slate-400">{apt.specialty.split(' ')[0]}</p>
                              {apt.status !== 'completed' && (
                                <select
                                  onChange={(e) => assignDoctorToAppointment(apt.id, e.target.value)}
                                  className="bg-slate-50 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-750 px-1 py-0.5 rounded text-[9px] text-slate-500 focus:outline-none font-bold"
                                  value={apt.doctorId}
                                >
                                  {doctors.map((d) => (
                                    <option key={d.uid} value={d.uid}>{d.name}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {apt.status !== 'completed' && apt.status !== 'rejected' ? (
                            <div className="flex flex-col gap-1 max-w-[140px]">
                              <input
                                type="date"
                                value={apt.date}
                                onChange={(e) => updateAppointmentStatus(apt.id, apt.status, apt.notes, apt.meetingLink, { date: e.target.value })}
                                className="bg-slate-555 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold focus:outline-none text-slate-800 dark:text-slate-250"
                              />
                              <select
                                value={apt.timeSlot}
                                onChange={(e) => updateAppointmentStatus(apt.id, apt.status, apt.notes, apt.meetingLink, { timeSlot: e.target.value })}
                                className="bg-slate-555 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold focus:outline-none text-slate-800 dark:text-slate-250"
                              >
                                {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'].map((slot) => (
                                  <option key={slot} value={slot}>{slot}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold">{apt.date}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{apt.timeSlot}</p>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[8px] uppercase w-max ${
                              apt.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' :
                              apt.status === 'completed' ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400' :
                              apt.status === 'rejected' ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400' :
                              'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                            }`}>
                              {apt.status}
                            </span>
                            <span className={`text-[9px] font-bold ${apt.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-slate-400'}`}>
                              {apt.paymentStatus === 'paid' ? '💳 Settle Paid' : '💵 Pending Fee'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {apt.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateAppointmentStatus(apt.id, 'rejected')}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500 rounded"
                                  title="Reject Appointment"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => updateAppointmentStatus(apt.id, 'approved')}
                                  disabled={apt.doctorId === 'pending'}
                                  className={`p-1 rounded ${apt.doctorId === 'pending' ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-500'}`}
                                  title={apt.doctorId === 'pending' ? 'Assign doctor first' : 'Approve Appointment'}
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {apt.status === 'approved' && meetingFilter !== 'past' && (
                              <button
                                onClick={() => handleAssignMeeting(apt.id)}
                                className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all"
                                title="Assign simulated Zoom Meet Room link"
                              >
                                <Video className="h-3 w-3" />
                                {apt.meetingLink ? 'Re-assign Meet' : 'Assign Meet'}
                              </button>
                            )}
                            {apt.status === 'completed' && (
                              <div className="flex items-center gap-1.5 justify-end">
                                <button
                                  onClick={() => setActiveViewPrescriptionApt(apt)}
                                  className="py-1 px-2 bg-purple-550/10 hover:bg-purple-600/20 text-purple-600 dark:text-purple-400 font-bold rounded text-[9px] transition-all"
                                  title="View Prescription Details"
                                >
                                  👁️ View Rx
                                </button>
                                {!apt.prescriptionReleased ? (
                                  <button
                                    onClick={() => updateAppointmentStatus(apt.id, 'completed', undefined, undefined, { prescriptionReleased: true })}
                                    className="py-1 px-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-750 text-white rounded text-[9px] font-bold flex items-center gap-1 transition-all shadow"
                                    title="Release prescription to patient"
                                  >
                                    🔓 Release Rx
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-emerald-500 font-extrabold">✓ Rx Released</span>
                                )}
                                <span className="text-[10px] text-slate-400 font-bold">Archived</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* ==========================================
            TAB VIEW 5: MEDICINE STOCK INVENTORY CRUD
            ========================================== */}
        {activeTab === 'pharmacy' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Pharmacy Stocks Management</h3>
              <button
                onClick={() => {
                  setEditingMedId(null);
                  setMedName('');
                  setMedDesc('');
                  setMedPrice(50);
                  setMedQty(100);
                  setMedRx(false);
                  setMedFormOpen(true);
                }}
                className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow"
              >
                <Plus className="h-4 w-4" /> New Medicine
              </button>
            </div>

            {/* Medicine Form Drawer */}
            {medFormOpen && (
              <form onSubmit={handleSaveMedicine} className="glass-card p-6 rounded-3xl border border-purple-500/20 space-y-4">
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {editingMedId ? 'Update Stock Item Parameters' : 'Insert New Medicine Stock'}
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-slate-400 font-bold">Medicine Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Amoxicillin 500mg Tablet"
                      value={medName}
                      onChange={(e) => setMedName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">Visual Icon / Emoji</label>
                    <input
                      type="text"
                      placeholder="💊 / 🧪 / 🧴"
                      value={medImg}
                      onChange={(e) => setMedImg(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-purple-500 text-center"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">Unit Price (INR) *</label>
                    <input
                      type="number"
                      required
                      value={medPrice}
                      onChange={(e) => setMedPrice(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">Initial Inventory Count *</label>
                    <input
                      type="number"
                      required
                      value={medQty}
                      onChange={(e) => setMedQty(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">Medicine Category *</label>
                    <select
                      value={medCat}
                      onChange={(e) => setMedCat(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="Fever & Pain Relief">Fever & Pain Relief</option>
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Cough & Cold">Cough & Cold</option>
                      <option value="Heart Care">Heart Care</option>
                      <option value="Vitamins & Supplements">Vitamins & Supplements</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3 space-y-1.5">
                    <label className="text-slate-400 font-bold">Description Details</label>
                    <textarea
                      placeholder="Specify indications, dosages, and warnings..."
                      rows={2}
                      value={medDesc}
                      onChange={(e) => setMedDesc(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div className="sm:col-span-3 flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="rxToggle"
                      checked={medRx}
                      onChange={(e) => setMedRx(e.target.checked)}
                      className="h-4 w-4 border-slate-300 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="rxToggle" className="font-bold text-slate-700 dark:text-slate-300">
                      🚨 Requires Doctor&apos;s Prescription (Rx Warning Badge)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => setMedFormOpen(false)}
                    className="py-2.5 px-4 border border-slate-200 dark:border-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow"
                  >
                    Save Stock
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Rx Rule</th>
                    <th className="py-3 px-4">Stock count</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {medicines.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <span className="text-2xl p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">{m.image}</span>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{m.name}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{m.description}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-teal-600 dark:text-teal-400">₹{m.price}</td>
                      <td className="py-3.5 px-4 text-[10px] uppercase font-bold text-slate-400">{m.category.split(' ')[0]}</td>
                      <td className="py-3.5 px-4">
                        {m.prescriptionRequired ? (
                          <span className="bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-2 py-0.5 rounded font-extrabold text-[8px] uppercase">Rx Required</span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        <span className={m.quantity < 10 ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}>
                          {m.quantity} Units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleEditMedicine(m)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-purple-600 rounded"
                          title="Edit Stock details"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeMedicine(m.id)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500 rounded"
                          title="Delete Stock item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB VIEW 6: ORDER FULFILLMENT DESK
            ========================================== */}
        {activeTab === 'orders' && (
          <div className="glass-card p-6 rounded-3xl space-y-5 animate-in fade-in duration-200 text-left">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Pharmacy Order Dispatch & Fulfillment</h3>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="py-3 px-4">Order Code</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Cart items Summary</th>
                    <th className="py-3 px-4">Method & Address</th>
                    <th className="py-3 px-4">Amount / Settle</th>
                    <th className="py-3 px-4">Fulfillment Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3.5 px-4 font-mono font-bold">{ord.id}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold">{ord.patientName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Mob: {ord.patientMobile}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-[10px]">
                          {ord.items.map((item, idx) => (
                            <p key={idx} className="text-slate-500 font-medium truncate max-w-[120px]">
                              {item.name} <span className="text-slate-400">x{item.quantity}</span>
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[10px]">{ord.fastBooking ? '⚡ Store Pick-up' : '🚚 Home Delivery'}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[150px] mt-0.5">{ord.deliveryAddress}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-teal-600 dark:text-teal-400">₹{ord.totalAmount}</p>
                        <p className={`text-[9px] font-bold ${ord.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {ord.paymentStatus === 'paid' ? '💳 Pre-Paid' : '💵 Cash/COD'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                          ord.status === 'delivered' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' :
                          ord.status === 'dispatched' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' :
                          ord.status === 'processing' ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {/* Status Dispatch controls */}
                        <div className="flex justify-end gap-1.5">
                          {ord.status === 'pending' && (
                            <button
                              onClick={() => updateOrderStatus(ord.id, 'processing')}
                              className="py-1 px-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[10px] transition-all"
                            >
                              Process Order
                            </button>
                          )}
                          {ord.status === 'processing' && (
                            <button
                              onClick={() => updateOrderStatus(ord.id, 'dispatched')}
                              className="py-1 px-2.5 bg-indigo-500 hover:bg-indigo-650 text-white font-bold rounded-lg text-[10px] transition-all"
                            >
                              Dispatch Order
                            </button>
                          )}
                          {ord.status === 'dispatched' && (
                            <button
                              onClick={() => updateOrderStatus(ord.id, 'delivered', 'paid')}
                              className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-lg text-[10px] transition-all"
                            >
                              Mark Delivered
                            </button>
                          )}
                          {ord.status === 'delivered' && (
                            <span className="text-[10px] text-slate-400 font-bold">Completed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ==========================================
          REAL-TIME PRESCRIPTION VIEWER OVERLAY (ADMIN VIEW)
          ========================================== */}
      {activeViewPrescriptionApt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-1.5">
                <ClipboardList className="h-5 w-5 text-purple-450 animate-pulse" /> 
                Clinical Prescription Record
              </h3>
              <button
                onClick={() => setActiveViewPrescriptionApt(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Doctor Details Summary Box */}
              <div className="flex items-center gap-3 p-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-xs text-slate-300">
                <div className="h-10 w-10 bg-purple-950/40 text-purple-450 flex items-center justify-center rounded-xl font-bold border border-purple-900/50">
                  🩺
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{activeViewPrescriptionApt.doctorName}</h4>
                  <p className="text-[10px] text-slate-400">{activeViewPrescriptionApt.specialty}</p>
                </div>
                <div className="ml-auto text-right text-[10px] text-slate-500">
                  <p>Date: {activeViewPrescriptionApt.date}</p>
                  <p className="font-mono mt-0.5">{activeViewPrescriptionApt.id}</p>
                </div>
              </div>

              {/* Prescription Body Text Box */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-450">Clinical Directives & Prescriptions:</span>
                <div className="w-full p-4 rounded-xl border border-slate-800 bg-slate-950/30 text-xs font-mono leading-relaxed whitespace-pre-wrap min-h-[150px] text-slate-350 select-text">
                  {activeViewPrescriptionApt.notes || "No custom diagnostic notes recorded by doctor yet."}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button
                  onClick={() => setActiveViewPrescriptionApt(null)}
                  className="py-2.5 px-4 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          REAL-TIME USER PROFILE EDIT OVERLAY (ADMIN VIEW)
          ========================================== */}
      {userEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-1.5">
                <Edit className="h-5 w-5 text-purple-450" /> 
                Edit User Profile Details
              </h3>
              <button
                onClick={() => setUserEditOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-200 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold">Email Address</label>
                  <input
                    type="email"
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-200 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={editUserMobile}
                    onChange={(e) => setEditUserMobile(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-200 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold">Security PIN (4-Digit Passcode) *</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={editUserPasscode}
                    onChange={(e) => setEditUserPasscode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-200 focus:ring-1 focus:ring-purple-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold">User Role *</label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value as 'consumer' | 'doctor' | 'admin')}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-200 focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="consumer">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold">Age *</label>
                  <input
                    type="number"
                    required
                    value={editUserAge}
                    onChange={(e) => setEditUserAge(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-200 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold">Gender *</label>
                  <select
                    value={editUserGender}
                    onChange={(e) => setEditUserGender(e.target.value as 'Male' | 'Female' | 'Other')}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-200 focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">Residential/Office Address</label>
                <textarea
                  rows={2}
                  value={editUserAddress}
                  onChange={(e) => setEditUserAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-200 focus:ring-1 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setUserEditOpen(false)}
                  className="py-2.5 px-4 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
