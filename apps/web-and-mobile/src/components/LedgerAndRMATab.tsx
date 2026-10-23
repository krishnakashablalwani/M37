'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, FileText, CheckCircle2, AlertTriangle, ArrowUpRight, DollarSign, RotateCcw, Building2, Upload, AlertCircle } from 'lucide-react';
import { Organization } from '@/types';

interface LedgerAndRMATabProps {
  currentOrg: Organization | null;
  distributors: Organization[];
  onViewInvoice: (orderId: string) => void;
}

export function LedgerAndRMATab({
  currentOrg,
  distributors,
  onViewInvoice,
}: LedgerAndRMATabProps) {
  const isRetailer = currentOrg?.org_type === 'RETAILER';
  const retailerId = isRetailer ? currentOrg.id : '';
  const distributorId = !isRetailer ? currentOrg?.id : '';

  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'rma'>('ledger');
  const [links, setLinks] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [rmas, setRmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Payment Modal state
  const [payModalInv, setPayModalInv] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'CASH'>('UPI');
  const [paying, setPaying] = useState(false);

  // New RMA Modal state
  const [showRmaModal, setShowRmaModal] = useState(false);
  const [rmaOrders, setRmaOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [rmaReason, setRmaReason] = useState<'DAMAGED' | 'SHORT_SUPPLY' | 'NEAR_EXPIRY' | 'INCORRECT_ITEM'>('DAMAGED');
  const [rmaQty, setRmaQty] = useState('1');
  const [rmaComments, setRmaComments] = useState('');

  const fetchLedger = () => {
    setLoading(true);
    let url = `/api/ledger?`;
    if (retailerId) url += `retailer_id=${retailerId}`;
    if (distributorId) url += `distributor_id=${distributorId}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLinks(data.links || []);
          setInvoices(data.invoices || []);
          setPayments(data.payments || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchRmas = () => {
    let url = `/api/rma?`;
    if (retailerId) url += `retailer_id=${retailerId}`;
    if (distributorId) url += `distributor_id=${distributorId}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRmas(data.rmas || []);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchLedger();
    fetchRmas();
  }, [retailerId, distributorId]);

  useEffect(() => {
    if (showRmaModal && retailerId) {
      fetch(`/api/orders?retailer_id=${retailerId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.orders) {
            setRmaOrders(data.orders);
            if (data.orders.length > 0) {
              setSelectedOrderId(data.orders[0].id);
              if (data.orders[0].items?.length > 0) {
                setSelectedProduct(data.orders[0].items[0]);
              }
            }
          }
        });
    }
  }, [showRmaModal, retailerId]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalInv) return;
    setPaying(true);

    try {
      const res = await fetch('/api/ledger/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: payModalInv.id,
          retailer_id: payModalInv.retailer_id,
          distributor_id: payModalInv.distributor_id,
          amount: Number(payAmount),
          payment_method: payMethod,
          transaction_ref: `UPI-TXN-${Date.now().toString().slice(-6)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Payment failed');

      setPayModalInv(null);
      fetchLedger();
    } catch (err: any) {
      alert(`Payment error: ${err.message}`);
    } finally {
      setPaying(false);
    }
  };

  const handleCreateRma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const order = rmaOrders.find((o) => o.id === selectedOrderId);
      const res = await fetch('/api/rma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrderId,
          distributor_id: order?.distributor_id,
          retailer_id: currentOrg?.id,
          master_product_id: selectedProduct.master_product_id,
          batch_number: selectedProduct.batch_number || 'BATCH-UNKNOWN',
          return_qty: parseInt(rmaQty, 10),
          reason: rmaReason,
          comments: rmaComments,
          photo_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to submit RMA');

      setShowRmaModal(false);
      fetchRmas();
    } catch (err: any) {
      alert(`RMA Error: ${err.message}`);
    }
  };

  const handleResolveRma = async (rmaId: string, action: 'APPROVE' | 'REJECT', creditAmount: number) => {
    try {
      const res = await fetch('/api/rma', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rma_id: rmaId,
          action,
          credit_note_amount: creditAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to resolve RMA');

      fetchRmas();
      fetchLedger();
    } catch (err: any) {
      alert(`Error resolving RMA: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-900 dark:text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              Financial &amp; Ledger Control
            </span>
            <span className="text-xs text-slate-500 font-mono">FR-7 Commercial Reconciliation</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">Credit Ledgers &amp; Claims (RMA)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Track distributor credit limits, payment terms (15/21 days), overdue aging, UPI settlements, and damaged stock credit notes.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl self-start sm:self-auto text-xs">
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeSubTab === 'ledger'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Commercial Ledger &amp; Invoices
          </button>
          <button
            onClick={() => setActiveSubTab('rma')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeSubTab === 'rma'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Returns &amp; RMA Claims
          </button>
        </div>
      </div>

      {activeSubTab === 'ledger' && (
        <div className="mt-6 space-y-6">
          {/* Commercial Credit Terms Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {links.map((link) => {
              const creditLimit = Number(link.credit_limit || 0);
              const outstanding = Number(link.current_outstanding || 0);
              const availableHeadroom = Math.max(0, creditLimit - outstanding);
              const usedPct = creditLimit > 0 ? Math.min(100, (outstanding / creditLimit) * 100) : 0;

              return (
                <div
                  key={link.id}
                  className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs relative overflow-hidden"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {isRetailer ? link.distributor_name : link.retailer_name}
                      </span>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                      {link.credit_days} Days Credit
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Outstanding:</span>
                      <strong className="font-mono text-amber-700 dark:text-amber-400 text-sm">₹{outstanding.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Approved Credit Limit:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">₹{creditLimit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Available Headroom:</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">₹{availableHeadroom.toFixed(2)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-2">
                      <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            usedPct > 80 ? 'bg-rose-500' : usedPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${usedPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>{usedPct.toFixed(0)}% utilized</span>
                        <span>₹{creditLimit.toLocaleString('en-IN')} max</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Invoices List */}
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white text-sm">Issued Tax Invoices &amp; Aging</span>
              <span className="text-slate-500">{invoices.length} total invoice{invoices.length === 1 ? '' : 's'}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[10px] uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 font-bold">
                  <tr>
                    <th className="py-3 px-4">Invoice No / Order Ref</th>
                    <th className="py-3 px-4">Parties</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Invoice Total</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4">Payment State</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No issued invoices found. Dispatched orders will appear here automatically.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-teal-700 dark:text-teal-400 text-sm">{inv.invoice_number}</div>
                          <div className="text-[11px] text-slate-400 font-mono">Ref: {inv.order_number}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white font-sans">{inv.seller_trade_name || inv.distributor_name}</div>
                          <div className="text-[11px] text-slate-500">Buyer: {inv.buyer_trade_name || inv.retailer_name}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div>{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : 'Net 21 Days'}</div>
                          {inv.calculated_status === 'OVERDUE' && (
                            <span className="text-[10px] text-rose-600 font-bold block">OVERDUE</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                          ₹{Number(inv.total_invoice_amount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                          ₹{Number(inv.amount_paid || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.calculated_status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                : inv.calculated_status === 'OVERDUE'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 animate-pulse'
                                : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                            }`}
                          >
                            {inv.calculated_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => onViewInvoice(inv.order_id)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-400 border border-slate-300 dark:border-slate-700 cursor-pointer font-bold"
                          >
                            View
                          </button>
                          {inv.calculated_status !== 'PAID' && (
                            <button
                              onClick={() => {
                                setPayModalInv(inv);
                                const balance = Number(inv.total_invoice_amount) - Number(inv.amount_paid || 0);
                                setPayAmount(balance.toFixed(2));
                              }}
                              className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
                            >
                              Pay UPI
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Returns & RMA Tab */}
      {activeSubTab === 'rma' && (
        <div className="mt-6 space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Return Merchandise Authorizations (RMA)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Damaged, short-supplied, or near-expiry batches are quarantined and reconciled via GST Credit Notes.
              </p>
            </div>

            {isRetailer && (
              <button
                onClick={() => setShowRmaModal(true)}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Raise Return Request</span>
              </button>
            )}
          </div>

          {/* RMA Claims Table */}
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[10px] uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold">
                  <tr>
                    <th className="py-3 px-4">RMA Number</th>
                    <th className="py-3 px-4">Product &amp; Batch</th>
                    <th className="py-3 px-4">Reason &amp; Details</th>
                    <th className="py-3 px-4 text-right">Return Qty</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Credit Note Value</th>
                    {!isRetailer && <th className="py-3 px-4 text-right">Distributor Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                  {rmas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No return requests filed.
                      </td>
                    </tr>
                  ) : (
                    rmas.map((rma) => (
                      <tr key={rma.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{rma.rma_number}</span>
                          <div className="text-[10px] text-slate-400 font-mono">Order: {rma.order_number}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white font-sans">{rma.brand_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">Batch: {rma.batch_number}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {rma.reason}
                          </span>
                          {rma.comments && <p className="text-[11px] text-slate-500 mt-1 font-sans">{rma.comments}</p>}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">{rma.return_qty} units</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rma.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : rma.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}
                          >
                            {rma.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {Number(rma.credit_note_amount) > 0 ? `₹${Number(rma.credit_note_amount).toFixed(2)}` : '—'}
                        </td>
                        {!isRetailer && (
                          <td className="py-3 px-4 text-right space-x-2">
                            {rma.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleResolveRma(rma.id, 'REJECT', 0)}
                                  className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-300 dark:border-slate-700 cursor-pointer"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => {
                                    const amount = prompt(
                                      'Enter GST Credit Note amount (₹) to credit retailer:',
                                      '150.00'
                                    );
                                    if (amount) {
                                      handleResolveRma(rma.id, 'APPROVE', parseFloat(amount));
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                                >
                                  Approve &amp; Issue Credit Note
                                </button>
                              </>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {payModalInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-900 dark:text-white shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Invoice Settlement</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Invoice <strong className="text-teal-700 dark:text-teal-400">{payModalInv.invoice_number}</strong> payable to{' '}
              {payModalInv.distributor_name}
            </p>

            <form onSubmit={handlePay} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e: any) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                >
                  <option value="UPI">Direct UPI Deep Link</option>
                  <option value="BANK_TRANSFER">NEFT / RTGS Bank Transfer</option>
                  <option value="CHEQUE">Cheque Collection</option>
                  <option value="CASH">Cash Collection</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Amount to Settle (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPayModalInv(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {paying ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raise RMA Modal */}
      {showRmaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-900 dark:text-white shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Raise Return Request (RMA)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select delivered order and batch for return inspection.
            </p>

            <form onSubmit={handleCreateRma} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Select Order</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => {
                    setSelectedOrderId(e.target.value);
                    const ord = rmaOrders.find((o) => o.id === e.target.value);
                    if (ord && ord.items?.length > 0) setSelectedProduct(ord.items[0]);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                >
                  {rmaOrders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      {ord.order_number} ({ord.distributor_name} - ₹{ord.grand_total.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Return Reason</label>
                <select
                  value={rmaReason}
                  onChange={(e: any) => setRmaReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                >
                  <option value="DAMAGED">Damaged in Transit / Leaking</option>
                  <option value="SHORT_SUPPLY">Short Supply / Quantity Discrepancy</option>
                  <option value="NEAR_EXPIRY">Near Expiry (&lt; 90 days remaining)</option>
                  <option value="INCORRECT_ITEM">Incorrect Product / Pack Dispatched</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Return Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={rmaQty}
                  onChange={(e) => setRmaQty(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Explanation &amp; Notes</label>
                <textarea
                  rows={2}
                  value={rmaComments}
                  onChange={(e) => setRmaComments(e.target.value)}
                  placeholder="Describe damage / shortage..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRmaModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  Submit RMA Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
