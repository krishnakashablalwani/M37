'use client';

import React from 'react';
import { Pill, ShieldCheck, MapPin, ShoppingBag, Store, Building2, ShieldAlert, Truck, CreditCard, Layers, UploadCloud, Search } from 'lucide-react';
import { Organization, CartItem } from '@/types';

export type ActiveTabType = 'marketplace' | 'admin' | 'distributor' | 'orders' | 'ledger';

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

  const tabs: Array<{ id: ActiveTabType; label: string; icon: React.ReactNode }> = [
    { id: 'marketplace', label: 'Marketplace', icon: <Search className="h-3.5 w-3.5" /> },
    { id: 'orders', label: 'Order Workstation', icon: <Truck className="h-3.5 w-3.5" /> },
    { id: 'ledger', label: 'Ledger & Claims', icon: <CreditCard className="h-3.5 w-3.5" /> },
    { id: 'distributor', label: 'Stock Ingestion', icon: <UploadCloud className="h-3.5 w-3.5" /> },
    { id: 'admin', label: 'Master Catalog', icon: <Layers className="h-3.5 w-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer shrink-0" onClick={() => setActiveTab('marketplace')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-600/20">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  PharmaSync
                </span>
                <span className="px-1.5 py-0.2 text-[10px] font-bold uppercase rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                  B2B
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Zomato-grade Pharma & FMCG Distribution</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === t.id
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          {/* Persona Switcher & Cart */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Pincode Tag */}
            <div className="hidden sm:flex items-center space-x-1.5 text-xs bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              <span>PIN:</span>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white text-center focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            {/* Persona Selector Dropdown */}
            <div className="relative flex items-center">
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 shadow-sm">
                {currentOrg?.org_type === 'DISTRIBUTOR' ? (
                  <Building2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : currentOrg?.drug_license_no_20 ? (
                  <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                )}
                <div className="text-left hidden xl:block">
                  <div className="font-semibold text-white truncate max-w-[120px]">
                    {currentOrg?.trade_name || 'Select Persona'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {currentOrg?.drug_license_no_20 ? 'DL Verified (Form 20/21)' : 'FMCG Only (No DL)'}
                  </div>
                </div>
                <select
                  value={currentOrg?.id || ''}
                  onChange={(e) => {
                    const sel = organizations.find((o) => o.id === e.target.value);
                    if (sel) onSelectOrg(sel);
                  }}
                  className="bg-transparent text-xs text-slate-300 font-semibold cursor-pointer focus:outline-none"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id} className="bg-slate-900 text-white">
                      [{org.org_type === 'DISTRIBUTOR' ? 'DISTRIBUTOR' : 'RETAILER'}] {org.trade_name}{' '}
                      {org.drug_license_no_20 ? '✓ (DL)' : '⚠️ (No DL)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all transform active:scale-95"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {totalCartCount > 0 && (
                <span className="ml-1 bg-white text-blue-900 text-[10px] font-extrabold h-4.5 w-4.5 rounded-full flex items-center justify-center px-1 font-mono">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <nav className="flex lg:hidden items-center justify-between py-2 border-t border-slate-800 text-xs overflow-x-auto gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg shrink-0 font-medium ${
                activeTab === t.id ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
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
