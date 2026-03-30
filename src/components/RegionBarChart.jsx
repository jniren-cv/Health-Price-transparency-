import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { getRegionAverages, formatCurrency } from '../data/sampleData';

function yFmt(v) {
  if (v >= 10000) return `$${(v / 1000).toFixed(0)}k`;
  if (v >= 1000)  return `$${(v / 1000).toFixed(1)}k`;
  return `$${v}`;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{d.region}</p>
      <p style={{ color: '#0369a1', fontWeight: 700 }}>Avg: {formatCurrency(d.avg)}</p>
      <p style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{d.count} providers</p>
    </div>
  );
}

export default function RegionBarChart({ planId, serviceCode, selectedRegion, onRegionSelect }) {
  const data = useMemo(() => getRegionAverages(planId, serviceCode), [planId, serviceCode]);
  const stateAvg = data.reduce((s, d) => s + d.avg, 0) / (data.length || 1);

  return (
    <ResponsiveContainer width="100%" height={368}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 5, bottom: 70 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="region"
          angle={-38}
          textAnchor="end"
          tick={{ fontSize: 11, fill: '#64748b' }}
          interval={0}
        />
        <YAxis tickFormatter={yFmt} tick={{ fontSize: 11, fill: '#64748b' }} width={52} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={stateAvg}
          stroke="#f97316"
          strokeDasharray="5 3"
          label={{ value: 'State avg', position: 'insideTopRight', fontSize: 10, fill: '#f97316', dy: -4 }}
        />
        <Bar dataKey="avg" radius={[4, 4, 0, 0]} cursor="pointer">
          {data.map((entry) => {
            const isSelected = selectedRegion === entry.region;
            const dimmed = selectedRegion && !isSelected;
            const fill = isSelected ? '#f97316' : entry.avg > stateAvg ? '#0369a1' : '#7c3aed';
            return (
              <Cell
                key={entry.region}
                fill={fill}
                opacity={dimmed ? 0.4 : 1}
                onClick={() => onRegionSelect(isSelected ? null : entry.region)}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
