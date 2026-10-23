'use client';

import React, { useState, useEffect } from 'react';
import {
  Pill,
  MapPin,
  ShoppingBag,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Truck,
  CreditCard,
  Layers,
  UploadCloud,
  Search,
  Sparkles,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react';
import { Organization, CartItem } from '@/types';

export type ActiveTabType = 'marketplace' | 'replenish' | 'orders' | 'ledger' | 'distributor' | 'admin';

interface HeaderProps {
  currentOrg: Organization | null;
  organizations: Organization[];
  onSelectOrg: (org: Organization) => void;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  cart: CartItem[];
  onOpenCart: () => void;
  pincode: string;
  setPincode: (p: string) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
}

export function Header({
  currentOrg,
  organizations,
  onSelectOrg,
  activeTab,
  setActiveTab,
  cart,
  onOpenCart,
  pincode,
  setPincode,
  theme,
  setTheme,
}: HeaderProps) {
  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const totalCartValue = cart.reduce((acc, it) => acc + (it.unit_ptr * it.quantity), 0);

  // Live commercial credit limit for glanceable top bar
  const totalCreditLimit = 50000;
  const availableCredit = 38400;
  const currentOutstanding = totalCreditLimit - availableCredit;
  const creditUsagePct = Math.round((currentOutstanding / totalCreditLimit) * 100);

  const tabs: Array<{ id: ActiveTabType; label: string; icon: React.ReactNode; badge?: string | number }> = [
    { id: 'marketplace', label: 'Wholesale Exchange', icon: <Search className="w-4 h-4" />, badge: '9 SKUs' },
    { id: 'replenish', label: 'Auto-Replenish Deck', icon: <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />, badge: '2 Deficits' },
    { id: 'orders', label: 'Fulfillment Workstation', icon: <Truck className="w-4 h-4" />, badge: '4 Orders' },
    { id: 'ledger', label: 'Credit Ledger & GST', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'distributor', label: 'Bulk Stock Ingestion', icon: <UploadCloud className="w-4 h-4" /> },
    { id: 'admin', label: 'Master SKU Catalog', icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#101726] border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xs">
      {/* Top Utility & Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Brand Logo & Grid Status */}
          <div className="flex items-center space-x-3 shrink-0">
            <div
              className="flex items-center space-x-2.5 cursor-pointer group"
              onClick={() => setActiveTab('marketplace')}
            >
              <div className="h-8 w-8 rounded-lg bg-teal-600 dark:bg-teal-500/20 text-white dark:text-teal-400 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                <Pill className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                    PharmaSync
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 font-mono">
                    B2B
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                  Telangana Medical &amp; Surgical Exchange
                </span>
              </div>
            </div>

            <div className="hidden xl:flex items-center space-x-1.5 pl-3 border-l border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hyderabad &amp; Secunderabad Hub</span>
            </div>
          </div>

          {/* Location / Pincode Selector */}
          <div className="hidden md:flex items-center space-x-2 text-xs bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Delivery:</span>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="w-16 bg-transparent text-xs text-slate-900 dark:text-white text-center focus:outline-none font-mono font-bold"
              title="Delivery Pincode"
            />
            <span className="text-[10px] font-semibold text-slate-400">Secunderabad</span>
          </div>

          {/* Right Controls: Store Persona, Credit, Theme Toggle, Cart */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Persona Switcher Dropdown */}
            <div className="relative flex items-center">
              <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={currentOrg?.id || ''}
                  onChange={(e) => {
                    const sel = organizations.find((o) => o.id === e.target.value);
                    if (sel) onSelectOrg(sel);
                  }}
                  className="bg-transparent text-xs text-slate-900 dark:text-white font-semibold cursor-pointer focus:outline-none max-w-[120px] sm:max-w-[180px] truncate"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      [{org.org_type === 'DISTRIBUTOR' ? 'DIST' : 'RETAIL'}] {org.trade_name}{' '}
                      {org.drug_license_no_20 ? '(DL 20/21 ✓)' : '(No DL)'}
                    </option>
                  ))}
                </select>
                {currentOrg?.drug_license_no_20 ? (
                  <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3 h-3" /> DL 20/21
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-amber-700 dark:text-amber-400 font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                    FMCG Only
                  </span>
                )}
              </div>
            </div>

            {/* Credit Limit Micro-Gauge */}
            <div className="hidden lg:flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-mono">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Credit:</span>
              <span className="text-teal-700 dark:text-teal-400 font-bold tabular-nums">
                ₹{(availableCredit / 1000).toFixed(1)}k
              </span>
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 dark:bg-teal-400 rounded-full"
                  style={{ width: `${100 - creditUsagePct}%` }}
                />
              </div>
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-500 dark:hover:bg-teal-600 dark:text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline font-mono">Cart</span>
              {totalCartCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black bg-white text-teal-800 dark:bg-slate-950 dark:text-teal-300">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Navigation Bar (Segmented Workspace Tabs) */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0B0F17]/80 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-1 py-1.5 overflow-x-auto no-scrollbar">
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white dark:bg-[#1A2234] text-teal-700 dark:text-teal-300 font-bold shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className={isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}>
                    {t.icon}
                  </span>
                  <span>{t.label}</span>
                  {t.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                        isActive
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
