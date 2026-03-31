/**
 * SOURCE: Claims Data
 *
 * Provider-submitted claims (835/837 EDI or payer portal export)
 * reflecting actual paid amounts per service line.
 *
 * Status: PENDING — no claims data loaded.
 * To activate: load adjudicated claims export and normalize to
 * { providerId, planId, cptCode, paidAmount, serviceDate, region }.
 *
 * When active, claims data can validate MRF rates against actual payments.
 */

export const SOURCE_META = {
  id:          'claims',
  name:        'Claims Data',
  type:        'Claims',
  status:      'pending',
  lastUpdated: null,
  recordCount: 0,
  notes:       'Adjudicated claims (835/837). Activate by loading paid claims export.',
};

export const CLAIMS = [];
