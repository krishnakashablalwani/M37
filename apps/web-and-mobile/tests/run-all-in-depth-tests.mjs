process.env.RUN_AS_SUITE = 'true';

import { runDatabaseAndFefoTests } from './db-and-fefo-integrity.test.mjs';
import { runApiIntegrationTests } from './api-integration.test.mjs';
import { runPharmaRegulatoryTests } from './pharma-regulatory-rules.test.mjs';

async function main() {
  const startTime = Date.now();

  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║        PharmaSync B2B — Master In-Depth Automated Test Suite             ║');
  console.log('║       End-to-End Database, Regulatory Compliance & Workflow Audit        ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝');

  const results = [];

  // Suite 1
  try {
    const s1Start = Date.now();
    const s1Res = await runDatabaseAndFefoTests();
    results.push({
      name: 'Suite 1: PostgreSQL Schema & Atomic FEFO Database Integrity',
      passed: true,
      tests: s1Res.count,
      durationMs: Date.now() - s1Start,
    });
  } catch (err) {
    results.push({
      name: 'Suite 1: PostgreSQL Schema & Atomic FEFO Database Integrity',
      passed: false,
      error: err.message,
    });
  }

  // Suite 2
  try {
    const s2Start = Date.now();
    const s2Res = await runApiIntegrationTests();
    results.push({
      name: 'Suite 2: End-to-End HTTP API & Workflow Integration',
      passed: true,
      tests: s2Res.count,
      durationMs: Date.now() - s2Start,
    });
  } catch (err) {
    results.push({
      name: 'Suite 2: End-to-End HTTP API & Workflow Integration',
      passed: false,
      error: err.message,
    });
  }

  // Suite 3
  try {
    const s3Start = Date.now();
    const s3Res = await runPharmaRegulatoryTests();
    results.push({
      name: 'Suite 3: Pharma Regulatory Rules, GST & Replenishment Math',
      passed: true,
      tests: s3Res.count,
      durationMs: Date.now() - s3Start,
    });
  } catch (err) {
    results.push({
      name: 'Suite 3: Pharma Regulatory Rules, GST & Replenishment Math',
      passed: false,
      error: err.message,
    });
  }

  // Summary Report
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalTests = results.reduce((sum, r) => sum + (r.tests || 0), 0);
  const allPassed = results.every((r) => r.passed);

  console.log('\n\n╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                          EXECUTIVE TEST REPORT                           ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════╣');

  for (const r of results) {
    const statusMark = r.passed ? '✓ PASSED' : '✗ FAILED';
    const detail = r.passed ? `${r.tests} tests (${r.durationMs}ms)` : `ERROR: ${r.error}`;
    console.log(`║ [${statusMark}] ${r.name.padEnd(58)} ║`);
    console.log(`║          └─ ${detail.padEnd(60)} ║`);
  }

  console.log('╠══════════════════════════════════════════════════════════════════════════╣');
  console.log(`║ Total Verification Checks: ${String(totalTests).padEnd(5)} | Total Duration: ${totalDuration}s${' '.repeat(16)}║`);
  console.log(`║ Overall Platform Verdict:   ${allPassed ? 'ALL SYSTEMS OPERATIONAL & COMPLIANT' : 'FAILURES DETECTED'}${' '.repeat(allPassed ? 7 : 24)}║`);
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  if (!allPassed) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Fatal test runner failure:', e);
  process.exit(1);
});
