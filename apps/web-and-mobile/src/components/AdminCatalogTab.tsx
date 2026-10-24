'use client';

import React, { useState, useEffect } from 'react';
import { Plus, ShieldAlert, CheckCircle, Search, Pill, Sparkles, AlertCircle } from 'lucide-react';
import { MasterProduct } from '@/types';

export function AdminCatalogTab() {
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [skuCode, setSkuCode] = useState('');
  const [brandName, setBrandName] = useState('');
  const [genericComp, setGenericComp] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [category, setCategory] = useState<'PHARMA' | 'SURGICAL' | 'FMCG'>('PHARMA');
  const [schedule, setSchedule] = useState<'OTC' | 'SCHEDULE_H' | 'SCHEDULE_H1' | 'SCHEDULE_X' | 'NON_PHARMA'>('SCHEDULE_H');
  const [packSize, setPackSize] = useState('10x10 Tablets / Box');
  const [uom, setUom] = useState('Box');
  const [hsnCode, setHSNCode] = useState('30049060');
  const [gstPercentage, setGstPercentage] = useState('12');

  const fetchCatalog = () => {
    setLoading(true);
    fetch('/api/catalog/admin')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.products || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleCreateSku = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    try {
      const res = await fetch('/api/catalog/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku_code: skuCode,
          brand_name: brandName,
          generic_composition: genericComp,
          manufacturer,
          category,
          schedule,
          pack_size: packSize,
          uom,
          hsn_code: hsnCode,
          gst_percentage: Number(gstPercentage),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create SKU');
      }

      setStatusMsg({ type: 'success', text: `Canonical SKU '${skuCode}' created successfully!` });
      setShowAddModal(false);
      // Reset form
      setSkuCode('');
      setBrandName('');
      setGenericComp('');
      setManufacturer('');
      fetchCatalog();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const filtered = products.filter(
    (p) =>
      p.brand_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.sku_code.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (p.generic_composition && p.generic_composition.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-900 dark:text-slate-100">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              Admin Governance
            </span>
            <span className="text-xs text-slate-500 font-mono">Single Source of Truth</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">Master Product Catalog Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Enforces standard SKU definitions across all stockists to eliminate duplicate product naming, standardizes HSN codes and GST taxation.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Master SKU</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`mt-4 p-3.5 rounded-xl border text-xs flex items-center space-x-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Search Filter */}
      <div className="mt-6 flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 max-w-md">
        <Search className="h-4 w-4 text-slate-400 mr-2" />
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter canonical SKUs..."
          className="bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none w-full font-sans"
        />
      </div>

      {/* Table */}
      <div className="mt-4 bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-[#121212] text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">SKU &amp; Brand Name</th>
                <th className="py-3 px-4">Generic Composition</th>
                <th className="py-3 px-4">Category &amp; Schedule</th>
                <th className="py-3 px-4">Pack Size / UOM</th>
                <th className="py-3 px-4">HSN / GST</th>
                <th className="py-3 px-4 text-right">Mapped Stockists</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80 text-slate-700 dark:text-neutral-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading Master Catalog...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No matching master SKUs found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm font-sans">{item.brand_name}</div>
                      <div className="font-mono text-[10px] text-teal-700 dark:text-teal-400 font-bold mt-0.5">{item.sku_code}</div>
                      <div className="text-[11px] text-slate-400 font-sans">{item.manufacturer}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 max-w-xs font-medium">
                      {item.generic_composition || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mr-1.5">
                        {item.category}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.schedule === 'SCHEDULE_H'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                            : item.schedule === 'SCHEDULE_H1'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                        }`}
                      >
                        {item.schedule}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{item.pack_size}</div>
                      <div className="text-[10px] text-slate-400">UOM: {item.uom}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div>HSN {item.hsn_code}</div>
                      <div className="text-teal-700 dark:text-teal-400 text-[11px] font-bold">{item.gst_percentage}% GST</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                        {item.distributor_count || 0}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Master SKU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 rounded-2xl max-w-xl w-full p-6 text-slate-900 dark:text-white shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Create Canonical Master SKU</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4">
              All distributors will map their inventory batches to this master SKU.
            </p>

            <form onSubmit={handleCreateSku} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1 font-semibold">SKU Code (Unique)</label>
                  <input
                    type="text"
                    required
                    value={skuCode}
                    onChange={(e) => setSkuCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MED-AMOX-625"
                    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-300 dark:border-neutral-700 rounded-lg p-2 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1 font-semibold">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Augmentin 625 Duo"
                    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-neutral-400 mb-1 font-semibold">Generic / Salt Composition</label>
                <input
                  type="text"
                  value={genericComp}
                  onChange={(e) => setGenericComp(e.target.value)}
                  placeholder="e.g. Amoxicillin 500mg + Clavulanic Acid 125mg"
                  className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1 font-semibold">Manufacturer</label>
                  <input
                    type="text"
                    required
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="e.g. GlaxoSmithKline"
                    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1 font-semibold">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-600"
                  >
                    <option value="PHARMA">PHARMA</option>
                    <option value="SURGICAL">SURGICAL</option>
                    <option value="FMCG">FMCG</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1 font-semibold">Drug Schedule</label>
                  <select
                    value={schedule}
                    onChange={(e: any) => setSchedule(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-600"
                  >
                    <option value="SCHEDULE_H">Schedule H (Rx Only)</option>
                    <option value="SCHEDULE_H1">Schedule H1 (High Risk)</option>
                    <option value="OTC">OTC (Free Sale)</option>
                    <option value="NON_PHARMA">Non-Pharma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1 font-semibold">Pack Size</label>
                  <input
                    type="text"
                    required
                    value={packSize}
                    onChange={(e) => setPackSize(e.target.value)}
                    placeholder="e.g. 10 Tablets / Strip"
                    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1 font-semibold">UOM</label>
                  <input
                    type="text"
                    required
                    value={uom}
                    onChange={(e) => setUom(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1 font-semibold">HSN Code</label>
                  <input
                    type="text"
                    required
                    value={hsnCode}
                    onChange={(e) => setHSNCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-neutral-400 mb-1 font-semibold">GST %</label>
                  <input
                    type="number"
                    required
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-600 dark:text-neutral-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Create Master SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
