'use client';

import React from 'react';
import { Search, Sparkles, X, Filter } from 'lucide-react';
import { ProductCategory, DrugSchedule } from '@/types';

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
  const categories: Array<{ id: ProductCategory | 'ALL'; label: string; icon: string }> = [
    { id: 'ALL', label: 'All Categories', icon: '✨' },
    { id: 'PHARMA', label: 'Pharmaceuticals (Rx)', icon: '💊' },
    { id: 'SURGICAL', label: 'Surgical & Medical', icon: '🩺' },
    { id: 'FMCG', label: 'FMCG & OTC', icon: '🧴' },
  ];

  const schedules: Array<{ id: DrugSchedule | 'ALL'; label: string; color: string }> = [
    { id: 'ALL', label: 'All Schedules', color: 'bg-slate-800 text-slate-300' },
    { id: 'OTC', label: 'OTC / Non-Pharma', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { id: 'SCHEDULE_H', label: 'Schedule H (Rx)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    { id: 'SCHEDULE_H1', label: 'Schedule H1 (High Risk)', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  ];

  return (
    <div className="relative bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 pt-8 pb-6 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
      <div className="max-w-4xl mx-auto text-center">
        {/* Tagline */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Multi-Distributor Real-time Stock & Price Comparison</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Search Master Catalog & Distributor Stock
        </h1>
        <p className="mt-1 text-sm text-slate-400 max-w-2xl mx-auto">
          Compare wholesale PTR, live batches, delivery SLAs, and commercial promotional schemes across stockists in Secunderabad & Hyderabad.
        </p>

        {/* Instant Debounced Search Bar */}
        <div className="mt-6 relative max-w-3xl mx-auto">
          <div className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden border-2 border-slate-700/80 focus-within:border-cyan-400 bg-slate-800/90 transition-all">
            <div className="pl-4 pr-2 text-slate-400">
              <Search className="h-5 w-5 text-cyan-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Brand Name, Salt (e.g. Paracetamol 650), SKU, or Manufacturer..."
              className="w-full py-3.5 pr-10 bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="pr-4 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === c.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 scale-105'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Drug Schedule Filter Pills */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mr-1 flex items-center">
            <Filter className="h-3 w-3 mr-1" /> Schedule:
          </span>
          {schedules.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSchedule(s.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                s.color
              } ${
                selectedSchedule === s.id
                  ? 'ring-2 ring-cyan-400 font-bold shadow-sm'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Results Counter Summary */}
        <div className="mt-4 flex items-center justify-center text-xs text-slate-400 space-x-2">
          <span>Found <strong className="text-white font-mono">{totalProducts}</strong> matching master products</span>
          {searchQuery && (
            <span>for &quot;<span className="text-cyan-400">{searchQuery}</span>&quot;</span>
          )}
        </div>
      </div>
    </div>
  );
}
