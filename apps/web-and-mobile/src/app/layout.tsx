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
      <body className="min-h-full flex flex-col bg-[#090D11] text-slate-100 font-sans selection:bg-[#00D2C4] selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
