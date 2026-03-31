/**
 * PIPELINE STEP 3: Best Rates
 * "Generating Best Rates"
 *
 * Given rates from multiple sources for the same CPT code + provider,
 * selects or blends the most authoritative value.
 *
 * Source priority (highest → lowest):
 *   1. Contracts       — direct contract, highest fidelity
 *   2. Payer MRF       — CMS-mandated published rate
 *   3. Hospital MRF    — CMS-mandated chargemaster
 *   4. Claims          — actual paid amount (may differ from contracted)
 *   5. Medicare        — reference floor
 *   6. References      — external benchmarks (FAIR Health etc.)
 */

const SOURCE_PRIORITY = [
  'contracts',
  'payer_mrf',
  'hospital_mrf',
  'claims',
  'medicare',
  'references',
];

/**
 * Resolve the single "best" rate from a set of source-tagged values.
 *
 * @param {Array<{ value: number, source: string, confidence: number }>} candidates
 * @returns {{ value: number, source: string, confidence: number } | null}
 */
export function resolveBestRate(candidates) {
  if (!candidates.length) return null;

  // If a higher-priority source is available, use it directly
  for (const sourceId of SOURCE_PRIORITY) {
    const match = candidates.filter(c => c.source === sourceId);
    if (match.length === 1) return match[0];
    if (match.length > 1) {
      // Multiple records from same source — use median
      const sorted = [...match].sort((a, b) => a.value - b.value);
      return sorted[Math.floor(sorted.length / 2)];
    }
  }

  // Fallback: return highest-confidence candidate
  return candidates.slice().sort((a, b) => b.confidence - a.confidence)[0];
}

/**
 * Build a best-rate map for all providers × CPT codes.
 * Currently passes through Payer MRF rates (only active source).
 * When additional sources are active, this function merges them.
 *
 * @param {import('../sources/index.js').ALL_PROVIDERS} providers
 * @returns {typeof providers}  — providers with a resolved `bestRate` per CPT
 */
export function applyBestRates(providers) {
  return providers.map(p => ({
    ...p,
    // `bestRates` will hold the resolved rate per planId → cptCode
    // For now: mirrors `rates` (single source). Multi-source merge happens here.
    bestRates: p.rates,
  }));
}
