import React, { useMemo } from 'react';
import { PROVIDERS, PLANS, formatCurrency } from '../data/sampleData';

const BADGE_CLASS = {
  'Hospital':          'badge badge-Hospital',
  'Medical Group':     'badge badge-Medical',
  'Outpatient Center': 'badge badge-Outpatient',
  'Specialty Clinic':  'badge badge-Specialty',
};

export default function ProviderTable({ planId, serviceCode, selectedRegion }) {
  const rows = useMemo(
    () =>
      PROVIDERS.filter((p) => !selectedRegion || p.region === selectedRegion)
        .map((p) => ({ ...p, rate: p.rates[planId]?.[serviceCode] ?? null }))
        .filter((p) => p.rate !== null)
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 15),
    [planId, serviceCode, selectedRegion],
  );

  const plan = PLANS.find((p) => p.id === planId);

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Provider</th>
            <th>Region</th>
            <th>Type</th>
            <th style={{ textAlign: 'right' }}>{plan?.shortName} Rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={p.id}>
              <td className="rank">{i + 1}</td>
              <td>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.name}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>NPI {p.npi}</div>
              </td>
              <td style={{ color: '#475569', whiteSpace: 'nowrap' }}>{p.region}</td>
              <td>
                <span className={BADGE_CLASS[p.type] ?? 'badge'}>
                  {p.type.split(' ')[0]}
                </span>
              </td>
              <td style={{ textAlign: 'right', fontWeight: 700, color: '#0369a1' }}>
                {formatCurrency(p.rate)}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0' }}>
                No providers found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
