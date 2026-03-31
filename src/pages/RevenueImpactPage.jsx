import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Cell,
  ComposedChart, Line, Area,
} from 'recharts';
import {
  PLANS, CPT_CODES, REGIONS, getPercentiles, getRates,
  formatCurrency, formatDelta, cptByCode,
} from '../data/index.js';

function Input({ label, value, onChange, prefix, suffix, type='number', min, max, step='1' }) {
  return (
    <div className="filter-group" style={{ flex:1 }}>
      <label>{label}</label>
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        {prefix && <span style={{ color:'#64748b', fontWeight:600 }}>{prefix}</span>}
        <input
          type={type} value={value} min={min} max={max} step={step}
          onChange={e => onChange(e.target.value)}
          style={{
            padding:'7px 10px', border:'1px solid #cbd5e1', borderRadius:6,
            fontSize:14, width:'100%', background:'#f8fafc',
          }}
        />
        {suffix && <span style={{ color:'#64748b' }}>{suffix}</span>}
      </div>
    </div>
  );
}

const PERCENTILE_TARGETS = [
  { label: 'P25 (Low)',    key: 'p25', color: '#059669' },
  { label: 'P50 (Median)', key: 'p50', color: '#0369a1' },
  { label: 'P75 (High)',   key: 'p75', color: '#d97706' },
  { label: 'P90 (Top)',    key: 'p90', color: '#dc2626' },
];

export default function RevenueImpactPage() {
  const [planId,      setPlanId]      = useState(PLANS[0].id);
  const [cptCode,     setCptCode]     = useState('99214');
  const [region,      setRegion]      = useState('');
  const [myRate,      setMyRate]      = useState('');
  const [annualVol,   setAnnualVol]   = useState('1000');

  const cpt  = cptByCode[cptCode];
  const plan = PLANS.find(p => p.id === planId);
  const filterRegion = region || null;

  const pct = useMemo(() => getPercentiles(planId, cptCode, filterRegion), [planId, cptCode, filterRegion]);

  const currentRate = parseFloat(myRate) || 0;
  const volume      = parseInt(annualVol, 10) || 0;
  const currentRev  = currentRate * volume;

  // Market position
  const marketRates = useMemo(() => getRates(planId, cptCode, filterRegion).sort((a,b)=>a-b), [planId, cptCode, filterRegion]);
  const myPercentile = useMemo(() => {
    if (!currentRate || !marketRates.length) return null;
    const below = marketRates.filter(r => r <= currentRate).length;
    return Math.round((below / marketRates.length) * 100);
  }, [currentRate, marketRates]);

  // Revenue impact bars
  const impactData = useMemo(() =>
    PERCENTILE_TARGETS.map(t => {
      const targetRate = pct[t.key];
      const targetRev  = targetRate * volume;
      const delta      = targetRev - currentRev;
      return { ...t, rate: targetRate, revenue: targetRev, delta, annualDelta: delta };
    }),
  [pct, volume, currentRev]);

  // Rate distribution histogram
  const histData = useMemo(() => {
    if (!marketRates.length) return [];
    const min = marketRates[0], max = marketRates[marketRates.length-1];
    const buckets = 10;
    const width   = (max - min) / buckets || 1;
    const bins    = Array.from({ length: buckets }, (_, i) => ({
      range: `$${Math.round(min + i * width)}`,
      rangeEnd: min + (i+1) * width,
      rangeStart: min + i * width,
      count: 0,
    }));
    for (const r of marketRates) {
      const i = Math.min(Math.floor((r - min) / width), buckets - 1);
      bins[i].count++;
    }
    return bins;
  }, [marketRates]);

  const fmtY   = v => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v/1e3).toFixed(0)}k` : `$${v}`;
  const fmtAx  = v => v >= 10000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`;

  const ImpactTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="tooltip-box">
        <strong>{d.label}</strong>
        <div>Rate: {formatCurrency(d.rate)}</div>
        <div>Annual Revenue: {formatCurrency(d.revenue)}</div>
        <div style={{ color: d.delta >= 0 ? '#059669' : '#dc2626', fontWeight:700 }}>
          vs. current: {formatDelta(d.annualDelta)}
        </div>
      </div>
    );
  };

  const HistTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="tooltip-box">
        <div>Range: {formatCurrency(d.rangeStart)} – {formatCurrency(d.rangeEnd)}</div>
        <div style={{ fontWeight:700 }}>{d.count} providers</div>
      </div>
    );
  };

  return (
    <div className="page">
      {/* Inputs */}
      <div className="controls-bar" style={{ flexWrap:'wrap', gap:12 }}>
        <div className="filter-group">
          <label>Plan</label>
          <select value={planId} onChange={e => setPlanId(e.target.value)}>
            {PLANS.map(p => <option key={p.id} value={p.id}>{p.shortName}</option>)}
          </select>
        </div>
        <div className="filter-group" style={{ minWidth:280 }}>
          <label>CPT Code</label>
          <select value={cptCode} onChange={e => setCptCode(e.target.value)}>
            {CPT_CODES.map(c => <option key={c.code} value={c.code}>{c.code} – {c.name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Your Region (optional)</label>
          <select value={region} onChange={e => setRegion(e.target.value)}>
            <option value="">Statewide Market</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <Input label="Your Current Rate" value={myRate} onChange={setMyRate} prefix="$" step="0.01" min="0" />
        <Input label="Annual Visit Volume" value={annualVol} onChange={setAnnualVol} suffix="visits/yr" min="1" />
      </div>

      {/* Market Position Banner */}
      {currentRate > 0 && (
        <div className="position-banner">
          <div className="position-banner-inner">
            <div>
              <div style={{ fontSize:12, color:'#94a3b8', marginBottom:4 }}>YOUR CURRENT RATE</div>
              <div style={{ fontSize:28, fontWeight:800, color:'#1e293b' }}>{formatCurrency(currentRate)}</div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{cpt?.name} · {plan?.shortName}{region ? ` · ${region}` : ' · Statewide'}</div>
            </div>
            {myPercentile !== null && (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:12, color:'#94a3b8', marginBottom:4 }}>MARKET PERCENTILE</div>
                <div style={{ fontSize:28, fontWeight:800, color: myPercentile >= 75 ? '#dc2626' : myPercentile >= 50 ? '#d97706' : '#059669' }}>
                  {myPercentile}th
                </div>
                <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>
                  {myPercentile >= 75 ? 'Above most providers' : myPercentile >= 50 ? 'Above market median' : 'Below market median'}
                </div>
              </div>
            )}
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:12, color:'#94a3b8', marginBottom:4 }}>CURRENT ANNUAL REVENUE</div>
              <div style={{ fontSize:28, fontWeight:800, color:'#0369a1' }}>{formatCurrency(currentRev, true)}</div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Based on {volume.toLocaleString()} visits/yr</div>
            </div>
            <div>
              <div style={{ fontSize:11, color:'#94a3b8', marginBottom:6 }}>MARKET BENCHMARKS</div>
              {PERCENTILE_TARGETS.map(t => (
                <div key={t.key} style={{ display:'flex', justifyContent:'space-between', gap:12, marginBottom:3 }}>
                  <span style={{ fontSize:12, color:'#64748b' }}>{t.label}</span>
                  <span style={{ fontSize:12, fontWeight:700, color: t.color }}>{formatCurrency(pct[t.key])}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Revenue Impact Chart */}
        <div className="card">
          <div className="card-header">
            <h2>Revenue at Each Market Percentile</h2>
            <p>{volume.toLocaleString()} annual visits · {cpt?.name}</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={impactData} margin={{top:8,right:16,left:8,bottom:8}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{fontSize:11,fill:'#64748b'}} />
                <YAxis tickFormatter={fmtY} tick={{fontSize:11,fill:'#64748b'}} width={60} />
                <Tooltip content={<ImpactTip />} />
                {currentRate > 0 && (
                  <ReferenceLine y={currentRev} stroke="#6b7280" strokeDasharray="5 3"
                    label={{value:'Current',position:'insideTopRight',fontSize:10,fill:'#6b7280'}} />
                )}
                <Bar dataKey="revenue" radius={[4,4,0,0]}>
                  {impactData.map(d => <Cell key={d.key} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Delta table */}
            {currentRate > 0 && (
              <div style={{ marginTop:16, borderTop:'1px solid #f1f5f9', paddingTop:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#64748b', marginBottom:8 }}>ANNUAL REVENUE IMPACT vs. YOUR CURRENT RATE</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                  {impactData.map(d => (
                    <div key={d.key} style={{ background:'#f8fafc', borderRadius:8, padding:'10px 14px', border:`2px solid ${d.color}20` }}>
                      <div style={{ fontSize:11, color:'#64748b', marginBottom:3 }}>{d.label}</div>
                      <div style={{ fontSize:16, fontWeight:800, color: d.delta >= 0 ? '#059669' : '#dc2626' }}>
                        {formatDelta(d.annualDelta)}
                      </div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>per year</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rate Distribution */}
        <div className="card">
          <div className="card-header">
            <h2>Market Rate Distribution</h2>
            <p>{cpt?.name} · {plan?.shortName}{region ? ` · ${region}` : ' · Statewide'} · {marketRates.length} providers</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={histData} margin={{top:8,right:16,left:8,bottom:8}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{fontSize:10,fill:'#64748b'}} />
                <YAxis tick={{fontSize:11,fill:'#64748b'}} />
                <Tooltip content={<HistTip />} />
                {currentRate > 0 && (
                  <ReferenceLine x={histData.find(b => currentRate >= b.rangeStart && currentRate < b.rangeEnd)?.range}
                    stroke="#f97316" strokeWidth={2} label={{value:'You',position:'top',fontSize:10,fill:'#f97316'}} />
                )}
                <Bar dataKey="count" fill="#0369a1" radius={[3,3,0,0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>

            {/* Percentile markers */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:12, paddingTop:12, borderTop:'1px solid #f1f5f9' }}>
              {PERCENTILE_TARGETS.map(t => (
                <div key={t.key} style={{ flex:1, minWidth:80, textAlign:'center', padding:'8px 4px', background:'#f8fafc', borderRadius:6, border:`1px solid ${t.color}40` }}>
                  <div style={{ fontSize:10, color:'#94a3b8' }}>{t.label}</div>
                  <div style={{ fontWeight:800, color:t.color, fontSize:15 }}>{formatCurrency(pct[t.key], true)}</div>
                </div>
              ))}
            </div>

            {/* Help text */}
            <div style={{ marginTop:16, padding:'10px 14px', background:'#eff6ff', borderRadius:8, border:'1px solid #bfdbfe' }}>
              <div style={{ fontSize:12, color:'#1d4ed8', lineHeight:1.5 }}>
                <strong>How to use this tool:</strong> Enter your current negotiated rate and annual visit volume above.
                The chart shows your potential annual revenue at each market percentile.
                Use this to benchmark your rate and model the financial impact of renegotiating your Aetna contract.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
