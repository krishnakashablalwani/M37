'use client';

import React from 'react';
import { ShoppingBag, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { CartItem } from '@/types';

interface StickyReplenishmentFooterProps {
  cart: CartItem[];
  onOpenCart: () => void;
  onOpenReplenish: () => void;
}

export function StickyReplenishmentFooter({
  cart,
  onOpenCart,
  onOpenReplenish,
}: StickyReplenishmentFooterProps) {
  const totalCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  let grandTotal = 0;
  const distributorSet = new Set<string>();
  cart.forEach((it) => {
    grandTotal += it.unit_ptr * it.quantity * (1 + it.gst_pct / 100);
    distributorSet.add(it.distributor_name);
  });

  const distCount = distributorSet.size;

  if (totalCount === 0) return null;

  return (
    <aside
      aria-label="Order summary"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 py-3 px-4 sm:px-6 shadow-2xl transition-all animate-in slide-in-from-bottom duration-200"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Cart Counter & Total */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>

          <div>
            <div className="text-xs text-slate-700 dark:text-slate-300 font-mono flex items-center space-x-1.5">
              <strong className="text-slate-900 dark:text-white font-bold">{totalCount} Items Selected</strong>
              <span>|</span>
              <span className="text-teal-700 dark:text-teal-300 font-extrabold text-sm tabular-nums">
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center space-x-2">
              <span>{distCount} {distCount === 1 ? 'Stockist' : 'Stockists'} Split</span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-mono">
                <CheckCircle2 className="w-2.5 h-2.5" />
                MOQ Met: {distCount}/{distCount}
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onOpenCart}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer font-mono"
          >
            <span>Review Suggested Order</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
