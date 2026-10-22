'use client';

import React from 'react';
import { Pill, Building2, Tag, ShieldAlert, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { MasterProduct, Organization } from '@/types';

interface ProductCardProps {
  product: MasterProduct;
  onOpenCompare: (product: MasterProduct) => void;
  onQuickAdd: (product: MasterProduct) => void;
  currentOrg: Organization | null;
}

export function ProductCard({
  product,
  onOpenCompare,
  onQuickAdd,
  currentOrg,
}: ProductCardProps) {
  const isRestrictedSchedule = ['SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X'].includes(product.schedule);
  const lacksDl = isRestrictedSchedule && (!currentOrg?.drug_license_no_20 || currentOrg.kyc_state !== 'APPROVED');

  const getScheduleBadge = () => {
    switch (product.schedule) {
      case 'SCHEDULE_H':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <ShieldAlert className="h-3 w-3 mr-0.5" /> Schedule H (Rx Only)
          </span>
        );
      case 'SCHEDULE_H1':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="h-3 w-3 mr-0.5" /> Schedule H1 (Restricted)
          </span>
        );
      case 'OTC':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3 mr-0.5" /> OTC (Free Sale)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/50 text-slate-300 border border-slate-600">
            Non-Pharma
          </span>
        );
    }
  };

  return (
    <div className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/5 flex flex-col justify-between">
      <div>
        {/* Top Badges: Category & Schedule */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-slate-800 text-cyan-400 border border-slate-700">
            {product.category}
          </span>
          {getScheduleBadge()}
        </div>

        {/* Product Brand & Generic Salt Composition */}
        <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors leading-snug">
          {product.brand_name}
        </h3>

        {product.generic_composition && (
          <div className="mt-1 flex items-center space-x-1 text-xs text-slate-400 font-mono">
            <Pill className="h-3 w-3 text-cyan-400/80 shrink-0" />
            <span className="truncate">{product.generic_composition}</span>
          </div>
        )}

        <div className="mt-2 text-xs text-slate-400 flex items-center space-x-2">
          <span className="text-slate-300 font-medium">{product.manufacturer}</span>
          <span>•</span>
          <span className="text-slate-500">{product.pack_size}</span>
        </div>

        {/* Scheme Badge (if distributor offers any scheme like 10+1) */}
        {product.best_scheme && (
          <div className="mt-3 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Scheme: <strong>{product.best_scheme}</strong></span>
          </div>
        )}

        {/* Pricing & Stock Details */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Wholesale PTR</div>
            <div className="text-base font-extrabold text-white font-mono">
              ₹{Number(product.min_ptr || 0).toFixed(2)}
              <span className="text-[10px] text-slate-400 font-normal ml-1">+{product.gst_percentage}% GST</span>
            </div>
            {product.max_mrp && (
              <div className="text-[11px] text-slate-500 line-through">
                MRP ₹{Number(product.max_mrp).toFixed(2)}
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Stock in Pincode</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">
              {product.total_available_qty && product.total_available_qty > 0 ? (
                `${product.total_available_qty} units available`
              ) : (
                <span className="text-rose-400">Out of Stock</span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              Across <strong className="text-white">{product.distributor_count || 0}</strong> stockist{product.distributor_count === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-3 border-t border-slate-800 flex items-center space-x-2">
        <button
          onClick={() => onOpenCompare(product)}
          className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 hover:border-cyan-500/50 transition-all"
        >
          <span>Compare Stockists ({product.distributor_count || 0})</span>
          <ArrowRight className="h-3 w-3" />
        </button>

        <button
          onClick={() => onQuickAdd(product)}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all ${
            lacksDl
              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20'
          }`}
          title={lacksDl ? 'Drug License Form 20/21 required' : 'Quick Add to Cart'}
        >
          {lacksDl ? (
            <>
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>DL Req</span>
            </>
          ) : (
            <span>+ Add</span>
          )}
        </button>
      </div>
    </div>
  );
}
