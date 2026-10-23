'use client';

import React, { useRef, useEffect } from 'react';
import { Search, X, Filter, ScanLine, LayoutGrid, List } from 'lucide-react';
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
  viewMode: 'grid' | 'table';
  setViewMode: (v: 'grid' | 'table') => void;
}

export function SearchHero({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedSchedule,
  setSelectedSchedule,
  totalProducts,
  viewMode,
  setViewMode,
}: SearchHeroProps) {
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories: Array<{ id: ProductCategory | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'All SKUs' },
    { id: 'PHARMA', label: 'Pharmaceuticals (Rx)' },
    { id: 'SURGICAL', label: 'Surgical & Gloves' },
    { id: 'FMCG', label: 'FMCG & OTC' },
  ];

  const schedules: Array<{ id: DrugSchedule | 'ALL'; label: string; activeStyle: string; inactiveStyle: string }> = [
    {
      id: 'ALL',
      label: 'All Schedules',
      activeStyle: 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 font-bold',
      inactiveStyle: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    },
    {
      id: 'OTC',
      label: 'OTC (Free Sale)',
      activeStyle: 'bg-emerald-600 text-white font-bold',
      inactiveStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    },
    {
      id: 'SCHEDULE_H',
      label: 'Schedule H (Rx)',
      activeStyle: 'bg-amber-600 text-white font-bold',
      inactiveStyle: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    },
    {
      id: 'SCHEDULE_H1',
      label: 'Schedule H1 (Restricted)',
      activeStyle: 'bg-rose-600 text-white font-bold',
      inactiveStyle: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    },
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
    <div className="bg-white dark:bg-[#101726] py-4 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto space-y-3.5">
        {/* Top Header Row with Search & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Wholesale Medicine &amp; Surgical Exchange
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold">
              {totalProducts} Master SKUs
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 rounded-lg text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Product Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Dense Wholesale Order Sheet"
              >
                <List className="w-3.5 h-3.5" />
                <span>Order Sheet</span>
              </button>
            </div>
          </div>
        </div>

        {/* High-Velocity Command Search Bar */}
        <div className="relative flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/80 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-teal-600 dark:focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all shadow-2xs">
          <div className="pl-3.5 pr-2 text-slate-400">
            <Search className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by brand name (e.g. Dolo, Augmentin), generic salt (e.g. Paracetamol), manufacturer, or barcode..."
            className="w-full py-2.5 pr-3 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-sans"
          />
          <div className="flex items-center space-x-1.5 pr-2.5">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                  ⌘K
                </kbd>
              </div>
            )}

            {/* Barcode Camera Scanner Button */}
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              title="Scan Barcode (EAN-13 / GS1)"
            >
              <ScanLine className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Bar: Categories & Schedules */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
          {/* Categories */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-sans">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === c.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Schedules */}
          <div className="flex items-center space-x-1.5 flex-wrap gap-1">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono font-semibold mr-1 flex items-center">
              <Filter className="w-3 h-3 mr-1 text-slate-400" /> Schedule:
            </span>
            {schedules.map((s) => {
              const isSelected = selectedSchedule === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSchedule(s.id)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer border ${
                    isSelected ? s.activeStyle : s.inactiveStyle
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Barcode Scanner Modal */}
        <BarcodeScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onBarcodeDetected={(code) => setSearchQuery(code)}
        />
      </div>
    </div>
  );
}
