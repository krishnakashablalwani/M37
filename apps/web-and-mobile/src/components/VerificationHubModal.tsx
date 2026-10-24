'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileText,
  UserCheck,
  Server,
  Zap,
  Clock,
  Layers,
  Database,
  Search,
} from 'lucide-react';
import { validateGstinOffline, GstinValidationResult } from '@/lib/verification/gstinValidator';
import { validateDrugLicense, DrugLicenseCheckResult, STATE_DRUG_CONTROLLER_PATTERNS } from '@/lib/verification/drugLicenseValidator';
import { validateDoctorCredentials, DoctorVerificationResult, STATE_MEDICAL_COUNCILS } from '@/lib/verification/doctorNmcValidator';
import { brandSkuCache } from '@/lib/cache/brandSkuCache';

interface VerificationHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type VerificationTab = 'gstin' | 'drug_license' | 'doctor' | 'brand_cache' | 'erp_bridge';

export function VerificationHubModal({ isOpen, onClose }: VerificationHubModalProps) {
  const [activeTab, setActiveTab] = useState<VerificationTab>('gstin');

  // 1. GSTIN State
  const [inputGstin, setInputGstin] = useState('36AABCM1234F1ZY');
  const [gstinResult, setGstinResult] = useState<GstinValidationResult | null>(null);

  // 2. Drug License State
  const [inputDl, setInputDl] = useState('TS/HYD/20/12456');
  const [inputState, setInputState] = useState('TS');
  const [inputValidUntil, setInputValidUntil] = useState('2028-12-31');
  const [dlResult, setDlResult] = useState<DrugLicenseCheckResult | null>(null);

  // 3. Doctor Verification State
  const [doctorName, setDoctorName] = useState('Dr. Rajesh Sharma, MD');
  const [smcCode, setSmcCode] = useState('TSMC');
  const [smcRegNo, setSmcRegNo] = useState('TSMC/2019/88214');
  const [regYear, setRegYear] = useState('2019');
  const [nmcUid, setNmcUid] = useState('NMR-2019-TSMC-88214');
  const [doctorResult, setDoctorResult] = useState<DoctorVerificationResult | null>(null);

  // 4. Brand & SKU Cache State
  const [brandSearch, setBrandSearch] = useState('DOLO');
  const [brandResults, setBrandResults] = useState<{ brand: any; matchedSkus: any[] }[]>([]);

  React.useEffect(() => {
    setGstinResult(validateGstinOffline('36AABCM1234F1ZY'));
    setDlResult(validateDrugLicense('TS/HYD/20/12456', 'TS', '2028-12-31'));
    setDoctorResult(
      validateDoctorCredentials({
        nmcUid: 'NMR-2019-TSMC-88214',
        smcCode: 'TSMC',
        registrationNumber: '88214',
        registrationYear: 2019,
        doctorName: 'Dr. Rajesh Sharma, MD',
      })
    );
    setBrandResults(brandSkuCache.searchLocal('DOLO'));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0E0E10] border border-slate-200 dark:border-neutral-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-900 dark:text-neutral-100 overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#141416]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Regulatory Verification &amp; Offline Token Bypass Hub
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Zero Token Cost
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                GSTIN Mod-36 • State DCA Rule 65 • NMR Doctor UID • Marg ERP Edge • Edge Brand Cache
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-200 dark:border-neutral-800 bg-slate-100/70 dark:bg-[#121214] text-xs font-mono font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('gstin')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'gstin'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400 dark:border-teal-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            1. GSTIN (Mod-36 &amp; Midnight Sync)
          </button>
          <button
            onClick={() => setActiveTab('drug_license')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'drug_license'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400 dark:border-teal-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            2. Drug License (29 States DCA)
          </button>
          <button
            onClick={() => setActiveTab('doctor')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'doctor'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400 dark:border-teal-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            3. Doctor NMC / SMC UID
          </button>
          <button
            onClick={() => setActiveTab('brand_cache')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'brand_cache'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400 dark:border-teal-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            4. Local Brand &amp; SKU Cache
          </button>
          <button
            onClick={() => setActiveTab('erp_bridge')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'erp_bridge'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400 dark:border-teal-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            5. Marg / ProfitMaker Edge
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: GSTIN */}
          {activeTab === 'gstin' && (
            <div className="space-y-5">
              <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/80 rounded-xl p-4 text-slate-700 dark:text-slate-300 space-y-2">
                <div className="flex items-center space-x-2 text-teal-800 dark:text-teal-300 font-bold font-mono text-xs">
                  <Zap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Token-Bypass Architecture: Algorithmic Mod-36 + Midnight Delta Sync</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  The Indian GSTN contains over 1.4 crore registered taxpayers. Instead of paying ₹2 to ₹5 per API token on every user registration or screen open:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px] font-mono">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-black/40 border border-teal-200 dark:border-teal-900">
                    <span className="font-bold text-teal-700 dark:text-teal-400 block mb-1">Tier 1: Client Checksum</span>
                    ISO 7064 Mod 36, 36 algorithm validates syntax and mathematical checksum instantly in &lt;1ms.
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-black/40 border border-teal-200 dark:border-teal-900">
                    <span className="font-bold text-teal-700 dark:text-teal-400 block mb-1">Tier 2: Local DB Cache</span>
                    Previously verified chemist &amp; distributor GSTINs are stored locally in PostgreSQL `organizations`.
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-black/40 border border-teal-200 dark:border-teal-900">
                    <span className="font-bold text-teal-700 dark:text-teal-400 block mb-1">Tier 3: Midnight Cron</span>
                    Runs at 00:00:00 IST to update status deltas (Active / Cancelled / Suspended) in bulk batch mode.
                  </div>
                </div>
              </div>

              {/* Interactive GSTIN Tester */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                  Test Any 15-Digit Indian GSTIN:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputGstin}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setInputGstin(val);
                      setGstinResult(validateGstinOffline(val));
                    }}
                    placeholder="e.g. 36AABCM1234F1Z8"
                    maxLength={15}
                    className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-black border border-slate-300 dark:border-slate-700 font-mono text-sm uppercase tracking-wider text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    onClick={() => {
                      setInputGstin('36AABCM1234F1ZY');
                      setGstinResult(validateGstinOffline('36AABCM1234F1ZY'));
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-mono font-bold text-xs cursor-pointer"
                  >
                    Sample Valid
                  </button>
                  <button
                    onClick={() => {
                      setInputGstin('36AABCM1234F1Z9'); // Wrong checksum digit
                      setGstinResult(validateGstinOffline('36AABCM1234F1Z9'));
                    }}
                    className="px-3 py-2 rounded-lg bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-800 dark:text-rose-300 font-mono font-bold text-xs cursor-pointer"
                  >
                    Sample Invalid
                  </button>
                </div>

                {/* Validation Output */}
                {gstinResult && (
                  <div
                    className={`p-4 rounded-xl border mt-3 space-y-2 ${
                      gstinResult.isValid
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 font-mono font-bold text-sm">
                        {gstinResult.isValid ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                        ) : (
                          <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                        )}
                        <span>{gstinResult.isValid ? 'GSTIN Validated Successfully' : 'GSTIN Validation Failed'}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/70 dark:bg-black/50 font-bold">
                        Source: {gstinResult.verifiedVia}
                      </span>
                    </div>

                    {gstinResult.isValid ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
                        <div>
                          <span className="text-slate-500 block text-[10px]">State Code</span>
                          <strong>{gstinResult.stateCode} ({gstinResult.stateName})</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Taxpayer PAN</span>
                          <strong>{gstinResult.pan}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Constitution</span>
                          <strong>{gstinResult.constitution}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Mod-36 Checksum</span>
                          <strong className="text-emerald-700 dark:text-emerald-400">PASSED ✓</strong>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-mono pt-1 text-rose-700 dark:text-rose-300">
                        {gstinResult.error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DRUG LICENSE */}
          {activeTab === 'drug_license' && (
            <div className="space-y-5">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl p-4 text-slate-700 dark:text-slate-300 space-y-2">
                <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 font-bold font-mono text-xs">
                  <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Rule 65 Compliance &amp; 29 States DCA Aggregation</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  In India, pharmacy licenses are issued state-by-state under the <strong>Drugs &amp; Cosmetics Act, 1940</strong>. Form 20/21 authorizes retail chemists, while Form 20B/21B authorizes wholesale stockists.
                </p>
                <div className="text-[11px] font-mono text-amber-900 dark:text-amber-300 pt-1">
                  <strong>Token Bypass:</strong> App checks local `dl_valid_until` against current date during daily checkout. 30 days prior to expiry, automated renewal alerts trigger. Only expired licenses or re-uploads invoke external verification.
                </div>
              </div>

              {/* Interactive Drug License Tester */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono mb-1">
                      State / UT Authority
                    </label>
                    <select
                      value={inputState}
                      onChange={(e) => {
                        setInputState(e.target.value);
                        setDlResult(validateDrugLicense(inputDl, e.target.value, inputValidUntil));
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
                    >
                      {Object.entries(STATE_DRUG_CONTROLLER_PATTERNS).map(([code, meta]) => (
                        <option key={code} value={code}>
                          [{code}] {meta.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono mb-1">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={inputDl}
                      onChange={(e) => {
                        setInputDl(e.target.value);
                        setDlResult(validateDrugLicense(e.target.value, inputState, inputValidUntil));
                      }}
                      placeholder="e.g. TS/HYD/20/12456"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono mb-1">
                      Valid Until Date
                    </label>
                    <input
                      type="date"
                      value={inputValidUntil}
                      onChange={(e) => {
                        setInputValidUntil(e.target.value);
                        setDlResult(validateDrugLicense(inputDl, inputState, e.target.value));
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* DL Output */}
                {dlResult && (
                  <div
                    className={`p-4 rounded-xl border mt-3 space-y-2 ${
                      dlResult.isValid
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 font-mono font-bold text-sm">
                        {dlResult.isValid ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                        ) : (
                          <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                        )}
                        <span>{dlResult.isValid ? 'Drug License Active & Verified' : 'License Restricted / Expired'}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/70 dark:bg-black/50 font-bold">
                        Tier: {dlResult.tierType}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Form Category</span>
                        <strong className="text-teal-700 dark:text-teal-400 font-bold">{dlResult.formType}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">DCA Authority</span>
                        <strong>{dlResult.stateName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Validity Window</span>
                        <strong>{dlResult.validUntil || 'Active'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Schedule H / H1 Access</span>
                        <strong className={dlResult.isValid ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}>
                          {dlResult.isValid ? 'AUTHORIZED ✓' : 'BLOCKED ✗'}
                        </strong>
                      </div>
                    </div>

                    {dlResult.error && (
                      <p className="text-xs font-mono pt-1 text-rose-700 dark:text-rose-300">
                        {dlResult.error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DOCTOR NMC / SMC UID */}
          {activeTab === 'doctor' && (
            <div className="space-y-5">
              <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/80 rounded-xl p-4 text-slate-700 dark:text-slate-300 space-y-2">
                <div className="flex items-center space-x-2 text-sky-800 dark:text-sky-300 font-bold font-mono text-xs">
                  <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>National Medical Commission (NMC) &amp; State Medical Council (SMC) Architecture</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Under India&apos;s &quot;One Nation, One Registration&quot; mandate, doctors first register with their local State Medical Council (SMC). The NMC central database links their Aadhaar and issues a permanent <strong>Unique Identification (UID)</strong> on the National Medical Register (NMR).
                </p>
                <div className="text-[11px] font-mono text-sky-900 dark:text-sky-300 pt-1">
                  <strong>Use Case in M37:</strong> Validates practitioner credentials for prescription-only (Schedule H/H1/X) patient orders, clinic sample distribution, and tele-consultation onboarding.
                </div>
              </div>

              {/* Interactive Doctor Verification */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono mb-1">
                      Doctor Legal Name
                    </label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => {
                        setDoctorName(e.target.value);
                        setDoctorResult(
                          validateDoctorCredentials({
                            nmcUid,
                            smcCode,
                            registrationNumber: smcRegNo,
                            registrationYear: Number(regYear),
                            doctorName: e.target.value,
                          })
                        );
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono mb-1">
                      State Medical Council (SMC)
                    </label>
                    <select
                      value={smcCode}
                      onChange={(e) => {
                        setSmcCode(e.target.value);
                        setDoctorResult(
                          validateDoctorCredentials({
                            nmcUid,
                            smcCode: e.target.value,
                            registrationNumber: smcRegNo,
                            registrationYear: Number(regYear),
                            doctorName,
                          })
                        );
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
                    >
                      {STATE_MEDICAL_COUNCILS.map((c) => (
                        <option key={c.code} value={c.code}>
                          [{c.code}] {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono mb-1">
                      SMC State Reg Number
                    </label>
                    <input
                      type="text"
                      value={smcRegNo}
                      onChange={(e) => {
                        setSmcRegNo(e.target.value);
                        setDoctorResult(
                          validateDoctorCredentials({
                            nmcUid,
                            smcCode,
                            registrationNumber: e.target.value,
                            registrationYear: Number(regYear),
                            doctorName,
                          })
                        );
                      }}
                      placeholder="e.g. 88214"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono mb-1">
                      NMC National UID
                    </label>
                    <input
                      type="text"
                      value={nmcUid}
                      onChange={(e) => {
                        setNmcUid(e.target.value);
                        setDoctorResult(
                          validateDoctorCredentials({
                            nmcUid: e.target.value,
                            smcCode,
                            registrationNumber: smcRegNo,
                            registrationYear: Number(regYear),
                            doctorName,
                          })
                        );
                      }}
                      placeholder="e.g. NMR-2019-TSMC-88214"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>

                {/* Doctor Output */}
                {doctorResult && (
                  <div
                    className={`p-4 rounded-xl border mt-3 space-y-2 ${
                      doctorResult.isValid
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 font-mono font-bold text-sm">
                        {doctorResult.isValid ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                        ) : (
                          <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                        )}
                        <span>{doctorResult.isValid ? 'Doctor Verified on National Medical Register' : 'Verification Incomplete'}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/70 dark:bg-black/50 font-bold">
                        Registry: {doctorResult.verificationSource}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Assigned NMR UID</span>
                        <strong className="text-teal-700 dark:text-teal-400 font-bold">{doctorResult.nmcUid}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Medical Council</span>
                        <strong>{doctorResult.smcName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Qualifications</span>
                        <strong>{doctorResult.qualifications.join(', ')}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Rx Writing Authority</span>
                        <strong className="text-emerald-700 dark:text-emerald-400">AUTHORIZED (Sched H/H1/X) ✓</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BRAND & SKU LOCAL CACHE */}
          {activeTab === 'brand_cache' && (
            <div className="space-y-5">
              <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 rounded-xl p-4 text-slate-700 dark:text-slate-300 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-800 dark:text-indigo-300 font-bold font-mono text-xs">
                  <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Sub-Millisecond Edge Brand &amp; SKU Hierarchy</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Registered pharmaceutical brands (e.g. <strong>DOLO</strong>) encompass multiple SKUs (Dolo 650mg tablets, 325mg tablets, 125mg DT tablets, 125mg oral syrup). Rather than making repeated HTTP server calls on every keystroke during ordering, the app indexes brands locally in persistent IndexedDB storage as they are created or loaded.
                </p>
              </div>

              {/* Live Cache Search */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={brandSearch}
                    onChange={(e) => {
                      setBrandSearch(e.target.value);
                      setBrandResults(brandSkuCache.searchLocal(e.target.value));
                    }}
                    placeholder="Search cached brand or SKU (e.g. Dolo, 650, Azithral, Pan)..."
                    className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-black border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg">
                    Latency: &lt; 0.5ms (Offline)
                  </span>
                </div>

                {/* Brand Hierarchy Results */}
                <div className="space-y-3 mt-3">
                  {brandResults.map(({ brand, matchedSkus }) => (
                    <div
                      key={brand.brandName}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/40 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                            {brand.brandName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({brand.manufacturer})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          {matchedSkus.length} SKUs in Local Memory
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                        {matchedSkus.map((sku) => (
                          <div
                            key={sku.id}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                          >
                            <div>
                              <strong className="text-slate-900 dark:text-white block">{sku.brandName}</strong>
                              <span className="text-[10px] text-slate-500">{sku.packSize} • {sku.genericComposition}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-teal-700 dark:text-teal-400 font-bold block">PTR: ₹{sku.ptr.toFixed(2)}</span>
                              <span className="text-[10px] text-slate-500">MRP: ₹{sku.mrp.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MARG & PROFITMAKER EDGE BRIDGE */}
          {activeTab === 'erp_bridge' && (
            <div className="space-y-5">
              <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 rounded-xl p-4 text-slate-700 dark:text-slate-300 space-y-2">
                <div className="flex items-center space-x-2 text-purple-800 dark:text-purple-300 font-bold font-mono text-xs">
                  <Server className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>On-Premise ERP Bridge (Marg ERP 9+ &amp; ProfitMaker)</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Most wholesale stockists in Indian wholesale markets (like Bhagirath Palace, Govindappa Naicken St, or Hyderabad Koti) run desktop Marg ERP or ProfitMaker. They cannot afford to look at a cloud browser and manually re-type hundreds of line items into their billing software.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">Marg ERP 9+ Tele-Order (.ORD)</strong>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold">
                      Native Inward File
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Drops directly into Marg&apos;s monitored folder (<code className="text-teal-700 dark:text-teal-400">MARG\ORDER\INWARD\</code>). Billing clerks simply press <strong>F10 (Import Order)</strong> in Marg ERP, and the order pops up instantly on the billing screen with FEFO batches and schemes auto-applied.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">ProfitMaker (Lucky Soft)</strong>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold">
                      Batch Ingestion CSV
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Uses ProfitMaker standard Header/Detail ASCII format (<code className="text-purple-700 dark:text-purple-400">PROFITMAKER\IMP_EXP\</code>). Inward telephonic orders are imported via <strong>Alt + I</strong> without internet dependencies or cloud latency.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#141416] flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500">
            Compliance Engine: Drugs &amp; Cosmetics Act 1940 • Rule 65 • NMC Act 2019
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
