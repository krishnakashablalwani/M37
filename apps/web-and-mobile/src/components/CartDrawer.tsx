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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl text-white">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Your Cart</h2>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full font-mono text-cyan-400">
              {cart.length} item{cart.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-slate-800"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="bg-rose-500/10 border-b border-rose-500/30 p-3 text-xs text-rose-300 flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ShoppingBag className="h-12 w-12 mx-auto text-slate-600 mb-3" />
              <p className="text-base font-bold text-white">Your cart is currently empty</p>
              <p className="text-xs text-slate-500 mt-1">
                Search the master catalog and add products from eligible stockists to checkout.
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
                  className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
                >
                  {/* Distributor Header */}
                  <div className="bg-slate-800/60 p-3.5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-cyan-400" />
                      <span className="font-bold text-xs text-white">{group.distributor_name}</span>
                      <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                        Sub-order Partition
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-white">
                      ₹{groupGrandTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-slate-800/60 p-3 space-y-3">
                    {group.items.map((item) => {
                      const itemSubtotal = item.unit_ptr * item.quantity;
                      const itemTax = itemSubtotal * (item.gst_pct / 100);

                      return (
                        <div key={item.batch_id} className="pt-2 first:pt-0 flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-white">{item.brand_name}</h4>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              Batch: {item.batch_number} • {item.pack_size}
                            </div>
                            {item.scheme_description && (
                              <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                                🎁 {item.scheme_description}
                              </div>
                            )}
                            <div className="text-xs font-mono text-slate-300 mt-1">
                              ₹{item.unit_ptr} <span className="text-[10px] text-slate-500">+{item.gst_pct}% GST</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden text-xs">
                              <button
                                onClick={() => {
                                  if (item.quantity <= item.moq) {
                                    onRemoveItem(item.batch_id);
                                  } else {
                                    onUpdateQty(item.batch_id, item.quantity - 1);
                                  }
                                }}
                                className="px-2 py-0.5 text-slate-400 hover:text-white hover:bg-slate-700"
                              >
                                -
                              </button>
                              <span className="px-2 font-mono font-bold text-white">{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQty(item.batch_id, item.quantity + 1)}
                                className="px-2 py-0.5 text-slate-400 hover:text-white hover:bg-slate-700"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => onRemoveItem(item.batch_id)}
                              className="text-slate-500 hover:text-rose-400 text-xs"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Distributor Partition Footer & 1-Tap Atomic Reserve Checkout */}
                  <div className="bg-slate-900 p-3.5 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Total Payable to Stockist</div>
                      <div className="font-mono font-extrabold text-white text-sm">₹{groupGrandTotal.toFixed(2)}</div>
                    </div>

                    <button
                      onClick={() => handleCheckout(distId, group.items)}
                      disabled={submitting}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all active:scale-95"
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
          <div className="p-5 border-t border-slate-800 bg-slate-950/90 text-xs space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Items Total (Wholesale PTR):</span>
              <span className="font-mono text-white">₹{overallSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total GST (CGST + SGST):</span>
              <span className="font-mono text-white">₹{overallTax.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-extrabold text-white">
              <span>Grand Total:</span>
              <span className="font-mono text-cyan-400 text-base">₹{overallGrandTotal.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-slate-500 pt-1">
              🔒 Invoices are legally generated on behalf of the respective fulfilling distributor. Concurrency protection enforced via atomic PostgreSQL row locking.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
