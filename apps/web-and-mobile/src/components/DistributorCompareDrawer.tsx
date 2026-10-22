'use client';

import React, { useEffect, useState } from 'react';
import { X, Building2, Phone, Star, ShieldCheck, Clock, Check, Sparkles, AlertCircle, ShoppingBag } from 'lucide-react';
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

  useEffect(() => {
    if (!product || !isOpen) return;

    setLoading(true);
    fetch(`/api/products/${product.id}/distributors?pincode=${pincode}&retailerId=${currentOrg?.id || ''}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDistributors(data.distributors || []);
          // Initialize default quantities to MOQ
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

  const handleAdd = (d: DistributorBatchListing) => {
    if (lacksDl) {
      onComplianceBlocked(product.brand_name, product.schedule);
      return;
    }
    const qty = quantities[d.batch_id] || d.moq || 1;
    onAddToCart(product, d, qty);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end transition-opacity duration-300">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl text-white animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {product.category}
              </span>
              <span className="text-xs text-slate-400 font-mono">SKU: {product.sku_code}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1 leading-snug">
              {product.brand_name}
            </h2>
            {product.generic_composition && (
              <p className="text-xs text-slate-400 font-mono mt-0.5">{product.generic_composition}</p>
            )}
            <div className="mt-1 flex items-center space-x-2 text-xs text-slate-400">
              <span>{product.manufacturer}</span>
              <span>•</span>
              <span>{product.pack_size}</span>
              <span>•</span>
              <span className="text-cyan-400 font-medium">HSN: {product.hsn_code} ({product.gst_percentage}% GST)</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Serving Pincode Banner */}
        <div className="bg-slate-800/60 px-5 py-2.5 text-xs text-slate-300 flex items-center justify-between border-b border-slate-800">
          <span>Comparing stockists serving Pincode: <strong className="text-cyan-400 font-mono">{pincode}</strong></span>
          <span className="text-[11px] text-slate-400">{distributors.length} eligible distributor{distributors.length === 1 ? '' : 's'}</span>
        </div>

        {/* Content: List of Stockists */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3">
              <div className="h-8 w-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Querying real-time stockist rates and batch inventory...</p>
            </div>
          ) : distributors.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <AlertCircle className="h-10 w-10 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No active stockists found</p>
              <p className="text-xs text-slate-500 mt-1">
                No distributor currently has available stock for this product in pincode {pincode}.
              </p>
            </div>
          ) : (
            distributors.map((d, idx) => {
              const isBestPrice = idx === 0;
              const curQty = quantities[d.batch_id] || d.moq || 1;

              return (
                <div
                  key={d.batch_id}
                  className={`relative rounded-2xl border p-4 transition-all duration-200 ${
                    isBestPrice
                      ? 'bg-gradient-to-br from-slate-900 to-cyan-950/30 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isBestPrice && (
                    <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm">
                      ⚡ Lowest Net Landing Price
                    </div>
                  )}

                  {/* Distributor Info & Score */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-cyan-400" />
                        <h4 className="font-bold text-white text-sm">{d.distributor_name}</h4>
                        {d.is_preferred && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-semibold">
                            Preferred
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span>{d.city}</span>
                        <span>•</span>
                        <span className="flex items-center text-amber-400 font-medium">
                          <Star className="h-3 w-3 mr-0.5 fill-current" />
                          {d.reliability_score}% Fulfillment Rate
                        </span>
                      </div>
                    </div>

                    {/* Net Landing Price */}
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Net Landing Price</div>
                      <div className="text-lg font-extrabold text-white font-mono">
                        ₹{d.net_landing_price}
                        <span className="text-[10px] text-slate-400 font-normal"> / unit</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Base PTR: ₹{d.ptr} | MRP: ₹{d.mrp}
                      </div>
                    </div>
                  </div>

                  {/* Batch Details & Expiry */}
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-950/60 rounded-xl p-2.5 text-xs text-slate-300 border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Batch No</span>
                      <strong className="font-mono text-white">{d.batch_number}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Earliest Expiry</span>
                      <strong className="text-emerald-400 font-mono">{d.expiry_date}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Stock Available</span>
                      <strong className="text-white font-mono">{d.available_qty} units</strong>
                    </div>
                  </div>

                  {/* Active Scheme (if any) */}
                  {d.scheme_description && (
                    <div className="mt-2.5 flex items-center space-x-1.5 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg px-2.5 py-1.5">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" />
                      <span>Distributor Scheme: <strong>{d.scheme_description}</strong></span>
                    </div>
                  )}

                  {/* Delivery SLA & MOQ */}
                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center space-x-1 text-slate-300">
                      <Clock className="h-3 w-3 text-cyan-400" />
                      <span>Delivery: <strong>{d.delivery_sla}</strong></span>
                    </span>
                    <span className="text-slate-400">
                      MOQ: <strong className="text-white font-mono">{d.moq}</strong> units
                    </span>
                  </div>

                  {/* Actions: Call Distributor & Add to Cart */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    {/* Call Distributor */}
                    <div>
                      {revealedPhoneId === d.batch_id ? (
                        <a
                          href={`tel:${d.distributor_phone}`}
                          className="inline-flex items-center space-x-1 text-xs text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1.5 rounded-lg hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{d.distributor_phone}</span>
                        </a>
                      ) : (
                        <button
                          onClick={() => setRevealedPhoneId(d.batch_id)}
                          className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors"
                        >
                          <Phone className="h-3 w-3" />
                          <span>Call Stockist</span>
                        </button>
                      )}
                    </div>

                    {/* Quantity Selector & Add Button */}
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 overflow-hidden text-xs">
                        <button
                          onClick={() => {
                            const newQ = Math.max(d.moq || 1, curQty - 1);
                            setQuantities({ ...quantities, [d.batch_id]: newQ });
                          }}
                          className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-700"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono font-bold text-white">{curQty}</span>
                        <button
                          onClick={() => {
                            const newQ = Math.min(d.available_qty, curQty + 1);
                            setQuantities({ ...quantities, [d.batch_id]: newQ });
                          }}
                          className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-700"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleAdd(d)}
                        className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                          lacksDl
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20'
                        }`}
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Add from this Stockist</span>
                      </button>
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
