/**
 * Sample data for the Aetna NY Provider Revenue Dashboard.
 *
 * Derived from the Aetna NY MRF index structure (75 in-network files,
 * plans 17210NY009 / 68485NY001 / 570805126).
 *
 * To replace with real data run:
 *   python scripts/extract_rates.py --index src/data/aetna_index.json
 */

// ── Seeded PRNG (deterministic) ──────────────────────────────────────────────
function rng(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 0x100000000; };
}
const rand = rng(42);

// ── Plans ────────────────────────────────────────────────────────────────────
export const PLANS = [
  { id: '17210NY009', name: 'Aetna Open Access Elect Choice 3140', shortName: 'Plan 3140', color: '#0369a1' },
  { id: '68485NY001', name: 'Aetna Open Access Elect Choice 3139', shortName: 'Plan 3139', color: '#7c3aed' },
  { id: '570805126',  name: 'Aetna Open Access Elect Choice 60189', shortName: 'Plan 60189', color: '#059669' },
];

// ── CPT Codes ────────────────────────────────────────────────────────────────
export const CPT_CODES = [
  // Evaluation & Management
  { code: '99213', name: 'Office Visit – Est. (Low)',      category: 'E&M',         specialty: 'Primary Care',    base: { '17210NY009': 138,  '68485NY001': 129,  '570805126': 125  } },
  { code: '99214', name: 'Office Visit – Est. (Moderate)', category: 'E&M',         specialty: 'Primary Care',    base: { '17210NY009': 198,  '68485NY001': 184,  '570805126': 179  } },
  { code: '99215', name: 'Office Visit – Est. (High)',     category: 'E&M',         specialty: 'Primary Care',    base: { '17210NY009': 268,  '68485NY001': 252,  '570805126': 244  } },
  { code: '99204', name: 'New Patient – Moderate',         category: 'E&M',         specialty: 'Primary Care',    base: { '17210NY009': 218,  '68485NY001': 204,  '570805126': 196  } },
  { code: '99205', name: 'New Patient – High',             category: 'E&M',         specialty: 'Primary Care',    base: { '17210NY009': 285,  '68485NY001': 268,  '570805126': 258  } },
  { code: '99232', name: 'Subsequent Hospital Care',       category: 'E&M',         specialty: 'Internal Medicine', base: { '17210NY009': 165,  '68485NY001': 154,  '570805126': 149  } },
  // Surgery
  { code: '27447', name: 'Total Knee Arthroplasty',        category: 'Surgery',     specialty: 'Orthopedics',     base: { '17210NY009': 14800,'68485NY001': 13900,'570805126': 13500 } },
  { code: '27130', name: 'Total Hip Arthroplasty',         category: 'Surgery',     specialty: 'Orthopedics',     base: { '17210NY009': 15200,'68485NY001': 14300,'570805126': 13900 } },
  { code: '43239', name: 'Upper GI Endoscopy w/ Biopsy',  category: 'Surgery',     specialty: 'Gastroenterology',base: { '17210NY009': 875,  '68485NY001': 820,  '570805126': 795  } },
  { code: '45378', name: 'Colonoscopy – Diagnostic',      category: 'Surgery',     specialty: 'Gastroenterology',base: { '17210NY009': 820,  '68485NY001': 768,  '570805126': 744  } },
  { code: '47562', name: 'Laparoscopic Cholecystectomy',  category: 'Surgery',     specialty: 'General Surgery', base: { '17210NY009': 9200, '68485NY001': 8630, '570805126': 8360 } },
  { code: '19301', name: 'Partial Mastectomy',            category: 'Surgery',     specialty: 'General Surgery', base: { '17210NY009': 8400, '68485NY001': 7880, '570805126': 7640 } },
  // Imaging
  { code: '70553', name: 'MRI Brain w/wo Contrast',       category: 'Imaging',     specialty: 'Radiology',       base: { '17210NY009': 1080, '68485NY001': 1010, '570805126': 980  } },
  { code: '72148', name: 'MRI Lumbar Spine',              category: 'Imaging',     specialty: 'Radiology',       base: { '17210NY009': 920,  '68485NY001': 862,  '570805126': 836  } },
  { code: '71046', name: 'Chest X-Ray (2 Views)',         category: 'Imaging',     specialty: 'Radiology',       base: { '17210NY009': 95,   '68485NY001': 89,   '570805126': 86   } },
  // Diagnostics / Cardiology
  { code: '93000', name: 'Electrocardiogram (ECG)',       category: 'Diagnostics', specialty: 'Cardiology',      base: { '17210NY009': 46,   '68485NY001': 43,   '570805126': 42   } },
  { code: '93306', name: 'Echocardiography – Complete',  category: 'Diagnostics', specialty: 'Cardiology',      base: { '17210NY009': 680,  '68485NY001': 637,  '570805126': 617  } },
  // Laboratory
  { code: '80053', name: 'Comprehensive Metabolic Panel', category: 'Laboratory',  specialty: 'Lab/Pathology',   base: { '17210NY009': 28,   '68485NY001': 26,   '570805126': 25   } },
  { code: '85025', name: 'CBC with Differential',        category: 'Laboratory',  specialty: 'Lab/Pathology',   base: { '17210NY009': 22,   '68485NY001': 21,   '570805126': 20   } },
  { code: '36415', name: 'Venipuncture / Blood Draw',    category: 'Laboratory',  specialty: 'Lab/Pathology',   base: { '17210NY009': 18,   '68485NY001': 17,   '570805126': 16   } },
];

export const CPT_CATEGORIES = [...new Set(CPT_CODES.map(c => c.category))];
export const SPECIALTIES    = [...new Set(CPT_CODES.map(c => c.specialty))];

// ── Regions ──────────────────────────────────────────────────────────────────
// Ordered south-to-north; multiplier reflects local cost-of-care index
export const REGION_META = {
  'Manhattan':           { lat: 40.7831, lng: -73.9712, mul: 1.55, providerCount: 9 },
  'Brooklyn':            { lat: 40.6782, lng: -73.9442, mul: 1.32, providerCount: 8 },
  'Queens':              { lat: 40.7282, lng: -73.7949, mul: 1.28, providerCount: 7 },
  'Bronx/Staten Island': { lat: 40.8448, lng: -73.8648, mul: 1.20, providerCount: 6 },
  'Long Island':         { lat: 40.7282, lng: -73.2976, mul: 1.18, providerCount: 7 },
  'Westchester':         { lat: 41.1220, lng: -73.8368, mul: 1.15, providerCount: 5 },
  'Hudson Valley':       { lat: 41.7004, lng: -74.0447, mul: 1.05, providerCount: 4 },
  'Capital Region':      { lat: 42.6526, lng: -73.7562, mul: 0.95, providerCount: 5 },
  'Central NY':          { lat: 43.0481, lng: -76.1474, mul: 0.88, providerCount: 4 },
  'Finger Lakes':        { lat: 43.1566, lng: -77.6088, mul: 0.87, providerCount: 4 },
  'Western NY':          { lat: 42.8864, lng: -78.8784, mul: 0.84, providerCount: 5 },
  'North Country':       { lat: 44.6995, lng: -73.4529, mul: 0.76, providerCount: 3 },
};
export const REGIONS = Object.keys(REGION_META);

// Provider names by region
const NAMES = {
  'Manhattan':           ['Manhattan Medical Center','NYC Health Partners','Midtown Specialty Group','Upper East Side Medical','Columbia Medical Associates','NewYork-Presbyterian Physicians','Mount Sinai Medical Group','NYU Langone Associates','Weill Cornell Medicine'],
  'Brooklyn':            ['Brooklyn Methodist Hospital','SUNY Downstate Medical','Interfaith Medical Center','Maimonides Medical Group','NYU Langone Brooklyn','Brooklyn Hospital Group','Coney Island Hospital Partners','Woodhull Medical Associates'],
  'Queens':              ['Jamaica Hospital Medical','NewYork-Presbyterian Queens','Queens County Medical Group','Long Island Jewish Queens','Elmhurst Hospital Partners','North Queens Medical Center','Forest Hills Medical Group'],
  'Bronx/Staten Island': ['Montefiore Medical Group','Lincoln Medical Associates','BronxCare Health Network','Richmond University Medical','Staten Island University Hospital','NYC Health + Hospitals/Jacobi'],
  'Long Island':         ['Northwell Health LI','North Shore University Hospital','South Nassau Communities','Stony Brook Medicine','Winthrop University Hospital','LIJ Medical Group','Good Samaritan Hospital Partners'],
  'Westchester':         ['Westchester Medical Center','White Plains Hospital','NewYork-Presbyterian Westchester','Montefiore New Rochelle','Phelps Hospital Group'],
  'Hudson Valley':       ['Vassar Brothers Medical','Mid-Hudson Regional Hospital','Crystal Run Healthcare','Orange Regional Medical'],
  'Capital Region':      ['Albany Medical Center','St. Peter\'s Health Partners','Ellis Medicine Associates','Saratoga Hospital Group','Capital District Physicians\' Health'],
  'Central NY':          ['Upstate University Hospital','Crouse Hospital Medical','St. Joseph\'s Health System','CNY Orthopedic Group'],
  'Finger Lakes':        ['UR Medicine / Strong Memorial','Rochester Regional Health','Unity Health System','Highland Hospital Associates'],
  'Western NY':          ['Kaleida Health Network','Buffalo General Medical','ECMC Medical Center','Roswell Park Physicians','Sisters of Charity Health'],
  'North Country':       ['Champlain Valley Physicians','Adirondack Health','Canton-Potsdam Hospital'],
};

const PROVIDER_TYPES = ['Hospital', 'Medical Group', 'Outpatient Center', 'Specialty Clinic'];
const SPECIALTY_LIST = [...SPECIALTIES];

// ── Generate providers ───────────────────────────────────────────────────────
function buildProviders() {
  const out = [];
  let id = 1;
  for (const region of REGIONS) {
    const { lat, lng, mul, providerCount } = REGION_META[region];
    const names = NAMES[region];
    for (let i = 0; i < Math.min(names.length, providerCount); i++) {
      const variance  = 0.86 + rand() * 0.28;
      const specialty = SPECIALTY_LIST[Math.floor(rand() * SPECIALTY_LIST.length)];
      const rates = {};
      for (const plan of PLANS) {
        rates[plan.id] = {};
        for (const cpt of CPT_CODES) {
          rates[plan.id][cpt.code] = Math.round(cpt.base[plan.id] * mul * variance * 100) / 100;
        }
      }
      out.push({
        id: `P${String(id++).padStart(3,'0')}`,
        name: names[i],
        npi: String(1000000000 + Math.floor(rand() * 999999999)),
        type: PROVIDER_TYPES[i % PROVIDER_TYPES.length],
        specialty,
        region,
        lat: lat + (rand() - 0.5) * 0.14,
        lng: lng + (rand() - 0.5) * 0.20,
        rates,
      });
    }
  }
  return out;
}
export const PROVIDERS = buildProviders();

// ── Analytics helpers ────────────────────────────────────────────────────────

/** All rate values for a given plan + CPT code, optionally filtered by region. */
export function getRates(planId, code, region = null) {
  return PROVIDERS
    .filter(p => !region || p.region === region)
    .map(p => p.rates[planId]?.[code])
    .filter(v => v != null);
}

/** Average negotiated rate per region for a given plan + CPT code. */
export function getRegionAverages(planId, code) {
  return REGIONS.map(region => {
    const vals = getRates(planId, code, region);
    const avg  = vals.length ? vals.reduce((a,b) => a+b,0) / vals.length : 0;
    return { region, avg: round2(avg), min: vals.length ? Math.min(...vals) : 0, max: vals.length ? Math.max(...vals) : 0, count: vals.length };
  });
}

/** P25 / P50 / P75 / P90 for a given plan + CPT code (optionally regional). */
export function getPercentiles(planId, code, region = null) {
  const sorted = getRates(planId, code, region).sort((a,b) => a - b);
  if (!sorted.length) return { p25: 0, p50: 0, p75: 0, p90: 0 };
  const pct = (p) => {
    const idx = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    return round2(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
  };
  return { p25: pct(25), p50: pct(50), p75: pct(75), p90: pct(90) };
}

/** Top N CPT codes by average rate for a region + plan. */
export function getTopCodesByRate(planId, region, n = 10) {
  return CPT_CODES
    .map(cpt => {
      const vals = getRates(planId, cpt.code, region);
      const avg  = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
      return { ...cpt, avg: round2(avg) };
    })
    .filter(c => c.avg > 0)
    .sort((a,b) => b.avg - a.avg)
    .slice(0, n);
}

/** Rate spread (P75-P25) for each CPT code — measures negotiation variability. */
export function getRateSpread(planId, region = null) {
  return CPT_CODES.map(cpt => {
    const { p25, p50, p75 } = getPercentiles(planId, cpt.code, region);
    return { ...cpt, p25, p50, p75, spread: round2(p75 - p25), spreadPct: p50 > 0 ? round2((p75 - p25) / p50 * 100) : 0 };
  }).filter(c => c.p50 > 0);
}

/**
 * Generic query engine for the Query Builder page.
 * Returns { labels, series: [{ name, data[] }] }
 */
export function runQuery({ groupBy, metric, planId, filterCode, filterCategory, filterRegion }) {
  let items;

  // Determine rows
  if (groupBy === 'region') {
    items = REGIONS.map(region => {
      const codes = filterCode ? [CPT_CODES.find(c => c.code === filterCode)].filter(Boolean)
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
          const codes = filterCode ? [filterCode] : filterCategory ? CPT_CODES.filter(c=>c.category===filterCategory).map(c=>c.code) : CPT_CODES.map(c=>c.code);
          return codes.map(code => p.rates[planId]?.[code]).filter(v=>v!=null);
        });
      return { label: type, vals };
    });
  }

  const applyMetric = (vals) => {
    if (!vals.length) return 0;
    const sorted = [...vals].sort((a,b)=>a-b);
    if (metric === 'avg')   return round2(vals.reduce((a,b)=>a+b,0)/vals.length);
    if (metric === 'min')   return round2(Math.min(...vals));
    if (metric === 'max')   return round2(Math.max(...vals));
    if (metric === 'p50')   return round2(sorted[Math.floor(sorted.length*0.5)]);
    if (metric === 'p75')   return round2(sorted[Math.floor(sorted.length*0.75)]);
    if (metric === 'count') return vals.length;
    return round2(vals.reduce((a,b)=>a+b,0)/vals.length);
  };

  return (items || [])
    .map(it => ({ label: it.shortLabel || it.label, fullLabel: it.label, value: applyMetric(it.vals) }))
    .filter(it => it.value > 0);
}

/** Lookup helpers */
export const cptByCode = Object.fromEntries(CPT_CODES.map(c => [c.code, c]));

function round2(v) { return Math.round(v * 100) / 100; }

/** Format a dollar value. */
export function formatCurrency(val, compact = false) {
  if (val == null) return '—';
  if (compact && val >= 10000) return `$${(val/1000).toFixed(1)}k`;
  if (compact && val >= 1000)  return `$${(val/1000).toFixed(1)}k`;
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Format with sign for delta values. */
export function formatDelta(val) {
  if (val == null) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${formatCurrency(val)}`;
}
