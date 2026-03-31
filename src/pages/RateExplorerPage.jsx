import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import {
  PLANS, CPT_CODES, REGIONS, PROVIDERS, CPT_CATEGORIES, SPECIALTIES,
  getRegionAverages, getPercentiles, formatCurrency, cptByCode,
} from '../data/index.js';

const TYPE_COLORS = { 'Hospital':'#0369a1','Medical Group':'#059669','Outpatient Center':'#7c3aed','Specialty Clinic':'#d97706' };

export default function RateExplorerPage() {
  const [planId,   setPlanId]   = useState(PLANS[0].id);
  const [cptCode,  setCptCode]  = useState('99214');
  const [region,   setRegion]   = useState(null);
  const [category, setCategory] = useState('');
  const [sortBy,   setSortBy]   = useState('rate-desc');

  const cpt  = cptByCode[cptCode];
  const plan = PLANS.find(p => p.id === planId);

  // Filter CPT codes by category
  const visibleCodes = useMemo(() =>
    category ? CPT_CODES.filter(c => c.category === category) : CPT_CODES,
  [category]);

  // Regional averages + state avg ref line
  const regionData = useMemo(() => getRegionAverages(planId, cptCode), [planId, cptCode]);
  const stateAvg   = useMemo(() => {
    const vals = regionData.map(r => r.avg).filter(Boolean);
    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
  }, [regionData]);
  const pct = useMemo(() => getPercentiles(planId, cptCode, region), [planId, cptCode, region]);

  // Providers table
  const tableRows = useMemo(() => {
    let rows = PROVIDERS
      .filter(p => !region || p.region === region)
      .map(p => ({ ...p, rate: p.rates[planId]?.[cptCode] ?? null }))
      .filter(p => p.rate != null);
    if (sortBy === 'rate-desc') rows.sort((a,b) => b.rate - a.rate);
    if (sortBy === 'rate-asc')  rows.sort((a,b) => a.rate - b.rate);
    if (sortBy === 'name')      rows.sort((a,b) => a.name.localeCompare(b.name));
    return rows;
  }, [planId, cptCode, region, sortBy]);

  // Map providers (with rates)
  const mapProviders = useMemo(() =>
    PROVIDERS.map(p => ({ ...p, rate: p.rates[planId]?.[cptCode] ?? null })).filter(p => p.rate),
  [planId, cptCode]);
  const rateMin = Math.min(...mapProviders.map(p => p.rate));
  const rateMax = Math.max(...mapProviders.map(p => p.rate));
  const radius  = (r) => 5 + ((r - rateMin) / (rateMax - rateMin || 1)) * 11;

  const fmtY = v => v >= 10000 ? `$${(v/1000).toFixed(0)}k` : v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v}`;

  const BarTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return <div className="tooltip-box"><strong>{d.region}</strong><div style={{color:'#0369a1'}}>Avg: {formatCurrency(d.avg)}</div><div style={{fontSize:11,color:'#94a3b8'}}>{d.count} providers</div></div>;
  };

  return (
    <div className="page">
      {/* Filters */}
      <div className="controls-bar">
        <div className="filter-group">
          <label>Category</label>
          <select value={category} onChange={e => { setCategory(e.target.value); setCptCode(CPT_CODES.find(c => !e.target.value || c.category === e.target.value)?.code ?? cptCode); }}>
            <option value="">All Categories</option>
            {CPT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>CPT Code</label>
          <select value={cptCode} onChange={e => setCptCode(e.target.value)}>
            {visibleCodes.map(c => <option key={c.code} value={c.code}>{c.code} – {c.name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Plan</label>
          <select value={planId} onChange={e => setPlanId(e.target.value)}>
            {PLANS.map(p => <option key={p.id} value={p.id}>{p.shortName}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Region</label>
          <select value={region ?? ''} onChange={e => setRegion(e.target.value || null)}>
            <option value="">All Regions</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {region && <button className="clear-btn" onClick={() => setRegion(null)}>✕ {region}</button>}
      </div>

      {/* Percentile pills */}
      <div className="pct-bar">
        <span className="pct-label">Market rates {region ? `in ${region}` : 'statewide'} · {cpt?.name} · {plan?.shortName}:</span>
        {[['P25', pct.p25, '#059669'], ['P50 Median', pct.p50, '#0369a1'], ['P75', pct.p75, '#d97706'], ['P90', pct.p90, '#dc2626']].map(([label, val, color]) => (
          <div key={label} className="pct-pill" style={{ borderColor: color }}>
            <span style={{ color, fontWeight:700 }}>{label}</span>
            <span style={{ color:'#1e293b', fontWeight:800, fontSize:15 }}>{formatCurrency(val)}</span>
          </div>
        ))}
      </div>

      {/* Map + Bar Chart */}
      <div className="grid-2">
        {/* Map */}
        <div className="card">
          <div className="card-header">
            <h2>Provider Locations — {cpt?.name}</h2>
            <p>Marker size ∝ rate · Click to filter by region</p>
          </div>
          <div style={{ height: 380 }}>
            <MapContainer center={[42.6,-75.8]} zoom={6} style={{height:'100%',width:'100%'}} scrollWheelZoom={false}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {mapProviders.map(p => (
                <CircleMarker key={p.id} center={[p.lat,p.lng]} radius={radius(p.rate)}
                  fillColor={TYPE_COLORS[p.type]??'#6b7280'} color="white" weight={1.5}
                  fillOpacity={region && region !== p.region ? 0.2 : 0.82}
                  eventHandlers={{ click: () => setRegion(p.region === region ? null : p.region) }}>
                  <Popup>
                    <strong>{p.name}</strong><br/>
                    <span style={{color:'#64748b',fontSize:11}}>{p.type} · {p.region}</span><br/>
                    <span style={{fontWeight:700,color:'#0369a1'}}>{plan?.shortName}: {formatCurrency(p.rate)}</span>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          <div className="map-legend">
            {Object.entries(TYPE_COLORS).map(([t,c]) => (
              <div key={t} className="legend-item"><div className="legend-dot" style={{background:c}}/><span>{t}</span></div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="card">
          <div className="card-header">
            <h2>Average Rate by Region</h2>
            <p>Click a bar to filter · Dashed line = statewide avg</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={regionData} margin={{top:8,right:24,left:4,bottom:72}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="region" angle={-38} textAnchor="end" tick={{fontSize:10,fill:'#64748b'}} interval={0} />
                <YAxis tickFormatter={fmtY} tick={{fontSize:11,fill:'#64748b'}} width={52} />
                <Tooltip content={<BarTip />} />
                <ReferenceLine y={stateAvg} stroke="#f97316" strokeDasharray="5 3"
                  label={{value:'State avg',position:'insideTopRight',fontSize:10,fill:'#f97316',dy:-4}} />
                <Bar dataKey="avg" radius={[4,4,0,0]} cursor="pointer">
                  {regionData.map(r => (
                    <Cell key={r.region}
                      fill={region === r.region ? '#f97316' : r.avg > stateAvg ? '#0369a1' : '#7c3aed'}
                      opacity={region && region !== r.region ? 0.4 : 1}
                      onClick={() => setRegion(r.region === region ? null : r.region)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Provider Table */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h2>Provider Rates — {cpt?.name}</h2>
            <p>{plan?.shortName}{region ? ` · ${region}` : ' · All regions'} · {tableRows.length} providers</p>
          </div>
          <div className="filter-group" style={{ marginBottom:0 }}>
            <label>Sort by</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ minWidth:160 }}>
              <option value="rate-desc">Rate: High → Low</option>
              <option value="rate-asc">Rate: Low → High</option>
              <option value="name">Provider Name</option>
            </select>
          </div>
        </div>
        <div className="table-scroll" style={{ maxHeight:400 }}>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Provider</th><th>Region</th><th>Type</th><th>Specialty</th>
                <th style={{textAlign:'right'}}>Negotiated Rate</th>
                <th style={{textAlign:'right'}}>vs. P50</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((p, i) => {
                const delta = p.rate - pct.p50;
                const pct50Color = delta >= 0 ? '#dc2626' : '#059669';
                return (
                  <tr key={p.id}>
                    <td className="rank">{i+1}</td>
                    <td>
                      <div style={{fontWeight:600,color:'#1e293b'}}>{p.name}</div>
                      <div style={{fontSize:10,color:'#94a3b8'}}>NPI {p.npi}</div>
                    </td>
                    <td style={{color:'#475569'}}>{p.region}</td>
                    <td><span className={`badge badge-${p.type.split(' ')[0]}`}>{p.type.split(' ')[0]}</span></td>
                    <td style={{color:'#475569',fontSize:12}}>{p.specialty}</td>
                    <td style={{textAlign:'right',fontWeight:700,color:'#0369a1'}}>{formatCurrency(p.rate)}</td>
                    <td style={{textAlign:'right',fontWeight:600,color:pct50Color}}>
                      {delta >= 0 ? '+' : ''}{formatCurrency(delta)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
