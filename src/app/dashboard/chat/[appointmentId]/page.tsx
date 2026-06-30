'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApp, ChatMessage } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { CartDrawer } from '@/components/CartDrawer';
import { 
  Send, 
  Paperclip, 
  FileText, 
  ChevronLeft, 
  User, 
  Check, 
  Download, 
  ExternalLink,
  Activity
} from 'lucide-react';

export default function ClinicalChatRoom() {
  const { user, appointments, chatMessages, sendChatMessage } = useApp();
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.appointmentId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [cartOpen, setCartOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Security Redirects
  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!user || !appointmentId) return null;

  // Retrieve matching appointment
  const apt = appointments.find((a) => a.id === appointmentId);
  if (!apt) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 p-8 text-center justify-center items-center">
        <p className="text-sm font-bold text-red-500">Clinical consult room not found.</p>
        <button onClick={() => router.push('/')} className="mt-4 py-2 px-4 bg-teal-500 rounded-xl text-xs font-bold">
          Return Home
        </button>
      </div>
    );
  }

  // Determine recipient details based on who is viewing
  const isDoctorView = user.role === 'doctor';
  const recipientName = isDoctorView ? apt.patientName : apt.doctorName;
  const recipientRole = isDoctorView ? 'PATIENT' : 'PRACTITIONER';

  // Filter messages for this specific room
  const activeMessages = chatMessages.filter((msg) => msg.appointmentId === appointmentId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (apt.status === 'completed' || apt.status === 'rejected') return;

    sendChatMessage(appointmentId, inputText);
    setInputText('');
  };

  // Simulated Medical Report File Uploader
  const handleSimulateReportUpload = () => {
    const reportNames = [
      'Blood_Lipid_Profile_Report.pdf',
      'Cardio_ECG_Diagnostics.pdf',
      'Ananya_Thyroid_Screening.pdf',
      'Clinical_Urine_Analysis.pdf'
    ];
    const chosenReportName = reportNames[Math.floor(Math.random() * reportNames.length)];
    
    // Simulate base64 string
    const mockFileBase64 = 'data:application/pdf;base64,JVBERi0xLjQKJdPr6g...';
    
    sendChatMessage(appointmentId, `Clinical Document Upload: Attached standard medical record sheet.`, {
      data: mockFileBase64,
      name: chosenReportName
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors h-screen overflow-hidden">
      <Navbar onOpenCart={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Main chat layout */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-300">
        
        {/* Chat header */}
        <div className="glass-card px-5 py-4 rounded-t-3xl border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(isDoctorView ? '/doctor' : '/dashboard')}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="h-10 w-10 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 rounded-xl flex items-center justify-center font-extrabold text-base uppercase">
              {recipientName.charAt(0)}
            </div>
            <div className="text-left">
              <h2 className="text-sm font-bold text-slate-850 dark:text-slate-100">{recipientName}</h2>
              <span className="text-[9px] bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {recipientRole}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-400 font-bold">Secured Connection</span>
          </div>
        </div>

        {/* Message stream panel */}
        <div className="flex-1 overflow-y-auto p-4 bg-white/70 dark:bg-slate-900/40 border-x border-slate-200/50 dark:border-slate-800/50 space-y-4">
          {activeMessages.map((msg) => {
            const isSelf = msg.senderId === user.uid;
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[75%] ${isSelf ? 'ml-auto items-end text-right' : 'mr-auto items-start text-left'}`}
              >
                <span className="text-[9px] text-slate-400 font-bold mb-1 uppercase tracking-wide">
                  {isSelf ? 'You' : msg.senderName.split(' ')[0]}
                </span>
                
                {/* Speech balloon */}
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    isSelf
                      ? 'bg-gradient-to-r from-teal-500 to-sky-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750 text-slate-700 dark:text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  
                  {/* Attached Medical file */}
                  {msg.fileUrl && (
                    <div className={`mt-3 p-2.5 rounded-xl border flex items-center justify-between gap-3 text-[10px] font-bold ${
                      isSelf 
                        ? 'bg-white/10 border-white/20 text-white' 
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200/40 dark:border-slate-800 text-teal-600 dark:text-teal-400'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate max-w-[120px]">{msg.fileName || 'medical_report.pdf'}</span>
                      </div>
                      <a
                        href={msg.fileUrl}
                        download={msg.fileName || 'report.pdf'}
                        className={`p-1.5 rounded hover:scale-105 transition-all ${isSelf ? 'bg-white/20 text-white' : 'bg-teal-500/10 text-teal-500'}`}
                        title="Download medical report PDF"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>

                <span className="text-[8px] text-slate-400 mt-1 block font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex flex-col max-w-[70%] mr-auto items-start text-left animate-pulse">
              <span className="text-[9px] text-slate-400 font-bold mb-1 uppercase">{recipientName.split(' ')[0]} is typing</span>
              <div className="p-3 bg-white dark:bg-slate-850 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce delay-100" />
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input box footer */}
        <div className="glass-card p-4 rounded-b-3xl border-x border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm bg-white dark:bg-slate-900">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            
            {/* Attachment Button */}
            <button
              type="button"
              onClick={handleSimulateReportUpload}
              disabled={apt.status === 'completed' || apt.status === 'rejected'}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Upload diagnostic health report PDF"
            >
              <Paperclip className="h-4.5 w-4.5" />
            </button>

            {/* Input field */}
            <input
              type="text"
              placeholder={apt.status === 'completed' || apt.status === 'rejected' ? "Chat is disabled for completed consultations." : "Type your medical query or response here..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={apt.status === 'completed' || apt.status === 'rejected'}
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-800/60 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || apt.status === 'completed' || apt.status === 'rejected'}
              className="p-2.5 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white rounded-xl disabled:opacity-40 transition-all flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>

          </form>
        </div>

      </main>
    </div>
  );
}
