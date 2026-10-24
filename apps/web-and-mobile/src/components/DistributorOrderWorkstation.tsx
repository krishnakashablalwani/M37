'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  CheckCircle2,
  Truck,
  FileText,
  Package,
  Layers,
  Edit2,
  Check,
  Filter,
  Search,
  Clock,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
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
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>('ALL');
  const [activeView, setActiveView] = useState<WorkstationView>('orders');

  useEffect(() => {
    if (currentOrg?.org_type === 'DISTRIBUTOR') {
      setSelectedDistributorId(currentOrg.id);
    }
  }, [currentOrg]);

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
  const [searchBatch, setSearchBatch] = useState('');
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editQtyValue, setEditQtyValue] = useState<number>(0);
  const [savingBatch, setSavingBatch] = useState(false);

  // 1. Fetch Orders for selected distributor (or ALL)
  const fetchOrders = useCallback(() => {
    setLoadingOrders(true);
    let url = `/api/orders?`;
    if (selectedDistributorId && selectedDistributorId !== 'ALL') {
      url += `distributor_id=${selectedDistributorId}&`;
    }
    if (statusFilter !== 'ALL') {
      url += `status=${statusFilter}&`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const fetchedOrders = data.orders || [];
          setOrders(fetchedOrders);
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
    setLoadingBatches(true);
    let url = `/api/distributor/batches?filter=${batchFilter}`;
    if (selectedDistributorId && selectedDistributorId !== 'ALL') {
      url += `&distributor_id=${selectedDistributorId}`;
    }

    fetch(url)
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
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (!selectedOrder) return;

      if ((e.key === 'a' || e.key === 'A') && selectedOrder.status === 'ORDER_PLACED') {
        e.preventDefault();
        handleUpdateStatus(selectedOrder.id, 'ACCEPTED');
      } else if ((e.key === 'r' || e.key === 'R') && selectedOrder.status === 'ORDER_PLACED') {
        e.preventDefault();
        handleUpdateStatus(selectedOrder.id, 'REJECTED', 'Stock allocation shortage');
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
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800">
            Awaiting Confirmation
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700">
            Accepted
          </span>
        );
      case 'PROCESSING':
      case 'PACKED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800">
            {status}
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
            Dispatched (Invoiced)
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
            Delivered
          </span>
        );
      case 'REJECTED':
      case 'CANCELLED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
            {status}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  const filteredBatches = batches.filter((b) => {
    if (!searchBatch) return true;
    const q = searchBatch.toLowerCase();
    return (
      b.brand_name?.toLowerCase().includes(q) ||
      b.batch_number?.toLowerCase().includes(q) ||
      b.schedule?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-900 dark:text-slate-100">
      {/* Workstation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 uppercase">
              Operations Control
            </span>
            <span className="text-xs text-slate-500 font-mono">FEFO Allocation &amp; Warehouse Dispatch</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
            Distributor Order Workstation &amp; Batch Grid
          </h2>
        </div>

        {/* View Toggle & Distributor Select */}
        <div className="flex items-center space-x-3 self-start sm:self-auto flex-wrap gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs font-mono">
            <button
              onClick={() => setActiveView('orders')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeView === 'orders'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Order Intake Screen
            </button>
            <button
              onClick={() => setActiveView('inventory_grid')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeView === 'inventory_grid'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Zero-Waste Batch Grid
            </button>
          </div>

          {/* Distributor Switcher */}
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <select
              value={selectedDistributorId}
              onChange={(e) => setSelectedDistributorId(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-mono font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                All Stockists (Live Stream)
              </option>
              {distributors
                .filter((d) => d.org_type === 'DISTRIBUTOR')
                .map((d) => (
                  <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
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
          {/* Left Pane (40% on Desktop): Order Stream sorted by Urgency */}
          <div className="lg:col-span-5 bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 rounded-xl flex flex-col overflow-hidden shadow-xs">
            {/* Status Filter Header */}
            <div className="p-3 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#121212] flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 dark:text-neutral-400 text-[11px] uppercase tracking-wider font-semibold">
                Incoming Stream ({orders.length})
              </span>
              <div className="flex items-center space-x-1">
                {['ALL', 'ORDER_PLACED', 'ACCEPTED', 'DISPATCHED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs border border-slate-200 dark:border-slate-700'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {st === 'ORDER_PLACED' ? 'New' : st === 'DISPATCHED' ? 'Invoiced' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Stream List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[700px]">
              {loadingOrders ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-2">
                  <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-500 font-mono">Loading orders stream...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-mono text-xs">
                  <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
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
                      className={`p-3.5 transition-all cursor-pointer border-l-3 ${
                        isSelected
                          ? 'bg-teal-50/50 dark:bg-slate-800/60 border-l-teal-600 dark:border-l-teal-400'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{ord.order_number}</span>
                            {isUrgent && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                                2h Cutoff
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">{ord.retailer_name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            {ord.items?.length || 0} items • {ord.distributor_name} • {ord.created_at}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-sm font-black text-teal-700 dark:text-teal-400 tabular-nums">
                            ₹{ord.grand_total.toFixed(2)}
                          </div>
                          <div className="mt-1">{getStatusBadge(ord.status)}</div>
                        </div>
                      </div>

                      {/* Quick Keyboard Shortcut Bar on Pending Orders */}
                      {ord.status === 'ORDER_PLACED' && isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>Keyboard Shortcuts:</span>
                          <div className="flex items-center space-x-1.5">
                            <span className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded text-teal-700 dark:text-teal-400 font-bold">[A] Accept</span>
                            <span className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded text-rose-600 dark:text-rose-400 font-bold">[R] Reject</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane (60% on Desktop): Batch Assignment & Invoice Generator */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 rounded-xl flex flex-col overflow-hidden shadow-xs">
            {selectedOrder ? (
              <div className="flex-1 flex flex-col p-5 overflow-y-auto">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-neutral-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                        {selectedOrder.order_number}
                      </span>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <div className="text-xs text-slate-700 dark:text-neutral-300 mt-1 font-mono">
                      Retailer: <strong className="text-slate-900 dark:text-white font-sans">{selectedOrder.retailer_name}</strong> • Phone:{' '}
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
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'REJECTED', 'Stock shortage')}
                          disabled={actionLoadingId === selectedOrder.id}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer font-mono"
                        >
                          [R] Reject
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'ACCEPTED')}
                          disabled={actionLoadingId === selectedOrder.id}
                          className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer font-mono"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>[A] Accept Order</span>
                        </button>
                      </div>
                    )}

                    {selectedOrder.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'PROCESSING')}
                        disabled={actionLoadingId === selectedOrder.id}
                        className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer font-mono"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Move to Packing</span>
                      </button>
                    )}

                    {['PROCESSING', 'PACKED'].includes(selectedOrder.status) && (
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'DISPATCHED')}
                        disabled={actionLoadingId === selectedOrder.id}
                        className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer font-mono"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch &amp; Generate Tax Invoice</span>
                      </button>
                    )}

                    {selectedOrder.status === 'DISPATCHED' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onViewInvoice(selectedOrder.id)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 text-xs font-bold font-mono cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Tax Invoice</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                          disabled={actionLoadingId === selectedOrder.id}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono cursor-pointer"
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
                      <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        FEFO Batch Auto-Assignment Drawer
                      </h4>
                    </div>
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">
                      FEFO Expiry Lock: Active
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedOrder.items?.map((it: any) => (
                      <div
                        key={it.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3.5 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm font-sans">{it.brand_name}</span>
                            <span className="text-slate-500 ml-2">({it.pack_size})</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block font-semibold">Unit PTR</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">₹{it.unit_ptr.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* FEFO Batch Details */}
                        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase font-bold">Allocated Batch</span>
                            <strong className="text-teal-700 dark:text-teal-400 font-bold">{it.batch_number || 'Auto-Allocated'}</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase font-bold">Expiry Date</span>
                            <strong className="text-emerald-700 dark:text-emerald-400">Exp: {it.expiry_date || '2027-10-31'}</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase font-bold">Quantity</span>
                            <strong className="text-slate-900 dark:text-white">
                              {it.requested_qty} units {it.free_scheme_qty ? `(+${it.free_scheme_qty} Free)` : ''}
                            </strong>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-500 block uppercase font-bold">Line Total</span>
                            <strong className="text-slate-900 dark:text-white font-bold">₹{it.line_total.toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Commercial Reconciliation Breakdown */}
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 font-mono text-xs">
                  <div className="text-slate-500 text-[11px]">
                    Rule 46 GST Tax Compliant • Reverse Charge: No
                  </div>
                  <div className="space-y-1 text-right min-w-[200px]">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Subtotal (PTR):</span>
                      <span className="tabular-nums font-semibold">₹{selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>GST (CGST+SGST):</span>
                      <span className="tabular-nums font-semibold">₹{selectedOrder.tax_total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span>Invoice Total:</span>
                      <span className="text-teal-700 dark:text-teal-400 tabular-nums">
                        ₹{selectedOrder.grand_total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 font-mono">
                <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-800 dark:text-white font-sans">No order selected</p>
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
        <div className="mt-6 bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
          {/* Quick Filter Pills & Search */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#121212] border-b border-slate-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-1.5 flex-wrap gap-1">
              <span className="text-slate-500 mr-1 flex items-center">
                <Filter className="w-3.5 h-3.5 mr-1 text-teal-600 dark:text-teal-400" /> Batches:
              </span>
              <button
                onClick={() => setBatchFilter('ALL')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  batchFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({batches.length})
              </button>
              <button
                onClick={() => setBatchFilter('EXPIRING_90')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  batchFilter === 'EXPIRING_90'
                    ? 'bg-amber-500 text-white font-bold'
                    : 'text-amber-700 dark:text-amber-400 hover:underline'
                }`}
              >
                Expiring &lt;90 Days
              </button>
              <button
                onClick={() => setBatchFilter('ZERO_STOCK')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  batchFilter === 'ZERO_STOCK'
                    ? 'bg-rose-500 text-white font-bold'
                    : 'text-rose-700 dark:text-rose-400 hover:underline'
                }`}
              >
                Zero Stock
              </button>
              <button
                onClick={() => setBatchFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  batchFilter === 'ACTIVE'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-emerald-700 dark:text-emerald-400 hover:underline'
                }`}
              >
                Active
              </button>
            </div>

            {/* Quick Search in Batches */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchBatch}
                  onChange={(e) => setSearchBatch(e.target.value)}
                  placeholder="Filter by batch or SKU..."
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none w-48 font-mono"
                />
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Click stock to edit inline
              </span>
            </div>
          </div>

          {/* Dense Table */}
          <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider font-bold">
                <tr>
                  <th className="py-2.5 px-3">Batch #</th>
                  <th className="py-2.5 px-3">Medicine SKU</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3 text-right">PTR (₹)</th>
                  <th className="py-2.5 px-3 text-right">MRP (₹)</th>
                  <th className="py-2.5 px-3 text-right">Physical</th>
                  <th className="py-2.5 px-3 text-right">Reserved</th>
                  <th className="py-2.5 px-3 text-right">Available</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loadingBatches ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-slate-500">
                      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading inventory batches...
                    </td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No batches found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b) => {
                    const isEditing = editingBatchId === b.id;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {b.batch_number}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 dark:text-white font-sans">{b.brand_name}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {b.pack_size} • {b.schedule}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={
                              b.days_to_expiry <= 90 ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-emerald-700 dark:text-emerald-400 font-medium'
                            }
                          >
                            {b.expiry_date}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            ({b.days_to_expiry} days)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-700 dark:text-slate-200">
                          ₹{b.ptr.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-400">
                          ₹{b.mrp.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                          {b.physical_stock}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-amber-700 dark:text-amber-400">
                          {b.reserved_qty}
                        </td>

                        {/* Inline Editable Available Stock Cell */}
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {isEditing ? (
                            <div className="flex items-center justify-end space-x-1">
                              <input
                                type="number"
                                value={editQtyValue}
                                onChange={(e) => setEditQtyValue(parseInt(e.target.value, 10) || 0)}
                                className="w-16 bg-white dark:bg-slate-900 border border-teal-600 px-1 py-0.5 rounded text-right text-slate-900 dark:text-white font-mono text-xs focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveBatchQty(b.id)}
                                disabled={savingBatch}
                                className="p-1 bg-teal-600 text-white rounded hover:bg-teal-700 cursor-pointer"
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
                                  b.available_qty === 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {b.available_qty}
                              </span>
                              <Edit2 className="w-2.5 h-2.5 text-slate-400 group-hover:text-teal-600" />
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {b.status === 'EXPIRING_SOON' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                              Expiring &lt;90d
                            </span>
                          )}
                          {b.status === 'ZERO_STOCK' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
                              Zero Stock
                            </span>
                          )}
                          {b.status === 'ACTIVE' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                              Active
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              setEditingBatchId(b.id);
                              setEditQtyValue(b.available_qty);
                            }}
                            className="text-[10px] text-teal-700 dark:text-teal-400 hover:underline cursor-pointer font-bold"
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
