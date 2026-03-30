import React, { useMemo } from 'react';
import { PROVIDERS, REGIONS, getRegionAverages, formatCurrency } from '../data/sampleData';

export default function StatsPanel({ planId, serviceCode }) {
  const { avgRate, highest, lowest, count } = useMemo(() => {
    const allRates = PROVIDERS
      .map((p) => p.rates[planId]?.[serviceCode])
      .filter((v) => v != null);

    const avg = allRates.length
      ? allRates.reduce((a, b) => a + b, 0) / allRates.length
      : 0;

    const sorted = [...getRegionAverages(planId, serviceCode)].sort((a, b) => b.avg - a.avg);

    return {
      avgRate: avg,
      highest: sorted[0],
      lowest: sorted[sorted.length - 1],
      count: allRates.length,
    };
  }, [planId, serviceCode]);

  const cards = [
    {
      label: 'In-Network Providers',
      value: PROVIDERS.length,
      sub: `${REGIONS.length} NY regions`,
      fmt: (v) => v.toString(),
      color: '#0369a1',
    },
    {
      label: 'Statewide Avg Rate',
      value: avgRate,
      sub: 'For selected service',
      fmt: formatCurrency,
      color: '#0369a1',
    },
    {
      label: 'Highest-Rate Region',
      value: highest?.region ?? '—',
      sub: highest ? `${formatCurrency(highest.avg)} avg` : '',
      fmt: (v) => v,
      color: '#dc2626',
    },
    {
      label: 'Lowest-Rate Region',
      value: lowest?.region ?? '—',
      sub: lowest ? `${formatCurrency(lowest.avg)} avg` : '',
      fmt: (v) => v,
      color: '#059669',
    },
  ];

  return (
    <div className="stats-row">
      {cards.map((c) => (
        <div className="stat-card" key={c.label}>
          <div className="s-label">{c.label}</div>
          <div className="s-value" style={{ color: c.color }}>{c.fmt(c.value)}</div>
          <div className="s-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
