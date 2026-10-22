'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Filter, ScanLine } from 'lucide-react';
import { ProductCategory, DrugSchedule } from '@/types';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';

interface SearchHeroProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: ProductCategory | 'ALL';
  setSelectedCategory: (cat: ProductCategory | 'ALL') => void;
  selectedSchedule: DrugSchedule | 'ALL';
  setSelectedSchedule: (sch: DrugSchedule | 'ALL') => void;
  totalProducts: number;
}

export function SearchHero({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedSchedule,
  setSelectedSchedule,
  totalProducts,
}: SearchHeroProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories: Array<{ id: ProductCategory | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'PHARMA', label: 'Pharmaceuticals (Rx)' },
    { id: 'SURGICAL', label: 'Surgical & Medical' },
    { id: 'FMCG', label: 'FMCG & OTC' },
  ];

  const schedules: Array<{ id: DrugSchedule | 'ALL'; label: string; color: string }> = [
    { id: 'ALL', label: 'All Schedules', color: 'bg-[#12181F] text-slate-400 border-[#1E2631]' },
    { id: 'OTC', label: 'OTC (Free Sale)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { id: 'SCHEDULE_H', label: 'Schedule H (Rx)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    { id: 'SCHEDULE_H1', label: 'Schedule H1 (Restricted)', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  ];

  // Keyboard shortcut listener (Cmd+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="bg-[#090D11] pt-6 pb-6 px-4 sm:px-6 lg:px-8 border-b border-[#1E2631]">
      <div className="max-w-4xl mx-auto text-center">
        {/* Title */}
        <h1 className="text-xl sm:text-3xl font-black text-slate-100 tracking-tight">
          B2B Pharmaceutical & Wholesale Stock Search
        </h1>
        <p className="mt-1 text-xs text-slate-400 max-w-xl mx-auto font-sans">
          Instant debounced discovery across canonical Master SKUs, generic salts, manufacturer batches, and active Telangana stockists.
        </p>

        {/* Command Search Bar */}
        <div className="mt-5 relative max-w-2xl mx-auto">
          <div className="relative flex items-center rounded-xl border border-[#1E2631] bg-[#12181F] focus-within:border-[#00D2C4] shadow-xl transition-all">
            <div className="pl-3.5 pr-2 text-slate-400">
              <Search className="w-4 h-4 text-[#00D2C4]" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Brand Name, Salt (e.g. Paracetamol 650), SKU code, or Manufacturer..."
              className="w-full py-3 pr-3 bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
            />
            <div className="flex items-center space-x-1.5 pr-2.5">
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <div className="hidden sm:flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#090D11] text-slate-400 border border-[#1E2631]">
                    ⌘K
                  </kbd>
                </div>
              )}

              {/* Native Barcode Scanner Camera Trigger */}
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#00D2C4] hover:bg-[#1E2631] transition-colors cursor-pointer"
                title="Scan Medicine Box Barcode (EAN-13 / GS1)"
              >
                <ScanLine className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Barcode Scanner Modal */}
        <BarcodeScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onBarcodeDetected={(code) => setSearchQuery(code)}
        />

        {/* Category Pills */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 font-mono text-xs">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-[#00D2C4] text-slate-950 font-bold shadow-sm'
                  : 'bg-[#12181F] hover:bg-[#1E2631] text-slate-400 border border-[#1E2631]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Drug Schedule Filter */}
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-semibold mr-1 flex items-center">
            <Filter className="w-3 h-3 mr-1" /> Legal Schedule:
          </span>
          {schedules.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSchedule(s.id)}
              className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-medium border transition-all cursor-pointer ${
                s.color
              } ${
                selectedSchedule === s.id
                  ? 'ring-1 ring-[#00D2C4] font-bold shadow-sm'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Count */}
        <div className="mt-3 text-[11px] font-mono text-slate-500">
          Found <span className="text-white font-bold">{totalProducts}</span> master SKU records
          {searchQuery && (
            <span> matching &quot;<span className="text-[#00D2C4]">{searchQuery}</span>&quot;</span>
          )}
        </div>
      </div>
    </div>
  );
}
