import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "Ananya Enterprises – Appointment & Pharmacy Management System",
  description: "A premium healthcare appointment booking and pharmacy ordering platform featuring direct doctor consultations, Razorpay billing, and role management.",
  icons: {
    icon: "/favicon.ico",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="h-full flex flex-col antialiased text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 font-sans">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
