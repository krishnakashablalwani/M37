'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, FileText, CheckCircle, X } from 'lucide-react';
import { Organization } from '@/types';

interface ComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  schedule: string;
  currentOrg: Organization | null;
  onSwitchToVerified: () => void;
}

export function ComplianceModal({
  isOpen,
  onClose,
  productName,
  schedule,
  currentOrg,
  onSwitchToVerified,
}: ComplianceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-3 text-rose-400 mb-4">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">Compliance Guardrail Blocked</h3>
            <p className="text-xs text-rose-300 font-mono">Pharmaceutical Drug Licensing Restriction</p>
          </div>
        </div>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              Cannot add <strong className="text-white font-semibold">{productName}</strong> ({schedule}) to cart.
            </div>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Under <strong>Section 18(c) of the Drugs and Cosmetics Act, 1940</strong> and <strong>Rule 65</strong>, wholesale distributors are strictly prohibited from supplying Schedule H, H1, or X medications to retailers without a verified, non-expired State Drug License (Form 20/21) on file.
          </p>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Current Business:</span>
            <span className="font-bold text-amber-400">{currentOrg?.trade_name} (FMCG Only / No DL)</span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end space-x-3 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
              onSwitchToVerified();
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/20 transition-all"
          >
            Switch to Verified Pharmacy (Care Chemist)
          </button>
        </div>
      </div>
    </div>
  );
}
