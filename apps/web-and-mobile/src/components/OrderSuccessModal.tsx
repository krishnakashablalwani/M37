'use client';

import React from 'react';
import { CheckCircle2, FileText, ArrowRight, ShieldCheck, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <h3 className="text-xl font-extrabold text-white">Order Confirmed & Stock Locked!</h3>
        <p className="text-xs text-slate-400 mt-1">
          Atomic FEFO reservation executed successfully in database.
        </p>

        <div className="mt-4 bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Order Number:</span>
            <span className="font-mono font-bold text-cyan-400 text-sm">{orderNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Total Payable:</span>
            <span className="font-mono font-bold text-white text-base">₹{Number(grandTotal || 0).toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 text-left">
            <span className="text-emerald-400 font-semibold">✓ Concurrency Protected:</span> The earliest expiring batch has been decremented from available stock and moved to reserved inventory.
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
