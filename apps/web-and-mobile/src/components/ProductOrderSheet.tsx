'use client';

import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, Lock, Plus, Minus, ChevronRight, Package, Droplets, Pill } from 'lucide-react';
import { MasterProduct, Organization } from '@/types';

interface ProductOrderSheetProps {
  products: MasterProduct[];
  onOpenDistributors: (product: MasterProduct) => void;
  onQuickAdd: (product: MasterProduct, qty?: number) => void;
  currentOrg: Organization | null;
}

export function ProductOrderSheet({
  products,
  onOpenDistributors,
  onQuickAdd,
  currentOrg,
}: ProductOrderSheetProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getQty = (id: string) => quantities[id] || 10;
  const setQty = (id: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 10) + delta),
    }));
  };

  return (
    <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto max-h-[750px] overflow-y-auto">
        <table className="w-full text-left text-xs font-mono min-w-[900px]">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider font-bold">
            <tr>
              <th className="py-3 px-4">Medicine Brand &amp; Salt Composition</th>
              <th className="py-3 px-3">Pack &amp; Category</th>
              <th className="py-3 px-3">Schedule</th>
              <th className="py-3 px-3 text-right">Wholesale PTR</th>
              <th className="py-3 px-3 text-right">MRP</th>
              <th className="py-3 px-3 text-center">Margin</th>
              <th className="py-3 px-3">Active Scheme</th>
              <th className="py-3 px-3 text-right">Available</th>
              <th className="py-3 px-3 text-center">Quick Quantity</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {products.map((p) => {
              const isRestricted = ['SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X'].includes(p.schedule);
              const lacksDl = isRestricted && (!currentOrg?.drug_license_no_20 || currentOrg.kyc_state !== 'APPROVED');
              const bestPtr = Number(p.min_ptr || 0);
              const maxMrp = Number(p.max_mrp || 0);
              const marginPct = maxMrp > 0 && bestPtr > 0 ? Math.round(((maxMrp - bestPtr) / maxMrp) * 100) : 0;
              const currentQty = getQty(p.id);

              return (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Medicine Brand & Salt */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-md bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0">
                        {p.pack_size.toLowerCase().includes('bottle') ? (
                          <Droplets className="w-3.5 h-3.5" />
                        ) : p.category === 'SURGICAL' ? (
                          <Package className="w-3.5 h-3.5" />
                        ) : (
                          <Pill className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white font-sans text-xs sm:text-sm block">
                          {p.brand_name}
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 block truncate max-w-xs font-medium">
                          {p.generic_composition} • <span className="text-slate-400 dark:text-slate-500 font-sans">{p.manufacturer}</span>
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Pack & Category */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{p.pack_size}</span>
                    <span className="text-[10px] text-slate-500">HSN {p.hsn_code}</span>
                  </td>

                  {/* Schedule */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {p.schedule === 'SCHEDULE_H' && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <ShieldAlert className="w-2.5 h-2.5 text-amber-600" />
                        Sched H
                      </span>
                    )}
                    {p.schedule === 'SCHEDULE_H1' && (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <ShieldAlert className="w-2.5 h-2.5 text-rose-600" />
                        Sched H1
                      </span>
                    )}
                    {p.schedule === 'OTC' && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        OTC
                      </span>
                    )}
                    {p.schedule === 'NON_PHARMA' && (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                        {p.category}
                      </span>
                    )}
                  </td>

                  {/* PTR */}
                  <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                    <span className="font-black text-slate-900 dark:text-white text-sm">₹{bestPtr.toFixed(2)}</span>
                    <span className="block text-[10px] text-slate-500">+{p.gst_percentage}% GST</span>
                  </td>

                  {/* MRP */}
                  <td className="py-3 px-3 text-right tabular-nums text-slate-400 whitespace-nowrap">
                    {maxMrp > 0 ? (
                      <span className="line-through">₹{maxMrp.toFixed(2)}</span>
                    ) : '—'}
                  </td>

                  {/* Margin */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {marginPct > 0 ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        {marginPct}%
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* Active Scheme */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {p.best_scheme ? (
                      <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                        {p.best_scheme}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Regular Net</span>
                    )}
                  </td>

                  {/* Stock Available */}
                  <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                    <span className={(p.total_available_qty ?? 0) > 0 ? 'text-slate-800 dark:text-slate-200 font-bold' : 'text-rose-600 font-bold'}>
                      {(p.total_available_qty ?? 0) > 0 ? `${p.total_available_qty} Units` : 'Out of Stock'}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      {p.distributor_count} Stockists
                    </span>
                  </td>

                  {/* Quick Quantity Stepper */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="inline-flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setQty(p.id, -5)}
                        className="px-2 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-bold text-slate-900 dark:text-white tabular-nums w-8 text-center">
                        {currentQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(p.id, 5)}
                        className="px-2 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Action Button */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {lacksDl ? (
                      <button
                        type="button"
                        onClick={() => onQuickAdd(p)}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 cursor-pointer font-mono"
                      >
                        <Lock className="w-3 h-3" />
                        <span>DL Req</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenDistributors(p)}
                        className="inline-flex items-center gap-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-500 dark:hover:bg-teal-600 dark:text-slate-950 px-3 py-1 text-[11px] font-bold transition-all cursor-pointer font-sans shadow-2xs"
                      >
                        <span>Compare</span>
                        <ChevronRight className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
