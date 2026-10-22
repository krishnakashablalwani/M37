'use client';

import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle2, Clock, Truck, FileText, XCircle, Package, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Organization } from '@/types';

interface DistributorOrderWorkstationProps {
  currentOrg: Organization | null;
  distributors: Organization[];
  onViewInvoice: (orderId: string) => void;
}

export function DistributorOrderWorkstation({
  currentOrg,
  distributors,
  onViewInvoice,
}: DistributorOrderWorkstationProps) {
  // If current persona is not a distributor, pick the first distributor by default
  const defaultDistributorId =
    currentOrg?.org_type === 'DISTRIBUTOR'
      ? currentOrg.id
      : distributors.find((d) => d.org_type === 'DISTRIBUTOR')?.id || '';

  const [selectedDistributorId, setSelectedDistributorId] = useState(defaultDistributorId);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    let url = `/api/orders?distributor_id=${selectedDistributorId}`;
    if (statusFilter !== 'ALL') {
      url += `&status=${statusFilter}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrders(data.orders || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedDistributorId) {
      fetchOrders();
    }
  }, [selectedDistributorId, statusFilter]);

  const handleUpdateStatus = async (orderId: string, targetStatus: string, rejectionReason?: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          rejection_reason: rejectionReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update order status');
      }

      fetchOrders();
    } catch (err: any) {
      alert(`Error updating order: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ORDER_PLACED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            Awaiting Confirmation
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            Accepted
          </span>
        );
      case 'PROCESSING':
      case 'PACKED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            {status}
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Dispatched (Invoice Issued)
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Delivered
          </span>
        );
      case 'REJECTED':
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            {status}
          </span>
        );
      case 'RETURN_REQUESTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            RMA Return Filed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Distributor Workstation
            </span>
            <span className="text-xs text-slate-400 font-mono">Fulfillment Pipeline</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-1">Order Intake & Invoicing Workstation</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Accept or reject retailer orders with real-time stock allocation, advance delivery states, and generate legal GST Tax Invoices.
          </p>
        </div>

        {/* Distributor Filter Selector */}
        <div className="self-start sm:self-auto">
          <label className="block text-[11px] text-slate-400 mb-1">Active Distributor Workspace</label>
          <select
            value={selectedDistributorId}
            onChange={(e) => setSelectedDistributorId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
          >
            {distributors
              .filter((d) => d.org_type === 'DISTRIBUTOR')
              .map((d) => (
                <option key={d.id} value={d.id}>
                  🏢 {d.trade_name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        {['ALL', 'ORDER_PLACED', 'ACCEPTED', 'DISPATCHED', 'DELIVERED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === st
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            {st === 'ALL'
              ? 'All Orders'
              : st === 'ORDER_PLACED'
              ? 'Incoming (New)'
              : st === 'ACCEPTED'
              ? 'Accepted'
              : st === 'DISPATCHED'
              ? 'Dispatched (Invoiced)'
              : 'Delivered'}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="h-8 w-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading fulfillment orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800">
            <Package className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">No orders matching filter</h3>
            <p className="text-xs text-slate-500 mt-1">
              Switch the status filter or select another distributor.
            </p>
          </div>
        ) : (
          orders.map((ord) => {
            const isProcessing = actionLoadingId === ord.id;

            return (
              <div
                key={ord.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all"
              >
                {/* Header Row: Order Number & Retailer */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-extrabold text-cyan-400">{ord.order_number}</span>
                    {getStatusBadge(ord.status)}
                    <span className="text-[11px] text-slate-500 font-mono">Placed {ord.created_at}</span>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Grand Total</div>
                    <div className="text-base font-extrabold text-white font-mono">
                      ₹{ord.grand_total.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Retailer Info */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Buyer (Retailer)</span>
                    <strong className="text-white">{ord.retailer_name}</strong>
                    <div className="text-[11px] text-slate-400">{ord.retailer_phone}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Delivery Address</span>
                    <div className="text-slate-300">{ord.retailer_address}</div>
                    <div className="text-[11px] text-cyan-400 font-mono">Pincode: {ord.retailer_pincode}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">GST Tax Breakdown</span>
                    <div className="text-slate-400 font-mono">
                      Taxable: ₹{ord.subtotal.toFixed(2)} | GST: ₹{ord.tax_total.toFixed(2)}
                    </div>
                    {ord.invoice_number && (
                      <div className="text-[11px] text-emerald-400 font-mono font-bold mt-0.5">
                        Invoice: {ord.invoice_number}
                      </div>
                    )}
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-800/80">
                      <tr>
                        <th className="py-2">Item</th>
                        <th className="py-2">Batch / Expiry</th>
                        <th className="py-2 text-right">Requested Qty</th>
                        <th className="py-2 text-right">Free Scheme</th>
                        <th className="py-2 text-right">Unit PTR</th>
                        <th className="py-2 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {ord.items.map((it: any) => (
                        <tr key={it.id}>
                          <td className="py-2 text-white font-medium">
                            {it.brand_name}{' '}
                            <span className="text-[10px] text-slate-400 font-mono">({it.pack_size})</span>
                          </td>
                          <td className="py-2 font-mono text-[11px] text-slate-300">
                            {it.batch_number || 'Auto-allocated'} ({it.expiry_date})
                          </td>
                          <td className="py-2 text-right font-mono font-bold text-white">{it.requested_qty}</td>
                          <td className="py-2 text-right font-mono text-emerald-400">{it.free_scheme_qty || 0}</td>
                          <td className="py-2 text-right font-mono text-slate-300">₹{it.unit_ptr.toFixed(2)}</td>
                          <td className="py-2 text-right font-mono font-bold text-white">
                            ₹{it.line_total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action Toolbar */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    {/* View GST Tax Invoice Button (if dispatched) */}
                    {ord.invoice_number && (
                      <button
                        onClick={() => onViewInvoice(ord.id)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors font-medium"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>View GST Tax Invoice</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {ord.status === 'ORDER_PLACED' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'REJECTED', 'Stock allocation shortage')}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'ACCEPTED')}
                          disabled={isProcessing}
                          className="flex items-center space-x-1 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-md shadow-cyan-500/20"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Accept Order</span>
                        </button>
                      </>
                    )}

                    {ord.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'PROCESSING')}
                        disabled={isProcessing}
                        className="flex items-center space-x-1 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                      >
                        <Package className="h-3.5 w-3.5" />
                        <span>Move to Processing & Packing</span>
                      </button>
                    )}

                    {['PROCESSING', 'PACKED'].includes(ord.status) && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'DISPATCHED')}
                        disabled={isProcessing}
                        className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold shadow-md shadow-amber-500/20"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        <span>Dispatch & Generate Legal GST Invoice</span>
                      </button>
                    )}

                    {ord.status === 'DISPATCHED' && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'DELIVERED')}
                        disabled={isProcessing}
                        className="flex items-center space-x-1 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Mark Delivered</span>
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
  );
}
