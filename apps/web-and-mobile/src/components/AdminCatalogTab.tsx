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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Admin Governance
            </span>
            <span className="text-xs text-slate-400 font-mono">Single Source of Truth</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-1">Master Product Catalog Management</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Enforces standard SKU definitions across all stockists to eliminate duplicate product naming, standardizes HSN codes and GST taxation.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Master SKU</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`mt-4 p-3.5 rounded-xl border text-xs flex items-center space-x-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Search Filter */}
      <div className="mt-6 flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 max-w-md">
        <Search className="h-4 w-4 text-slate-500 mr-2" />
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter canonical SKUs..."
          className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      {/* Table */}
      <div className="mt-4 bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">SKU & Brand Name</th>
                <th className="py-3 px-4">Generic Composition</th>
                <th className="py-3 px-4">Category & Schedule</th>
                <th className="py-3 px-4">Pack Size / UOM</th>
                <th className="py-3 px-4">HSN / GST</th>
                <th className="py-3 px-4 text-right">Mapped Stockists</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading Master Catalog...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No matching master SKUs found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{item.brand_name}</div>
                      <div className="font-mono text-[10px] text-cyan-400 mt-0.5">{item.sku_code}</div>
                      <div className="text-[11px] text-slate-400">{item.manufacturer}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 max-w-xs">
                      {item.generic_composition || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 mr-1.5">
                        {item.category}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.schedule === 'SCHEDULE_H'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : item.schedule === 'SCHEDULE_H1'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {item.schedule}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{item.pack_size}</div>
                      <div className="text-[10px] text-slate-500">UOM: {item.uom}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div>HSN {item.hsn_code}</div>
                      <div className="text-cyan-400 text-[11px] font-bold">{item.gst_percentage}% GST</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-1 rounded-lg bg-slate-800 font-mono font-bold text-white">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 text-white shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Create Canonical Master SKU</h3>
            <p className="text-xs text-slate-400 mb-4">
              All distributors will map their inventory batches to this master SKU.
            </p>

            <form onSubmit={handleCreateSku} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">SKU Code (Unique)</label>
                  <input
                    type="text"
                    required
                    value={skuCode}
                    onChange={(e) => setSkuCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MED-AMOX-625"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Augmentin 625 Duo"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Generic / Salt Composition</label>
                <input
                  type="text"
                  value={genericComp}
                  onChange={(e) => setGenericComp(e.target.value)}
                  placeholder="e.g. Amoxicillin 500mg + Clavulanic Acid 125mg"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    required
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="e.g. GlaxoSmithKline"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="PHARMA">PHARMA</option>
                    <option value="SURGICAL">SURGICAL</option>
                    <option value="FMCG">FMCG</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Drug Schedule</label>
                  <select
                    value={schedule}
                    onChange={(e: any) => setSchedule(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="SCHEDULE_H">Schedule H (Rx Only)</option>
                    <option value="SCHEDULE_H1">Schedule H1 (High Risk)</option>
                    <option value="OTC">OTC (Free Sale)</option>
                    <option value="NON_PHARMA">Non-Pharma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Pack Size</label>
                  <input
                    type="text"
                    required
                    value={packSize}
                    onChange={(e) => setPackSize(e.target.value)}
                    placeholder="e.g. 10 Tablets / Strip"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">UOM</label>
                  <input
                    type="text"
                    required
                    value={uom}
                    onChange={(e) => setUom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">HSN Code</label>
                  <input
                    type="text"
                    required
                    value={hsnCode}
                    onChange={(e) => setHSNCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">GST %</label>
                  <input
                    type="number"
                    required
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/20"
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
