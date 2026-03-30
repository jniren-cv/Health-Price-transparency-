import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, LabelList,
} from 'recharts';
import {
  PLANS, CPT_CODES, REGIONS, CPT_CATEGORIES, SPECIALTIES,
  runQuery, getRegionAverages, getPercentiles,
  formatCurrency, cptByCode,
} from '../data/sampleData';

// Preset query templates
const PRESETS = [
  {
    id: 'region-rate',
    label: '📍 Which regions pay the most for a service?',
    config: { groupBy:'region', metric:'avg', filterCode:'99214', filterCategory:'', filterRegion:'' },
  },
  {
    id: 'top-codes',
    label: '💵 Highest-paid CPT codes in a region',
    config: { groupBy:'cpt', metric:'avg', filterCode:'', filterCategory:'', filterRegion:'Manhattan' },
  },
  {
    id: 'category-compare',
    label: '📊 Average rate by service category',
    config: { groupBy:'category', metric:'avg', filterCode:'', filterCategory:'', filterRegion:'' },
  },
  {
    id: 'specialty-compare',
    label: '🏥 Average rate by specialty',
    config: { groupBy:'specialty', metric:'avg', filterCode:'', filterCategory:'', filterRegion:'' },
  },
  {
    id: 'provider-type',
    label: '🏢 Hospital vs Medical Group vs Outpatient rates',
    config: { groupBy:'providerType', metric:'avg', filterCode:'99214', filterCategory:'', filterRegion:'' },
  },
  {
    id: 'em-region',
    label: '📋 E&M code rates across regions',
    config: { groupBy:'region', metric:'avg', filterCode:'', filterCategory:'E&M', filterRegion:'' },
  },
  {
    id: 'surgery-region',
    label: '🔪 Surgical procedure rates by region',
    config: { groupBy:'region', metric:'avg', filterCode:'', filterCategory:'Surgery', filterRegion:'' },
  },
  {
    id: 'max-rate',
    label: '📈 Maximum rates by region (best-case scenario)',
    config: { groupBy:'region', metric:'max', filterCode:'99214', filterCategory:'', filterRegion:'' },
  },
];

const GROUP_OPTIONS = [
  { value:'region',       label:'Region' },
  { value:'cpt',          label:'CPT Code' },
  { value:'category',     label:'Service Category' },
  { value:'specialty',    label:'Specialty' },
  { value:'providerType', label:'Provider Type' },
];

const METRIC_OPTIONS = [
  { value:'avg',   label:'Average Rate' },
  { value:'p50',   label:'Median Rate (P50)' },
  { value:'p75',   label:'75th Percentile Rate' },
  { value:'max',   label:'Maximum Rate' },
  { value:'min',   label:'Minimum Rate' },
  { value:'count', label:'Provider Count' },
];

const PALETTE = [
  '#0369a1','#7c3aed','#059669','#d97706','#dc2626','#0891b2',
  '#4f46e5','#db2777','#65a30d','#ca8a04','#0d9488','#2563eb',
];

const SAVED_KEY = 'savedQueries';

export default function QueryBuilderPage() {
  const [planId,         setPlanId]         = useState(PLANS[0].id);
  const [groupBy,        setGroupBy]        = useState('region');
  const [metric,         setMetric]         = useState('avg');
  const [filterCode,     setFilterCode]     = useState('99214');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRegion,   setFilterRegion]   = useState('');
  const [chartType,      setChartType]      = useState('bar');
  const [presetId,       setPresetId]       = useState('');
  const [savedQueries,   setSavedQueries]   = useState(() => {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch { return []; }
  });
  const [queryName,      setQueryName]      = useState('');

  const config = { groupBy, metric, planId, filterCode, filterCategory, filterRegion };

  const results = useMemo(() => runQuery(config), [groupBy, metric, planId, filterCode, filterCategory, filterRegion]);

  const metricLabel = METRIC_OPTIONS.find(m => m.value === metric)?.label ?? metric;
  const plan        = PLANS.find(p => p.id === planId);

  const isMonetary = metric !== 'count';
  const fmtY = v => {
    if (!isMonetary) return v;
    return v >= 10000 ? `$${(v/1000).toFixed(0)}k` : v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v}`;
  };

  const CustomTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="tooltip-box">
        <strong style={{ fontSize:13 }}>{d.fullLabel}</strong>
        <div style={{ color:'#0369a1', fontWeight:700, marginTop:4 }}>
          {isMonetary ? formatCurrency(d.value) : `${d.value} providers`}
        </div>
      </div>
    );
  };

  function applyPreset(id) {
    const p = PRESETS.find(p => p.id === id);
    if (!p) return;
    setPresetId(id);
    const c = p.config;
    setGroupBy(c.groupBy);
    setMetric(c.metric);
    setFilterCode(c.filterCode || '99214');
    setFilterCategory(c.filterCategory || '');
    setFilterRegion(c.filterRegion || '');
  }

  function saveQuery() {
    if (!queryName.trim()) return;
    const q = { id: Date.now(), name: queryName.trim(), config: { ...config }, planId };
    const updated = [q, ...savedQueries].slice(0, 8);
    setSavedQueries(updated);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(updated)); } catch {}
    setQueryName('');
  }

  function loadQuery(q) {
    setPlanId(q.planId);
    setGroupBy(q.config.groupBy);
    setMetric(q.config.metric);
    setFilterCode(q.config.filterCode || '99214');
    setFilterCategory(q.config.filterCategory || '');
    setFilterRegion(q.config.filterRegion || '');
  }

  function deleteQuery(id) {
    const updated = savedQueries.filter(q => q.id !== id);
    setSavedQueries(updated);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(updated)); } catch {}
  }

  // Build chart title
  const chartTitle = useMemo(() => {
    const grpLabel = GROUP_OPTIONS.find(g => g.value === groupBy)?.label ?? groupBy;
    const parts = [`${metricLabel} by ${grpLabel}`];
    if (filterCode) parts.push(cptByCode[filterCode]?.name ?? filterCode);
    if (filterCategory && !filterCode) parts.push(filterCategory);
    if (filterRegion) parts.push(filterRegion);
    return parts.join(' · ');
  }, [groupBy, metric, filterCode, filterCategory, filterRegion]);

  return (
    <div className="page">
      <div className="qb-layout">
        {/* Left: controls */}
        <div className="qb-sidebar">
          <div className="card">
            <div className="card-header"><h2>Query Builder</h2></div>
            <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Presets */}
              <div>
                <div className="s-label" style={{marginBottom:6}}>QUICK PRESETS</div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {PRESETS.map(p => (
                    <button key={p.id}
                      onClick={() => applyPreset(p.id)}
                      style={{
                        textAlign:'left', padding:'7px 10px', borderRadius:6, cursor:'pointer',
                        border:`1px solid ${presetId===p.id ? '#0369a1' : '#e2e8f0'}`,
                        background: presetId===p.id ? '#eff6ff' : 'white',
                        color: presetId===p.id ? '#0369a1' : '#374151',
                        fontSize:12, fontWeight: presetId===p.id ? 600 : 400,
                        transition:'all 0.1s',
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:14 }}>
                <div className="s-label" style={{marginBottom:10}}>CUSTOM QUERY</div>

                <div className="filter-group">
                  <label>Plan</label>
                  <select value={planId} onChange={e => setPlanId(e.target.value)}>
                    {PLANS.map(p => <option key={p.id} value={p.id}>{p.shortName}</option>)}
                  </select>
                </div>

                <div className="filter-group" style={{marginTop:10}}>
                  <label>Group By</label>
                  <select value={groupBy} onChange={e => { setGroupBy(e.target.value); setPresetId(''); }}>
                    {GROUP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div className="filter-group" style={{marginTop:10}}>
                  <label>Metric</label>
                  <select value={metric} onChange={e => { setMetric(e.target.value); setPresetId(''); }}>
                    {METRIC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div className="filter-group" style={{marginTop:10}}>
                  <label>Filter: Service Category</label>
                  <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPresetId(''); }}>
                    <option value="">All Categories</option>
                    {CPT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="filter-group" style={{marginTop:10}}>
                  <label>Filter: Specific CPT Code</label>
                  <select value={filterCode} onChange={e => { setFilterCode(e.target.value); setPresetId(''); }}>
                    <option value="">(All codes in category)</option>
                    {CPT_CODES.filter(c => !filterCategory || c.category===filterCategory)
                      .map(c => <option key={c.code} value={c.code}>{c.code} – {c.name}</option>)}
                  </select>
                </div>

                <div className="filter-group" style={{marginTop:10}}>
                  <label>Filter: Region</label>
                  <select value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setPresetId(''); }}>
                    <option value="">All Regions</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Save query */}
              <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:14 }}>
                <div className="s-label" style={{marginBottom:6}}>SAVE THIS QUERY</div>
                <div style={{ display:'flex', gap:6 }}>
                  <input
                    value={queryName} onChange={e => setQueryName(e.target.value)}
                    placeholder="Query name…"
                    style={{ flex:1, padding:'6px 8px', border:'1px solid #cbd5e1', borderRadius:6, fontSize:12 }}
                    onKeyDown={e => e.key==='Enter' && saveQuery()}
                  />
                  <button onClick={saveQuery}
                    style={{ padding:'6px 10px', background:'#0369a1', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600 }}>
                    Save
                  </button>
                </div>
              </div>

              {/* Saved queries */}
              {savedQueries.length > 0 && (
                <div>
                  <div className="s-label" style={{marginBottom:6}}>SAVED QUERIES</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {savedQueries.map(q => (
                      <div key={q.id} style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <button onClick={() => loadQuery(q)}
                          style={{
                            flex:1, textAlign:'left', padding:'5px 8px', borderRadius:5, cursor:'pointer',
                            border:'1px solid #e2e8f0', background:'white', fontSize:11, color:'#374151',
                          }}>
                          📌 {q.name}
                        </button>
                        <button onClick={() => deleteQuery(q.id)}
                          style={{ padding:'4px 7px', border:'none', background:'#fee2e2', color:'#dc2626', borderRadius:5, cursor:'pointer', fontSize:11 }}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: chart + table */}
        <div className="qb-main">
          <div className="card" style={{ marginBottom:14 }}>
            <div className="card-header">
              <h2>{chartTitle}</h2>
              <p>{plan?.shortName} · {results.length} results</p>
            </div>
            <div className="card-body">
              {results.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 0', color:'#94a3b8' }}>
                  No data for this combination. Try adjusting your filters.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={results}
                    layout={results.length > 8 ? 'vertical' : 'horizontal'}
                    margin={{ top:8, right:24, left: results.length > 8 ? 160 : 8, bottom: results.length > 8 ? 8 : 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    {results.length > 8 ? (
                      <>
                        <XAxis type="number" tickFormatter={fmtY} tick={{fontSize:10,fill:'#64748b'}} />
                        <YAxis type="category" dataKey="label" tick={{fontSize:10,fill:'#374151'}} width={155} />
                      </>
                    ) : (
                      <>
                        <XAxis dataKey="label" angle={-35} textAnchor="end" tick={{fontSize:10,fill:'#64748b'}} interval={0} />
                        <YAxis tickFormatter={fmtY} tick={{fontSize:11,fill:'#64748b'}} width={56} />
                      </>
                    )}
                    <Tooltip content={<CustomTip />} />
                    <Bar dataKey="value" radius={[3,3,0,0]}>
                      {results.map((r, i) => <Cell key={r.label} fill={PALETTE[i % PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Results table */}
          <div className="card">
            <div className="card-header"><h2>Results Table</h2></div>
            <div className="table-scroll" style={{ maxHeight:320 }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{GROUP_OPTIONS.find(g=>g.value===groupBy)?.label}</th>
                    <th style={{textAlign:'right'}}>{metricLabel}</th>
                    <th style={{textAlign:'right'}}>vs. Median</th>
                  </tr>
                </thead>
                <tbody>
                  {[...results].sort((a,b)=>b.value-a.value).map((r,i) => {
                    const median = results.length ? [...results].sort((a,b)=>a.value-b.value)[Math.floor(results.length/2)]?.value ?? 0 : 0;
                    const delta  = r.value - median;
                    return (
                      <tr key={r.label}>
                        <td className="rank">{i+1}</td>
                        <td style={{fontWeight:500,color:'#1e293b'}}>{r.fullLabel}</td>
                        <td style={{textAlign:'right',fontWeight:700,color:'#0369a1'}}>
                          {isMonetary ? formatCurrency(r.value) : r.value}
                        </td>
                        <td style={{textAlign:'right',fontWeight:600,color:delta>=0?'#dc2626':'#059669'}}>
                          {isMonetary ? (delta>=0?'+':'')+formatCurrency(delta, true) : (delta>=0?'+':'')+delta}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
