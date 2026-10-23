'use client';

import React from 'react';
import { CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface OrderSuccessModalProps {
  orderNumber: string | null;
  grandTotal: number;
  onClose: () => void;
}

export function OrderSuccessModal({
  orderNumber,
  grandTotal,
  onClose,
}: OrderSuccessModalProps) {
  if (!orderNumber) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#12181F] border border-slate-200 dark:border-[#1E2631] rounded-2xl max-w-md w-full p-6 text-slate-900 dark:text-white shadow-2xl relative text-center transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E2631] cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="h-14 w-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Order Confirmed & Stock Locked</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Atomic FEFO reservation executed successfully in live Supabase PostgreSQL.
        </p>

        <div className="mt-4 bg-slate-50 dark:bg-[#090D11] rounded-xl p-4 border border-slate-200 dark:border-[#1E2631] text-xs space-y-2 font-mono">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400 font-sans">Order Reference:</span>
            <span className="font-bold text-teal-700 dark:text-teal-300 text-sm">{orderNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400 font-sans">Total Payable:</span>
            <span className="font-bold text-slate-900 dark:text-white text-base tabular-nums">
              ₹{Number(grandTotal || 0).toFixed(2)}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-[#1E2631] text-[11px] text-slate-500 dark:text-slate-400 text-left flex items-start space-x-1.5 font-sans">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-emerald-700 dark:text-emerald-400">Concurrency Protected:</strong> Earliest expiring batch decremented from available stock into reserved state.
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer font-mono"
        >
          Continue Ordering
        </button>
      </div>
    </div>
  );
}
