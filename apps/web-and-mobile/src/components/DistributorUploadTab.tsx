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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-900 dark:text-slate-100">
      {/* Tab Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            Distributor Ingestion Engine
          </span>
          <span className="text-xs text-slate-500 font-mono">FR-2.3 Bulk CSV Parser</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">Bulk Stock &amp; Batch Ingestion Workstation</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Distributors upload daily batch stock sheets via CSV/Excel. The staging parser validates SKUs against the canonical Master Catalog, verifies pricing guardrails, and isolates invalid rows with detailed error reporting.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input & Upload Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
            {/* Distributor Selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">
                Fulfilling Distributor Organization
              </label>
              <select
                value={selectedDistributorId}
                onChange={(e) => setSelectedDistributorId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-300 dark:border-neutral-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-600"
              >
                {distributors
                  .filter((d) => d.org_type === 'DISTRIBUTOR')
                  .map((d) => (
                    <option key={d.id} value={d.id} className="bg-white dark:bg-[#121212] text-slate-900 dark:text-white">
                      {d.trade_name} ({d.city} - Lic: {d.drug_license_no_20 || 'Approved'})
                    </option>
                  ))}
              </select>
            </div>

            {/* CSV Editor / Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
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
                  className="text-[11px] text-teal-700 dark:text-teal-400 hover:underline flex items-center space-x-1 cursor-pointer font-bold"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Reset Demo CSV</span>
                </button>
              </div>

              <textarea
                rows={10}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-600 leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Action Bar */}
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500">
                Notice: row 4 intentionally tests an unmapped SKU to demonstrate validation error reporting.
              </span>

              <button
                onClick={handleUpload}
                disabled={loading}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <span>Processing CSV...</span>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Validate &amp; Ingest Stock</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Validation & Staging Report */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Ingestion Staging Summary</h3>

            {result ? (
              <div className="space-y-4 text-xs font-mono">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 dark:bg-[#121212] p-2.5 rounded-lg border border-slate-200 dark:border-neutral-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Total Rows</span>
                    <strong className="text-slate-900 dark:text-white text-base">{result.processed || 0}</strong>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block uppercase font-sans font-bold">Upserted</span>
                    <strong className="text-emerald-700 dark:text-emerald-400 text-base">{result.success_count || 0}</strong>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
                    <span className="text-[10px] text-rose-800 dark:text-rose-300 block uppercase font-sans font-bold">Failed</span>
                    <strong className="text-rose-700 dark:text-rose-400 text-base">{result.failed_count || 0}</strong>
                  </div>
                </div>

                {/* Errors Section */}
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center space-x-1 text-rose-700 dark:text-rose-400 font-bold mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Validation Failures ({result.errors.length})</span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {result.errors.map((err: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-2.5 text-[11px] text-rose-800 dark:text-rose-200"
                        >
                          <div className="font-bold flex justify-between">
                            <span>Row {err.rowIndex}: {err.sku_code}</span>
                            <span className="text-rose-600 dark:text-rose-400 font-mono text-[10px]">FAILED</span>
                          </div>
                          <p className="text-rose-600 dark:text-rose-300 mt-1 font-sans">{err.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Batches */}
                {result.batches && result.batches.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 font-bold mb-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Live Stock Updated</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Successfully updated {result.batches.length} batch records in the active catalog. These are now live in the marketplace search and comparison drawer!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                <FileText className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <span>Upload a CSV to view row validation and ingestion audit results.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
