import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { PROVIDERS, PLANS, formatCurrency } from '../data/sampleData';

const TYPE_COLORS = {
  'Hospital':          '#0369a1',
  'Medical Group':     '#059669',
  'Outpatient Center': '#7c3aed',
  'Specialty Clinic':  '#d97706',
};

function RatePopup({ provider, planId, rate }) {
  const plan = PLANS.find((p) => p.id === planId);
  return (
    <div style={{ minWidth: 180 }}>
      <strong style={{ fontSize: 13 }}>{provider.name}</strong>
      <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
        {provider.type} · {provider.region}
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>NPI: {provider.npi}</div>
      <div style={{ marginTop: 6, fontWeight: 700, color: '#0369a1', fontSize: 14 }}>
        {plan?.shortName}: {formatCurrency(rate)}
      </div>
    </div>
  );
}

export default function MapView({ planId, serviceCode, selectedRegion, onRegionSelect }) {
  const annotated = useMemo(
    () =>
      PROVIDERS.map((p) => ({
        ...p,
        rate: p.rates[planId]?.[serviceCode] ?? null,
      })),
    [planId, serviceCode],
  );

  const validRates = annotated.map((p) => p.rate).filter(Boolean);
  const minRate = Math.min(...validRates);
  const maxRate = Math.max(...validRates);

  const radius = (rate) => {
    if (!rate) return 5;
    return 5 + ((rate - minRate) / (maxRate - minRate || 1)) * 11;
  };

  return (
    <>
      <div className="map-container">
        <MapContainer
          center={[42.6, -75.8]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {annotated.map(
            (p) =>
              p.rate && (
                <CircleMarker
                  key={p.id}
                  center={[p.lat, p.lng]}
                  radius={radius(p.rate)}
                  fillColor={TYPE_COLORS[p.type] ?? '#6b7280'}
                  color="white"
                  weight={1.5}
                  fillOpacity={
                    selectedRegion && selectedRegion !== p.region ? 0.25 : 0.82
                  }
                  eventHandlers={{
                    click: () =>
                      onRegionSelect(p.region === selectedRegion ? null : p.region),
                  }}
                >
                  <Popup>
                    <RatePopup provider={p} planId={planId} rate={p.rate} />
                  </Popup>
                </CircleMarker>
              ),
          )}
        </MapContainer>
      </div>

      <div className="map-legend">
        <span style={{ fontWeight: 700, color: '#374151' }}>Provider Type:</span>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div className="legend-item" key={type}>
            <div className="legend-dot" style={{ background: color }} />
            <span>{type}</span>
          </div>
        ))}
        <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 10 }}>
          Circle size ∝ negotiated rate · Click marker or bar to filter by region
        </span>
      </div>
    </>
  );
}
