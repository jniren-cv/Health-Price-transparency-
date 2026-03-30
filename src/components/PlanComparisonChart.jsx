import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { REGIONS, getRegionAverages, formatCurrency } from '../data/sampleData';

function yFmt(v) {
  if (v >= 10000) return `$${(v / 1000).toFixed(0)}k`;
  if (v >= 1000)  return `$${(v / 1000).toFixed(1)}k`;
  return `$${v}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const v3140 = payload.find((p) => p.name === 'Plan 3140')?.value ?? 0;
  const v3139 = payload.find((p) => p.name === 'Plan 3139')?.value ?? 0;
  const diff = v3140 - v3139;

  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill, marginBottom: 2, fontWeight: 600 }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
      <p style={{
        fontSize: 11, marginTop: 6,
        color: diff > 0 ? '#dc2626' : '#059669', fontWeight: 700,
      }}>
        3140 vs 3139: {diff > 0 ? '+' : ''}{formatCurrency(diff)}
      </p>
    </div>
  );
}

export default function PlanComparisonChart({ serviceCode, selectedRegion }) {
  const data = useMemo(() => {
    const d3140 = getRegionAverages('17210NY009', serviceCode);
    const d3139 = getRegionAverages('68485NY001', serviceCode);
    const regions = selectedRegion ? [selectedRegion] : REGIONS;

    return regions.map((region) => ({
      region,
      'Plan 3140': d3140.find((d) => d.region === region)?.avg ?? 0,
      'Plan 3139': d3139.find((d) => d.region === region)?.avg ?? 0,
    }));
  }, [serviceCode, selectedRegion]);

  const angleNeeded = data.length > 4;

  return (
    <ResponsiveContainer width="100%" height={368}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 5, bottom: angleNeeded ? 70 : 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="region"
          angle={angleNeeded ? -38 : 0}
          textAnchor={angleNeeded ? 'end' : 'middle'}
          tick={{ fontSize: 11, fill: '#64748b' }}
          interval={0}
        />
        <YAxis tickFormatter={yFmt} tick={{ fontSize: 11, fill: '#64748b' }} width={52} />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12, paddingBottom: 4 }} />
        <Bar dataKey="Plan 3140" fill="#0369a1" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Plan 3139" fill="#7c3aed" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
