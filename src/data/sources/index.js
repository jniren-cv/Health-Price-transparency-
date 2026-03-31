/**
 * Source Registry
 *
 * All pricing data sources in Layer 01.
 * Add new sources here — the pipeline picks them up automatically.
 */

import { SOURCE_META as payerMRFMeta, PROVIDERS as payerProviders, PLANS, CPT_CODES, REGIONS, REGION_META } from './payerMRF.js';
import { SOURCE_META as hospitalMRFMeta, PROVIDERS as hospitalProviders } from './hospitalMRF.js';
import { SOURCE_META as claimsMeta }     from './claims.js';
import { SOURCE_META as medicareMeta }   from './medicare.js';
import { SOURCE_META as referencesMeta } from './references.js';
import { SOURCE_META as contractsMeta }  from './contracts.js';

/** Ordered list of all data sources with their metadata. */
export const ALL_SOURCES = [
  payerMRFMeta,
  hospitalMRFMeta,
  claimsMeta,
  medicareMeta,
  referencesMeta,
  contractsMeta,
];

/** Sources currently providing rate data. */
export const ACTIVE_SOURCES = ALL_SOURCES.filter(s => s.status === 'active');

/** Combined provider list from all active sources. */
export const ALL_PROVIDERS = [
  ...payerProviders,
  ...hospitalProviders,
];

export { PLANS, CPT_CODES, REGIONS, REGION_META };
