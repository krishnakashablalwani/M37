import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PharmaSync B2B — High-Density Medicine & Surgical Supply Chain",
  description:
    "Utilitarian B2B multi-distributor ordering, automated replenishment triage, and FEFO batch fulfillment for retail pharmacies and stockists.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-black text-slate-900 dark:text-[#F5F5F5] font-sans selection:bg-teal-500 selection:text-white transition-colors duration-150">
        {children}
      </body>
    </html>
  );
}
