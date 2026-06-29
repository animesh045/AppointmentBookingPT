'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, hasFirebaseCredentials } from './FirebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc as firestoreDeleteDoc,
  onSnapshot 
} from 'firebase/firestore';

// ==========================================
// INTERFACES & SCHEMAS
// ==========================================

export interface UserProfile {
  uid: string;
  name: string;
  mobile: string;
  passcode: string; // 4-digit passcode PIN
  email?: string;
  address: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  role: 'consumer' | 'doctor' | 'admin';
  status: 'active' | 'suspended';
  createdAt: string;
  fcmTokens?: string[];
}

export interface DoctorProfile {
  uid: string;
  name: string;
  specialty: string;
  fees: number;
  availability: {
    days: string[];
    slots: string[];
  };
  profilePicture: string;
  rating?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientMobile: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  timeSlot: string;
  reason: string;
  fees: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  paymentStatus: 'pending' | 'paid';
  paymentId?: string;
  meetingLink?: string;
  notes?: string;
  prescriptionPdfUrl?: string; // base64 or file URL
  prescriptionReleased?: boolean;
  prescriptionMedicines?: Array<{
    name: string;
    qtyValue: string;
    qtyUnit: string;
    frequency: string;
    foodTiming: string;
    mealTiming?: string;
  }>;
  createdAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  price: number;
  quantity: number; // Stock count
  description: string;
  prescriptionRequired: boolean;
  category: string;
  image: string; // Base64 or standard URL
}

export interface CartItem {
  medicine: Medicine;
  quantity: number;
}

export interface Order {
  id: string;
  patientId: string;
  patientName: string;
  patientMobile: string;
  items: {
    medicineId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid';
  status: 'pending' | 'processing' | 'dispatched' | 'delivered';
  paymentId?: string;
  deliveryAddress: string;
  fastBooking: boolean; // Reserve before arrival
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  appointmentId: string;
  senderId: string;
  senderName: string;
  text: string;
  fileUrl?: string; // base64 file string
  fileName?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

// ==========================================
// CONTEXT TYPE DEFINITION
// ==========================================

interface AppContextType {
  // Authentication & Users
  user: UserProfile | null;
  users: UserProfile[];
  doctors: DoctorProfile[];
  login: (mobile: string, passcode: string) => Promise<boolean>;
  loginViaOtp: (mobile: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  registerUser: (profile: Omit<UserProfile, 'uid' | 'role' | 'status' | 'createdAt'>, customUid?: string) => Promise<void>;
  suspendUser: (uid: string) => void;
  unsuspendUser: (uid: string) => void;
  deleteUser: (uid: string) => void;
  changeUserRole: (uid: string, role: 'consumer' | 'doctor' | 'admin') => void;

  // Doctors Management
  addDoctor: (doc: Omit<DoctorProfile, 'uid'>) => void;
  updateDoctor: (uid: string, doc: Partial<DoctorProfile>) => void;
  deleteDoctor: (uid: string) => void;

  // Appointment Actions
  appointments: Appointment[];
  bookAppointment: (appointment: Omit<Appointment, 'id' | 'patientId' | 'patientName' | 'patientMobile' | 'status' | 'paymentStatus' | 'createdAt'>) => Promise<Appointment>;
  updateAppointmentStatus: (id: string, status: Appointment['status'], notes?: string, meetingLink?: string, additionalFields?: Partial<Appointment>) => void;
  assignDoctorToAppointment: (appointmentId: string, doctorUid: string) => Promise<void>;
  payConsultationFee: (id: string, method: string) => Promise<boolean>;

  // Pharmacy & Order Management
  medicines: Medicine[];
  addMedicine: (med: Omit<Medicine, 'id'>) => void;
  updateMedicine: (id: string, med: Partial<Medicine>) => void;
  removeMedicine: (id: string) => void;
  cart: CartItem[];
  addToCart: (med: Medicine) => void;
  removeFromCart: (medId: string) => void;
  updateCartQuantity: (medId: string, qty: number) => void;
  clearCart: () => void;
  checkoutCart: (address: string, fastBooking: boolean, payNow: boolean) => Promise<Order>;
  orders: Order[];
  updateOrderStatus: (id: string, status: Order['status'], paymentStatus?: Order['paymentStatus']) => void;

  // Live Chat
  chatMessages: ChatMessage[];
  sendChatMessage: (appointmentId: string, text: string, fileData?: { data: string; name: string }) => void;

  // Real-Time Notifications
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  addNotification: (userId: string, title: string, body: string) => void;

  // Dev Tool Helper
  devLoginAs: (role: 'consumer' | 'doctor' | 'admin') => void;
  auditLogs: AuditLog[];

  // Language support
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ==========================================
// PRE-POPULATED DEFAULT DUMMY DATA
// ==========================================

const DEFAULT_DOCTORS: DoctorProfile[] = [
  {
    uid: 'doc_ananya',
    name: 'Dr. Ananya Sharma',
    specialty: 'Cardiologist & General Medicine',
    fees: 600,
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']
    },
    profilePicture: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?w=150&auto=format&fit=crop&q=80',
    rating: 4.9
  },
  {
    uid: 'doc_vikram',
    name: 'Dr. Vikram Malhotra',
    specialty: 'Pediatrician',
    fees: 450,
    availability: {
      days: ['Monday', 'Wednesday', 'Friday'],
      slots: ['10:00 AM', '11:30 AM', '01:00 PM', '04:00 PM', '05:00 PM']
    },
    profilePicture: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    rating: 4.8
  },
  {
    uid: 'doc_priya',
    name: 'Dr. Priya Nair',
    specialty: 'Dermatologist',
    fees: 500,
    availability: {
      days: ['Tuesday', 'Thursday', 'Saturday'],
      slots: ['09:30 AM', '10:30 AM', '12:00 PM', '03:30 PM', '04:30 PM']
    },
    profilePicture: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    rating: 4.7
  }
];

const DEFAULT_MEDICINES: Medicine[] = [
  {
    id: 'med_paracetamol',
    name: 'Paracetamol 650mg (Dolo)',
    price: 30,
    quantity: 120,
    description: 'Relieves mild to moderate pain and reduces fever.',
    prescriptionRequired: false,
    category: 'Fever & Pain Relief',
    image: '💊'
  },
  {
    id: 'med_amoxicillin',
    name: 'Amoxicillin 500mg',
    price: 120,
    quantity: 45,
    description: 'Antibiotic used to treat various bacterial infections. Prescription required.',
    prescriptionRequired: true,
    category: 'Antibiotics',
    image: '🧪'
  },
  {
    id: 'med_cough_syrup',
    name: 'Benadryl Cough Syrup 100ml',
    price: 105,
    quantity: 80,
    description: 'Effective relief from wet and dry cough.',
    prescriptionRequired: false,
    category: 'Cough & Cold',
    image: '🧴'
  },
  {
    id: 'med_lipitor',
    name: 'Atorvastatin 10mg (Lipitor)',
    price: 180,
    quantity: 60,
    description: 'Lowers cholesterol levels to reduce cardiovascular risk.',
    prescriptionRequired: true,
    category: 'Heart Care',
    image: '❤️'
  },
  {
    id: 'med_multivitamin',
    name: 'Revital H Multivitamin (30 Caps)',
    price: 280,
    quantity: 150,
    description: 'Daily energy booster with ginseng, vitamins, and minerals.',
    prescriptionRequired: false,
    category: 'Vitamins & Supplements',
    image: '🌟'
  }
];

const DEFAULT_USERS: UserProfile[] = [
  {
    uid: 'admin_1',
    name: 'Animesh Gupta (Admin)',
    mobile: '8368825928',
    passcode: '1234',
    email: 'admin@ananya.com',
    address: 'Ananya Enterprises, Main Market Road, New Delhi',
    gender: 'Male',
    age: 32,
    role: 'admin',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'doc_ananya',
    name: 'Dr. Ananya Sharma',
    mobile: '8888888888',
    passcode: '1234',
    email: 'ananya.sharma@ananya.com',
    address: 'Max Super Speciality Clinic, Saket, Delhi',
    gender: 'Female',
    age: 41,
    role: 'doctor',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'consumer_demo',
    name: 'Rahul Sharma (Patient)',
    mobile: '7777777777',
    passcode: '1234',
    email: 'rahul@gmail.com',
    address: 'Flat 402, Block C, Green Park, New Delhi',
    gender: 'Male',
    age: 28,
    role: 'consumer',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

// ==========================================
// CONTEXT PROVIDER COMPONENT
// ==========================================

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global Collections
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Local Session
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [language, setLanguageState] = useState<'en' | 'hi'>('en');

  // Load language preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('ananya_language') as 'en' | 'hi' | null;
      if (storedLang === 'en' || storedLang === 'hi') {
        setLanguageState(storedLang);
      }
    }
  }, []);

  const setLanguage = (lang: 'en' | 'hi') => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ananya_language', lang);
    }
  };

  // Helper to sync doc to Firestore
  const syncDoc = async (collectionName: string, id: string, data: any) => {
    if (hasFirebaseCredentials() && db) {
      try {
        await setDoc(doc(db, collectionName, id), data);
        return true;
      } catch (err) {
        console.error(`Firestore syncDoc error for ${collectionName}/${id}:`, err);
      }
    }
    return false;
  };

  // Helper to delete doc from Firestore
  const deleteDocHelper = async (collectionName: string, id: string) => {
    if (hasFirebaseCredentials() && db) {
      try {
        await firestoreDeleteDoc(doc(db, collectionName, id));
        return true;
      } catch (err) {
        console.error(`Firestore deleteDoc error for ${collectionName}/${id}:`, err);
      }
    }
    return false;
  };

  // Load initial data from LocalStorage or seed defaults / Listen to Firestore
  useEffect(() => {
    if (hasFirebaseCredentials() && db) {
      // 1. Listen to users
      const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const docs = snapshot.docs.map(doc => doc.data() as UserProfile);
        if (docs.length === 0) {
          DEFAULT_USERS.forEach(async (u) => {
            await setDoc(doc(db, 'users', u.uid), u);
          });
        } else {
          // Check if admin is in the database and has correct role/passcode
          const adminIdx = docs.findIndex((u) => u.mobile === '8368825928');
          if (adminIdx === -1) {
            const defaultAdmin = DEFAULT_USERS.find(u => u.mobile === '8368825928');
            if (defaultAdmin) {
              setDoc(doc(db, 'users', defaultAdmin.uid), defaultAdmin);
            }
          } else if (docs[adminIdx].role !== 'admin' || docs[adminIdx].passcode !== '1234') {
            const revisedAdmin = { ...docs[adminIdx], role: 'admin' as const, passcode: '1234' };
            setDoc(doc(db, 'users', revisedAdmin.uid), revisedAdmin);
          }

          // Check if default doctor is in the database and has correct role/passcode
          const doctorIdx = docs.findIndex((u) => u.mobile === '8888888888');
          if (doctorIdx === -1) {
            const defaultDoctor = DEFAULT_USERS.find(u => u.mobile === '8888888888');
            if (defaultDoctor) {
              setDoc(doc(db, 'users', defaultDoctor.uid), defaultDoctor);
            }
          }

          setUsers(docs);
        }
      });

      // 2. Listen to doctors
      const unsubDoctors = onSnapshot(collection(db, 'doctors'), (snapshot) => {
        const docs = snapshot.docs.map(doc => doc.data() as DoctorProfile);
        if (docs.length === 0) {
          DEFAULT_DOCTORS.forEach(async (d) => {
            await setDoc(doc(db, 'doctors', d.uid), d);
          });
        } else {
          setDoctors(docs);
        }
      });

      // 3. Listen to medicines
      const unsubMedicines = onSnapshot(collection(db, 'medicines'), (snapshot) => {
        const docs = snapshot.docs.map(doc => doc.data() as Medicine);
        if (docs.length === 0) {
          DEFAULT_MEDICINES.forEach(async (m) => {
            await setDoc(doc(db, 'medicines', m.id), m);
          });
        } else {
          setMedicines(docs);
        }
      });

      // 4. Listen to appointments
      const unsubAppointments = onSnapshot(collection(db, 'appointments'), (snapshot) => {
        const docs = snapshot.docs.map(doc => doc.data() as Appointment);
        if (docs.length === 0) {
          const initialAppointments: Appointment[] = [
            {
              id: 'apt_1001',
              patientId: 'consumer_demo',
              patientName: 'Rahul Sharma',
              patientMobile: '7777777777',
              doctorId: 'doc_ananya',
              doctorName: 'Dr. Ananya Sharma',
              specialty: 'Cardiologist & General Medicine',
              date: new Date().toISOString().split('T')[0],
              timeSlot: '10:00 AM',
              reason: 'Routine cardiac health review and prescription renewal.',
              fees: 600,
              status: 'approved',
              paymentStatus: 'paid',
              paymentId: 'pay_mock_12345',
              meetingLink: 'https://meet.google.com/abc-defg-hij',
              notes: 'Keep taking Lipitor as prescribed. Watch sodium intake.',
              createdAt: new Date(Date.now() - 86400000).toISOString()
            }
          ];
          initialAppointments.forEach(async (apt) => {
            await setDoc(doc(db, 'appointments', apt.id), apt);
          });
        } else {
          docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setAppointments(docs);
        }
      });

      // 5. Listen to orders
      const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
        const docs = snapshot.docs.map(doc => doc.data() as Order);
        if (docs.length === 0) {
          const initialOrders: Order[] = [
            {
              id: 'ord_2001',
              patientId: 'consumer_demo',
              patientName: 'Rahul Sharma',
              patientMobile: '7777777777',
              items: [
                { medicineId: 'med_paracetamol', name: 'Paracetamol 650mg (Dolo)', price: 30, quantity: 2 },
                { medicineId: 'med_lipitor', name: 'Atorvastatin 10mg (Lipitor)', price: 180, quantity: 1 }
              ],
              totalAmount: 240,
              paymentStatus: 'paid',
              status: 'delivered',
              paymentId: 'pay_mock_99887',
              deliveryAddress: 'Flat 402, Block C, Green Park, New Delhi',
              fastBooking: false,
              createdAt: new Date(Date.now() - 172800000).toISOString()
            }
          ];
          initialOrders.forEach(async (ord) => {
            await setDoc(doc(db, 'orders', ord.id), ord);
          });
        } else {
          docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(docs);
        }
      });

      // 6. Listen to chatMessages
      const unsubChats = onSnapshot(collection(db, 'chatMessages'), (snapshot) => {
        const docs = snapshot.docs.map(doc => doc.data() as ChatMessage);
        if (docs.length === 0) {
          const initialChats: ChatMessage[] = [
            {
              id: 'msg_1',
              appointmentId: 'apt_1001',
              senderId: 'doc_ananya',
              senderName: 'Dr. Ananya Sharma',
              text: 'Hello Rahul! How are you doing today? I have reviewed your latest cholesterol reports.',
              timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: 'msg_2',
              appointmentId: 'apt_1001',
              senderId: 'consumer_demo',
              senderName: 'Rahul Sharma',
              text: 'Hello doctor, I am feeling fine. My energy levels have improved significantly.',
              timestamp: new Date(Date.now() - 3400000).toISOString()
            }
          ];
          initialChats.forEach(async (c) => {
            await setDoc(doc(db, 'chatMessages', c.id), c);
          });
        } else {
          docs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          setChatMessages(docs);
        }
      });

      // 7. Listen to notifications
      const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
        const docs = snapshot.docs.map(doc => doc.data() as Notification);
        if (docs.length === 0) {
          const initialNotifs: Notification[] = [
            {
              id: 'notif_1',
              userId: 'consumer_demo',
              title: 'Appointment Approved',
              body: 'Your consultation with Dr. Ananya Sharma on today is approved. Meeting link assigned!',
              read: false,
              createdAt: new Date().toISOString()
            }
          ];
          initialNotifs.forEach(async (n) => {
            await setDoc(doc(db, 'notifications', n.id), n);
          });
        } else {
          docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setNotifications(docs);
        }
      });

      // 8. Listen to auditLogs
      const unsubLogs = onSnapshot(collection(db, 'auditLogs'), (snapshot) => {
        const docs = snapshot.docs.map(doc => doc.data() as AuditLog);
        if (docs.length === 0) {
          const initialLogs: AuditLog[] = [
            {
              id: 'log_1',
              userId: 'admin_1',
              userName: 'Animesh Gupta (Admin)',
              action: 'System Initialization',
              details: 'Ananya Enterprises portal configured and pre-seeded.',
              timestamp: new Date().toISOString()
            }
          ];
          initialLogs.forEach(async (l) => {
            await setDoc(doc(db, 'auditLogs', l.id), l);
          });
        } else {
          docs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setAuditLogs(docs);
        }
      });

      // Load session local
      const activeSession = localStorage.getItem('ananya_session');
      if (activeSession) {
        setUser(JSON.parse(activeSession));
      }

      return () => {
        unsubUsers();
        unsubDoctors();
        unsubMedicines();
        unsubAppointments();
        unsubOrders();
        unsubChats();
        unsubNotifications();
        unsubLogs();
      };
    } else {
      // Offline/unconfigured fallback
      const localUsers = localStorage.getItem('ananya_users');
      const localDoctors = localStorage.getItem('ananya_doctors');
      const localMedicines = localStorage.getItem('ananya_medicines');
      const localAppointments = localStorage.getItem('ananya_appointments');
      const localOrders = localStorage.getItem('ananya_orders');
      const localChats = localStorage.getItem('ananya_chats');
      const localNotifications = localStorage.getItem('ananya_notifications');
      const localLogs = localStorage.getItem('ananya_logs');
      const activeSession = localStorage.getItem('ananya_session');

      // Seeding users local
      if (localUsers) {
        const parsed = JSON.parse(localUsers);
        const adminIndex = parsed.findIndex((u: any) => u.mobile === '8368825928');
        if (adminIndex === -1) {
          const defaultAdmin = DEFAULT_USERS.find(u => u.mobile === '8368825928');
          if (defaultAdmin) {
            parsed.push(defaultAdmin);
            localStorage.setItem('ananya_users', JSON.stringify(parsed));
          }
        } else if (parsed[adminIndex].role !== 'admin' || parsed[adminIndex].passcode !== '1234') {
          parsed[adminIndex].role = 'admin';
          parsed[adminIndex].passcode = '1234';
          localStorage.setItem('ananya_users', JSON.stringify(parsed));
        }

        const doctorIndex = parsed.findIndex((u: any) => u.mobile === '8888888888');
        if (doctorIndex === -1) {
          const defaultDoctor = DEFAULT_USERS.find(u => u.mobile === '8888888888');
          if (defaultDoctor) {
            parsed.push(defaultDoctor);
            localStorage.setItem('ananya_users', JSON.stringify(parsed));
          }
        }
        setUsers(parsed);
      } else {
        localStorage.setItem('ananya_users', JSON.stringify(DEFAULT_USERS));
        setUsers(DEFAULT_USERS);
      }

      // Seeding doctors local
      if (localDoctors) {
        setDoctors(JSON.parse(localDoctors));
      } else {
        localStorage.setItem('ananya_doctors', JSON.stringify(DEFAULT_DOCTORS));
        setDoctors(DEFAULT_DOCTORS);
      }

      // Seeding medicines local
      if (localMedicines) {
        setMedicines(JSON.parse(localMedicines));
      } else {
        localStorage.setItem('ananya_medicines', JSON.stringify(DEFAULT_MEDICINES));
        setMedicines(DEFAULT_MEDICINES);
      }

      // Seeding appointments local
      if (localAppointments) {
        setAppointments(JSON.parse(localAppointments));
      } else {
        const initialAppointments: Appointment[] = [
          {
            id: 'apt_1001',
            patientId: 'consumer_demo',
            patientName: 'Rahul Sharma',
            patientMobile: '7777777777',
            doctorId: 'doc_ananya',
            doctorName: 'Dr. Ananya Sharma',
            specialty: 'Cardiologist & General Medicine',
            date: new Date().toISOString().split('T')[0],
            timeSlot: '10:00 AM',
            reason: 'Routine cardiac health review and prescription renewal.',
            fees: 600,
            status: 'approved',
            paymentStatus: 'paid',
            paymentId: 'pay_mock_12345',
            meetingLink: 'https://meet.google.com/abc-defg-hij',
            notes: 'Keep taking Lipitor as prescribed. Watch sodium intake.',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        localStorage.setItem('ananya_appointments', JSON.stringify(initialAppointments));
        setAppointments(initialAppointments);
      }

      // Seeding orders local
      if (localOrders) {
        setOrders(JSON.parse(localOrders));
      } else {
        const initialOrders: Order[] = [
          {
            id: 'ord_2001',
            patientId: 'consumer_demo',
            patientName: 'Rahul Sharma',
            patientMobile: '7777777777',
            items: [
              { medicineId: 'med_paracetamol', name: 'Paracetamol 650mg (Dolo)', price: 30, quantity: 2 },
              { medicineId: 'med_lipitor', name: 'Atorvastatin 10mg (Lipitor)', price: 180, quantity: 1 }
            ],
            totalAmount: 240,
            paymentStatus: 'paid',
            status: 'delivered',
            paymentId: 'pay_mock_99887',
            deliveryAddress: 'Flat 402, Block C, Green Park, New Delhi',
            fastBooking: false,
            createdAt: new Date(Date.now() - 172800000).toISOString()
          }
        ];
        localStorage.setItem('ananya_orders', JSON.stringify(initialOrders));
        setOrders(initialOrders);
      }

      // Seeding chats local
      if (localChats) {
        setChatMessages(JSON.parse(localChats));
      } else {
        const initialChats: ChatMessage[] = [
          {
            id: 'msg_1',
            appointmentId: 'apt_1001',
            senderId: 'doc_ananya',
            senderName: 'Dr. Ananya Sharma',
            text: 'Hello Rahul! How are you doing today? I have reviewed your latest cholesterol reports.',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 'msg_2',
            appointmentId: 'apt_1001',
            senderId: 'consumer_demo',
            senderName: 'Rahul Sharma',
            text: 'Hello doctor, I am feeling fine. My energy levels have improved significantly.',
            timestamp: new Date(Date.now() - 3400000).toISOString()
          }
        ];
        localStorage.setItem('ananya_chats', JSON.stringify(initialChats));
        setChatMessages(initialChats);
      }

      // Seeding Notifications local
      if (localNotifications) {
        setNotifications(JSON.parse(localNotifications));
      } else {
        const initialNotifs: Notification[] = [
          {
            id: 'notif_1',
            userId: 'consumer_demo',
            title: 'Appointment Approved',
            body: 'Your consultation with Dr. Ananya Sharma on today is approved. Meeting link assigned!',
            read: false,
            createdAt: new Date().toISOString()
          }
        ];
        localStorage.setItem('ananya_notifications', JSON.stringify(initialNotifs));
        setNotifications(initialNotifs);
      }

      // Seeding Logs local
      if (localLogs) {
        setAuditLogs(JSON.parse(localLogs));
      } else {
        const initialLogs: AuditLog[] = [
          {
            id: 'log_1',
            userId: 'admin_1',
            userName: 'Animesh Gupta (Admin)',
            action: 'System Initialization',
            details: 'Ananya Enterprises portal configured and pre-seeded.',
            timestamp: new Date().toISOString()
          }
        ];
        localStorage.setItem('ananya_logs', JSON.stringify(initialLogs));
        setAuditLogs(initialLogs);
      }

      if (activeSession) {
        setUser(JSON.parse(activeSession));
      }
    }
  }, []);

  // Synchronize localStorage updates across tabs/windows or manual triggers in same window
  useEffect(() => {
    const handleStorage = (e: any) => {
      const localUsers = localStorage.getItem('ananya_users');
      if (localUsers) setUsers(JSON.parse(localUsers));
      const localDoctors = localStorage.getItem('ananya_doctors');
      if (localDoctors) setDoctors(JSON.parse(localDoctors));
      const localMedicines = localStorage.getItem('ananya_medicines');
      if (localMedicines) setMedicines(JSON.parse(localMedicines));
      const localAppointments = localStorage.getItem('ananya_appointments');
      if (localAppointments) setAppointments(JSON.parse(localAppointments));
      const localOrders = localStorage.getItem('ananya_orders');
      if (localOrders) setOrders(JSON.parse(localOrders));
      const localChats = localStorage.getItem('ananya_chats');
      if (localChats) setChatMessages(JSON.parse(localChats));
      const localNotifications = localStorage.getItem('ananya_notifications');
      if (localNotifications) setNotifications(JSON.parse(localNotifications));
      const localLogs = localStorage.getItem('ananya_logs');
      if (localLogs) setAuditLogs(JSON.parse(localLogs));
      const activeSession = localStorage.getItem('ananya_session');
      if (activeSession) setUser(JSON.parse(activeSession));
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('local-storage-update', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('local-storage-update', handleStorage);
    };
  }, []);

  // Register FCM Token for logged-in user
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;

    const registerFcmToken = async () => {
      try {
        const { messaging, hasFirebaseCredentials } = await import('./FirebaseConfig');
        if (!hasFirebaseCredentials() || !messaging) return;

        // Request permission
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('[FCM] Notification permission denied');
            return;
          }
        }

        // Register dynamic Service Worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('[FCM] Service Worker registered successfully:', registration);

        const { getToken } = await import('firebase/messaging');
        const token = await getToken(messaging, {
          serviceWorkerRegistration: registration
        });
        
        if (token) {
          console.log('[FCM] Token retrieved:', token);
          const existingTokens = user.fcmTokens || [];
          if (!existingTokens.includes(token)) {
            const updatedTokens = [...existingTokens, token];
            await updateProfile({ fcmTokens: updatedTokens });
          }
        }
      } catch (err) {
        console.error('[FCM] Failed to register FCM token:', err);
      }
    };

    const timer = setTimeout(registerFcmToken, 3000);
    return () => clearTimeout(timer);
  }, [user]);

  // Listen to foreground FCM messages
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;

    let unsub: (() => void) | undefined;

    const listenForeground = async () => {
      try {
        const { messaging, hasFirebaseCredentials } = await import('./FirebaseConfig');
        if (!hasFirebaseCredentials() || !messaging) return;

        const { onMessage } = await import('firebase/messaging');
        unsub = onMessage(messaging, (payload) => {
          console.log('[FCM] Foreground message received:', payload);
          if (Notification.permission === 'granted') {
            new Notification(payload.notification?.title || 'Ananya Enterprises', {
              body: payload.notification?.body || '',
              icon: '/favicon.ico'
            });
          }
        });
      } catch (err) {
        console.error('[FCM] Foreground listener registration failed:', err);
      }
    };

    listenForeground();
    return () => {
      if (unsub) unsub();
    };
  }, [user]);

  // Helper helper to write states to local storage
  const syncStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const createLog = async (action: string, details: string, uid?: string, name?: string) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      userId: uid || user?.uid || 'guest',
      userName: name || user?.name || 'Guest User',
      action,
      details,
      timestamp: new Date().toISOString()
    };
    const dbSaved = await syncDoc('auditLogs', newLog.id, newLog);
    if (!dbSaved) {
      const updated = [newLog, ...auditLogs];
      setAuditLogs(updated);
      syncStorage('ananya_logs', updated);
    }
  };

  // ==========================================
  // FUNCTION IMPLEMENTATIONS
  // ==========================================

  // Authentication
  // Authentication
  const login = async (mobile: string, passcode: string): Promise<boolean> => {
    // Load fresh copy of users from localStorage if available to avoid race conditions with React state
    let activeUsers = users;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ananya_users');
      if (stored) {
        activeUsers = JSON.parse(stored);
      }
    }

    // Intercept/force admin credentials and role to ensure stale local storage behaves correctly
    if (mobile === '8368825928') {
      if (passcode !== '1234') {
        alert('Incorrect 4-digit Passcode (PIN). Please try again.');
        return false;
      }
      let adminUser = activeUsers.find((u) => u.mobile === '8368825928');
      if (!adminUser || adminUser.role !== 'admin' || adminUser.passcode !== '1234') {
        const defaultAdmin = DEFAULT_USERS.find(u => u.mobile === '8368825928') || {
          uid: 'admin_1',
          name: 'Animesh Gupta (Admin)',
          mobile: '8368825928',
          passcode: '1234',
          email: 'admin@ananya.com',
          address: 'Ananya Enterprises, Main Market Road, New Delhi',
          gender: 'Male' as const,
          age: 32,
          role: 'admin' as const,
          status: 'active' as const,
          createdAt: new Date().toISOString()
        };
        adminUser = {
          ...defaultAdmin,
          role: 'admin',
          passcode: '1234',
          status: 'active'
        };
        
        syncDoc('users', adminUser.uid, adminUser);
        
        const otherUsers = activeUsers.filter(u => u.mobile !== '8368825928');
        const updatedUsers = [...otherUsers, adminUser];
        setUsers(updatedUsers);
        syncStorage('ananya_users', updatedUsers);
        activeUsers = updatedUsers;
      }
      setUser(adminUser);
      syncStorage('ananya_session', adminUser);
      createLog('User Login', `Logged in via mobile ${mobile}`, adminUser.uid, adminUser.name);
      return true;
    }

    // Search for existing user
    const existing = activeUsers.find((u) => u.mobile === mobile);
    if (existing) {
      if (existing.status === 'suspended') {
        alert('Your account is currently suspended. Please contact Ananya Admin.');
        return false;
      }
      if (existing.passcode !== passcode) {
        alert('Incorrect 4-digit Passcode (PIN). Please try again.');
        return false;
      }
      setUser(existing);
      syncStorage('ananya_session', existing);
      createLog('User Login', `Logged in via mobile ${mobile}`, existing.uid, existing.name);
      return true;
    }

    // Else trigger auto-creation modal sequence
    return false;
  };

  const registerUser = async (profile: Omit<UserProfile, 'uid' | 'role' | 'status' | 'createdAt'>, customUid?: string) => {
    // Load fresh copy of users from localStorage if available to avoid race conditions with React state
    let activeUsers = users;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ananya_users');
      if (stored) {
        activeUsers = JSON.parse(stored);
      }
    }

    const newUid = customUid || `user_${Date.now()}`;
    const newUser: UserProfile = {
      ...profile,
      uid: newUid,
      role: 'consumer',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const dbSaved = await syncDoc('users', newUser.uid, newUser);
    
    // Deduplicate and update state and localStorage
    const existsIndex = activeUsers.findIndex(u => u.uid === newUser.uid || u.mobile === newUser.mobile);
    let updated;
    if (existsIndex > -1) {
      updated = activeUsers.map((u, i) => i === existsIndex ? newUser : u);
    } else {
      updated = [...activeUsers, newUser];
    }
    setUsers(updated);
    if (typeof window !== 'undefined') {
      syncStorage('ananya_users', updated);
    }

    // Auto log-in
    setUser(newUser);
    syncStorage('ananya_session', newUser);
    createLog('User Self-Registration', `Created and logged into account ${profile.name}`, newUid, profile.name);
    addNotification(newUid, 'Welcome!', 'Thank you for registering at Ananya Enterprises portal.');
  };

  const loginViaOtp = async (mobile: string): Promise<boolean> => {
    let activeUsers = users;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ananya_users');
      if (stored) {
        activeUsers = JSON.parse(stored);
      }
    }

    const existing = activeUsers.find((u) => u.mobile === mobile);
    if (existing) {
      if (existing.status === 'suspended') {
        alert('Your account is currently suspended. Please contact Ananya Admin.');
        return false;
      }
      setUser(existing);
      syncStorage('ananya_session', existing);
      createLog('User Login (OTP)', `Logged in via OTP for mobile ${mobile}`, existing.uid, existing.name);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (user) {
      createLog('User Logout', `Logged out from session`, user.uid, user.name);
    }
    setUser(null);
    localStorage.removeItem('ananya_session');
    setCart([]);
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser = { ...user, ...profileData };
    setUser(updatedUser);
    syncStorage('ananya_session', updatedUser);

    const dbSaved = await syncDoc('users', user.uid, updatedUser);
    if (!dbSaved) {
      const updatedUsers = users.map((u) => (u.uid === user.uid ? updatedUser : u));
      setUsers(updatedUsers);
      syncStorage('ananya_users', updatedUsers);
    }

    createLog('Profile Update', 'User updated personal details');
  };

  // Admin User & Role controls
  const suspendUser = async (uid: string) => {
    const targetUser = users.find(u => u.uid === uid);
    if (targetUser) {
      const revisedUser = { ...targetUser, status: 'suspended' as const };
      const updated = users.map((u) => (u.uid === uid ? revisedUser : u));
      setUsers(updated);
      syncStorage('ananya_users', updated);
      window.dispatchEvent(new Event('local-storage-update'));
      await syncDoc('users', uid, revisedUser);
    }
    createLog('Suspend User', `Suspended user UID: ${uid}`);
    addNotification(uid, 'Account Suspended', 'Your account has been suspended by the administrator.');
  };

  const unsuspendUser = async (uid: string) => {
    const targetUser = users.find(u => u.uid === uid);
    if (targetUser) {
      const revisedUser = { ...targetUser, status: 'active' as const };
      const updated = users.map((u) => (u.uid === uid ? revisedUser : u));
      setUsers(updated);
      syncStorage('ananya_users', updated);
      window.dispatchEvent(new Event('local-storage-update'));
      await syncDoc('users', uid, revisedUser);
    }
    createLog('Activate User', `Activated user UID: ${uid}`);
    addNotification(uid, 'Account Restored', 'Your account has been reactivated. You can now login.');
  };

  const deleteUser = async (uid: string) => {
    const updated = users.filter((u) => u.uid !== uid);
    setUsers(updated);
    syncStorage('ananya_users', updated);
    window.dispatchEvent(new Event('local-storage-update'));
    await deleteDocHelper('users', uid);
    createLog('Delete User', `Deleted user account UID: ${uid}`);
  };

  const changeUserRole = async (uid: string, role: 'consumer' | 'doctor' | 'admin') => {
    const targetUser = users.find(u => u.uid === uid);
    if (targetUser) {
      const revisedUser = { ...targetUser, role };
      
      const updated = users.map((u) => (u.uid === uid ? revisedUser : u));
      setUsers(updated);
      syncStorage('ananya_users', updated);
      window.dispatchEvent(new Event('local-storage-update'));

      await syncDoc('users', uid, revisedUser);

      // If role is updated to doctor, ensure they have a DoctorProfile
      if (role === 'doctor') {
        const docExists = doctors.some((d) => d.uid === uid);
        if (!docExists) {
          const matchingUser = updated.find((u) => u.uid === uid);
          const newDoc: DoctorProfile = {
            uid: uid,
            name: matchingUser ? matchingUser.name : 'Dr. Practitioner',
            specialty: 'General Medicine',
            fees: 500,
            availability: {
              days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']
            },
            profilePicture: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
            rating: 5.0
          };
          
          await syncDoc('doctors', uid, newDoc);
          
          const updatedDoctors = [...doctors, newDoc];
          setDoctors(updatedDoctors);
          syncStorage('ananya_doctors', updatedDoctors);
        }
      }

      // If changing role of current logged in user
      if (user && user.uid === uid) {
        const updatedSelf = { ...user, role };
        setUser(updatedSelf);
        syncStorage('ananya_session', updatedSelf);
      }
    }
    createLog('Change User Role', `Assigned role ${role} to UID: ${uid}`);
    addNotification(uid, 'Role Level Updated', `Your system privileges changed. New Role: ${role.toUpperCase()}`);
  };

  // Doctors
  const addDoctor = async (doc: Omit<DoctorProfile, 'uid'>) => {
    const newUid = `doc_${Date.now()}`;
    const newDoc: DoctorProfile = { ...doc, uid: newUid, rating: 5.0 };

    const dbSaved = await syncDoc('doctors', newUid, newDoc);
    if (!dbSaved) {
      const updated = [...doctors, newDoc];
      setDoctors(updated);
      syncStorage('ananya_doctors', updated);
    }

    // Create a companion User Account for the doctor to allow login
    const doctorUser: UserProfile = {
      uid: newUid,
      name: doc.name,
      mobile: `888888${Math.floor(1000 + Math.random() * 9000)}`, // Generate demo mobile or assign dummy
      passcode: '1234',
      address: 'Ananya Healthcare Complex, Clinic Wing',
      gender: 'Other',
      age: 35,
      role: 'doctor',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    syncDoc('users', newUid, doctorUser);
    
    if (!dbSaved) {
      const updatedUsers = [...users, doctorUser];
      setUsers(updatedUsers);
      syncStorage('ananya_users', updatedUsers);
    }

    createLog('Add Doctor Profile', `Added doctor ${doc.name} with specialty ${doc.specialty}`);
  };

  const updateDoctor = async (uid: string, docData: Partial<DoctorProfile>) => {
    const targetDoc = doctors.find((d) => d.uid === uid);
    if (targetDoc) {
      const revisedDoc = { ...targetDoc, ...docData };
      const dbSaved = await syncDoc('doctors', uid, revisedDoc);
      if (!dbSaved) {
        const updated = doctors.map((d) => (d.uid === uid ? revisedDoc : d));
        setDoctors(updated);
        syncStorage('ananya_doctors', updated);
      }
    }
    createLog('Update Doctor Profile', `Updated profile of doctor ${uid}`);
  };

  const deleteDoctor = async (uid: string) => {
    const dbDeleted = await deleteDocHelper('doctors', uid);
    if (!dbDeleted) {
      const updated = doctors.filter((d) => d.uid !== uid);
      setDoctors(updated);
      syncStorage('ananya_doctors', updated);
    }
    createLog('Remove Doctor Profile', `Deleted doctor listing: ${uid}`);
  };

  // Appointments
  const bookAppointment = async (
    aptData: Omit<Appointment, 'id' | 'patientId' | 'patientName' | 'patientMobile' | 'status' | 'paymentStatus' | 'createdAt'>
  ): Promise<Appointment> => {
    if (!user) throw new Error('Must be logged in to book');
    
    const newApt: Appointment = {
      ...aptData,
      id: `apt_${Date.now()}`,
      patientId: user.uid,
      patientName: user.name,
      patientMobile: user.mobile,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString()
    };

    const dbSaved = await syncDoc('appointments', newApt.id, newApt);
    if (!dbSaved) {
      const updated = [newApt, ...appointments];
      setAppointments(updated);
      syncStorage('ananya_appointments', updated);
    }

    createLog('Book Appointment', `Booked appointment with ${aptData.doctorName} for ${aptData.date}`);
    
    // Notify Doctor & Admins
    addNotification(aptData.doctorId, 'New Appointment Request', `${user.name} has requested an appointment on ${aptData.date} at ${aptData.timeSlot}.`);
    const adminUsers = users.filter(u => u.role === 'admin');
    if (adminUsers.length > 0) {
      adminUsers.forEach(adm => {
        addNotification(adm.uid, 'New Consultation Request', `Appointment pending approval: ${user.name} with ${aptData.doctorName}.`);
      });
    } else {
      addNotification('admin_1', 'New Consultation Request', `Appointment pending approval: ${user.name} with ${aptData.doctorName}.`);
    }

    return newApt;
  };

  const updateAppointmentStatus = async (
    id: string,
    status: Appointment['status'],
    notes?: string,
    meetingLink?: string,
    additionalFields?: Partial<Appointment>
  ) => {
    const revisedApts = appointments.map((apt) => {
      if (apt.id === id) {
        const revised = { ...apt, status, ...additionalFields };
        if (notes !== undefined) revised.notes = notes;
        if (meetingLink !== undefined) revised.meetingLink = meetingLink;
        
        syncDoc('appointments', id, revised);

        // Push notification alerts to patient & doctor
        if (status === 'approved') {
          addNotification(apt.patientId, 'Appointment APPROVED', `Your appointment with ${revised.doctorName} on ${apt.date} is approved!`);
          if (revised.doctorId !== 'pending') {
            addNotification(revised.doctorId, 'Appointment APPROVED', `Patient ${apt.patientName}'s appointment on ${apt.date} at ${apt.timeSlot} is approved!`);
          }
          if (meetingLink) {
            addNotification(apt.patientId, 'Meeting Link Assigned', `Consultation video room is active. Join: ${meetingLink}`);
            if (revised.doctorId !== 'pending') {
              addNotification(revised.doctorId, 'Meeting Link Assigned', `Consultation video room is active. Join: ${meetingLink}`);
            }
          }
        } else if (status === 'rejected') {
          addNotification(apt.patientId, 'Appointment REJECTED', `Your request with ${revised.doctorName} was rejected or needs rescheduling.`);
        } else if (status === 'completed') {
          addNotification(apt.patientId, 'Consultation Completed', `Prescription and reports are now ready for download!`);
        }

        return revised;
      }
      return apt;
    });

    setAppointments(revisedApts);
    syncStorage('ananya_appointments', revisedApts);
    window.dispatchEvent(new Event('local-storage-update'));
    
    createLog('Update Appointment', `Appointment ${id} status updated to: ${status}`);
  };

  const assignDoctorToAppointment = async (appointmentId: string, doctorUid: string) => {
    const doctor = doctors.find(d => d.uid === doctorUid);
    if (!doctor) return;

    const revisedApts = appointments.map((apt) => {
      if (apt.id === appointmentId) {
        const revised = {
          ...apt,
          doctorId: doctor.uid,
          doctorName: doctor.name,
          specialty: doctor.specialty,
          fees: doctor.fees
        };
        syncDoc('appointments', appointmentId, revised);
        
        // Notify patient
        addNotification(apt.patientId, 'Clinician Assigned', `Dr. ${doctor.name} has been assigned to your consultation on ${apt.date}.`);
        
        return revised;
      }
      return apt;
    });

    setAppointments(revisedApts);
    syncStorage('ananya_appointments', revisedApts);
    window.dispatchEvent(new Event('local-storage-update'));
    
    createLog('Assign Doctor', `Assigned Dr. ${doctor.name} to Appointment ID: ${appointmentId}`);
  };

  const payConsultationFee = async (id: string, method: string): Promise<boolean> => {
    const paymentId = `pay_mock_${Math.floor(100000 + Math.random() * 900000)}`;
    const revisedApts = appointments.map((apt) => {
      if (apt.id === id) {
        const revised = { ...apt, paymentStatus: 'paid' as const, paymentId };
        syncDoc('appointments', id, revised);
        addNotification(apt.patientId, 'Payment Successful', `Consultation fee of ₹${apt.fees} received. Txn: ${paymentId}`);
        addNotification('admin_1', 'Revenue Received', `Payment of ₹${apt.fees} logged for appointment ${id}.`);
        return revised;
      }
      return apt;
    });

    if (!hasFirebaseCredentials() || !db) {
      setAppointments(revisedApts);
      syncStorage('ananya_appointments', revisedApts);
    }
    createLog('Process Fee Payment', `Logged fee payment for appointment ${id}. Method: ${method}`);
    return true;
  };

  // Medicine Inventory CRUD
  const addMedicine = async (med: Omit<Medicine, 'id'>) => {
    const newId = `med_${Date.now()}`;
    const newMed: Medicine = { ...med, id: newId };
    
    const dbSaved = await syncDoc('medicines', newId, newMed);
    if (!dbSaved) {
      const updated = [...medicines, newMed];
      setMedicines(updated);
      syncStorage('ananya_medicines', updated);
    }
    createLog('Add Medicine Stock', `Added medicine ${med.name} into index`);
  };

  const updateMedicine = async (id: string, medData: Partial<Medicine>) => {
    const targetMed = medicines.find(m => m.id === id);
    if (targetMed) {
      const revisedMed = { ...targetMed, ...medData };
      const dbSaved = await syncDoc('medicines', id, revisedMed);
      if (!dbSaved) {
        const updated = medicines.map((m) => (m.id === id ? revisedMed : m));
        setMedicines(updated);
        syncStorage('ananya_medicines', updated);
      }
    }
    createLog('Modify Medicine Stock', `Updated stock parameters of medicine ID: ${id}`);
  };

  const removeMedicine = async (id: string) => {
    const dbDeleted = await deleteDocHelper('medicines', id);
    if (!dbDeleted) {
      const updated = medicines.filter((m) => m.id !== id);
      setMedicines(updated);
      syncStorage('ananya_medicines', updated);
    }
    createLog('Remove Medicine Stock', `Deleted medicine listing ID: ${id}`);
  };

  // Cart Mechanics
  const addToCart = (med: Medicine) => {
    const existing = cart.find((item) => item.medicine.id === med.id);
    if (existing) {
      setCart(cart.map((item) => (item.medicine.id === med.id ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setCart([...cart, { medicine: med, quantity: 1 }]);
    }
  };

  const removeFromCart = (medId: string) => {
    setCart(cart.filter((item) => item.medicine.id !== medId));
  };

  const updateCartQuantity = (medId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(medId);
    } else {
      setCart(cart.map((item) => (item.medicine.id === medId ? { ...item, quantity: qty } : item)));
    }
  };

  const clearCart = () => setCart([]);

  const checkoutCart = async (address: string, fastBooking: boolean, payNow: boolean): Promise<Order> => {
    if (!user) throw new Error('Authentication required');
    if (cart.length === 0) throw new Error('Cart is empty');

    const total = cart.reduce((sum, item) => sum + item.medicine.price * item.quantity, 0);
    const paymentId = payNow ? `pay_mock_${Math.floor(100000 + Math.random() * 900000)}` : undefined;

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      patientId: user.uid,
      patientName: user.name,
      patientMobile: user.mobile,
      items: cart.map((item) => ({
        medicineId: item.medicine.id,
        name: item.medicine.name,
        price: item.medicine.price,
        quantity: item.quantity
      })),
      totalAmount: total,
      paymentStatus: payNow ? 'paid' : 'pending',
      status: 'pending',
      paymentId,
      deliveryAddress: fastBooking ? 'Self-Pickup (Fast Reservation)' : address,
      fastBooking,
      createdAt: new Date().toISOString()
    };

    // Deduct stock levels in medicines list
    const updatedMeds = medicines.map((m) => {
      const cartMatch = cart.find((c) => c.medicine.id === m.id);
      if (cartMatch) {
        const updatedQty = Math.max(0, m.quantity - cartMatch.quantity);
        const updatedMed = { ...m, quantity: updatedQty };
        syncDoc('medicines', m.id, updatedMed);
        return updatedMed;
      }
      return m;
    });

    if (!hasFirebaseCredentials() || !db) {
      setMedicines(updatedMeds);
      syncStorage('ananya_medicines', updatedMeds);
    }

    // Save Order
    const dbSaved = await syncDoc('orders', newOrder.id, newOrder);
    if (!dbSaved) {
      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      syncStorage('ananya_orders', updatedOrders);
    }

    // Clear cart local
    setCart([]);

    // Trigger alerts
    addNotification(user.uid, 'Order Received Successfully', `Order ${newOrder.id} has been registered! Total amount: ₹${total}.`);
    addNotification('admin_1', 'New Pharmacy Order', `Order ${newOrder.id} placed by ${user.name}. Total: ₹${total}.`);
    createLog('Pharmacy Order Checkout', `Order ${newOrder.id} created. Total amount: ₹${total}`);

    return newOrder;
  };

  const updateOrderStatus = async (id: string, status: Order['status'], paymentStatus?: Order['paymentStatus']) => {
    const revisedOrders = orders.map((o) => {
      if (o.id === id) {
        const revised = { ...o, status };
        if (paymentStatus) revised.paymentStatus = paymentStatus;

        syncDoc('orders', id, revised);

        // Alerts to patient
        if (status === 'processing') {
          addNotification(o.patientId, 'Order Processing', `Pharmacy staff is preparing your order ${o.id}.`);
        } else if (status === 'dispatched') {
          addNotification(o.patientId, 'Order Dispatched', `Your medicine order ${o.id} is out for delivery!`);
        } else if (status === 'delivered') {
          addNotification(o.patientId, 'Order Delivered', `Order ${o.id} has been successfully delivered/collected.`);
        }

        return revised;
      }
      return o;
    });

    if (!hasFirebaseCredentials() || !db) {
      setOrders(revisedOrders);
      syncStorage('ananya_orders', revisedOrders);
    }
    createLog('Update Pharmacy Order', `Order ${id} status set to: ${status}`);
  };

  // Live Chat Messaging
  const sendChatMessage = async (appointmentId: string, text: string, fileData?: { data: string; name: string }) => {
    if (!user) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      appointmentId,
      senderId: user.uid,
      senderName: user.name,
      text,
      fileUrl: fileData?.data,
      fileName: fileData?.name,
      timestamp: new Date().toISOString()
    };

    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    syncStorage('ananya_chats', updated);
    window.dispatchEvent(new Event('local-storage-update'));

    await syncDoc('chatMessages', newMsg.id, newMsg);

    // Alert receiver depending on sender role
    const apt = appointments.find((a) => a.id === appointmentId);
    if (apt) {
      const recipientId = user.uid === apt.patientId ? apt.doctorId : apt.patientId;
      addNotification(recipientId, 'New Message Received', `${user.name} sent you a message in your medical chat.`);
    }
  };

  // Notifications Manager
  const addNotification = async (userId: string, title: string, body: string) => {
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      userId,
      title,
      body,
      read: false,
      createdAt: new Date().toISOString()
    };

    const dbSaved = await syncDoc('notifications', newNotif.id, newNotif);
    if (!dbSaved) {
      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        syncStorage('ananya_notifications', updated);
        return updated;
      });
    }

    // Fire FCM push notification if user has registered tokens
    try {
      let activeUsers = users;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('ananya_users');
        activeUsers = stored ? JSON.parse(stored) : users;
      }
      const target = activeUsers.find((u: any) => u.uid === userId);
      if (target && target.fcmTokens && target.fcmTokens.length > 0) {
        fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokens: target.fcmTokens,
            title,
            body
          })
        }).catch(err => console.error('Push notification send call failed:', err));
      }
    } catch (err) {
      console.error('Error dispatching push notification:', err);
    }
  };

  const markNotificationRead = async (id: string) => {
    const targetNotif = notifications.find(n => n.id === id);
    if (targetNotif) {
      const revisedNotif = { ...targetNotif, read: true };
      const dbSaved = await syncDoc('notifications', id, revisedNotif);
      if (!dbSaved) {
        const updated = notifications.map((n) => (n.id === id ? revisedNotif : n));
        setNotifications(updated);
        syncStorage('ananya_notifications', updated);
      }
    }
  };

  // Developer Bypass login
  const devLoginAs = (role: 'consumer' | 'doctor' | 'admin') => {
    let mockAccount: UserProfile | undefined;
    if (role === 'admin') {
      mockAccount = users.find((u) => u.role === 'admin');
    } else if (role === 'doctor') {
      mockAccount = users.find((u) => u.role === 'doctor') || {
        uid: 'doc_ananya',
        name: 'Dr. Ananya Sharma',
        mobile: '8888888888',
        passcode: '1234',
        email: 'ananya.sharma@ananya.com',
        address: 'Max Super Speciality Clinic, Saket, Delhi',
        gender: 'Female',
        age: 41,
        role: 'doctor',
        status: 'active',
        createdAt: new Date().toISOString()
      };
    } else {
      mockAccount = users.find((u) => u.role === 'consumer') || {
        uid: 'consumer_demo',
        name: 'Rahul Sharma (Patient)',
        mobile: '7777777777',
        passcode: '1234',
        email: 'rahul@gmail.com',
        address: 'Flat 402, Block C, Green Park, New Delhi',
        gender: 'Male',
        age: 28,
        role: 'consumer',
        status: 'active',
        createdAt: new Date().toISOString()
      };
    }

    if (mockAccount) {
      setUser(mockAccount);
      syncStorage('ananya_session', mockAccount);
      createLog('Developer Quick Sign-In', `Bypassed authentication to act as ${role.toUpperCase()}`, mockAccount.uid, mockAccount.name);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        users,
        doctors,
        login,
        loginViaOtp,
        logout,
        updateProfile,
        registerUser,
        suspendUser,
        unsuspendUser,
        deleteUser,
        changeUserRole,
        addDoctor,
        updateDoctor,
        deleteDoctor,
        appointments,
        bookAppointment,
        updateAppointmentStatus,
        assignDoctorToAppointment,
        payConsultationFee,
        medicines,
        addMedicine,
        updateMedicine,
        removeMedicine,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        checkoutCart,
        orders,
        updateOrderStatus,
        chatMessages,
        sendChatMessage,
        notifications,
        markNotificationRead,
        addNotification,
        devLoginAs,
        auditLogs,
        language,
        setLanguage
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
