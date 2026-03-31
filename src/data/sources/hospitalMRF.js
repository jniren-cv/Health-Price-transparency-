/**
 * SOURCE: Hospital MRF (Machine-Readable File)
 *
 * CMS price transparency rules require hospitals to publish
 * standard charge files (chargemaster + payer-negotiated rates).
 *
 * Status: PENDING — no files loaded yet.
 * To activate: fetch hospital MRF JSON/CSV files and populate
 * PROVIDERS and RATES below, matching the payerMRF schema.
 *
 * Schema reference: 45 CFR § 180.50
 */

export const SOURCE_META = {
  id:          'hospital_mrf',
  name:        'Hospital Price Transparency MRF',
  type:        'Hospital MRF',
  status:      'pending',
  lastUpdated: null,
  fileCount:   0,
  plans:       0,
  notes:       'CMS-mandated hospital chargemaster files. Activate by ingesting hospital MRF JSON/CSV.',
};

export const PROVIDERS = [];
export const RATES     = [];
