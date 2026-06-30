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

const BRANDS = [
  { name: 'Patanjali', color: '#ea580c', bg: '#fff7ed10', abbr: 'P', logo: '/patanjali1556.logowik.com.webp' },
  { name: 'Baidyanath', color: '#ca8a04', bg: '#fefce810', abbr: 'B', logo: '/baidhyanath.webp' },
  { name: 'Dabur', color: '#dc2626', bg: '#fef2f210', abbr: 'D', logo: '/dabur.png' },
  { name: 'Sri Sri Tattva', color: '#0891b2', bg: '#ecfeff10', abbr: 'SST', logo: '/logo-srisritattva.png' },
  { name: 'Axiom', color: '#2563eb', bg: '#eff6ff10', abbr: 'A', logo: '/logo-axiom.png' },
  { name: 'Vyas', color: '#16a34a', bg: '#f0fdf410', abbr: 'V', logo: '/logo-vyas.png' },
  { name: 'Vedsun', color: '#7c3aed', bg: '#f5f3ff10', abbr: 'VS', logo: '/vdsun.png' },
  // Duplicate for infinite scroll
  { name: 'Patanjali', color: '#ea580c', bg: '#fff7ed10', abbr: 'P', logo: '/patanjali1556.logowik.com.webp' },
  { name: 'Baidyanath', color: '#ca8a04', bg: '#fefce810', abbr: 'B', logo: '/baidhyanath.webp' },
  { name: 'Dabur', color: '#dc2626', bg: '#fef2f210', abbr: 'D', logo: '/dabur.png' },
  { name: 'Sri Sri Tattva', color: '#0891b2', bg: '#ecfeff10', abbr: 'SST', logo: '/logo-srisritattva.png' },
  { name: 'Axiom', color: '#2563eb', bg: '#eff6ff10', abbr: 'A', logo: '/logo-axiom.png' },
  { name: 'Vyas', color: '#16a34a', bg: '#f0fdf410', abbr: 'V', logo: '/logo-vyas.png' },
  { name: 'Vedsun', color: '#7c3aed', bg: '#f5f3ff10', abbr: 'VS', logo: '/vdsun.png' },
];

function BrandItem({ brand }: { brand: typeof BRANDS[0] }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className="flex-shrink-0 flex items-center gap-2.5 mx-5 px-5 py-2 rounded-full border shadow-sm cursor-default hover:scale-105 transition-transform"
      style={{ borderColor: brand.color + '40', background: brand.bg }}
    >
      {!imgFailed ? (
        <img
          src={brand.logo}
          alt={brand.name}
          onError={() => setImgFailed(true)}
          className="h-6 w-auto max-w-[80px] object-contain flex-shrink-0"
        />
      ) : (
        <span
          className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-inner flex-shrink-0"
          style={{ background: brand.color + '20', color: brand.color }}
        >
          {brand.abbr}
        </span>
      )}
      <span className="text-sm font-extrabold whitespace-nowrap text-slate-800">
        {brand.name}
      </span>
    </div>
  );
}

export default function Home() {
  const { user, login, loginViaOtp, registerUser, users, language } = useApp();
  const router = useRouter();

  // Navigation Cart Toggle
  const [cartOpen, setCartOpen] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Auth States
  const [mobile, setMobile] = useState('');
  const [passcode, setPasscode] = useState('');
  const [otp, setOtp] = useState('');
  const [authUid, setAuthUid] = useState('');
  const [step, setStep] = useState<'mobile' | 'choice' | 'passcode' | 'otp' | 'register'>('mobile');
  const [loading, setLoading] = useState(false);
  
  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regAge, setRegAge] = useState<number>(25);
  const [regPasscode, setRegPasscode] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const TRANSLATIONS = {
    en: {
      subTitle: "Doctor appointment booking app - Ananya enterprises",
      titlePart1: "Ananya Enterprises",
      titlePart2: "Doctor appointment booking app",
      desc: "Welcome to Ananya Enterprises. Book digital consultations with specialized doctors, access real-time medical chatrooms, order medications with express home delivery, and manage patient files through our state-of-the-art clinic ecosystem.",
      accuracy: "Accuracy Rating",
      prescriptions: "Prescriptions",
      support: "Support",
      callDesk: "Call Pharmacy Desk",
      directions: "Get Directions",
      gateway: "Secure Clinic Gateway",
      gatewayDesc: "Enter your mobile number to sign in or register instantly.",
      mobileLabel: "Mobile Number",
      continue: "Continue",
      checking: "Checking Account...",
      verification: "Passcode Verification",
      verificationDesc: "Enter your 4-digit PIN Passcode to sign in securely.",
      demoPIN: "Demo passcode: 1234",
      pinLabel: "4-Digit PIN Passcode",
      goBack: "Go Back",
      verify: "Verify Session",
      authenticating: "Authenticating...",
      createProfile: "Create Patient Profile",
      registerDesc: "First time logging in? Let's build your clinic record.",
      fullName: "Full Name *",
      fullNamePlaceholder: "Rahul Sharma",
      pinCreate: "Create 4-Digit PIN Passcode *",
      pinPlaceholder: "Choose 4-digit PIN (e.g. 5678)",
      age: "Age *",
      gender: "Gender *",
      male: "Male",
      female: "Female",
      other: "Other",
      email: "Email Address (Optional)",
      address: "Residential Address *",
      addressPlaceholder: "Flat 402, Block C, Green Park, New Delhi",
      useLocation: "Use Current Location",
      fetchingLocation: "Fetching Location...",
      completeLogin: "Complete & Log In",
      submittingReg: "Submitting Registration...",
      genuineStore: "100% Genuine Ayurvedic Store",
      bannerTitle: "Ananya Enterprises Doctor App & Pharmacy",
      loginChoice: "Select Verification Method",
      loginChoiceDesc: "Choose how you want to sign in to your Ananya patient profile.",
      viaOtpButton: "Login via SMS OTP",
      viaPasscodeButton: "Login via Passcode PIN",
      otpTitle: "Enter OTP Code",
      otpDesc: "We have sent a 6-digit OTP to your number.",
      otpLabel: "6-Digit OTP Code",
      otpVerifyButton: "Verify OTP & Log In",
      otpPlaceholder: "123456"
    },
    hi: {
      subTitle: "डॉक्टर अपॉइंटमेंट बुकिंग ऐप - अनन्या एंटरप्राइजेज",
      titlePart1: "अनन्या एंटरप्राइजेज",
      titlePart2: "डॉक्टर अपॉइंटमेंट बुकिंग ऐप",
      desc: "अनन्या एंटरप्राइजेज में आपका स्वागत है। विशेषज्ञ डॉक्टरों के साथ डिजिटल परामर्श बुक करें, रीयल-टाइम मेडिकल चैट रूम का उपयोग करें, एक्सप्रेस होम डिलीवरी के साथ दवाएं ऑर्डर करें, और हमारे अत्याधुनिक क्लिनिक इकोसिस्टम के माध्यम से रोगी फाइलों का प्रबंधन करें।",
      accuracy: "सटीकता रेटिंग",
      prescriptions: "पर्चे (प्रिस्क्रिप्शन)",
      support: "सहायता",
      callDesk: "फार्मेसी डेस्क को कॉल करें",
      directions: "दिशा-निर्देश प्राप्त करें",
      gateway: "सुरक्षित क्लिनिक गेटवे",
      gatewayDesc: "तुरंत साइन इन या पंजीकरण करने के लिए अपना मोबाइल नंबर दर्ज करें।",
      mobileLabel: "मोबाइल नंबर",
      continue: "जारी रखें",
      checking: "खाते की जाँच हो रही है...",
      verification: "पासकोड सत्यापन",
      verificationDesc: "सुरक्षित रूप से साइन इन करने के लिए अपना 4-अंकीय पिन पासकोड दर्ज करें।",
      demoPIN: "डेमो पासकोड: 1234",
      pinLabel: "4-अंकीय पिन पासकोड",
      goBack: "वापस जाएं",
      verify: "सत्र सत्यापित करें",
      authenticating: "प्रमाणित किया जा रहा है...",
      createProfile: "मरीज प्रोफाइल बनाएं",
      registerDesc: "पहली बार लॉग इन कर रहे हैं? आइए आपका क्लिनिक रिकॉर्ड बनाएं।",
      fullName: "पूरा नाम *",
      fullNamePlaceholder: "राहुल शर्मा",
      pinCreate: "4-अंकीय पिन पासकोड बनाएं *",
      pinPlaceholder: "4-अंकीय पिन चुनें (जैसे 5678)",
      age: "उम्र *",
      gender: "लिंग *",
      male: "पुरुष",
      female: "महिला",
      other: "अन्य",
      email: "ईमेल पता (वैकल्पिक)",
      address: "आवासीय पता *",
      addressPlaceholder: "फ्लैट 402, ब्लॉक सी, ग्रीन पार्क, नई दिल्ली",
      useLocation: "वर्तमान स्थान का उपयोग करें",
      fetchingLocation: "स्थान प्राप्त किया जा रहा है...",
      completeLogin: "पूर्ण करें और लॉग इन करें",
      submittingReg: "पंजीकरण सबमिट किया जा रहा है...",
      genuineStore: "100% असली आयुर्वेदिक स्टोर",
      bannerTitle: "अनन्या एंटरप्राइजेज डॉक्टर ऐप और फार्मेसी",
      loginChoice: "सत्यापन विधि चुनें",
      loginChoiceDesc: "चुनें कि आप अपने अनन्या प्रोफाइल में कैसे साइन इन करना चाहते हैं।",
      viaOtpButton: "एसएमएस ओटीपी के माध्यम से लॉगिन",
      viaPasscodeButton: "पासकोड पिन के माध्यम से लॉगिन",
      otpTitle: "ओटीपी कोड दर्ज करें",
      otpDesc: "हमने आपके नंबर पर 6-अंकीय ओटीपी भेजा है।",
      otpLabel: "6-अंकीय ओटीपी कोड",
      otpVerifyButton: "ओटीपी सत्यापित करें और लॉगिन करें",
      otpPlaceholder: "123456"
    }
  };

  const t = TRANSLATIONS[language];

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
            setRegAddress(data.display_name);
          } else {
            setRegAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
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

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin-login');
      } else if (user.role === 'doctor') {
        router.push('/admin-login');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  const handleCheckMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobile)) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    
    // Check if the user already exists in the system
    const userExists = users.some((u) => u.mobile === mobile) || mobile === '8368825928';
    
    if (userExists) {
      // User exists: transition to choice screen
      setStep('choice');
      setLoading(false);
    } else {
      // New user: auto-send OTP and transition to OTP screen
      try {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile })
        });
        const data = await res.json();
        if (data.success) {
          if (data.debugOtp) {
            alert(`[Mock OTP Gateway] Code: ${data.debugOtp}`);
          }
          setStep('otp');
        } else {
          alert(data.error || 'Failed to send OTP. Please try again.');
        }
      } catch (err) {
        console.error('Send OTP error:', err);
        alert('Connection error. Failed to send OTP.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendOtpFromChoice = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });
      const data = await res.json();
      if (data.success) {
        if (data.debugOtp) {
          alert(`[Mock OTP Gateway] Code: ${data.debugOtp}`);
        }
        setStep('otp');
      } else {
        alert(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      alert('Connection error. Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp) && otp !== '123456') {
      alert('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp })
      });
      const data = await res.json();
      if (data.success) {
        setAuthUid(data.uid);
        
        // Sign in to Firebase Auth on the client with the custom token
        if (data.customToken && !data.isMock) {
          try {
            const { signInWithCustomToken } = await import('firebase/auth');
            const { auth } = await import('@/context/FirebaseConfig');
            if (auth) {
              await signInWithCustomToken(auth, data.customToken);
              console.log('[Firebase Auth] Signed in successfully with custom token.');
            }
          } catch (authErr) {
            console.error('[Firebase Auth] Client sign-in with custom token failed:', authErr);
          }
        }
        
        // Check if user is staff before logging in on patient portal
        const isStaff = users.some((u) => u.mobile === mobile && (u.role === 'admin' || u.role === 'doctor'));
        if (isStaff) {
          alert('Staff and clinician accounts must log in via the staff portal (/admin-login).');
          setLoading(false);
          return;
        }

        // Try logging in the user if profile already exists
        const loggedIn = await loginViaOtp(mobile);
        if (loggedIn) {
          // Success! User logged in. Redirection handled by useEffect.
          setLoading(false);
        } else {
          // User is verified but has no profile yet: transition to registration
          setStep('register');
          setLoading(false);
        }
      } else {
        alert(data.error || 'Invalid OTP code. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      alert('Connection error. Failed to verify OTP.');
      setLoading(false);
    }
  };

  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(passcode)) {
      alert('Please enter a valid 4-digit PIN Passcode');
      return;
    }

    const isStaff = users.some((u) => u.mobile === mobile && (u.role === 'admin' || u.role === 'doctor'));
    if (isStaff) {
      alert('Staff and clinician accounts must log in via the staff portal (/admin-login).');
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
      email: regEmail || "",
      address: regAddress,
      gender: regGender,
      age: Number(regAge)
    }, authUid);
    setLoading(false);
  };

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 font-sans font-bold">
        Loading Ananya Enterprises...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 transition-colors text-slate-900">
      <Navbar onOpenCart={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Hero Brand Banner */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="relative rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-white group">
          <img
            src="/banner.png"
            alt="Ananya Enterprises Ayurvedic Store Banner"
            className="w-full h-auto block transition-transform duration-700 group-hover:scale-[1.01]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-end p-4 sm:p-6 md:p-8">
            <div className="text-left">
              <span className="px-3 py-1 rounded-full bg-green-600 text-white font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider shadow">
                {t.genuineStore}
              </span>
              <h3 className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-black text-white mt-1 sm:mt-2 drop-shadow-md">
                {t.bannerTitle}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Infinite Marquee Strip */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="marquee-container overflow-hidden relative py-3 bg-slate-100 border border-slate-200 rounded-2xl shadow-inner">
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-50 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-50 to-transparent z-10" />

          <div className="animate-marquee flex items-center">
            {BRANDS.map((brand, i) => (
              <BrandItem key={i} brand={brand} />
            ))}
          </div>
        </div>
      </div>

      {/* ==========================================
          HERO & AUTH SPLIT SECTION
          ========================================== */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Pitch / Left Grid */}
        <div className="lg:col-span-7 space-y-6 text-left animate-in fade-in slide-in-from-left-6 duration-500">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            <HeartHandshake className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wide">{t.subTitle}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-slate-900">
            {t.titlePart1} <br />
            <span className="bg-gradient-to-r from-blue-600 via-green-600 to-blue-700 bg-clip-text text-transparent">
              {t.titlePart2}
            </span>
          </h1>

          <p className="text-base text-slate-600 max-w-xl leading-relaxed">
            {t.desc}
          </p>

          {/* Quick Roster Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 max-w-lg">
            <div className="glass-card p-4 rounded-2xl flex flex-col border border-slate-200 bg-white/70 shadow-sm">
              <span className="text-2xl font-extrabold text-blue-600 flex items-center gap-1">
                99% <TrendingUp className="h-4 w-4 text-green-500" />
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{t.accuracy}</span>
            </div>
            <div className="glass-card p-4 rounded-2xl flex flex-col border border-slate-200 bg-white/70 shadow-sm">
              <span className="text-2xl font-extrabold text-slate-800">10k+</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{t.prescriptions}</span>
            </div>
            <div className="glass-card p-4 rounded-2xl flex flex-col border border-slate-200 bg-white/70 shadow-sm">
              <span className="text-2xl font-extrabold text-slate-800">24/7</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{t.support}</span>
            </div>
          </div>

          {/* Call Store & Fast Booking Widgets */}
          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="tel:9717098219"
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 group justify-center cursor-pointer"
            >
              <PhoneCall className="h-4 w-4 text-white group-hover:animate-bounce" />
              {t.callDesk}
            </a>
            <a
              href="https://maps.app.goo.gl/FgzC3vY9Z7fbrquf6"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 border border-slate-200 hover:bg-slate-100 rounded-2xl font-bold text-sm text-slate-755 transition-all flex items-center gap-1.5 justify-center cursor-pointer"
            >
              <MapPin className="h-4 w-4 text-blue-600" />
              {t.directions}
            </a>
          </div>
        </div>

        {/* Authentication Card / Right Grid */}
        <div id="auth-section" className="lg:col-span-5 animate-in fade-in slide-in-from-right-6 duration-500">
          <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-200 relative overflow-hidden bg-white/95">
            <div className="absolute top-0 right-0 h-32 w-32 bg-blue-500/5 rounded-full filter blur-2xl glow-bg" />

            {/* Mobile / Check Account Form */}
            {step === 'mobile' && (
              <form onSubmit={handleCheckMobile} className="space-y-5 relative">
                <div className="text-center space-y-1.5 mb-6">
                  <h3 className="text-xl font-extrabold text-slate-900">{t.gateway}</h3>
                  <p className="text-xs text-slate-500">{t.gatewayDesc}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">{t.mobileLabel}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-sm font-semibold select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="99999 99999"
                      maxLength={10}
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-500/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                  {loading ? t.checking : t.continue}
                </button>
              </form>
            )}

            {/* Login Method Choice Form */}
            {step === 'choice' && (
              <div className="space-y-5 relative">
                <div className="text-center space-y-1.5 mb-6">
                  <h3 className="text-xl font-extrabold text-slate-900">{t.loginChoice}</h3>
                  <p className="text-xs text-slate-500">{t.loginChoiceDesc}</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleSendOtpFromChoice}
                    disabled={loading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? t.checking : t.viaOtpButton}
                  </button>

                  <button
                    onClick={() => setStep('passcode')}
                    className="w-full py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-sm shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {t.viaPasscodeButton}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('mobile')}
                  className="w-full py-2.5 mt-2 border border-slate-200 text-xs font-bold text-slate-500 rounded-xl transition-all cursor-pointer hover:bg-slate-50 text-center block"
                >
                  {t.goBack}
                </button>
              </div>
            )}

            {/* OTP Verification Form */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center space-y-1.5 mb-6">
                  <h3 className="text-xl font-extrabold text-slate-900">{t.otpTitle}</h3>
                  <p className="text-xs text-slate-500">{t.otpDesc}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">{t.otpLabel}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder={t.otpPlaceholder}
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm font-semibold text-slate-900 text-center tracking-widest font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setStep('mobile'); setOtp(''); }}
                    className="py-3 px-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-2xl transition-all cursor-pointer hover:bg-slate-50"
                  >
                    {t.goBack}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="col-span-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {loading ? t.authenticating : t.otpVerifyButton}
                  </button>
                </div>
              </form>
            )}

            {/* Passcode Verification Form */}
            {step === 'passcode' && (
              <form onSubmit={handleVerifyPasscode} className="space-y-5">
                <div className="text-center space-y-1.5 mb-6">
                  <h3 className="text-xl font-extrabold text-slate-900">{t.verification}</h3>
                  <p className="text-xs text-slate-500">{t.verificationDesc}</p>
                  <p className="text-[11px] text-orange-600 font-mono font-bold">{t.demoPIN}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">{t.pinLabel}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      placeholder="••••"
                      maxLength={4}
                      required
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm font-semibold text-slate-900 text-center tracking-widest font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setStep('mobile'); setPasscode(''); }}
                    className="py-3 px-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-2xl transition-all cursor-pointer hover:bg-slate-50"
                  >
                    {t.goBack}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="col-span-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {loading ? t.authenticating : t.verify}
                  </button>
                </div>
              </form>
            )}

            {/* Registration Form */}
            {step === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                <div className="text-center space-y-1.5 mb-4 sticky top-0 bg-white pb-2 z-10">
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-1 justify-center">
                    <UserPlus className="h-5 w-5 text-blue-600" /> {t.createProfile}
                  </h3>
                  <p className="text-xs text-slate-500">{t.registerDesc}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">{t.fullName}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder={t.fullNamePlaceholder}
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">{t.pinCreate}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      placeholder={t.pinPlaceholder}
                      maxLength={4}
                      required
                      value={regPasscode}
                      onChange={(e) => setRegPasscode(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">{t.age}</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={120}
                      value={regAge}
                      onChange={(e) => setRegAge(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs font-semibold text-slate-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">{t.gender}</label>
                    <select
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value as 'Male' | 'Female' | 'Other')}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs font-semibold text-slate-900"
                    >
                      <option value="Male">{t.male}</option>
                      <option value="Female">{t.female}</option>
                      <option value="Other">{t.other}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">{t.email}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      placeholder="rahul@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500">{t.address}</label>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      📍 {locationLoading ? t.fetchingLocation : t.useLocation}
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start text-slate-500">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <textarea
                      placeholder={t.addressPlaceholder}
                      required
                      rows={2}
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs font-semibold text-slate-900 min-h-[50px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  {loading ? t.submittingReg : t.completeLogin}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <p className="font-bold text-slate-600">ANANYA ENTERPRISES SYSTEM</p>
        <p className="mt-1 text-[10px] text-slate-400">Created by Animesh • Secure Clinic and Stock Platform</p>
      </footer>
    </div>
  );
}
