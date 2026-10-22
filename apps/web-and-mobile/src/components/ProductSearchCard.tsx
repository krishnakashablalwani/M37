'use client';

import React from 'react';
import { ShieldAlert, Building2, ChevronRight, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { MasterProduct, Organization } from '@/types';

interface ProductSearchCardProps {
  product: MasterProduct;
  onOpenDistributors: (product: MasterProduct) => void;
  onQuickAdd: (product: MasterProduct) => void;
  currentOrg: Organization | null;
}

export function ProductSearchCard({
  product,
  onOpenDistributors,
  onQuickAdd,
  currentOrg,
}: ProductSearchCardProps) {
  const isRestrictedSchedule = ['SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X'].includes(product.schedule);
  const lacksDl = isRestrictedSchedule && (!currentOrg?.drug_license_no_20 || currentOrg.kyc_state !== 'APPROVED');

  const stockistCount = product.distributor_count || 1;
  const bestPtr = Number(product.min_ptr || 0);

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-[#1E2631] bg-[#12181F] p-4 transition-all hover:border-[#00D2C4]/50 hover:shadow-lg hover:shadow-cyan-950/20 active:ring-1 active:ring-cyan-400/50">
      <div>
        {/* Top Row: Pack Size & Legal Schedule Tag */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {product.pack_size}
          </span>

          {product.schedule === 'SCHEDULE_H' && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-3 h-3" />
              Sched H (Rx)
            </span>
          )}

          {product.schedule === 'SCHEDULE_H1' && (
            <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-3 h-3" />
              Sched H1 (High Risk)
            </span>
          )}

          {product.schedule === 'OTC' && (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              OTC
            </span>
          )}

          {product.schedule === 'NON_PHARMA' && (
            <span className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-700/60">
              {product.category}
            </span>
          )}
        </div>

        {/* Product Identity */}
        <h3 className="text-base font-bold text-slate-100 group-hover:text-[#00D2C4] transition-colors leading-snug">
          {product.brand_name}
        </h3>

        {product.generic_composition && (
          <p className="text-xs text-slate-400 font-mono mt-0.5 line-clamp-1">
            {product.generic_composition}
          </p>
        )}

        {/* Middle Row: Manufacturer & HSN Code */}
        <div className="mt-2 flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
          <span className="truncate max-w-[140px] text-slate-400 font-sans">{product.manufacturer}</span>
          <span>•</span>
          <span>HSN: {product.hsn_code}</span>
        </div>
      </div>

      {/* Pricing & Commercial Schemes */}
      <div className="mt-4 pt-3 border-t border-[#1E2631]/80 flex items-end justify-between gap-2">
        <div>
          <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider block">
            Best Landing PTR
          </span>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-mono text-lg font-extrabold text-slate-100 tabular-nums">
              ₹{bestPtr.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">+{product.gst_percentage}% GST</span>
            {product.best_scheme && (
              <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-purple-400 border border-purple-500/20 font-mono">
                {product.best_scheme}
              </span>
            )}
          </div>
        </div>

        {/* Action Button: Stockists Sheet or License Required Guardrail */}
        <div className="shrink-0">
          {lacksDl ? (
            <button
              onClick={() => onQuickAdd(product)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all active:scale-95 cursor-pointer"
              title="Drug License Form 20/21 Required"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>License Req</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenDistributors(product)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#00D2C4]/10 px-3 py-1.5 text-xs font-semibold text-[#00D2C4] border border-[#00D2C4]/20 hover:bg-[#00D2C4] hover:text-slate-950 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <div className="flex -space-x-1.5 items-center mr-0.5">
                <span className="inline-block w-4 h-4 rounded-full bg-slate-800 border border-[#1E2631] text-[8px] font-mono font-bold text-center leading-4 text-cyan-400">1</span>
                <span className="inline-block w-4 h-4 rounded-full bg-slate-700 border border-[#1E2631] text-[8px] font-mono font-bold text-center leading-4 text-slate-300">2</span>
              </div>
              <span className="font-mono font-bold">{stockistCount}</span>
              <span className="hidden sm:inline">Stockists</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
