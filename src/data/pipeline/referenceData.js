/**
 * PIPELINE STEP 4: Reference Data
 * "Verifying other sources"
 *
 * Cross-references negotiated rates against external benchmarks
 * (Medicare, FAIR Health, Turquoise) to surface anomalies and
 * compute rate-to-reference ratios.
 */

import { RATES as medicareRates } from '../sources/medicare.js';
import { BENCHMARKS }             from '../sources/references.js';

/**
 * Compute the ratio of a negotiated rate to Medicare for a given CPT code.
 * Returns null if Medicare reference is unavailable.
 *
 * @param {string} cptCode
 * @param {number} negotiatedRate
 * @returns {{ ratio: number, medicareRate: number } | null}
 */
export function medicareRatio(cptCode, negotiatedRate) {
  const ref = medicareRates[cptCode];
  if (!ref || ref <= 0) return null;
  return {
    medicareRate: ref,
    ratio:        Math.round((negotiatedRate / ref) * 100) / 100,
  };
}

/**
 * Find the external benchmark percentile position for a given rate.
 * Returns null if no benchmark data is available for this code + region.
 *
 * @param {string} cptCode
 * @param {string} region
 * @param {number} rate
 * @returns {{ position: 'below_p25'|'p25-p50'|'p50-p75'|'above_p75', benchmark: object } | null}
 */
export function benchmarkPosition(cptCode, region, rate) {
  const bm = BENCHMARKS.find(b => b.cptCode === cptCode && b.region === region);
  if (!bm) return null;

  let position;
  if (rate < bm.p25)      position = 'below_p25';
  else if (rate < bm.p50) position = 'p25-p50';
  else if (rate < bm.p75) position = 'p50-p75';
  else                    position = 'above_p75';

  return { position, benchmark: bm };
}

/**
 * Generate a verification summary for a provider's rates.
 * Currently returns empty verifications (no reference sources active).
 * Populates automatically when medicare.js or references.js are activated.
 *
 * @param {object} provider
 * @param {string} planId
 */
export function verifyProviderRates(provider, planId) {
  const verifications = [];
  const planRates = provider.rates?.[planId] ?? {};

  for (const [cptCode, rate] of Object.entries(planRates)) {
    const medicare = medicareRatio(cptCode, rate);
    if (medicare) {
      verifications.push({
        cptCode,
        type:   'medicare_ratio',
        ratio:  medicare.ratio,
        flag:   medicare.ratio > 3.0 ? 'high' : medicare.ratio < 0.8 ? 'low' : 'normal',
      });
    }
  }

  return verifications;
}
