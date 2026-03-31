/**
 * SOURCE: Contracts
 *
 * Provider contract terms uploaded directly by the provider organization:
 *   - Fee schedules per plan/payer
 *   - Carve-out rates for specific procedures
 *   - Value-based contract bonuses / withholds
 *   - Effective dates and renewal windows
 *
 * Status: PENDING — no contracts loaded.
 * To activate: parse contract PDFs/spreadsheets into structured records
 * and map to { providerId, planId, cptCode, contractRate, effectiveDate, expirationDate }.
 *
 * When active, contracts are the highest-fidelity source and override
 * MRF-derived rates in the Best Rates pipeline step.
 */

export const SOURCE_META = {
  id:          'contracts',
  name:        'Provider Contracts',
  type:        'Contracts',
  status:      'pending',
  lastUpdated: null,
  recordCount: 0,
  notes:       'Direct contract uploads. Activate by ingesting provider contract data.',
};

/** @type {Array<{ providerId: string, planId: string, cptCode: string, contractRate: number, effectiveDate: string, expirationDate: string }>} */
export const CONTRACT_RATES = [];
