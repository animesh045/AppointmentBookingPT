'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, Trash2, ShoppingBag, CreditCard, Compass, CheckCircle } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, updateCartQuantity, removeFromCart, checkoutCart } = useApp();
  const [address, setAddress] = useState('');
  const [fastBooking, setFastBooking] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  if (!isOpen) return null;

  const total = cart.reduce((sum, item) => sum + item.medicine.price * item.quantity, 0);

  const handleCheckout = async (payNow: boolean) => {
    if (!fastBooking && !address.trim()) {
      alert('Please enter your home delivery address');
      return;
    }
    
    setCheckingOut(true);
    try {
      // Emulate payment network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const newOrder = await checkoutCart(address, fastBooking, payNow);
      setOrderSuccess(newOrder);
      setAddress('');
      setFastBooking(false);
    } catch (err: any) {
      alert(err.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md transform transition-all duration-300">
          <div className="h-full flex flex-col bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200/50 dark:border-slate-800/50">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Shopping Cart</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Inner Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {orderSuccess ? (
                /* Success Screen */
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="h-16 w-16 bg-teal-100 dark:bg-teal-900/40 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400">
                    <CheckCircle className="h-10 w-10 animate-bounce" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Order Placed!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 px-4">
                    Your pharmacy order has been registered as <span className="font-extrabold text-slate-700 dark:text-slate-300">{orderSuccess.id}</span>.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl w-full text-left space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Transaction Mode:</span>
                      <span className="font-bold">{orderSuccess.paymentStatus === 'paid' ? '💳 Razorpay Pre-Paid' : '💵 Cash on Delivery'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Delivery Type:</span>
                      <span className="font-bold">{orderSuccess.fastBooking ? '⚡ Store Pick-up' : '🚚 Home Delivery'}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-1.5 font-bold">
                      <span>Total Charged:</span>
                      <span className="text-teal-600 dark:text-teal-400">₹{orderSuccess.totalAmount}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setOrderSuccess(null);
                      onClose();
                    }}
                    className="w-full py-3 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white rounded-xl font-bold text-sm shadow-md transition-all"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : cart.length === 0 ? (
                /* Empty Cart Screen */
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="h-14 w-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300">Your cart is empty</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px]">
                      Search medicines, add them to your cart, and review them here.
                    </p>
                  </div>
                </div>
              ) : (
                /* Cart Items List */
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.medicine.id}
                      className="flex items-center gap-4 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-sm transition-all"
                    >
                      <div className="h-12 w-12 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center text-2xl shadow-inner">
                        {item.medicine.image}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                          {item.medicine.name}
                        </h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          ₹{item.medicine.price} / unit
                        </p>
                        {item.medicine.prescriptionRequired && (
                          <span className="inline-block bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-1.5">
                            Rx Required
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800/40 h-8">
                          <button
                            onClick={() => updateCartQuantity(item.medicine.id, item.quantity - 1)}
                            className="px-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-bold"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-bold w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.medicine.id, item.quantity + 1)}
                            className="px-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.medicine.id)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Booking Mode Switcher */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Booking Preference</h3>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setFastBooking(false)}
                        className={`py-2 text-xs font-bold rounded-lg transition-all ${
                          !fastBooking
                            ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-600 dark:text-teal-400'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        🚚 Home Delivery
                      </button>
                      <button
                        onClick={() => setFastBooking(true)}
                        className={`py-2 text-xs font-bold rounded-lg transition-all ${
                          fastBooking
                            ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-600 dark:text-teal-400'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        ⚡ Reserve at Store
                      </button>
                    </div>

                    {!fastBooking ? (
                      <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                        <label className="text-[11px] font-bold text-slate-400">Delivery Address</label>
                        <textarea
                          placeholder="Enter your comprehensive home delivery address..."
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-teal-500 focus:outline-none min-h-[60px]"
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100/40 dark:border-teal-900/30 rounded-xl text-slate-600 dark:text-slate-400 animate-in slide-in-from-top-2 duration-200">
                        <p className="text-[10px] font-medium leading-relaxed">
                          📌 <span className="font-bold text-teal-700 dark:text-teal-400">Fast Medicine Reservation Active</span>: 
                          Your items will be reserved immediately at Ananya Enterprises Pharmacy. Collect and pay within 24 hours at the pharmacy desk before expiry!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {!orderSuccess && cart.length > 0 && (
              <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal</span>
                    <span>₹{total}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Delivery Charge</span>
                    <span>{!fastBooking ? '₹40 (Flat)' : 'Free'}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-800 dark:text-slate-100 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <span>Total Amount</span>
                    <span className="text-teal-600 dark:text-teal-400">₹{total + (!fastBooking ? 40 : 0)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleCheckout(false)}
                    disabled={checkingOut}
                    className="py-3 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-all"
                  >
                    {checkingOut ? 'Ordering...' : '💵 Pay on Pickup/COD'}
                  </button>
                  <button
                    onClick={() => handleCheckout(true)}
                    disabled={checkingOut}
                    className="py-3 px-4 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/10 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    {checkingOut ? 'Processing...' : '💳 Pay with Razorpay'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
