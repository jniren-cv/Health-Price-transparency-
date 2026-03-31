/**
 * PIPELINE STEP 5: Accuracy Table
 * "Determining Accuracy"
 *
 * Scores each rate's confidence based on:
 *   - Source reliability (contracts > MRF > claims > benchmarks)
 *   - Data freshness (recency of the source file)
 *   - Cross-source consistency (agreement across multiple sources)
 *   - Outlier flags from the Transformations step
 */

/** Base confidence score by source (0–100). */
const SOURCE_CONFIDENCE = {
  contracts:    95,
  payer_mrf:    85,
  hospital_mrf: 80,
  claims:       70,
  medicare:     90,   // highly reliable reference, but not a negotiated rate
  references:   60,
};

/** Staleness penalty: points deducted per year the data is old. */
const STALENESS_PENALTY_PER_YEAR = 8;

/**
 * Compute a confidence score (0–100) for a single rate record.
 *
 * @param {{
 *   source:      string,
 *   asOf:        string | null,   ISO date
 *   outlier:     boolean,
 *   crossSourceDelta?: number     0–1, fractional deviation vs. other sources
 * }} record
 * @returns {number}  0–100
 */
export function scoreAccuracy(record) {
  let score = SOURCE_CONFIDENCE[record.source] ?? 50;

  // Staleness penalty
  if (record.asOf) {
    const ageYears = (Date.now() - new Date(record.asOf).getTime()) / (1000 * 60 * 60 * 24 * 365);
    score -= Math.round(ageYears * STALENESS_PENALTY_PER_YEAR);
  }

  // Outlier penalty
  if (record.outlier) score -= 20;

  // Cross-source consistency bonus/penalty
  if (record.crossSourceDelta != null) {
    if (record.crossSourceDelta < 0.05)       score += 5;   // very consistent
    else if (record.crossSourceDelta > 0.25)  score -= 10;  // diverges from other sources
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Classify a confidence score into a human-readable tier.
 *
 * @param {number} score
 * @returns {{ label: string, color: string }}
 */
export function confidenceTier(score) {
  if (score >= 80) return { label: 'High',   color: '#059669' };
  if (score >= 60) return { label: 'Medium', color: '#d97706' };
  return               { label: 'Low',    color: '#dc2626' };
}

/**
 * Build an accuracy summary table for a set of rate records.
 * Returns one row per CPT code with the highest-confidence rate and its tier.
 *
 * @param {Array<{ cptCode: string, value: number, source: string, outlier: boolean, asOf: string | null }>} records
 * @returns {Array<{ cptCode: string, bestValue: number, score: number, tier: object, source: string }>}
 */
export function buildAccuracyTable(records) {
  const byCode = records.reduce((acc, r) => {
    acc[r.cptCode] = acc[r.cptCode] ?? [];
    acc[r.cptCode].push({ ...r, score: scoreAccuracy(r) });
    return acc;
  }, {});

  return Object.entries(byCode).map(([cptCode, recs]) => {
    const best = recs.slice().sort((a, b) => b.score - a.score)[0];
    return {
      cptCode,
      bestValue: best.value,
      score:     best.score,
      tier:      confidenceTier(best.score),
      source:    best.source,
    };
  });
}
