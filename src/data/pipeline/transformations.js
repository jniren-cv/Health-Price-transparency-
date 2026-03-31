/**
 * PIPELINE STEP 1: Transformations
 * "Changing estimates"
 *
 * Normalizes raw rates from all sources into a standard shape,
 * flags statistical outliers, and applies cost-of-care adjustments.
 */

/**
 * Normalize a rate value.
 * - Rounds to 2 decimal places
 * - Returns null for zero / negative / non-numeric values
 */
export function normalizeRate(value) {
  const n = parseFloat(value);
  if (!isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

/**
 * Flag outliers in a set of rates using the IQR (Tukey) method.
 * Returns the same array with an `outlier: true` flag on extreme values.
 *
 * @param {Array<{ value: number }>} rates
 * @returns {Array<{ value: number, outlier: boolean }>}
 */
export function flagOutliers(rates) {
  if (rates.length < 4) return rates.map(r => ({ ...r, outlier: false }));
  const sorted = [...rates].map(r => r.value).sort((a, b) => a - b);
  const q1  = sorted[Math.floor(sorted.length * 0.25)];
  const q3  = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lo  = q1 - 1.5 * iqr;
  const hi  = q3 + 1.5 * iqr;
  return rates.map(r => ({ ...r, outlier: r.value < lo || r.value > hi }));
}

/**
 * Apply a geographic cost-of-care multiplier to a base rate.
 * Used when a source provides state-level rates without regional breakdowns.
 *
 * @param {number} baseRate
 * @param {number} multiplier  — from REGION_META[region].mul
 * @returns {number}
 */
export function applyRegionalMultiplier(baseRate, multiplier) {
  return Math.round(baseRate * multiplier * 100) / 100;
}

/**
 * Run all transformations on a flat array of raw rate records.
 *
 * @param {Array<{ value: number, [key: string]: any }>} rawRates
 * @returns {Array<{ value: number, outlier: boolean, [key: string]: any }>}
 */
export function transform(rawRates) {
  const normalized = rawRates
    .map(r => ({ ...r, value: normalizeRate(r.value) }))
    .filter(r => r.value !== null);
  return flagOutliers(normalized);
}
