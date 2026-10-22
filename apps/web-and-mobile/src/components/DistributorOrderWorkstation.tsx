'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Truck,
  FileText,
  XCircle,
  Package,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
  Edit2,
  Check,
  Filter,
  Search,
} from 'lucide-react';
import { Organization } from '@/types';

interface DistributorOrderWorkstationProps {
  currentOrg: Organization | null;
  distributors: Organization[];
  onViewInvoice: (orderId: string) => void;
}

type WorkstationView = 'orders' | 'inventory_grid';
type BatchFilter = 'ALL' | 'EXPIRING_90' | 'ZERO_STOCK' | 'ACTIVE';

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
  const [activeView, setActiveView] = useState<WorkstationView>('orders');

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Inventory Grid State
  const [batches, setBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchFilter, setBatchFilter] = useState<BatchFilter>('ALL');
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editQtyValue, setEditQtyValue] = useState<number>(0);
  const [savingBatch, setSavingBatch] = useState(false);

  // 1. Fetch Orders for selected distributor
  const fetchOrders = useCallback(() => {
    if (!selectedDistributorId) return;
    setLoadingOrders(true);
    let url = `/api/orders?distributor_id=${selectedDistributorId}`;
    if (statusFilter !== 'ALL') {
      url += `&status=${statusFilter}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const fetchedOrders = data.orders || [];
          setOrders(fetchedOrders);
          // Retain current selection or select the first one
          if (fetchedOrders.length > 0) {
            setSelectedOrder((prev: any) => {
              if (!prev) return fetchedOrders[0];
              const match = fetchedOrders.find((o: any) => o.id === prev.id);
              return match || fetchedOrders[0];
            });
          } else {
            setSelectedOrder(null);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingOrders(false));
  }, [selectedDistributorId, statusFilter]);

  // 2. Fetch Batches for Dense Inventory Grid
  const fetchBatches = useCallback(() => {
    if (!selectedDistributorId) return;
    setLoadingBatches(true);
    fetch(`/api/distributor/batches?distributor_id=${selectedDistributorId}&filter=${batchFilter}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBatches(data.batches || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingBatches(false));
  }, [selectedDistributorId, batchFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (activeView === 'inventory_grid') {
      fetchBatches();
    }
  }, [activeView, fetchBatches]);

  // Status transition handler
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

  // Keyboard Shortcuts ('A' to accept, 'R' to reject active order)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (!selectedOrder) return;

      if ((e.key === 'a' || e.key === 'A') && selectedOrder.status === 'ORDER_PLACED') {
        e.preventDefault();
        handleUpdateStatus(selectedOrder.id, 'ACCEPTED');
      } else if ((e.key === 'r' || e.key === 'R') && selectedOrder.status === 'ORDER_PLACED') {
        e.preventDefault();
        handleUpdateStatus(selectedOrder.id, 'REJECTED', 'Order rejected via quick keyboard shortcut');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOrder]);

  // Inline Batch Editing
  const handleSaveBatchQty = async (batchId: string) => {
    setSavingBatch(true);
    try {
      const res = await fetch('/api/distributor/batches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: batchId,
          available_qty: editQtyValue,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update batch quantity');
      }

      setEditingBatchId(null);
      fetchBatches();
    } catch (err: any) {
      alert(`Error updating batch: ${err.message}`);
    } finally {
      setSavingBatch(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ORDER_PLACED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D2C4]/15 text-[#00D2C4] border border-[#00D2C4]/30">
            Awaiting Confirmation
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Accepted
          </span>
        );
      case 'PROCESSING':
      case 'PACKED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            {status}
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Dispatched (Invoiced)
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Delivered
          </span>
        );
      case 'REJECTED':
      case 'CANCELLED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            {status}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-100">
      {/* Workstation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#1E2631]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[#00D2C4]/10 text-[#00D2C4] border border-[#00D2C4]/20 uppercase">
              Linear-Style Portal
            </span>
            <span className="text-xs text-slate-400 font-mono">FEFO Batch Management & Invoice Intake</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
            Distributor Order Intake & Dense Data Grid
          </h2>
        </div>

        {/* View Toggle & Distributor Select */}
        <div className="flex items-center space-x-3 self-start sm:self-auto flex-wrap gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#12181F] border border-[#1E2631] p-1 rounded-xl text-xs font-mono">
            <button
              onClick={() => setActiveView('orders')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeView === 'orders'
                  ? 'bg-[#00D2C4] text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Order Intake Screen
            </button>
            <button
              onClick={() => setActiveView('inventory_grid')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeView === 'inventory_grid'
                  ? 'bg-[#00D2C4] text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Zero-Waste Batch Grid
            </button>
          </div>

          {/* Distributor Switcher */}
          <div className="bg-[#12181F] border border-[#1E2631] rounded-xl px-2.5 py-1 text-xs">
            <select
              value={selectedDistributorId}
              onChange={(e) => setSelectedDistributorId(e.target.value)}
              className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
            >
              {distributors
                .filter((d) => d.org_type === 'DISTRIBUTOR')
                .map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#12181F] text-white">
                    {d.trade_name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: SPLIT-PANE ORDER INTAKE SCREEN */}
      {activeView === 'orders' && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
          {/* Left Pane (35% on Desktop): Order Stream sorted by Urgency */}
          <div className="lg:col-span-5 bg-[#12181F] border border-[#1E2631] rounded-xl flex flex-col overflow-hidden">
            {/* Status Filter Header */}
            <div className="p-3 border-b border-[#1E2631] bg-[#090D11]/60 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                Incoming Stream ({orders.length})
              </span>
              <div className="flex items-center space-x-1">
                {['ALL', 'ORDER_PLACED', 'ACCEPTED', 'DISPATCHED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#00D2C4] text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-[#1E2631]'
                    }`}
                  >
                    {st === 'ORDER_PLACED' ? 'New' : st === 'DISPATCHED' ? 'Inv' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Stream List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#1E2631]/80 max-h-[700px]">
              {loadingOrders ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-2">
                  <div className="w-6 h-6 border-2 border-[#00D2C4] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-mono">Loading incoming orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 text-slate-500 font-mono text-xs">
                  <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <span>No orders matching status filter</span>
                </div>
              ) : (
                orders.map((ord, idx) => {
                  const isSelected = selectedOrder?.id === ord.id;
                  const isUrgent = idx === 0 || ord.status === 'ORDER_PLACED';

                  return (
                    <div
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      className={`p-3.5 transition-all cursor-pointer border-l-2 ${
                        isSelected
                          ? 'bg-[#090D11] border-l-[#00D2C4]'
                          : 'hover:bg-[#090D11]/50 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-xs font-bold text-white">{ord.order_number}</span>
                            {isUrgent && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                2h Cutoff
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-semibold text-slate-300 mt-1">{ord.retailer_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {ord.items?.length || 0} items • {ord.created_at}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-sm font-extrabold text-[#00D2C4] tabular-nums">
                            ₹{ord.grand_total.toFixed(2)}
                          </div>
                          <div className="mt-1">{getStatusBadge(ord.status)}</div>
                        </div>
                      </div>

                      {/* Quick Keyboard Shortcut Bar on Pending Orders */}
                      {ord.status === 'ORDER_PLACED' && isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-[#1E2631] flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>Keyboard Shortcuts:</span>
                          <div className="flex items-center space-x-1.5">
                            <span className="bg-[#1E2631] px-1.5 py-0.5 rounded text-[#00D2C4] font-bold">[A] Accept</span>
                            <span className="bg-[#1E2631] px-1.5 py-0.5 rounded text-rose-400 font-bold">[R] Reject</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane (65% on Desktop): Batch Assignment & Invoice Generator */}
          <div className="lg:col-span-7 bg-[#12181F] border border-[#1E2631] rounded-xl flex flex-col overflow-hidden">
            {selectedOrder ? (
              <div className="flex-1 flex flex-col p-5 overflow-y-auto">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E2631]">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-base font-extrabold text-white">
                        {selectedOrder.order_number}
                      </span>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">
                      Retailer: <strong className="text-white font-sans">{selectedOrder.retailer_name}</strong> • Phone:{' '}
                      {selectedOrder.retailer_phone}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Delivery: {selectedOrder.retailer_address} (Pincode: {selectedOrder.retailer_pincode})
                    </div>
                  </div>

                  {/* Primary Workflow CTA */}
                  <div className="shrink-0 flex items-center space-x-2">
                    {selectedOrder.status === 'ORDER_PLACED' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'REJECTED', 'Stock allocation shortage')}
                          disabled={actionLoadingId === selectedOrder.id}
                          className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer font-mono"
                        >
                          [R] Reject
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'ACCEPTED')}
                          disabled={actionLoadingId === selectedOrder.id}
                          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#00D2C4] hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer font-mono"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>[A] Accept Order</span>
                        </button>
                      </div>
                    )}

                    {selectedOrder.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'PROCESSING')}
                        disabled={actionLoadingId === selectedOrder.id}
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer font-mono"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Move to Packing & Verification</span>
                      </button>
                    )}

                    {['PROCESSING', 'PACKED'].includes(selectedOrder.status) && (
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'DISPATCHED')}
                        disabled={actionLoadingId === selectedOrder.id}
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer font-mono"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch & Generate Tax Invoice</span>
                      </button>
                    )}

                    {selectedOrder.status === 'DISPATCHED' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onViewInvoice(selectedOrder.id)}
                          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 text-xs font-bold font-mono cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Tax Invoice</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                          disabled={actionLoadingId === selectedOrder.id}
                          className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono cursor-pointer"
                        >
                          <span>Mark Delivered</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* The FEFO Auto-Assignment Drawer */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-[#00D2C4]" />
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                        FEFO Batch Auto-Assignment Drawer
                      </h4>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      FEFO Expiry Lock: Active
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedOrder.items?.map((it: any) => (
                      <div
                        key={it.id}
                        className="rounded-lg border border-[#1E2631] bg-[#090D11] p-3 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white text-sm font-sans">{it.brand_name}</span>
                            <span className="text-slate-400 ml-2">({it.pack_size})</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">Unit PTR</span>
                            <span className="font-bold text-slate-200">₹{it.unit_ptr.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* FEFO Batch Details */}
                        <div className="mt-2.5 pt-2 border-t border-[#1E2631] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase">Allocated Batch</span>
                            <strong className="text-[#00D2C4]">{it.batch_number || 'Auto-Allocated'}</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase">Expiry Date</span>
                            <strong className="text-emerald-400">Exp: {it.expiry_date || '2027-10-31'}</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase">Requested / Free</span>
                            <strong className="text-white">
                              {it.requested_qty} + {it.free_scheme_qty || 0} Free
                            </strong>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-500 block uppercase">Line Total</span>
                            <strong className="text-white font-bold">₹{it.line_total.toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Commercial Reconciliation Breakdown */}
                <div className="mt-6 pt-4 border-t border-[#1E2631] flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 font-mono text-xs">
                  <div className="text-slate-400 text-[11px]">
                    Rule 46 GST Tax Compliant • Reverse Charge: No
                  </div>
                  <div className="space-y-1 text-right min-w-[200px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal (PTR):</span>
                      <span className="tabular-nums">₹{selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>GST (CGST+SGST):</span>
                      <span className="tabular-nums">₹{selectedOrder.tax_total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-white pt-1 border-t border-[#1E2631]">
                      <span>Invoice Total:</span>
                      <span className="text-[#00D2C4] tabular-nums">
                        ₹{selectedOrder.grand_total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500 font-mono">
                <Package className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-sm font-bold text-white font-sans">No order selected</p>
                <p className="text-xs text-slate-500 mt-1">
                  Select an order from the left stream to inspect FEFO batch allocations.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: DENSE ZERO-WASTED-SPACE BATCH INVENTORY GRID */}
      {activeView === 'inventory_grid' && (
        <div className="mt-6 bg-[#12181F] border border-[#1E2631] rounded-xl overflow-hidden shadow-xl">
          {/* Quick Filter Pills */}
          <div className="p-3.5 bg-[#090D11]/60 border-b border-[#1E2631] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-1.5 flex-wrap gap-1">
              <span className="text-slate-400 mr-1 flex items-center">
                <Filter className="w-3.5 h-3.5 mr-1 text-[#00D2C4]" /> Filter Batches:
              </span>
              <button
                onClick={() => setBatchFilter('ALL')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  batchFilter === 'ALL'
                    ? 'bg-[#00D2C4] text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-[#1E2631]'
                }`}
              >
                All Batches ({batches.length})
              </button>
              <button
                onClick={() => setBatchFilter('EXPIRING_90')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  batchFilter === 'EXPIRING_90'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-amber-400 hover:text-white hover:bg-[#1E2631]'
                }`}
              >
                Expiring in &lt;90 Days
              </button>
              <button
                onClick={() => setBatchFilter('ZERO_STOCK')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  batchFilter === 'ZERO_STOCK'
                    ? 'bg-rose-500 text-white font-bold'
                    : 'text-rose-400 hover:text-white hover:bg-[#1E2631]'
                }`}
              >
                Zero Stock
              </button>
              <button
                onClick={() => setBatchFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  batchFilter === 'ACTIVE'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-emerald-400 hover:text-white hover:bg-[#1E2631]'
                }`}
              >
                Active
              </button>
            </div>

            <div className="text-[11px] text-slate-500">
              Double-click or click stock cell to edit inventory inline
            </div>
          </div>

          {/* Dense Table */}
          <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 z-10 bg-[#090D11] border-b border-[#1E2631] text-[10px] uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Batch #</th>
                  <th className="py-2.5 px-3">Medicine SKU</th>
                  <th className="py-2.5 px-3">Expiry</th>
                  <th className="py-2.5 px-3 text-right">PTR (₹)</th>
                  <th className="py-2.5 px-3 text-right">MRP (₹)</th>
                  <th className="py-2.5 px-3 text-right">Physical Stock</th>
                  <th className="py-2.5 px-3 text-right">Reserved</th>
                  <th className="py-2.5 px-3 text-right">Available</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2631]/60">
                {loadingBatches ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-[#00D2C4] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading inventory batches...
                    </td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      No batches found for this filter.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => {
                    const isEditing = editingBatchId === b.id;

                    return (
                      <tr key={b.id} className="hover:bg-[#090D11]/40 transition-colors">
                        <td className="py-2 px-3 font-bold text-white whitespace-nowrap">
                          {b.batch_number}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-white font-sans">{b.brand_name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {b.pack_size} • {b.schedule}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span
                            className={
                              b.days_to_expiry <= 90 ? 'text-amber-400 font-bold' : 'text-emerald-400'
                            }
                          >
                            {b.expiry_date}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            ({b.days_to_expiry} days)
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-200">
                          ₹{b.ptr.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-400">
                          ₹{b.mrp.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-300">
                          {b.physical_stock}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-amber-400">
                          {b.reserved_qty}
                        </td>

                        {/* Inline Editable Available Stock Cell */}
                        <td className="py-2 px-3 text-right tabular-nums">
                          {isEditing ? (
                            <div className="flex items-center justify-end space-x-1">
                              <input
                                type="number"
                                value={editQtyValue}
                                onChange={(e) => setEditQtyValue(parseInt(e.target.value, 10) || 0)}
                                className="w-16 bg-[#090D11] border border-[#00D2C4] px-1 py-0.5 rounded text-right text-white font-mono text-xs focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveBatchQty(b.id)}
                                disabled={savingBatch}
                                className="p-1 bg-[#00D2C4] text-slate-950 rounded hover:bg-cyan-400 cursor-pointer"
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingBatchId(b.id);
                                setEditQtyValue(b.available_qty);
                              }}
                              className="group cursor-pointer flex items-center justify-end space-x-1"
                              title="Click to edit stock"
                            >
                              <span
                                className={`font-bold ${
                                  b.available_qty === 0 ? 'text-rose-400' : 'text-white'
                                }`}
                              >
                                {b.available_qty}
                              </span>
                              <Edit2 className="w-2.5 h-2.5 text-slate-600 group-hover:text-[#00D2C4]" />
                            </div>
                          )}
                        </td>

                        <td className="py-2 px-3 text-center">
                          {b.status === 'EXPIRING_SOON' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Expiring &lt;90d
                            </span>
                          )}
                          {b.status === 'ZERO_STOCK' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              Zero Stock
                            </span>
                          )}
                          {b.status === 'ACTIVE' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => {
                              setEditingBatchId(b.id);
                              setEditQtyValue(b.available_qty);
                            }}
                            className="text-[10px] text-[#00D2C4] hover:underline cursor-pointer"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
