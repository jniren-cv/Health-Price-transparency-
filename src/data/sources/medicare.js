/**
 * SOURCE: Medicare Reference Rates
 *
 * CMS Medicare Physician Fee Schedule (MPFS) and Hospital Outpatient
 * Prospective Payment System (OPPS) rates for NY localities.
 *
 * Status: PENDING — no rates loaded.
 * To activate: download from CMS.gov and parse the MPFS/OPPS files.
 *   - MPFS: https://www.cms.gov/medicare/payment/fee-schedules/physician
 *   - OPPS: https://www.cms.gov/medicare/payment/prospective-payment-systems/hospital-outpatient
 *
 * Medicare rates serve as the standard reference denominator
 * (e.g. "negotiated rate = 1.4x Medicare") used in calculations.
 *
 * NY Locality codes: 1 (Manhattan), 2 (NYC suburbs), 14 (upstate NY)
 */

export const SOURCE_META = {
  id:          'medicare',
  name:        'Medicare Physician Fee Schedule',
  type:        'Medicare',
  status:      'pending',
  lastUpdated: null,
  year:        new Date().getFullYear(),
  localities:  [],
  notes:       'CMS MPFS/OPPS rates. Activate by parsing CMS fee schedule files for NY localities 1, 2, 14.',
};

/** @type {Record<string, number>} cptCode → Medicare allowed amount */
export const RATES = {};
