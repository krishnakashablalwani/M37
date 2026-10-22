'use client';

import React from 'react';
import { Pill, ShieldCheck, MapPin, ShoppingBag, Building2, ShieldAlert, Truck, CreditCard, Layers, UploadCloud, Search, Sparkles, Check } from 'lucide-react';
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
}: HeaderProps) {
  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  // Live commercial credit limit for glanceable top bar
  const totalCreditLimit = 50000;
  const availableCredit = 38400;
  const currentOutstanding = totalCreditLimit - availableCredit;
  const creditUsagePct = Math.round((currentOutstanding / totalCreditLimit) * 100);

  const tabs: Array<{ id: ActiveTabType; label: string; icon: React.ReactNode }> = [
    { id: 'marketplace', label: 'Marketplace', icon: <Search className="w-3.5 h-3.5" /> },
    { id: 'replenish', label: 'Auto-Replenish', icon: <Sparkles className="w-3.5 h-3.5 text-[#00D2C4]" /> },
    { id: 'orders', label: 'Workstation', icon: <Truck className="w-3.5 h-3.5" /> },
    { id: 'ledger', label: 'Credit Ledger', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { id: 'distributor', label: 'Stock Upload', icon: <UploadCloud className="w-3.5 h-3.5" /> },
    { id: 'admin', label: 'Master SKU', icon: <Layers className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#090D11]/95 backdrop-blur-md border-b border-[#1E2631] text-slate-100">
      {/* Persistent Glanceable Counter Top Bar */}
      <div className="bg-[#12181F] border-b border-[#1E2631] py-1.5 px-4 sm:px-6 lg:px-8 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Shop Name & DL Verification Pill */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-sans">Active Shop:</span>
            <strong className="text-white font-sans">{currentOrg?.trade_name || 'Care Chemist'}</strong>
            {currentOrg?.drug_license_no_20 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold font-sans">
                <Check className="w-3 h-3 stroke-[3]" />
                DL: {currentOrg.drug_license_no_20.slice(0, 14)}...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold font-sans">
                <ShieldAlert className="w-3 h-3" />
                FMCG Only (No DL)
              </span>
            )}
          </div>

          {/* Credit Limit Micro-Gauge */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-slate-400">Credit Limit:</span>
              <span className="text-[#00D2C4] font-bold tabular-nums">
                ₹{availableCredit.toLocaleString('en-IN')}
              </span>
              <span className="text-slate-500">/ ₹{totalCreditLimit.toLocaleString('en-IN')} Available</span>
            </div>
            {/* Visual Micro Bar */}
            <div className="w-16 h-1.5 bg-[#090D11] rounded-full overflow-hidden border border-[#1E2631] hidden sm:block">
              <div
                className="h-full bg-[#00D2C4] rounded-full"
                style={{ width: `${100 - creditUsagePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-3">
          {/* Brand Logo */}
          <div className="flex items-center space-x-2.5 cursor-pointer shrink-0" onClick={() => setActiveTab('marketplace')}>
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-[#00D2C4] to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Pill className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-base tracking-tight text-white">
                  PharmaSync
                </span>
                <span className="px-1 py-0.2 text-[9px] font-bold uppercase rounded bg-[#00D2C4]/15 text-[#00D2C4] border border-[#00D2C4]/30 font-mono">
                  B2B
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-[#12181F] p-1 rounded-xl border border-[#1E2631]">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === t.id
                    ? 'bg-[#00D2C4] text-slate-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-[#1E2631]'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Pincode Tag */}
            <div className="hidden sm:flex items-center space-x-1.5 text-xs bg-[#12181F] px-2.5 py-1 rounded-lg border border-[#1E2631] text-slate-300">
              <MapPin className="w-3 h-3 text-[#00D2C4]" />
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-16 bg-transparent text-xs text-white text-center focus:outline-none font-mono"
              />
            </div>

            {/* Persona Selector Dropdown */}
            <div className="relative flex items-center">
              <div className="flex items-center space-x-1.5 bg-[#12181F] border border-[#1E2631] rounded-lg px-2 py-1 text-xs text-slate-200">
                <select
                  value={currentOrg?.id || ''}
                  onChange={(e) => {
                    const sel = organizations.find((o) => o.id === e.target.value);
                    if (sel) onSelectOrg(sel);
                  }}
                  className="bg-transparent text-xs text-slate-300 font-semibold cursor-pointer focus:outline-none"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id} className="bg-[#12181F] text-white">
                      [{org.org_type === 'DISTRIBUTOR' ? 'DIST' : 'RETAIL'}] {org.trade_name}{' '}
                      {org.drug_license_no_20 ? '(DL Verified)' : '(No DL)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center space-x-1.5 bg-gradient-to-r from-cyan-500 to-[#00D2C4] hover:from-cyan-400 hover:to-teal-300 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cart</span>
              {totalCartCount > 0 && (
                <span className="ml-1 bg-slate-950 text-[#00D2C4] text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center font-mono">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <nav className="flex lg:hidden items-center justify-between py-2 border-t border-[#1E2631] text-xs overflow-x-auto gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg shrink-0 font-medium ${
                activeTab === t.id ? 'bg-[#00D2C4] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
