'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, AlertCircle, Building2, RefreshCw } from 'lucide-react';
import { Organization } from '@/types';

interface DistributorUploadTabProps {
  currentOrg: Organization | null;
  distributors: Organization[];
}

export function DistributorUploadTab({
  currentOrg,
  distributors,
}: DistributorUploadTabProps) {
  // If current persona is not a distributor, pick the first distributor by default
  const defaultDistributorId =
    currentOrg?.org_type === 'DISTRIBUTOR'
      ? currentOrg.id
      : distributors.find((d) => d.org_type === 'DISTRIBUTOR')?.id || '';

  const [selectedDistributorId, setSelectedDistributorId] = useState(defaultDistributorId);
  const [csvContent, setCsvContent] = useState(`sku_code,batch_number,expiry_date,mrp,ptr,discount_pct,scheme_description,scheme_base_qty,scheme_free_qty,moq,available_qty
MED-DOLO-650,DL24B02,2027-08-31,34.15,24.10,5.0,Buy 10 Get 1 Free,10,1,5,300
MED-CALPOL-650,CP24-10,2026-12-31,34.15,24.50,3.0,Flat 3% Cash Discount,0,0,5,150
MED-AZITH-500,AZ-SEP-26,2026-10-31,125.0,88.50,4.0,Buy 20 Get 2 Free,20,2,2,120
UNKNOWN-SKU-999,ERR-BATCH,2027-01-01,100.0,75.0,0.0,,0,0,1,50`);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleUpload = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Parse CSV into array of objects
      const lines = csvContent
        .trim()
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        throw new Error('CSV must contain header row and at least one data row.');
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim());
        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        return rowObj;
      });

      const res = await fetch('/api/catalog/bulk-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distributor_id: selectedDistributorId,
          rows,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Bulk upload failed');
      }

      setResult(data);
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      {/* Tab Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Distributor Ingestion Engine
          </span>
          <span className="text-xs text-slate-400 font-mono">FR-2.3 Bulk CSV Parser</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white mt-1">Bulk Stock & Batch Ingestion Workstation</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Distributors upload daily batch stock sheets via CSV/Excel. The staging parser validates SKUs against the canonical Master Catalog, verifies pricing guardrails, and isolates invalid rows with detailed error reporting.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input & Upload Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            {/* Distributor Selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Fulfilling Distributor Organization
              </label>
              <select
                value={selectedDistributorId}
                onChange={(e) => setSelectedDistributorId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {distributors
                  .filter((d) => d.org_type === 'DISTRIBUTOR')
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.trade_name} ({d.city} - Lic: {d.drug_license_no_20 || 'Approved'})
                    </option>
                  ))}
              </select>
            </div>

            {/* CSV Editor / Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  <span>CSV Stock Data (Paste or Edit Live)</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setCsvContent(`sku_code,batch_number,expiry_date,mrp,ptr,discount_pct,scheme_description,scheme_base_qty,scheme_free_qty,moq,available_qty
MED-DOLO-650,DL24B02,2027-08-31,34.15,24.10,5.0,Buy 10 Get 1 Free,10,1,5,300
MED-CALPOL-650,CP24-10,2026-12-31,34.15,24.50,3.0,Flat 3% Cash Discount,0,0,5,150
MED-AZITH-500,AZ-SEP-26,2026-10-31,125.0,88.50,4.0,Buy 20 Get 2 Free,20,2,2,120
UNKNOWN-SKU-999,ERR-BATCH,2027-01-01,100.0,75.0,0.0,,0,0,1,50`)
                  }
                  className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Reset Demo CSV</span>
                </button>
              </div>

              <textarea
                rows={10}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-400 leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Action Bar */}
            <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-500">
                Notice: row 4 intentionally tests an unmapped SKU to demonstrate validation error reporting.
              </span>

              <button
                onClick={handleUpload}
                disabled={loading}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all active:scale-95"
              >
                {loading ? (
                  <span>Processing CSV...</span>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Validate & Ingest Stock</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Validation & Staging Report */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-2">Ingestion Staging Summary</h3>

            {result ? (
              <div className="space-y-4 text-xs">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Total Rows</span>
                    <strong className="text-white font-mono text-sm">{result.processed || 0}</strong>
                  </div>
                  <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-400 block uppercase">Upserted</span>
                    <strong className="text-emerald-400 font-mono text-sm">{result.success_count || 0}</strong>
                  </div>
                  <div className="bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                    <span className="text-[10px] text-rose-400 block uppercase">Failed</span>
                    <strong className="text-rose-400 font-mono text-sm">{result.failed_count || 0}</strong>
                  </div>
                </div>

                {/* Errors Section (if any failed rows) */}
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center space-x-1 text-rose-400 font-bold mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Isolated Validation Failures ({result.errors.length})</span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {result.errors.map((err: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 text-[11px] text-rose-200"
                        >
                          <div className="font-bold flex justify-between">
                            <span>Row {err.rowIndex}: {err.sku_code}</span>
                            <span className="text-rose-400 font-mono text-[10px]">FAILED</span>
                          </div>
                          <p className="text-rose-300 mt-1">{err.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Batches */}
                {result.batches && result.batches.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center space-x-1 text-emerald-400 font-bold mb-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Live Stock Updated</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Successfully updated {result.batches.length} batch records in the active catalog. These are now live in the marketplace search and comparison drawer!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                <FileText className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                <span>Upload a CSV to view row validation and ingestion audit results.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
