/**
 * Mock provider and negotiated-rate data for the Aetna NY dashboard.
 *
 * Data structure mirrors the CMS Transparency-in-Coverage MRF schema.
 * Replace PROVIDERS with output from scripts/extract_rates.py to use real rates.
 *
 * Plans:
 *   17210NY009  →  Aetna Open Access Elect Choice 3140
 *   68485NY001  →  Aetna Open Access Elect Choice 3139
 */

// ── Seeded PRNG for deterministic mock data ──────────────────────────────────
function createRng(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  if (s === 0) s = 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s = s >>> 0;
    return s / 0x100000000;
  };
}
const rng = createRng(42);

// ── Plans ────────────────────────────────────────────────────────────────────
export const PLANS = [
  { id: '17210NY009', name: 'Aetna Open Access Elect Choice 3140', shortName: 'Plan 3140', color: '#0369a1' },
  { id: '68485NY001', name: 'Aetna Open Access Elect Choice 3139', shortName: 'Plan 3139', color: '#7c3aed' },
];

// ── Services (CPT codes) ─────────────────────────────────────────────────────
export const SERVICES = [
  { code: '99213', description: 'Office Visit – Established (Low Complexity)',      category: 'E&M' },
  { code: '99214', description: 'Office Visit – Established (Moderate Complexity)', category: 'E&M' },
  { code: '27447', description: 'Total Knee Arthroplasty',                          category: 'Surgery' },
  { code: '70553', description: 'MRI Brain w/wo Contrast',                          category: 'Imaging' },
  { code: '93000', description: 'Electrocardiogram (ECG/EKG)',                      category: 'Diagnostics' },
  { code: '43239', description: 'Upper GI Endoscopy w/ Biopsy',                    category: 'Surgery' },
  { code: '36415', description: 'Venipuncture / Blood Draw',                        category: 'Laboratory' },
];

// ── Regions ──────────────────────────────────────────────────────────────────
export const REGIONS = [
  'Manhattan',
  'Brooklyn/Queens',
  'Bronx/Staten Island',
  'Long Island',
  'Westchester',
  'Capital Region',
  'Central NY',
  'Finger Lakes',
  'Western NY',
  'North Country',
];

// Region metadata: geographic centre + cost-of-care multiplier
const REGION_META = {
  'Manhattan':           { lat: 40.7831, lng: -73.9712, mul: 1.48 },
  'Brooklyn/Queens':     { lat: 40.6782, lng: -73.8800, mul: 1.30 },
  'Bronx/Staten Island': { lat: 40.8448, lng: -73.8648, mul: 1.22 },
  'Long Island':         { lat: 40.7282, lng: -73.2976, mul: 1.17 },
  'Westchester':         { lat: 41.1220, lng: -73.8368, mul: 1.13 },
  'Capital Region':      { lat: 42.6526, lng: -73.7562, mul: 0.95 },
  'Central NY':          { lat: 43.0481, lng: -76.1474, mul: 0.88 },
  'Finger Lakes':        { lat: 43.1566, lng: -77.6088, mul: 0.87 },
  'Western NY':          { lat: 42.8864, lng: -78.8784, mul: 0.84 },
  'North Country':       { lat: 44.6995, lng: -73.4529, mul: 0.77 },
};

// Base negotiated rates (statewide reference, pre-multiplier)
const BASE = {
  '17210NY009': { '99213': 138, '99214': 198, '27447': 14800, '70553': 1080, '93000': 46, '43239': 875, '36415': 18 },
  '68485NY001': { '99213': 129, '99214': 184, '27447': 13900, '70553': 1010, '93000': 43, '43239': 820, '36415': 17 },
};

const PROVIDER_TYPES = ['Hospital', 'Medical Group', 'Outpatient Center', 'Specialty Clinic'];

const NAMES = {
  'Manhattan':           ['Manhattan Medical Center', 'NYC Health Partners', 'Midtown Specialty Group', 'Upper East Side Medical', 'Columbia Medical Associates'],
  'Brooklyn/Queens':     ['Brooklyn Methodist Hospital', 'Queens Medical Associates', 'Flatbush Health Group', 'Jamaica Hospital Group', 'Bay Ridge Medical Center'],
  'Bronx/Staten Island': ['Montefiore Bronx Associates', 'Lincoln Medical Group', 'Staten Island University Network', 'South Bronx Health Center', 'Richmond Medical Group'],
  'Long Island':         ['North Shore–LIJ Partners', 'South Nassau Communities Hospital', 'Stony Brook Medical Group', 'Long Island Jewish Associates', 'Winthrop University Hospital'],
  'Westchester':         ['White Plains Hospital Group', 'Westchester Medical Center', 'Mount Vernon Associates', 'Yonkers Health Group', 'New Rochelle Medical'],
  'Capital Region':      ['Albany Medical Center', "St. Peter's Health Partners", 'Ellis Hospital Associates', 'Saratoga Hospital Group', 'Capital District Physicians'],
  'Central NY':          ['Upstate Medical University', 'Crouse Hospital Associates', "St. Joseph's Hospital Group", 'CNY Orthopedic Group', 'Syracuse Cardiology'],
  'Finger Lakes':        ['Strong Memorial Hospital', 'Rochester General Health', 'Unity Health System', 'Highland Hospital Associates', 'Finger Lakes Medical Group'],
  'Western NY':          ['Buffalo General Medical', 'Kaleida Health Network', 'Roswell Park Physicians', 'Sisters of Charity Health', 'ECMC Medical Center'],
  'North Country':       ['Plattsburgh Medical Center', 'Champlain Valley Physicians', 'Adirondack Health Associates', 'Canton-Potsdam Hospital', 'North Country Specialists'],
};

// ── Generate providers ───────────────────────────────────────────────────────
function generateProviders() {
  const providers = [];
  let id = 1;

  for (const region of REGIONS) {
    const { lat, lng, mul } = REGION_META[region];
    const names = NAMES[region];

    for (let i = 0; i < names.length; i++) {
      const variance = 0.88 + rng() * 0.24;
      const rates = {};

      for (const planId of Object.keys(BASE)) {
        rates[planId] = {};
        for (const code of Object.keys(BASE[planId])) {
          rates[planId][code] = Math.round(BASE[planId][code] * mul * variance * 100) / 100;
        }
      }

      providers.push({
        id: `P${String(id++).padStart(3, '0')}`,
        name: names[i],
        npi: String(1000000000 + Math.floor(rng() * 999999999)),
        type: PROVIDER_TYPES[i % PROVIDER_TYPES.length],
        region,
        lat: lat + (rng() - 0.5) * 0.12,
        lng: lng + (rng() - 0.5) * 0.18,
        rates,
      });
    }
  }
  return providers;
}

export const PROVIDERS = generateProviders();

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Average negotiated rate per region for a given plan + service. */
export function getRegionAverages(planId, serviceCode) {
  return REGIONS.map((region) => {
    const vals = PROVIDERS
      .filter((p) => p.region === region)
      .map((p) => p.rates[planId]?.[serviceCode])
      .filter((v) => v != null);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { region, avg: Math.round(avg * 100) / 100, count: vals.length };
  });
}

/** Format a dollar value compactly. */
export function formatCurrency(val) {
  if (val == null) return '—';
  if (val >= 10000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
