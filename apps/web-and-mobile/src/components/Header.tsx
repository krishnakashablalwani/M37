'use client';

import React from 'react';
import { Pill, ShieldCheck, MapPin, ShoppingBag, Store, Building2, ShieldAlert, ArrowLeftRight } from 'lucide-react';
import { Organization, CartItem } from '@/types';

interface HeaderProps {
  currentOrg: Organization | null;
  organizations: Organization[];
  onSelectOrg: (org: Organization) => void;
  activeTab: 'marketplace' | 'admin' | 'distributor';
  setActiveTab: (tab: 'marketplace' | 'admin' | 'distributor') => void;
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

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('marketplace')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  PharmaSync
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  B2B
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Zomato-grade Pharma & FMCG Distribution</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'marketplace'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛒 Marketplace
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛡️ Master Catalog
            </button>
            <button
              onClick={() => setActiveTab('distributor')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'distributor'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📑 Bulk Batch Upload
            </button>
          </div>

          {/* Persona Switcher & Cart */}
          <div className="flex items-center space-x-3">
            {/* Pincode Tag */}
            <div className="hidden sm:flex items-center space-x-1.5 text-xs bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              <span>Pincode:</span>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-16 bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-white text-center focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            {/* Persona Selector Dropdown */}
            <div className="relative flex items-center">
              <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-200">
                {currentOrg?.org_type === 'DISTRIBUTOR' ? (
                  <Building2 className="h-4 w-4 text-emerald-400" />
                ) : currentOrg?.drug_license_no_20 ? (
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                )}
                <div className="text-left hidden lg:block">
                  <div className="font-semibold text-white truncate max-w-[130px]">
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
                  className="bg-transparent text-xs text-slate-300 font-medium cursor-pointer focus:outline-none"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id} className="bg-slate-900 text-white">
                      {org.org_type === 'DISTRIBUTOR' ? '🏢 [Distributor]' : '🏪 [Retailer]'}{' '}
                      {org.trade_name} {org.drug_license_no_20 ? '✓ (DL)' : '⚠️ (No DL)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center space-x-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all transform active:scale-95"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {totalCartCount > 0 && (
                <span className="ml-1 bg-white text-blue-900 text-[10px] font-extrabold h-4.5 w-4.5 rounded-full flex items-center justify-center px-1">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-3 py-1 rounded-md ${
              activeTab === 'marketplace' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            🛒 Marketplace
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1 rounded-md ${
              activeTab === 'admin' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            🛡️ Master Catalog
          </button>
          <button
            onClick={() => setActiveTab('distributor')}
            className={`px-3 py-1 rounded-md ${
              activeTab === 'distributor' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            📑 Bulk CSV Upload
          </button>
        </div>
      </div>
    </header>
  );
}
