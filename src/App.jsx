import React, { useState } from 'react';
import { PLANS, SERVICES, REGIONS } from './data/sampleData';
import aetnaIndex from './data/aetna_index.json';
import StatsPanel from './components/StatsPanel';
import MapView from './components/MapView';
import RegionBarChart from './components/RegionBarChart';
import PlanComparisonChart from './components/PlanComparisonChart';
import ProviderTable from './components/ProviderTable';

export default function App() {
  const [planId, setPlanId]           = useState(PLANS[0].id);
  const [serviceCode, setServiceCode] = useState(SERVICES[0].code);
  const [region, setRegion]           = useState(null);

  const service    = SERVICES.find((s) => s.code === serviceCode);
  const plan       = PLANS.find((p) => p.id === planId);
  const totalFiles = aetnaIndex.reporting_structure.length;

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="header">
        <h1>Aetna NY Provider Revenue Comparison Dashboard</h1>
        <p>
          {aetnaIndex.reporting_entity_name}&nbsp;·&nbsp;
          {aetnaIndex.reporting_entity_type}&nbsp;·&nbsp;
          Last updated: {aetnaIndex.last_updated_on}&nbsp;·&nbsp;
          {totalFiles} in-network MRF files &nbsp;·&nbsp;
          Sample data — run <code style={{ fontSize: 11 }}>scripts/extract_rates.py</code> to load real rates
        </p>
      </div>

      <div className="dashboard">
        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div className="filters-row">
          <div className="filter-group">
            <label>Service / CPT Code</label>
            <select value={serviceCode} onChange={(e) => setServiceCode(e.target.value)}>
              {SERVICES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} — {s.description}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Insurance Plan</label>
            <select value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {PLANS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.shortName} ({p.id})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Region Filter</label>
            <select value={region ?? ''} onChange={(e) => setRegion(e.target.value || null)}>
              <option value="">All Regions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {region && (
            <button className="clear-btn" onClick={() => setRegion(null)}>
              ✕ Clear: {region}
            </button>
          )}
        </div>

        {/* ── Stats Cards ──────────────────────────────────────────────── */}
        <StatsPanel planId={planId} serviceCode={serviceCode} />

        {/* ── Map + Regional Bar Chart ─────────────────────────────────── */}
        <div className="main-grid">
          <div className="card">
            <div className="card-header">
              <h2>Provider Map — Negotiated Rates by Location</h2>
              <p>
                {service?.description} · {plan?.shortName}
                {region ? ` · Filtered: ${region}` : ''}
              </p>
            </div>
            <MapView
              planId={planId}
              serviceCode={serviceCode}
              selectedRegion={region}
              onRegionSelect={setRegion}
            />
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Average Negotiated Rate by Region</h2>
              <p>
                {plan?.shortName} · Click a bar to filter · Orange line = statewide avg
              </p>
            </div>
            <div className="card-body">
              <RegionBarChart
                planId={planId}
                serviceCode={serviceCode}
                selectedRegion={region}
                onRegionSelect={setRegion}
              />
            </div>
          </div>
        </div>

        {/* ── Plan Comparison + Provider Table ─────────────────────────── */}
        <div className="bottom-grid">
          <div className="card">
            <div className="card-header">
              <h2>Plan 3140 vs Plan 3139 — Rate Comparison</h2>
              <p>
                {service?.description}
                {region ? ` · ${region}` : ' · All regions'}
              </p>
            </div>
            <div className="card-body">
              <PlanComparisonChart serviceCode={serviceCode} selectedRegion={region} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Top Providers by Negotiated Rate</h2>
              <p>
                {service?.description} · {plan?.shortName}
                {region ? ` · ${region}` : ' · Top 15 statewide'}
              </p>
            </div>
            <ProviderTable planId={planId} serviceCode={serviceCode} selectedRegion={region} />
          </div>
        </div>
      </div>
    </div>
  );
}
