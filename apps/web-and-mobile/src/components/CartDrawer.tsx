'use client';

import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, CheckCircle, ShieldCheck, ArrowRight, Building2, AlertCircle } from 'lucide-react';
import { CartItem, Organization } from '@/types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (batchId: string, qty: number) => void;
  onRemoveItem: (batchId: string) => void;
  onClearCart: () => void;
  currentOrg: Organization | null;
  onOrderSuccess: (orderNumber: string, grandTotal: number) => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  currentOrg,
  onOrderSuccess,
}: CartDrawerProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Group items by distributor_id
  const distributorGroups = cart.reduce((acc, item) => {
    if (!acc[item.distributor_id]) {
      acc[item.distributor_id] = {
        distributor_name: item.distributor_name,
        items: [],
      };
    }
    acc[item.distributor_id].items.push(item);
    return acc;
  }, {} as Record<string, { distributor_name: string; items: CartItem[] }>);

  // Compute overall totals
  let overallSubtotal = 0;
  let overallTax = 0;

  cart.forEach((it) => {
    const lineSubtotal = it.unit_ptr * it.quantity;
    const lineTax = lineSubtotal * (it.gst_pct / 100);
    overallSubtotal += lineSubtotal;
    overallTax += lineTax;
  });

  const overallGrandTotal = overallSubtotal + overallTax;

  const handleCheckout = async (distributorId: string, items: CartItem[]) => {
    if (!currentOrg) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retailer_id: currentOrg.id,
          distributor_id: distributorId,
          items,
          generation_mode: 'RETAILER_SELECTED',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Checkout failed');
      }

      // Remove checked out items from cart
      items.forEach((it) => onRemoveItem(it.batch_id));
      onOrderSuccess(data.order_number, data.grand_total);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error checking out');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 dark:bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-[#0B0F17] border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl text-slate-800 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#101726]">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center text-teal-700 dark:text-teal-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Wholesale Cart</h2>
                <span className="text-[11px] bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80 px-2 py-0.5 rounded-full font-mono font-bold">
                  {cart.length} SKU{cart.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Atomic FEFO Batch Partitioning</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 font-mono font-medium"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="bg-rose-50 dark:bg-rose-500/10 border-b border-rose-200 dark:border-rose-500/30 p-3 text-xs text-rose-800 dark:text-rose-300 flex items-start space-x-2 font-mono">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <ShoppingBag className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-base font-bold text-slate-800 dark:text-white">Your cart is currently empty</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Search the master pharmaceutical catalog or generate an automated shortfall replenishment draft to checkout.
              </p>
            </div>
          ) : (
            Object.entries(distributorGroups).map(([distId, group]) => {
              let groupSubtotal = 0;
              let groupTax = 0;

              group.items.forEach((it) => {
                const sub = it.unit_ptr * it.quantity;
                groupSubtotal += sub;
                groupTax += sub * (it.gst_pct / 100);
              });

              const groupGrandTotal = groupSubtotal + groupTax;

              return (
                <div
                  key={distId}
                  className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm"
                >
                  {/* Distributor Header */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{group.distributor_name}</span>
                      <span className="text-[10px] text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/60 px-1.5 py-0.2 rounded border border-teal-200 dark:border-teal-800 font-mono">
                        Sub-order Partition
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      ₹{groupGrandTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-3 space-y-2">
                    {group.items.map((item) => {
                      return (
                        <div key={item.batch_id} className="pt-2 first:pt-0 flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.brand_name}</h4>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                              Batch: {item.batch_number} • {item.pack_size}
                            </div>
                            {item.scheme_description && (
                              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5 font-mono">
                                Scheme: {item.scheme_description}
                              </div>
                            )}
                            <div className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1">
                              ₹{item.unit_ptr} <span className="text-[10px] text-slate-400">+{item.gst_pct}% GST</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden text-xs">
                              <button
                                onClick={() => {
                                  if (item.quantity <= item.moq) {
                                    onRemoveItem(item.batch_id);
                                  } else {
                                    onUpdateQty(item.batch_id, item.quantity - 1);
                                  }
                                }}
                                className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 font-mono"
                              >
                                -
                              </button>
                              <span className="px-2.5 font-mono font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQty(item.batch_id, item.quantity + 1)}
                                className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 font-mono"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => onRemoveItem(item.batch_id)}
                              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Distributor Partition Footer & 1-Tap Atomic Reserve Checkout */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Total Payable to Stockist</div>
                      <div className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">₹{groupGrandTotal.toFixed(2)}</div>
                    </div>

                    <button
                      onClick={() => handleCheckout(distId, group.items)}
                      disabled={submitting}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-bold text-xs shadow-sm disabled:opacity-50 transition-all active:scale-95 cursor-pointer font-mono"
                    >
                      {submitting ? (
                        <span>Reserving Stock...</span>
                      ) : (
                        <>
                          <span>Atomic FEFO Checkout</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Overall Cart Footer */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101726] text-xs space-y-2 font-mono">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Items Total (Wholesale PTR):</span>
              <span className="text-slate-900 dark:text-white font-semibold tabular-nums">₹{overallSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Total GST (CGST + SGST):</span>
              <span className="text-slate-900 dark:text-white font-semibold tabular-nums">₹{overallTax.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-extrabold text-slate-900 dark:text-white">
              <span>Grand Total:</span>
              <span className="text-teal-700 dark:text-teal-300 text-base tabular-nums">₹{overallGrandTotal.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 flex items-center gap-1.5 font-sans">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Invoices are legally generated per fulfilling distributor with atomic PostgreSQL row locking.</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
