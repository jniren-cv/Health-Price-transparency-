/**
 * SOURCE: Reference Data
 *
 * External benchmark datasets used to contextualize negotiated rates:
 *   - FAIR Health benchmarks (commercial claims percentiles by region)
 *   - Turquoise Health market rate data
 *   - CMS cost reports (hospital-level cost-to-charge ratios)
 *
 * Status: PENDING — no reference data loaded.
 * To activate: integrate one or more benchmark APIs/exports and
 * map to { cptCode, region, p25, p50, p75, p90, source, asOf }.
 */

export const SOURCE_META = {
  id:          'references',
  name:        'External Reference Benchmarks',
  type:        'References',
  status:      'pending',
  lastUpdated: null,
  providers:   [],
  notes:       'FAIR Health / Turquoise / CMS benchmarks. Activate by integrating benchmark data API.',
};

/** @type {Array<{ cptCode: string, region: string, p25: number, p50: number, p75: number, p90: number, source: string }>} */
export const BENCHMARKS = [];
