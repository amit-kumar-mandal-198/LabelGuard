'use client';

import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export default function Map() {
  return (
    <MapContainer center={[27.5, 78.5]} zoom={7} style={{ height: '100%', width: '100%', zIndex: 0 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Hotspot 1: Kanpur Railway Road */}
      <CircleMarker center={[26.4499, 80.3319]} pathOptions={{ color: '#f43f5e', fillColor: '#f43f5e', fillOpacity: 0.8 }} radius={12}>
        <Popup>
          <strong>Kanpur Railway Market</strong><br/>
          5 Dual-MRP Violations detected
        </Popup>
      </CircleMarker>

      {/* Hotspot 2: Sector 18 Noida */}
      <CircleMarker center={[28.5708, 77.3261]} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.8 }} radius={12}>
        <Popup>
          <strong>Sector 18 Superstore Hub</strong><br/>
          98% Compliance Rate (48 scans)
        </Popup>
      </CircleMarker>

      {/* Hotspot 3: Central Delhi */}
      <CircleMarker center={[28.6315, 77.2167]} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.8 }} radius={12}>
        <Popup>
          <strong>Connaught Place Trade Hub</strong><br/>
          Rule 9(6) Font Height Violations
        </Popup>
      </CircleMarker>
    </MapContainer>
  );
}
