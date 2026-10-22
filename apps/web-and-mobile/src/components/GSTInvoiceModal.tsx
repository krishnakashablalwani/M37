'use client';

import React, { useState, useEffect } from 'react';
import { X, Printer, Download, ShieldCheck, Building2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface GSTInvoiceModalProps {
  invoiceIdOrOrderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GSTInvoiceModal({
  invoiceIdOrOrderId,
  isOpen,
  onClose,
}: GSTInvoiceModalProps) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!invoiceIdOrOrderId || !isOpen) return;

    setLoading(true);
    fetch(`/api/invoices/${invoiceIdOrOrderId}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setData(res);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [invoiceIdOrOrderId, isOpen]);

  if (!isOpen || !invoiceIdOrOrderId) return null;

  const inv = data?.invoice;
  const items = data?.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full text-slate-100 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Control Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs print:hidden">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white text-sm">Tax Invoice Preview</span>
            <span className="text-[11px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-mono">
              GST Rule 46 Compliant
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-6 overflow-y-auto bg-slate-900 text-slate-200 font-sans print:p-0 print:bg-white print:text-black">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="h-8 w-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading GST Tax Invoice Details...</p>
            </div>
          ) : !inv ? (
            <div className="text-center py-16 text-slate-400">
              <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">Invoice Not Yet Issued</p>
              <p className="text-xs text-slate-500 mt-1">
                The distributor will issue the tax invoice upon dispatch of this order.
              </p>
            </div>
          ) : (
            <div className="border border-slate-700 rounded-xl p-6 bg-slate-950/60 print:border-black print:bg-transparent">
              {/* Header: Distributor Identity (Legal Seller) */}
              <div className="border-b border-slate-700 pb-5 mb-5 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="text-xs uppercase font-extrabold text-cyan-400 tracking-wider">
                    TAX INVOICE (RULE 46)
                  </div>
                  <h1 className="text-xl font-black text-white mt-0.5 print:text-black">
                    {inv.seller_legal_name}
                  </h1>
                  <p className="text-xs text-slate-400 print:text-gray-700 mt-0.5">
                    {inv.seller_address}, {inv.seller_city}, {inv.seller_state} - {inv.seller_pincode}
                  </p>
                  <div className="mt-2 text-xs text-slate-300 font-mono space-y-0.5">
                    <div>
                      GSTIN: <strong className="text-white print:text-black">{inv.seller_gstin || '36AABCM1234F1Z8'}</strong>
                    </div>
                    <div>
                      State Wholesale Drug License (Form 20B/21B):{' '}
                      <strong className="text-white print:text-black">
                        {inv.seller_dl_20b} & {inv.seller_dl_21b}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Invoice Metadata Box */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono space-y-1 w-full sm:w-auto text-right print:border-black print:bg-transparent">
                  <div>
                    <span className="text-slate-400">Invoice No:</span>{' '}
                    <strong className="text-cyan-400 print:text-black text-sm">{inv.invoice_number}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Date:</span>{' '}
                    <strong className="text-white print:text-black">
                      {new Date(inv.issued_at).toLocaleDateString('en-IN')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Order Ref:</span>{' '}
                    <strong className="text-white print:text-black">{inv.order_number}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Payment Status:</span>{' '}
                    <span
                      className={`px-1.5 py-0.2 rounded font-sans text-[10px] font-bold ${
                        inv.payment_state === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {inv.payment_state}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billed To (Buyer / Retailer) */}
              <div className="border-b border-slate-700 pb-5 mb-5 bg-slate-900/50 p-3.5 rounded-xl text-xs print:bg-transparent print:border-black">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Billed To (Retailer / Consignee):
                </span>
                <div className="font-bold text-white text-sm print:text-black">{inv.buyer_legal_name}</div>
                <div className="text-slate-400 print:text-gray-700">
                  {inv.buyer_address}, {inv.buyer_city}, {inv.buyer_state} - {inv.buyer_pincode}
                </div>
                <div className="mt-1 font-mono text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                  <div>
                    GSTIN: <strong>{inv.buyer_gstin || 'Unregistered'}</strong>
                  </div>
                  <div>
                    Retail Drug License (Form 20/21):{' '}
                    <strong>{inv.buyer_dl_20 || 'N/A (FMCG Store)'}</strong>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-700 uppercase tracking-wider text-[10px] print:bg-gray-100 print:text-black print:border-black">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-2">HSN</th>
                      <th className="py-2.5 px-2">Batch / Exp</th>
                      <th className="py-2.5 px-2 text-right">Qty</th>
                      <th className="py-2.5 px-2 text-right">Free</th>
                      <th className="py-2.5 px-2 text-right">PTR</th>
                      <th className="py-2.5 px-2 text-right">CGST</th>
                      <th className="py-2.5 px-2 text-right">SGST</th>
                      <th className="py-2.5 px-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                    {items.map((it: any, idx: number) => {
                      const lineTaxable = Number(it.unit_ptr) * Number(it.accepted_qty || it.requested_qty);
                      const halfTax = (lineTaxable * (Number(it.gst_pct) / 2)) / 100;

                      return (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-white print:text-black">{it.brand_name}</div>
                            <div className="text-[10px] text-slate-400 print:text-gray-600 font-mono">
                              {it.pack_size}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 font-mono text-slate-300 print:text-black">{it.hsn_code}</td>
                          <td className="py-2.5 px-2 font-mono text-[11px]">
                            <div className="text-white print:text-black">{it.batch_number}</div>
                            <div className="text-[10px] text-slate-400 print:text-gray-600">
                              Exp: {it.expiry_month_year}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-white print:text-black">
                            {it.accepted_qty || it.requested_qty}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-emerald-400 print:text-black">
                            {it.free_scheme_qty || 0}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-300 print:text-black">
                            ₹{Number(it.unit_ptr).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-400 print:text-black">
                            ₹{halfTax.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-400 print:text-black">
                            ₹{halfTax.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white print:text-black">
                            ₹{Number(it.line_total).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Tax & Grand Total Summary */}
              <div className="mt-6 pt-4 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="text-[11px] text-slate-400 max-w-sm space-y-1 print:text-gray-700">
                  <p>
                    <strong>Terms & Conditions:</strong> Goods once sold will not be returned unless covered under verified RMA policy. All pharmaceutical sales are strictly compliant with Indian Drugs and Cosmetics Act.
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono pt-1">
                    System generated tax invoice on behalf of {inv.seller_legal_name}.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full sm:w-64 space-y-1.5 text-xs font-mono print:border-black print:bg-transparent">
                  <div className="flex justify-between text-slate-400 print:text-gray-700">
                    <span>Taxable Amount:</span>
                    <span className="text-white print:text-black">₹{Number(inv.taxable_value).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 print:text-gray-700">
                    <span>CGST:</span>
                    <span className="text-white print:text-black">₹{Number(inv.cgst_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 print:text-gray-700">
                    <span>SGST:</span>
                    <span className="text-white print:text-black">₹{Number(inv.sgst_amount).toFixed(2)}</span>
                  </div>
                  {inv.delivery_fee > 0 && (
                    <div className="flex justify-between text-slate-400 print:text-gray-700">
                      <span>Delivery Fee:</span>
                      <span className="text-white print:text-black">₹{Number(inv.delivery_fee).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-700 flex justify-between text-sm font-extrabold text-white print:text-black">
                    <span>Invoice Total:</span>
                    <span className="text-cyan-400 print:text-black font-black">
                      ₹{Number(inv.total_invoice_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
