'use client';

import React, { useEffect, useState } from 'react';
import { X, Building2, Phone, ShieldCheck, Clock, Sparkles, AlertCircle, ShoppingBag, Lock, Check } from 'lucide-react';
import { MasterProduct, DistributorBatchListing, Organization } from '@/types';

interface DistributorCompareDrawerProps {
  product: MasterProduct | null;
  isOpen: boolean;
  onClose: () => void;
  pincode: string;
  currentOrg: Organization | null;
  onAddToCart: (product: MasterProduct, batch: DistributorBatchListing, quantity: number) => void;
  onComplianceBlocked: (productName: string, schedule: string) => void;
}

type SortOption = 'price' | 'scheme' | 'delivery' | 'preferred';

export function DistributorCompareDrawer({
  product,
  isOpen,
  onClose,
  pincode,
  currentOrg,
  onAddToCart,
  onComplianceBlocked,
}: DistributorCompareDrawerProps) {
  const [distributors, setDistributors] = useState<DistributorBatchListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [revealedPhoneId, setRevealedPhoneId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [activeFlashId, setActiveFlashId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('price');

  useEffect(() => {
    if (!product || !isOpen) return;

    setLoading(true);
    fetch(`/api/products/${product.id}/distributors?pincode=${pincode}&retailerId=${currentOrg?.id || ''}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDistributors(data.distributors || []);
          const qMap: Record<string, number> = {};
          (data.distributors || []).forEach((d: DistributorBatchListing) => {
            qMap[d.batch_id] = d.moq || 1;
          });
          setQuantities(qMap);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [product, isOpen, pincode, currentOrg]);

  if (!isOpen || !product) return null;

  const isRestrictedSchedule = ['SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X'].includes(product.schedule);
  const lacksDl = isRestrictedSchedule && (!currentOrg?.drug_license_no_20 || currentOrg.kyc_state !== 'APPROVED');

  const triggerTactileFlash = (batchId: string) => {
    setActiveFlashId(batchId);
    setTimeout(() => setActiveFlashId(null), 400);
  };

  const handleQtyChange = (d: DistributorBatchListing, delta: number) => {
    const moq = d.moq || 1;
    const cur = quantities[d.batch_id] || moq;
    const step = moq > 1 ? moq : 1;
    const nextVal = Math.max(moq, Math.min(d.available_qty, cur + delta * step));
    setQuantities((prev) => ({ ...prev, [d.batch_id]: nextVal }));
    triggerTactileFlash(d.batch_id);
  };

  const handleAdd = (d: DistributorBatchListing) => {
    if (lacksDl) {
      onComplianceBlocked(product.brand_name, product.schedule);
      return;
    }
    const qty = quantities[d.batch_id] || d.moq || 1;
    triggerTactileFlash(d.batch_id);
    onAddToCart(product, d, qty);
  };

  // Sort distributors based on criteria
  const sortedDistributors = [...distributors].sort((a, b) => {
    if (sortBy === 'scheme') {
      const aScheme = a.scheme_description ? 1 : 0;
      const bScheme = b.scheme_description ? 1 : 0;
      return bScheme - aScheme;
    }
    if (sortBy === 'delivery') {
      return (b.reliability_score || 0) - (a.reliability_score || 0);
    }
    if (sortBy === 'preferred') {
      const aPref = a.is_preferred ? 1 : 0;
      const bPref = b.is_preferred ? 1 : 0;
      return bPref - aPref;
    }
    return (a.net_landing_price || a.ptr) - (b.net_landing_price || b.ptr);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 dark:bg-black/80 backdrop-blur-xs flex justify-end transition-opacity duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-[#0A0A0A] border-l border-slate-200 dark:border-neutral-800 h-full flex flex-col shadow-2xl text-slate-900 dark:text-neutral-100 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#0A0A0A] flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 bg-slate-200/80 dark:bg-[#171717] px-1.5 py-0.5 rounded border border-slate-300 dark:border-neutral-700">
                {product.pack_size}
              </span>
              <span className="text-[10px] bg-slate-100 dark:bg-[#171717] text-slate-500 dark:text-neutral-400 px-1.5 py-0.5 rounded font-mono border border-slate-200 dark:border-neutral-700">
                HSN {product.hsn_code}
              </span>
              <span className="text-[10px] text-teal-700 dark:text-teal-400 font-mono font-bold">
                +{product.gst_percentage}% GST
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1.5 leading-snug tracking-tight">
              {product.brand_name}
            </h2>
            {product.generic_composition && (
              <p className="text-xs text-slate-600 dark:text-neutral-300 font-mono mt-0.5 font-medium">{product.generic_composition}</p>
            )}
            <p className="text-[11px] text-slate-500 font-sans mt-1">{product.manufacturer}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ranking Sort Pills */}
        <div className="bg-slate-50/60 dark:bg-[#121212] px-5 py-2.5 border-b border-slate-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-neutral-400 font-mono text-[11px] font-semibold">Rank by:</span>
          <div className="flex items-center space-x-1 flex-wrap gap-1 font-mono">
            <button
              onClick={() => setSortBy('price')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                sortBy === 'price'
                  ? 'bg-white dark:bg-[#1A1A1A] text-slate-900 dark:text-white font-bold shadow-xs border border-slate-300 dark:border-neutral-700'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Best Price
            </button>
            <button
              onClick={() => setSortBy('scheme')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                sortBy === 'scheme'
                  ? 'bg-white dark:bg-[#1A1A1A] text-slate-900 dark:text-white font-bold shadow-xs border border-slate-300 dark:border-neutral-700'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Best Scheme
            </button>
            <button
              onClick={() => setSortBy('delivery')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                sortBy === 'delivery'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs border border-slate-300 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Fastest Delivery
            </button>
            <button
              onClick={() => setSortBy('preferred')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                sortBy === 'preferred'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs border border-slate-300 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Preferred Stockist
            </button>
          </div>
        </div>

        {/* Drug License Missing Warning Header */}
        {lacksDl && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/80 px-5 py-2.5 flex items-center space-x-2 text-xs text-amber-800 dark:text-amber-300 font-medium">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Schedule H/H1 Restriction:</strong> Verified Drug License (Form 20/21) required to unlock wholesale orders.
            </span>
          </div>
        )}

        {/* Stockist Batch Cards List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-2">
              <div className="w-7 h-7 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-mono">Querying real-time stockist inventory...</p>
            </div>
          ) : sortedDistributors.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-slate-50 dark:bg-[#0A0A0A] rounded-xl border border-slate-200 dark:border-neutral-800 p-6">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-white">No active stockists found</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">Pincode: {pincode}</p>
            </div>
          ) : (
            sortedDistributors.map((d, idx) => {
              const isBest = idx === 0;
              const curQty = quantities[d.batch_id] || d.moq || 1;
              const isFlashing = activeFlashId === d.batch_id;

              return (
                <div
                  key={d.batch_id}
                  className={`relative rounded-xl border p-4.5 transition-all duration-150 ${
                    isFlashing
                      ? 'ring-2 ring-teal-500 border-teal-500 bg-teal-50/20'
                      : isBest
                      ? 'bg-white dark:bg-[#0A0A0A] border-teal-500/60 shadow-xs'
                      : 'bg-white dark:bg-[#0A0A0A] border-slate-200 dark:border-neutral-800 hover:border-slate-300'
                  }`}
                >
                  {isBest && (
                    <div className="absolute -top-2.5 right-4 bg-teal-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs font-mono tracking-wider">
                      TOP MATCH
                    </div>
                  )}

                  {/* Stockist Name & Verification */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{d.distributor_name}</h4>
                        {d.is_preferred && (
                          <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 px-1.5 py-0.2 rounded font-mono font-bold">
                            Preferred
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center space-x-2 mt-0.5 font-mono">
                        <span>{d.city}</span>
                        <span>•</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          {d.reliability_score}% Fulfillment Rate
                        </span>
                      </div>
                    </div>

                    {/* Net Landing Price */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block font-semibold">
                        Net Landing (Incl. GST)
                      </span>
                      <div className="text-base font-black text-slate-900 dark:text-white font-mono tabular-nums">
                        ₹{d.net_landing_price}
                        <span className="text-[10px] text-slate-400 font-normal"> / unit</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        PTR: ₹{d.ptr}
                      </div>
                    </div>
                  </div>

                  {/* Batch Details, Expiry & FEFO Status */}
                  <div className="mt-3.5 grid grid-cols-3 gap-2 bg-slate-50 dark:bg-[#121212] rounded-lg p-2.5 text-xs text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-800 font-mono">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Batch #</span>
                      <strong className="text-slate-900 dark:text-white text-[11px]">{d.batch_number}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Expiry</span>
                      <strong className="text-emerald-700 dark:text-emerald-400 text-[11px]">Exp: {d.expiry_date}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Available Stock</span>
                      <strong className="text-slate-900 dark:text-white text-[11px]">{d.available_qty} units</strong>
                    </div>
                  </div>

                  {/* Scheme Callout */}
                  {d.scheme_description && (
                    <div className="mt-2.5 flex items-center space-x-1.5 text-xs bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 rounded-lg px-2.5 py-1.5 font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span className="font-mono">{d.scheme_description}</span>
                    </div>
                  )}

                  {/* Delivery SLA & MOQ */}
                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 font-mono text-[11px]">
                    <span className="flex items-center space-x-1 text-slate-600 dark:text-neutral-400">
                      <Clock className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                      <span>{d.delivery_sla}</span>
                    </span>
                    <span>MOQ: <strong className="text-slate-900 dark:text-white">{d.moq} units</strong></span>
                  </div>

                  {/* Action Bar */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between gap-3">
                    {/* Phone Reveal */}
                    <div>
                      {revealedPhoneId === d.batch_id ? (
                        <a
                          href={`tel:${d.distributor_phone}`}
                          className="inline-flex items-center space-x-1 text-xs text-teal-800 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 px-2.5 py-1.5 rounded-lg font-mono"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{d.distributor_phone}</span>
                        </a>
                      ) : (
                        <button
                          onClick={() => setRevealedPhoneId(d.batch_id)}
                          className="inline-flex items-center space-x-1 text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#171717] hover:bg-slate-200 dark:hover:bg-neutral-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 transition-colors cursor-pointer"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call Stockist</span>
                        </button>
                      )}
                    </div>

                    {/* Quantity Stepper & Add Stock Action */}
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center bg-slate-100 dark:bg-[#121212] rounded-lg border border-slate-300 dark:border-neutral-700 overflow-hidden text-xs">
                        <button
                          onClick={() => handleQtyChange(d, -1)}
                          className="px-2.5 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white font-mono font-bold cursor-pointer"
                          title="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono font-bold text-slate-900 dark:text-white tabular-nums">{curQty}</span>
                        <button
                          onClick={() => handleQtyChange(d, 1)}
                          className="px-2.5 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white font-mono font-bold cursor-pointer"
                          title="Snap to next pack multiple"
                        >
                          +
                        </button>
                      </div>

                      {lacksDl ? (
                        <button
                          onClick={() => onComplianceBlocked(product.brand_name, product.schedule)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 hover:bg-amber-100 cursor-pointer font-mono"
                          title="Drug License Form 20/21 Required"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>DL Req</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAdd(d)}
                          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all active:scale-95 shadow-xs cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add Stock</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
