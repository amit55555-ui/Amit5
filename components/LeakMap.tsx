'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Leak } from '@/types';
import { timeAgo } from '@/lib/format';

// מרכז תל אביב-יפו
const TLV_CENTER: [number, number] = [32.0853, 34.7818];

const leakIcon = L.divIcon({
  className: '',
  html: '<div class="leak-pin"><span>💧</span></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 32],
  popupAnchor: [0, -30],
});

const pendingIcon = L.divIcon({
  className: '',
  html: '<div class="leak-pin leak-pin-pending"><span>📍</span></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 32],
});

function ClickCatcher({ active, onPick }: { active: boolean; onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (!active) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LeakMap({
  leaks,
  placing,
  pending,
  onPick,
}: {
  leaks: Leak[];
  placing: boolean;
  pending: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const markers = useMemo(() => leaks, [leaks]);

  return (
    <MapContainer
      center={TLV_CENTER}
      zoom={13}
      minZoom={11}
      className={`h-full w-full ${placing ? 'cursor-crosshair' : ''}`}
      attributionControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <ClickCatcher active={placing} onPick={onPick} />

      {markers.map((leak) => (
        <Marker key={leak.id} position={[leak.lat, leak.lng]} icon={leakIcon}>
          <Popup>
            <div className="w-48 text-right" dir="rtl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={leak.photoUrl}
                alt="תמונת נזילה"
                className="mb-2 h-32 w-full rounded-lg object-cover"
              />
              {leak.description && <p className="mb-1 text-sm text-ink">{leak.description}</p>}
              <p className="text-xs text-muted">{timeAgo(leak.createdAt)}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {pending && <Marker position={[pending.lat, pending.lng]} icon={pendingIcon} />}
    </MapContainer>
  );
}
