import React, { useState } from 'react';
import OverviewPage      from './pages/OverviewPage';
import RateExplorerPage  from './pages/RateExplorerPage';
import RevenueImpactPage from './pages/RevenueImpactPage';
import QueryBuilderPage  from './pages/QueryBuilderPage';
import aetnaIndex from './data/aetna_index.json';

const TABS = [
  { id: 'overview',  label: '📊 Overview' },
  { id: 'explorer',  label: '🗺 Rate Explorer' },
  { id: 'revenue',   label: '💰 Revenue Impact' },
  { id: 'query',     label: '🔍 Query Builder' },
];

export default function App() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="app-shell">
      {/* ── Top Bar ── */}
      <header className="topbar">
        <div className="topbar-inner">
          <div>
            <div className="topbar-title">Aetna NY Provider Rate Intelligence</div>
            <div className="topbar-sub">
              {aetnaIndex.reporting_entity_name} &nbsp;·&nbsp;
              {aetnaIndex.reporting_structure.length} in-network MRF files &nbsp;·&nbsp;
              Updated {aetnaIndex.last_updated_on}
            </div>
          </div>
          <nav className="tab-nav">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`tab-btn${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="page-content">
        {tab === 'overview' && <OverviewPage />}
        {tab === 'explorer' && <RateExplorerPage />}
        {tab === 'revenue'  && <RevenueImpactPage />}
        {tab === 'query'    && <QueryBuilderPage />}
      </main>
    </div>
  );
}
