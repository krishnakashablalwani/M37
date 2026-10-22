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
      className="fixed bottom-0 inset-x-0 z-40 bg-[#12181F]/95 backdrop-blur-md border-t border-[#1E2631] py-3 px-4 sm:px-6 shadow-2xl transition-all animate-in slide-in-from-bottom duration-300"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Cart Counter & Total */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-[#00D2C4]/10 border border-[#00D2C4]/20 flex items-center justify-center text-[#00D2C4] shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-300 font-mono flex items-center space-x-1.5">
              <strong className="text-white font-bold">{totalCount} Items Selected</strong>
              <span>|</span>
              <span className="text-[#00D2C4] font-extrabold text-sm tabular-nums">
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center space-x-2">
              <span>{distCount} {distCount === 1 ? 'Stockist' : 'Stockists'} Split</span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 font-mono">
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
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-[#00D2C4] hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer font-mono"
          >
            <span>Review Suggested Order</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
