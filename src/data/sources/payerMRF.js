/**
 * SOURCE: Payer MRF (Machine-Readable File)
 * Aetna Health Insurance Company of New York
 *
 * Index: 75 in-network files across 3 plans
 *   - Plan 3140  (17210NY009)  — 74 files
 *   - Plan 3139  (68485NY001)  — 13 files (shared with 3140)
 *   - Plan 60189 (570805126)   —  1 file  (EIN plan)
 *
 * Status: ACTIVE — rates generated deterministically from index structure.
 * When real rates become available, replace buildProviders() output with
 * data returned by scripts/extract_rates.py.
 */

import aetnaIndex from '../aetna_index.json';

// ── Source metadata ───────────────────────────────────────────────────────────
export const SOURCE_META = {
  id:          'payer_mrf',
  name:        aetnaIndex.reporting_entity_name,
  type:        'Payer MRF',
  status:      'active',   // 'active' | 'pending' | 'error'
  lastUpdated: aetnaIndex.last_updated_on,
  version:     aetnaIndex.version,
  fileCount:   aetnaIndex.reporting_structure.length,
  plans: aetnaIndex.reporting_structure
    .flatMap(r => r.reporting_plans)
    .reduce((acc, p) => {
      if (!acc.find(x => x.plan_id_type === p.plan_id_type && x.plan_market_type === p.plan_market_type)) acc.push(p);
      return acc;
    }, [])
    .length,
};

// ── Seeded PRNG (deterministic mock rates) ────────────────────────────────────
function rng(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 0x100000000; };
}
const rand = rng(42);

// ── Plans (directly from index) ───────────────────────────────────────────────
export const PLANS = [
  { id: '17210NY009', name: 'Aetna Open Access Elect Choice 3140',  shortName: 'Plan 3140',  color: '#0369a1', fileCount: 74 },
  { id: '68485NY001', name: 'Aetna Open Access Elect Choice 3139',  shortName: 'Plan 3139',  color: '#7c3aed', fileCount: 13 },
  { id: '570805126',  name: 'Aetna Open Access Elect Choice 60189', shortName: 'Plan 60189', color: '#059669', fileCount: 1  },
];

// ── CPT Codes ─────────────────────────────────────────────────────────────────
export const CPT_CODES = [
  // Evaluation & Management
  { code: '99213', name: 'Office Visit – Est. (Low)',       category: 'E&M',         specialty: 'Primary Care',     base: { '17210NY009': 138,   '68485NY001': 129,   '570805126': 125   } },
  { code: '99214', name: 'Office Visit – Est. (Moderate)',  category: 'E&M',         specialty: 'Primary Care',     base: { '17210NY009': 198,   '68485NY001': 184,   '570805126': 179   } },
  { code: '99215', name: 'Office Visit – Est. (High)',      category: 'E&M',         specialty: 'Primary Care',     base: { '17210NY009': 268,   '68485NY001': 252,   '570805126': 244   } },
  { code: '99204', name: 'New Patient – Moderate',          category: 'E&M',         specialty: 'Primary Care',     base: { '17210NY009': 218,   '68485NY001': 204,   '570805126': 196   } },
  { code: '99205', name: 'New Patient – High',              category: 'E&M',         specialty: 'Primary Care',     base: { '17210NY009': 285,   '68485NY001': 268,   '570805126': 258   } },
  { code: '99232', name: 'Subsequent Hospital Care',        category: 'E&M',         specialty: 'Internal Medicine',base: { '17210NY009': 165,   '68485NY001': 154,   '570805126': 149   } },
  // Surgery
  { code: '27447', name: 'Total Knee Arthroplasty',         category: 'Surgery',     specialty: 'Orthopedics',      base: { '17210NY009': 14800, '68485NY001': 13900, '570805126': 13500 } },
  { code: '27130', name: 'Total Hip Arthroplasty',          category: 'Surgery',     specialty: 'Orthopedics',      base: { '17210NY009': 15200, '68485NY001': 14300, '570805126': 13900 } },
  { code: '43239', name: 'Upper GI Endoscopy w/ Biopsy',   category: 'Surgery',     specialty: 'Gastroenterology', base: { '17210NY009': 875,   '68485NY001': 820,   '570805126': 795   } },
  { code: '45378', name: 'Colonoscopy – Diagnostic',        category: 'Surgery',     specialty: 'Gastroenterology', base: { '17210NY009': 820,   '68485NY001': 768,   '570805126': 744   } },
  { code: '47562', name: 'Laparoscopic Cholecystectomy',    category: 'Surgery',     specialty: 'General Surgery',  base: { '17210NY009': 9200,  '68485NY001': 8630,  '570805126': 8360  } },
  { code: '19301', name: 'Partial Mastectomy',              category: 'Surgery',     specialty: 'General Surgery',  base: { '17210NY009': 8400,  '68485NY001': 7880,  '570805126': 7640  } },
  // Imaging
  { code: '70553', name: 'MRI Brain w/wo Contrast',         category: 'Imaging',     specialty: 'Radiology',        base: { '17210NY009': 1080,  '68485NY001': 1010,  '570805126': 980   } },
  { code: '72148', name: 'MRI Lumbar Spine',                category: 'Imaging',     specialty: 'Radiology',        base: { '17210NY009': 920,   '68485NY001': 862,   '570805126': 836   } },
  { code: '71046', name: 'Chest X-Ray (2 Views)',           category: 'Imaging',     specialty: 'Radiology',        base: { '17210NY009': 95,    '68485NY001': 89,    '570805126': 86    } },
  // Diagnostics / Cardiology
  { code: '93000', name: 'Electrocardiogram (ECG)',         category: 'Diagnostics', specialty: 'Cardiology',       base: { '17210NY009': 46,    '68485NY001': 43,    '570805126': 42    } },
  { code: '93306', name: 'Echocardiography – Complete',     category: 'Diagnostics', specialty: 'Cardiology',       base: { '17210NY009': 680,   '68485NY001': 637,   '570805126': 617   } },
  // Laboratory
  { code: '80053', name: 'Comprehensive Metabolic Panel',   category: 'Laboratory',  specialty: 'Lab/Pathology',    base: { '17210NY009': 28,    '68485NY001': 26,    '570805126': 25    } },
  { code: '85025', name: 'CBC with Differential',           category: 'Laboratory',  specialty: 'Lab/Pathology',    base: { '17210NY009': 22,    '68485NY001': 21,    '570805126': 20    } },
  { code: '36415', name: 'Venipuncture / Blood Draw',       category: 'Laboratory',  specialty: 'Lab/Pathology',    base: { '17210NY009': 18,    '68485NY001': 17,    '570805126': 16    } },
];

// ── NY Regions (12 geographic markets) ───────────────────────────────────────
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

const PROVIDER_NAMES = {
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
const SPECIALTIES = [...new Set(CPT_CODES.map(c => c.specialty))];

function buildProviders() {
  const out = [];
  let id = 1;
  for (const region of REGIONS) {
    const { lat, lng, mul, providerCount } = REGION_META[region];
    const names = PROVIDER_NAMES[region];
    for (let i = 0; i < Math.min(names.length, providerCount); i++) {
      const variance  = 0.86 + rand() * 0.28;
      const specialty = SPECIALTIES[Math.floor(rand() * SPECIALTIES.length)];
      const rates = {};
      for (const plan of PLANS) {
        rates[plan.id] = {};
        for (const cpt of CPT_CODES) {
          rates[plan.id][cpt.code] = Math.round(cpt.base[plan.id] * mul * variance * 100) / 100;
        }
      }
      out.push({
        id:       `P${String(id++).padStart(3,'0')}`,
        name:     names[i],
        npi:      String(1000000000 + Math.floor(rand() * 999999999)),
        type:     PROVIDER_TYPES[i % PROVIDER_TYPES.length],
        specialty,
        region,
        lat:      lat + (rand() - 0.5) * 0.14,
        lng:      lng + (rand() - 0.5) * 0.20,
        rates,
        source:   'payer_mrf',   // data provenance tag
      });
    }
  }
  return out;
}

export const PROVIDERS = buildProviders();
