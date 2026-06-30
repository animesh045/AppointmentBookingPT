'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, Medicine } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { CartDrawer } from '@/components/CartDrawer';
import { 
  Search, 
  ShoppingCart, 
  Activity, 
  PhoneCall, 
  Check, 
  Plus, 
  AlertTriangle,
  Heart,
  ChevronRight,
  Info,
  Phone
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Fever & Pain Relief',
  'Antibiotics',
  'Cough & Cold',
  'Heart Care',
  'Vitamins & Supplements'
];

export default function PharmacyStore() {
  const { user, medicines, addToCart, cart } = useApp();
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Call Store Dialog
  const [callActive, setCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState(0);

  // Success Pop-ups for added items
  const [addedItemName, setAddedItemName] = useState<string | null>(null);

  // Redirect to login if needed
  useEffect(() => {
    if (!user) {
      router.push('/');
    } else if (user.role !== 'consumer') {
      router.push('/');
    }
  }, [user, router]);

  // Call duration counter simulator
  useEffect(() => {
    if (!callActive) return;
    const interval = setInterval(() => {
      setCallTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callActive]);

  if (!user || user.role !== 'consumer') return null;

  // Filter medicines list based on search query & category
  const filteredMeds = medicines.filter((med) => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          med.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || med.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (med: Medicine) => {
    if (med.quantity <= 0) {
      alert('This medicine is currently out of stock');
      return;
    }
    addToCart(med);
    setAddedItemName(med.name);
    setTimeout(() => {
      setAddedItemName(null);
    }, 1500);
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar onOpenCart={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Floating Added Notification */}
      {addedItemName && (
        <div className="fixed bottom-5 right-5 z-50 bg-teal-600 dark:bg-teal-500 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300">
          <Check className="h-4 w-4 bg-white/20 rounded-full p-0.5" />
          <span>Added {addedItemName} to Cart!</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        
        {/* Banner Section */}
        <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 h-40 w-40 bg-sky-500/10 rounded-full filter blur-3xl" />
          
          <div className="space-y-1.5 relative">
            <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Ananya Pharmacy</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100">
              Medicines & Stock Inventory
            </h1>
            <p className="text-xs text-slate-400">
              Search authentic formulations, check Rx prescription alerts, and reserve for immediate pick-up.
            </p>
          </div>
          
          <div className="flex gap-3 relative">
            <button
              onClick={() => { setCallActive(true); setCallTimer(0); }}
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all shadow"
            >
              <PhoneCall className="h-3.5 w-3.5 text-teal-500 dark:text-teal-600" />
              Quick Call Store
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="py-2.5 px-4 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-teal-500/10"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              View Cart ({totalCartItems})
            </button>
          </div>
        </div>

        {/* Filter Toolbar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Search Bar */}
          <div className="md:col-span-4 relative text-left">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by medicine name or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Category Tabs */}
          <div className="md:col-span-8 flex items-center gap-2 overflow-x-auto pb-1.5 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-teal-500 text-slate-950 font-extrabold shadow shadow-teal-500/15'
                      : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

        </div>

        {/* Prescription Disclaimer Banner */}
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-950/30 rounded-2xl text-left flex gap-2.5 items-start">
          <Info className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-800 dark:text-red-300 leading-normal">
            ⚠️ <span className="font-extrabold">Prescription Checkpoint</span>: Medicines labeled with <span className="font-extrabold bg-red-100 dark:bg-red-900 px-1 py-0.5 rounded text-[8px] uppercase">Rx Required</span> demand a valid medical prescription signed by a certified practitioner. You must upload or showcase this paper document during delivery/pickup.
          </p>
        </div>

        {/* PRODUCT GRID */}
        {filteredMeds.length === 0 ? (
          <div className="glass-card p-16 text-center rounded-3xl space-y-2">
            <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No medicines found</h3>
            <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
              Adjust your search keywords or explore another category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMeds.map((med) => {
              const inStock = med.quantity > 0;
              return (
                <div
                  key={med.id}
                  className="glass-card rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-md hover:scale-[1.01] transition-all duration-300 text-left"
                >
                  {/* Image/Category Section */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-900/50 relative flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40">
                    <span className="text-3xl filter drop-shadow bg-white dark:bg-slate-950 p-2.5 rounded-2xl shadow-inner">
                      {med.image}
                    </span>
                    <span className="text-[9px] bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full uppercase">
                      {med.category.split(' ')[0]}
                    </span>
                    
                    {/* Prescription Rx Banner */}
                    {med.prescriptionRequired && (
                      <span className="absolute top-3 right-3 bg-red-500 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full shadow-sm tracking-wider uppercase">
                        Rx Required
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {med.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
                        {med.description}
                      </p>
                    </div>

                    <div className="space-y-3">
                      
                      {/* Price & Stock info */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-base font-extrabold text-teal-600 dark:text-teal-400">
                          ₹{med.price}
                        </span>
                        
                        {inStock ? (
                          <span className="text-[10px] text-slate-400 font-bold">
                            Stock: <span className="text-slate-600 dark:text-slate-300">{med.quantity} Units</span>
                          </span>
                        ) : (
                          <span className="text-[10px] bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold uppercase">
                            Out of Stock
                          </span>
                        )}
                      </div>

                      {/* Add Button */}
                      <button
                        onClick={() => handleAddToCart(med)}
                        disabled={!inStock}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          inStock
                            ? 'bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white shadow-sm shadow-teal-500/10 hover:scale-[1.01] active:scale-[0.99]'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="h-4 w-4" />
                        {inStock ? 'Add to Cart' : 'Unavailable'}
                      </button>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ==========================================
          INTERACTIVE MOCK PHONE CALL OVERLAY
          ========================================== */}
      {callActive && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <div className="w-80 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 shadow-2xl flex flex-col items-center justify-between text-white aspect-[9/16] relative overflow-hidden animate-in slide-in-from-bottom-12 duration-500">
            
            {/* Soft decorative light */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-slate-800 rounded-b-3xl flex items-center justify-center">
              <div className="h-1.5 w-16 bg-slate-700 rounded-full" />
            </div>

            <div className="pt-16 flex flex-col items-center space-y-2">
              <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-teal-500 to-sky-600 flex items-center justify-center text-white text-3xl shadow-xl shadow-teal-500/20 font-bold border-2 border-slate-800 uppercase">
                A
              </div>
              <h4 className="text-base font-extrabold tracking-wide mt-2">Ananya Enterprises</h4>
              <p className="text-[10px] text-teal-400 font-semibold tracking-widest uppercase">Pharmacy Desk</p>
              <p className="text-xs text-slate-500 font-mono mt-1">+91 99999-55663</p>
            </div>

            <div className="flex flex-col items-center space-y-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping mb-1" />
              <p className="text-xs text-slate-300 font-semibold">Active Conversation</p>
              <p className="text-2xl font-bold font-mono text-emerald-400 tracking-wider">
                {formatCallTime(callTimer)}
              </p>
            </div>

            <div className="pb-8 w-full flex flex-col items-center space-y-4">
              <p className="text-[10px] text-slate-400 text-center max-w-[200px] leading-relaxed">
                Consult with our senior pharmacist regarding medicines or order reservations.
              </p>
              
              <button
                onClick={() => setCallActive(false)}
                className="h-14 w-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                title="End simulated call"
              >
                <Phone className="h-6 w-6 rotate-[135deg]" />
              </button>
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
