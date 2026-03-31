/**
 * PIPELINE STEP 2: Calculations
 * "Calculating Best Rates"
 *
 * Computes statistical summaries — percentiles, averages, spreads —
 * from the transformed rate pool.
 */

function round2(v) { return Math.round(v * 100) / 100; }

/**
 * Compute a single percentile from a sorted array.
 * Uses linear interpolation (same as NumPy 'linear' method).
 *
 * @param {number[]} sorted  — ascending order
 * @param {number}   p       — 0–100
 */
export function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo  = Math.floor(idx);
  const hi  = Math.ceil(idx);
  return round2(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
}

/**
 * Full percentile summary for an array of values.
 * Excludes flagged outliers by default.
 *
 * @param {number[]} values
 * @param {{ excludeOutliers?: boolean }} opts
 */
export function calcPercentiles(values, { excludeOutliers = false, outlierFlags = [] } = {}) {
  let filtered = excludeOutliers
    ? values.filter((_, i) => !outlierFlags[i])
    : values;
  const sorted = [...filtered].sort((a, b) => a - b);
  return {
    count: sorted.length,
    min:   sorted[0]           ?? 0,
    p25:   percentile(sorted, 25),
    p50:   percentile(sorted, 50),
    p75:   percentile(sorted, 75),
    p90:   percentile(sorted, 90),
    max:   sorted[sorted.length - 1] ?? 0,
    avg:   sorted.length ? round2(sorted.reduce((a, b) => a + b, 0) / sorted.length) : 0,
    spread:     round2(percentile(sorted, 75) - percentile(sorted, 25)),
    spreadPct:  percentile(sorted, 50) > 0
      ? round2((percentile(sorted, 75) - percentile(sorted, 25)) / percentile(sorted, 50) * 100)
      : 0,
  };
}

/**
 * Weighted average — used when combining rates from sources
 * with different confidence weights.
 *
 * @param {Array<{ value: number, weight: number }>} weightedRates
 */
export function weightedAverage(weightedRates) {
  const totalWeight = weightedRates.reduce((s, r) => s + r.weight, 0);
  if (!totalWeight) return 0;
  return round2(weightedRates.reduce((s, r) => s + r.value * r.weight, 0) / totalWeight);
}

/**
 * Build a histogram from a flat array of values.
 *
 * @param {number[]} values
 * @param {number}   buckets  — number of equal-width bins
 * @returns {Array<{ label: string, min: number, max: number, count: number }>}
 */
export function histogram(values, buckets = 10) {
  if (!values.length) return [];
  const min    = Math.min(...values);
  const max    = Math.max(...values);
  const width  = (max - min) / buckets || 1;
  const bins   = Array.from({ length: buckets }, (_, i) => ({
    label: `$${round2(min + i * width)}–$${round2(min + (i + 1) * width)}`,
    min:   round2(min + i * width),
    max:   round2(min + (i + 1) * width),
    count: 0,
  }));
  for (const v of values) {
    const i = Math.min(Math.floor((v - min) / width), buckets - 1);
    bins[i].count++;
  }
  return bins;
}
