/**
 * Unified Data API
 *
 * Orchestrates the two-layer pipeline:
 *
 *   Layer 01  Sources      → payerMRF · hospitalMRF · claims · medicare · references · contracts
 *   Layer 02  Clear Rates  → transformations → calculations → bestRates → referenceData → accuracyTable
 *
 * Exports a stable API consumed by all pages.
 * Adding a new source only requires updating src/data/sources/index.js.
 */

// ── Layer 01: Sources ─────────────────────────────────────────────────────────
export { PLANS, CPT_CODES, REGIONS, REGION_META, ALL_SOURCES, ACTIVE_SOURCES } from './sources/index.js';
import { ALL_PROVIDERS, PLANS, CPT_CODES, REGIONS, REGION_META } from './sources/index.js';

// ── Layer 02: Pipeline ────────────────────────────────────────────────────────
import { transform }        from './pipeline/transformations.js';
import { calcPercentiles }  from './pipeline/calculations.js';
import { applyBestRates }   from './pipeline/bestRates.js';

// Run pipeline once at module load (deterministic — safe to do at import time)
const _processed = applyBestRates(ALL_PROVIDERS);

/** All providers after pipeline processing. */
export const PROVIDERS = _processed;

// ── Derived lookups ───────────────────────────────────────────────────────────
export const CPT_CATEGORIES = [...new Set(CPT_CODES.map(c => c.category))];
export const SPECIALTIES    = [...new Set(CPT_CODES.map(c => c.specialty))];
export const cptByCode      = Object.fromEntries(CPT_CODES.map(c => [c.code, c]));

// ── Analytics API ─────────────────────────────────────────────────────────────

/** All rate values for a given plan + CPT code, optionally filtered by region. */
export function getRates(planId, code, region = null) {
  return PROVIDERS
    .filter(p => !region || p.region === region)
    .map(p => p.bestRates[planId]?.[code])
    .filter(v => v != null);
}

/** Average negotiated rate per region for a given plan + CPT code. */
export function getRegionAverages(planId, code) {
  return REGIONS.map(region => {
    const vals = getRates(planId, code, region);
    const avg  = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return {
      region,
      avg:   round2(avg),
      min:   vals.length ? Math.min(...vals) : 0,
      max:   vals.length ? Math.max(...vals) : 0,
      count: vals.length,
    };
  });
}

/** P25 / P50 / P75 / P90 for a given plan + CPT code (optionally regional). */
export function getPercentiles(planId, code, region = null) {
  const values = getRates(planId, code, region);
  const { p25, p50, p75, p90 } = calcPercentiles(values);
  return { p25, p50, p75, p90 };
}

/** Rate spread (P75–P25) for each CPT code — measures negotiation variability. */
export function getRateSpread(planId, region = null) {
  return CPT_CODES.map(cpt => {
    const values = getRates(planId, cpt.code, region);
    const stats  = calcPercentiles(values);
    return { ...cpt, ...stats };
  }).filter(c => c.p50 > 0);
}

/**
 * Generic query engine for the Query Builder page.
 * Returns array of { label, fullLabel, value }.
 */
export function runQuery({ groupBy, metric, planId, filterCode, filterCategory, filterRegion }) {
  const PROVIDER_TYPES = ['Hospital', 'Medical Group', 'Outpatient Center', 'Specialty Clinic'];
  let items;

  if (groupBy === 'region') {
    items = REGIONS.map(region => {
      const codes = filterCode
        ? [CPT_CODES.find(c => c.code === filterCode)].filter(Boolean)
        : CPT_CODES.filter(c => !filterCategory || c.category === filterCategory);
      const vals  = codes.flatMap(c => getRates(planId, c.code, region));
      return { label: region, vals };
    });
  } else if (groupBy === 'cpt') {
    const codes = filterCategory ? CPT_CODES.filter(c => c.category === filterCategory) : CPT_CODES;
    items = codes.map(cpt => {
      const vals = getRates(planId, cpt.code, filterRegion || null);
      return { label: `${cpt.code} – ${cpt.name}`, shortLabel: cpt.code, vals };
    });
  } else if (groupBy === 'category') {
    items = CPT_CATEGORIES.map(cat => {
      const codes = CPT_CODES.filter(c => c.category === cat);
      const vals  = codes.flatMap(c => getRates(planId, c.code, filterRegion || null));
      return { label: cat, vals };
    });
  } else if (groupBy === 'specialty') {
    items = SPECIALTIES.map(sp => {
      const codes = CPT_CODES.filter(c => c.specialty === sp);
      const vals  = codes.flatMap(c => getRates(planId, c.code, filterRegion || null));
      return { label: sp, vals };
    });
  } else if (groupBy === 'providerType') {
    items = PROVIDER_TYPES.map(type => {
      const vals = PROVIDERS
        .filter(p => p.type === type && (!filterRegion || p.region === filterRegion))
        .flatMap(p => {
          const codes = filterCode
            ? [filterCode]
            : filterCategory
              ? CPT_CODES.filter(c => c.category === filterCategory).map(c => c.code)
              : CPT_CODES.map(c => c.code);
          return codes.map(code => p.bestRates[planId]?.[code]).filter(v => v != null);
        });
      return { label: type, vals };
    });
  }

  const applyMetric = (vals) => {
    if (!vals.length) return 0;
    const sorted = [...vals].sort((a, b) => a - b);
    if (metric === 'avg')   return round2(vals.reduce((a, b) => a + b, 0) / vals.length);
    if (metric === 'min')   return round2(Math.min(...vals));
    if (metric === 'max')   return round2(Math.max(...vals));
    if (metric === 'p50')   return round2(sorted[Math.floor(sorted.length * 0.5)]);
    if (metric === 'p75')   return round2(sorted[Math.floor(sorted.length * 0.75)]);
    if (metric === 'count') return vals.length;
    return round2(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  return (items || [])
    .map(it => ({ label: it.shortLabel || it.label, fullLabel: it.label, value: applyMetric(it.vals) }))
    .filter(it => it.value > 0);
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatCurrency(val, compact = false) {
  if (val == null) return '—';
  if (compact && val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDelta(val) {
  if (val == null) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${formatCurrency(val)}`;
}

function round2(v) { return Math.round(v * 100) / 100; }
