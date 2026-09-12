'use client';

import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Hotspot {
  id: string;
  name: string;
  location: string;
  coords: [number, number];
  type: 'critical' | 'warning' | 'compliant';
  details: string;
  scans: number;
  rate?: string;
}

const HOTSPOTS: Hotspot[] = [
  // Kanpur Jurisdiction
  {
    id: 'kanpur-1',
    name: 'Kanpur Railway Market',
    location: 'Kanpur Central',
    coords: [26.4499, 80.3319],
    type: 'critical',
    details: '5 Dual-MRP Violations detected (Section 36 action required)',
    scans: 38,
  },
  {
    id: 'kanpur-2',
    name: 'Govind Nagar Retail Hub',
    location: 'Govind Nagar, Kanpur',
    coords: [26.4385, 80.3012],
    type: 'critical',
    details: '4 Missing Expiry & Date of Packaging cases',
    scans: 29,
  },
  {
    id: 'kanpur-3',
    name: 'P-Road Wholesale Corridor',
    location: 'P-Road, Kanpur',
    coords: [26.4632, 80.3248],
    type: 'warning',
    details: 'Font Height & Net Quantity Declarations under-spec',
    scans: 44,
  },
  {
    id: 'kanpur-4',
    name: 'Civil Lines Supermarket Complex',
    location: 'Civil Lines, Kanpur',
    coords: [26.4725, 80.3486],
    type: 'compliant',
    details: 'Verified legal metrology stamping & labels',
    scans: 35,
    rate: '96% Compliant',
  },

  // Noida / Greater Noida (Gautam Buddha Nagar)
  {
    id: 'noida-1',
    name: 'Sector 18 Superstore Hub',
    location: 'Sector 18, Noida',
    coords: [28.5708, 77.3261],
    type: 'compliant',
    details: 'Batch inspections passed with full unit price compliance',
    scans: 52,
    rate: '98% Compliant',
  },
  {
    id: 'noida-2',
    name: 'Sector 62 Commercial Zone',
    location: 'Sector 62, Noida',
    coords: [28.6270, 77.3725],
    type: 'compliant',
    details: 'All pre-packaged commodities compliant',
    scans: 28,
    rate: '95% Compliant',
  },
  {
    id: 'noida-3',
    name: 'Sector 104 High Street Market',
    location: 'Sector 104, Noida',
    coords: [28.5355, 77.3695],
    type: 'warning',
    details: '3 Missing Importer Address declarations on imported goods',
    scans: 31,
  },
  {
    id: 'gnoida-1',
    name: 'Pari Chowk Commercial Belt',
    location: 'Pari Chowk, Greater Noida',
    coords: [28.4646, 77.5110],
    type: 'critical',
    details: '6 Smudged MRP & Tampered Barcodes detected',
    scans: 46,
  },
  {
    id: 'gnoida-2',
    name: 'Alpha 1 Market Plaza',
    location: 'Alpha 1, Greater Noida',
    coords: [28.4732, 77.5028],
    type: 'compliant',
    details: 'Standard consumer packaged goods verified',
    scans: 22,
    rate: '93% Compliant',
  },

  // Delhi NCR Region
  {
    id: 'delhi-1',
    name: 'Connaught Place Trade Hub',
    location: 'Central Delhi',
    coords: [28.6315, 77.2167],
    type: 'warning',
    details: 'Rule 9(6) Font Height & Contrast Violations cited',
    scans: 64,
  },
  {
    id: 'delhi-2',
    name: 'Chandni Chowk Wholesale Bazaar',
    location: 'Old Delhi',
    coords: [28.6506, 77.2303],
    type: 'critical',
    details: '8 Non-standard quantity packages & missing batch numbers',
    scans: 71,
  },
  {
    id: 'delhi-3',
    name: 'Nehru Place Electronics Market',
    location: 'South Delhi',
    coords: [28.5494, 77.2528],
    type: 'compliant',
    details: 'Consumer electronics labels audited & verified',
    scans: 58,
    rate: '97% Compliant',
  },
  {
    id: 'delhi-4',
    name: 'Lajpat Nagar Central Market',
    location: 'South Delhi',
    coords: [28.5677, 77.2433],
    type: 'warning',
    details: '2 Incorrect unit sale price declarations',
    scans: 40,
  },
  {
    id: 'gurgaon-1',
    name: 'Cyber City Retail Enclave',
    location: 'DLF Cyber City, Gurugram',
    coords: [28.4962, 77.0894],
    type: 'compliant',
    details: 'Full digital compliance audit cleared',
    scans: 60,
    rate: '99% Compliant',
  },
  {
    id: 'gurgaon-2',
    name: 'Sadar Bazaar FMCG Corridor',
    location: 'Old Gurgaon',
    coords: [28.4601, 77.0266],
    type: 'critical',
    details: '7 Dual-MRP & metric dimension non-compliances',
    scans: 49,
  },
  {
    id: 'ghaziabad-1',
    name: 'Raj Nagar District Centre',
    location: 'Raj Nagar, Ghaziabad',
    coords: [28.6835, 77.4418],
    type: 'warning',
    details: 'Country of origin missing on cosmetic packages',
    scans: 33,
  },
  {
    id: 'ghaziabad-2',
    name: 'Sahibabad Industrial Area Outlets',
    location: 'Sahibabad, Ghaziabad',
    coords: [28.6710, 77.3650],
    type: 'critical',
    details: '9 Non-standard weights & packaging deficiencies',
    scans: 50,
  },
  {
    id: 'faridabad-1',
    name: 'NIT Faridabad Commercial Sector',
    location: 'NIT 1, Faridabad',
    coords: [28.3976, 77.3060],
    type: 'warning',
    details: '4 Misleading net weight declarations reported',
    scans: 37,
  },

  // Western & Central UP Corridor
  {
    id: 'meerut-1',
    name: 'Meerut Sadar Wholesale Market',
    location: 'Sadar, Meerut',
    coords: [29.0012, 77.7020],
    type: 'critical',
    details: '5 Uncertified weights and package dimension violations',
    scans: 35,
  },
  {
    id: 'meerut-2',
    name: 'Shastri Nagar Retail Walk',
    location: 'Shastri Nagar, Meerut',
    coords: [28.9740, 77.7289],
    type: 'compliant',
    details: 'Packaging compliance verified across grocery retail',
    scans: 27,
    rate: '94% Compliant',
  },
  {
    id: 'aligarh-1',
    name: 'Center Point FMCG Market',
    location: 'Center Point, Aligarh',
    coords: [27.8974, 78.0880],
    type: 'warning',
    details: 'Consumer care contact details incomplete on labels',
    scans: 26,
  },
  {
    id: 'agra-1',
    name: 'Sanjay Place Commercial Hub',
    location: 'Sanjay Place, Agra',
    coords: [27.2023, 78.0059],
    type: 'warning',
    details: '3 Dual price stamping notices served',
    scans: 36,
  },
  {
    id: 'agra-2',
    name: 'Sadar Bazaar Tourist Retail',
    location: 'Sadar Bazaar, Agra',
    coords: [27.1585, 78.0078],
    type: 'compliant',
    details: 'High compliance across packaged food & crafts',
    scans: 32,
    rate: '96% Compliant',
  },
  {
    id: 'lucknow-1',
    name: 'Aminabad Wholesale Market',
    location: 'Aminabad, Lucknow',
    coords: [26.8441, 80.9238],
    type: 'critical',
    details: '11 Section 36 Notices Pending - chronic non-compliance',
    scans: 68,
  },
  {
    id: 'lucknow-2',
    name: 'Hazratganj Retail Corridor',
    location: 'Hazratganj, Lucknow',
    coords: [26.8500, 80.9499],
    type: 'compliant',
    details: 'Full adherence to Legal Metrology (PC) Rules 2011',
    scans: 45,
    rate: '98% Compliant',
  },
];

export { HOTSPOTS };
export type { Hotspot };

interface MapProps {
  onHotspotClick?: (hotspot: Hotspot) => void;
}

export default function Map({ onHotspotClick }: MapProps) {
  const getMarkerColor = (type: Hotspot['type']) => {
    switch (type) {
      case 'critical':
        return { color: '#e11d48', fillColor: '#f43f5e' };
      case 'warning':
        return { color: '#d97706', fillColor: '#f59e0b' };
      case 'compliant':
        return { color: '#059669', fillColor: '#10b981' };
    }
  };

  return (
    <MapContainer center={[27.6, 78.6]} zoom={7} style={{ height: '100%', width: '100%', zIndex: 0 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {HOTSPOTS.map((spot) => {
        const { color, fillColor } = getMarkerColor(spot.type);
        const radius = spot.type === 'critical' ? 12 : spot.type === 'warning' ? 10 : 8;

        return (
          <CircleMarker
            key={spot.id}
            center={spot.coords}
            pathOptions={{
              color,
              fillColor,
              fillOpacity: 0.85,
              weight: 2,
            }}
            radius={radius}
            eventHandlers={{
              click: () => onHotspotClick?.(spot),
            }}
          >
            <Popup>
              <div className="p-1 min-w-[190px] text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-zinc-900 text-sm">{spot.name}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      spot.type === 'critical'
                        ? 'bg-rose-100 text-rose-700'
                        : spot.type === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {spot.type === 'critical' ? 'High Risk' : spot.type === 'warning' ? 'Watchlist' : 'Compliant'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mb-1">{spot.location}</p>
                <div className="text-[11px] text-zinc-700 bg-zinc-50 p-1.5 rounded border border-zinc-200 mb-1">
                  {spot.details}
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono mt-1 pt-1 border-t border-zinc-100">
                  <span>Scans: {spot.scans}</span>
                  {spot.rate && <span className="font-bold text-emerald-700">{spot.rate}</span>}
                </div>
                {onHotspotClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onHotspotClick(spot);
                    }}
                    className="mt-2 w-full text-center text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded py-1 transition"
                  >
                    Open Jurisdiction Dossier →
                  </button>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

