'use client';

import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, Lock, Pill, Package, Droplets, ChevronRight, Plus, Minus } from 'lucide-react';
import { MasterProduct, Organization } from '@/types';

interface ProductSearchCardProps {
  product: MasterProduct;
  onOpenDistributors: (product: MasterProduct) => void;
  onQuickAdd: (product: MasterProduct, qty?: number) => void;
  currentOrg: Organization | null;
}

export function ProductSearchCard({
  product,
  onOpenDistributors,
  onQuickAdd,
  currentOrg,
}: ProductSearchCardProps) {
  const [quickQty, setQuickQty] = useState(10);

  const isRestrictedSchedule = ['SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X'].includes(product.schedule);
  const lacksDl = isRestrictedSchedule && (!currentOrg?.drug_license_no_20 || currentOrg.kyc_state !== 'APPROVED');

  const stockistCount = product.distributor_count || 1;
  const bestPtr = Number(product.min_ptr || 0);
  const maxMrp = Number(product.max_mrp || 0);

  // Calculate profit margin % for retailer
  const marginPct = maxMrp > 0 && bestPtr > 0 ? Math.round(((maxMrp - bestPtr) / maxMrp) * 100) : 0;

  // Determine dosage icon
  const isLiquid = product.pack_size.toLowerCase().includes('bottle') || product.pack_size.toLowerCase().includes('ml');
  const isGlovesOrSurgical = product.category === 'SURGICAL' || product.pack_size.toLowerCase().includes('box');

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] p-4.5 transition-all duration-200 hover:shadow-md hover:border-teal-500/40 dark:hover:border-teal-500/40">
      <div>
        {/* Top Header Row: Pack Size, Category & Legal Pill */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-1.5">
            <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wide bg-slate-100 dark:bg-[#171717] px-2 py-0.5 rounded border border-slate-200 dark:border-neutral-700">
              {product.pack_size}
            </span>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              HSN {product.hsn_code}
            </span>
          </div>

          {product.schedule === 'SCHEDULE_H' && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
              <ShieldAlert className="w-3 h-3 text-amber-600" />
              Sched H (Rx)
            </span>
          )}

          {product.schedule === 'SCHEDULE_H1' && (
            <span className="inline-flex items-center gap-1 rounded bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80">
              <ShieldAlert className="w-3 h-3 text-rose-600" />
              Sched H1 (High Risk)
            </span>
          )}

          {product.schedule === 'OTC' && (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              OTC
            </span>
          )}

          {product.schedule === 'NON_PHARMA' && (
            <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-[#171717] px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700">
              {product.category}
            </span>
          )}
        </div>

        {/* Product Visual Identity Block */}
        <div className="flex items-start space-x-3">
          {/* Visual Dosage Avatar */}
          <div className="w-11 h-11 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0 group-hover:scale-105 transition-transform">
            {isGlovesOrSurgical ? (
              <Package className="w-5 h-5" />
            ) : isLiquid ? (
              <Droplets className="w-5 h-5" />
            ) : (
              <Pill className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors leading-snug tracking-tight">
              {product.brand_name}
            </h3>

            {product.generic_composition && (
              <p className="mt-0.5 text-xs text-slate-600 dark:text-neutral-300 font-mono truncate font-medium">
                {product.generic_composition}
              </p>
            )}

            <p className="mt-1 text-[11px] text-slate-500 dark:text-neutral-400 font-sans truncate">
              {product.manufacturer}
            </p>
          </div>
        </div>
      </div>

      {/* Commercial & Pricing Shelf */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800">
        <div className="bg-slate-50 dark:bg-[#121212] rounded-lg p-3 border border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-2">
          <div>
            <div className="text-[9px] uppercase font-mono text-slate-500 font-semibold tracking-wider">
              Wholesale Landing PTR
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-mono text-lg font-black text-slate-900 dark:text-white tabular-nums">
                ₹{bestPtr.toFixed(2)}
              </span>
              {maxMrp > 0 && (
                <span className="text-xs text-slate-400 font-mono line-through">
                  ₹{maxMrp.toFixed(2)}
                </span>
              )}
              <span className="text-[10px] text-slate-500 font-mono">
                +{product.gst_percentage}% GST
              </span>
            </div>
          </div>

          <div className="text-right space-y-1">
            {marginPct > 0 && (
              <span className="inline-block text-[11px] font-mono font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                {marginPct}% Margin
              </span>
            )}
            {product.best_scheme && (
              <div className="text-[10px] font-mono font-bold text-teal-700 dark:text-teal-400 truncate max-w-[140px]">
                {product.best_scheme}
              </div>
            )}
          </div>
        </div>

        {/* Stockist Count & Quick Action Shelf */}
        <div className="mt-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-neutral-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              <strong className="text-slate-800 dark:text-neutral-200">{stockistCount} Stockists</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {lacksDl ? (
              <button
                type="button"
                onClick={() => onQuickAdd(product)}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 transition-all cursor-pointer font-mono"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>DL Required</span>
              </button>
            ) : (
              <>
                {/* Direct Stepper */}
                <div className="flex items-center bg-slate-100 dark:bg-[#121212] border border-slate-300 dark:border-neutral-700 rounded-lg text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setQuickQty((q) => Math.max(1, q - 5))}
                    className="px-2 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-1.5 font-bold text-slate-900 dark:text-white tabular-nums">{quickQty}</span>
                  <button
                    type="button"
                    onClick={() => setQuickQty((q) => q + 5)}
                    className="px-2 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenDistributors(product)}
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-500 dark:hover:bg-teal-600 dark:text-black px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <span>Compare</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
