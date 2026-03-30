import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, ScatterChart, Scatter, ZAxis, Legend,
} from 'recharts';
import {
  PLANS, CPT_CODES, REGIONS, PROVIDERS, REGION_META,
  getRegionAverages, getPercentiles, getRateSpread,
  formatCurrency, cptByCode,
} from '../data/sampleData';

function StatCard({ label, value, sub, color = '#0369a1' }) {
  return (
    <div className="stat-card">
      <div className="s-label">{label}</div>
      <div className="s-value" style={{ color }}>{value}</div>
      {sub && <div className="s-sub">{sub}</div>}
    </div>
  );
}

const REGION_COLORS = [
  '#0369a1','#0891b2','#0d9488','#059669','#65a30d',
  '#ca8a04','#d97706','#dc2626','#db2777','#7c3aed','#4f46e5','#2563eb',
];

export default function OverviewPage() {
  const [planId, setPlanId]   = useState(PLANS[0].id);
  const [cptCode, setCptCode] = useState('99214');

  const plan  = PLANS.find(p => p.id === planId);
  const cpt   = cptByCode[cptCode];
  const pct   = useMemo(() => getPercentiles(planId, cptCode), [planId, cptCode]);
  const regionAvgs = useMemo(() => getRegionAverages(planId, cptCode), [planId, cptCode]);
  const stateAvg   = useMemo(() => {
    const avgs = regionAvgs.map(r => r.avg).filter(Boolean);
    return avgs.length ? Math.round(avgs.reduce((a,b)=>a+b,0)/avgs.length*100)/100 : 0;
  }, [regionAvgs]);

  const spread = useMemo(() => getRateSpread(planId).sort((a,b)=>b.spreadPct-a.spreadPct), [planId]);

  // Cost-of-care multiplier scatter (region mul vs avg rate)
  const scatterData = useMemo(() =>
    regionAvgs.map((r, i) => ({
      name: r.region,
      x: REGION_META[r.region]?.mul ?? 1,
      y: r.avg,
      z: REGION_META[r.region]?.providerCount ?? 4,
      color: REGION_COLORS[i % REGION_COLORS.length],
    })).filter(r => r.y > 0),
  [regionAvgs]);

  const fmtY = (v) => v >= 10000 ? `$${(v/1000).toFixed(0)}k` : v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v}`;

  const CustomBarTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="tooltip-box">
        <strong>{d.region}</strong>
        <div style={{ color: '#0369a1' }}>Avg: {formatCurrency(d.avg)}</div>
        <div style={{ color: '#94a3b8', fontSize: 11 }}>Min {formatCurrency(d.min)} · Max {formatCurrency(d.max)}</div>
      </div>
    );
  };

  const CustomScatterTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="tooltip-box">
        <strong>{d.name}</strong>
        <div>Cost index: {d.x.toFixed(2)}</div>
        <div style={{ color: '#0369a1' }}>Avg rate: {formatCurrency(d.y)}</div>
      </div>
    );
  };

  return (
    <div className="page">
      {/* Controls */}
      <div className="controls-bar">
        <div className="filter-group">
          <label>Plan</label>
          <select value={planId} onChange={e => setPlanId(e.target.value)}>
            {PLANS.map(p => <option key={p.id} value={p.id}>{p.shortName}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Benchmark CPT Code</label>
          <select value={cptCode} onChange={e => setCptCode(e.target.value)}>
            {CPT_CODES.map(c => <option key={c.code} value={c.code}>{c.code} – {c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-row">
        <StatCard label="Total In-Network Providers" value={PROVIDERS.length} sub={`${REGIONS.length} NY regions`} />
        <StatCard label="Statewide Avg Rate" value={formatCurrency(stateAvg, true)} sub={`${cpt?.name} · ${plan?.shortName}`} />
        <StatCard label="Market P50 (Median)" value={formatCurrency(pct.p50, true)} sub="Statewide median negotiated rate" />
        <StatCard label="P25 → P75 Range" value={`${formatCurrency(pct.p25,true)} – ${formatCurrency(pct.p75,true)}`} sub="Middle 50% of negotiated rates" color="#7c3aed" />
      </div>

      {/* Top row: regional bar + scatter */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2>Average Rate by Region</h2>
            <p>{cpt?.name} · {plan?.shortName}</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={regionAvgs} margin={{ top:8, right:16, left:8, bottom:70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="region" angle={-38} textAnchor="end" tick={{ fontSize:11, fill:'#64748b' }} interval={0} />
                <YAxis tickFormatter={fmtY} tick={{ fontSize:11, fill:'#64748b' }} width={52} />
                <Tooltip content={<CustomBarTip />} />
                <Bar dataKey="avg" radius={[4,4,0,0]}>
                  {regionAvgs.map((r, i) => (
                    <Cell key={r.region} fill={REGION_COLORS[i % REGION_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Cost-of-Care Index vs Avg Rate</h2>
            <p>Each bubble = one region · Size = provider count</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top:8, right:16, left:8, bottom:8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="x" type="number" name="Cost Index" domain={[0.7,1.65]} tick={{ fontSize:11 }} label={{ value:'Cost Index', position:'insideBottom', offset:-4, fontSize:11, fill:'#94a3b8' }} />
                <YAxis dataKey="y" tickFormatter={fmtY} tick={{ fontSize:11, fill:'#64748b' }} width={52} />
                <ZAxis dataKey="z" range={[60,300]} />
                <Tooltip content={<CustomScatterTip />} />
                <Scatter data={scatterData} fill="#0369a1">
                  {scatterData.map(d => <Cell key={d.name} fill={d.color} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom: rate spread table */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-header">
          <h2>Rate Variability by CPT Code</h2>
          <p>High spread = wider negotiating range · {plan?.shortName} · statewide</p>
        </div>
        <div className="table-scroll" style={{ maxHeight: 340 }}>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Service</th>
                <th>Category</th>
                <th style={{ textAlign:'right' }}>P25</th>
                <th style={{ textAlign:'right' }}>P50 (Median)</th>
                <th style={{ textAlign:'right' }}>P75</th>
                <th style={{ textAlign:'right' }}>Rate Spread</th>
                <th style={{ textAlign:'right' }}>Spread %</th>
              </tr>
            </thead>
            <tbody>
              {spread.map(c => (
                <tr key={c.code}>
                  <td><code style={{ background:'#f1f5f9', padding:'1px 5px', borderRadius:3 }}>{c.code}</code></td>
                  <td style={{ color:'#1e293b', fontWeight:500 }}>{c.name}</td>
                  <td><span className={`badge badge-${c.category.replace(/[^a-z]/gi,'')}`}>{c.category}</span></td>
                  <td style={{ textAlign:'right', color:'#059669' }}>{formatCurrency(c.p25)}</td>
                  <td style={{ textAlign:'right', fontWeight:600 }}>{formatCurrency(c.p50)}</td>
                  <td style={{ textAlign:'right', color:'#dc2626' }}>{formatCurrency(c.p75)}</td>
                  <td style={{ textAlign:'right', fontWeight:700, color:'#0369a1' }}>{formatCurrency(c.spread)}</td>
                  <td style={{ textAlign:'right' }}>
                    <span style={{
                      color: c.spreadPct > 25 ? '#dc2626' : c.spreadPct > 15 ? '#d97706' : '#059669',
                      fontWeight: 700,
                    }}>{c.spreadPct.toFixed(1)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
