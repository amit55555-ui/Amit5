'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
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

export type FlyTarget = { lat: number; lng: number; zoom: number; token: number };

function FlyTo({ target }: { target: FlyTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], target.zoom, { duration: 0.75 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.token]);
  return null;
}

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
  clickable,
  pending,
  pendingDraggable,
  flyTarget,
  onPick,
  onDragPending,
}: {
  leaks: Leak[];
  clickable: boolean;
  pending: { lat: number; lng: number } | null;
  pendingDraggable: boolean;
  flyTarget: FlyTarget | null;
  onPick: (lat: number, lng: number) => void;
  onDragPending: (lat: number, lng: number) => void;
}) {
  const markers = useMemo(() => leaks, [leaks]);

  return (
    <MapContainer
      center={TLV_CENTER}
      zoom={13}
      minZoom={11}
      className={`h-full w-full ${clickable ? 'cursor-crosshair' : ''}`}
      attributionControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <ClickCatcher active={clickable} onPick={onPick} />
      <FlyTo target={flyTarget} />

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

      {pending && (
        <Marker
          position={[pending.lat, pending.lng]}
          icon={pendingIcon}
          draggable={pendingDraggable}
          eventHandlers={{
            dragend: (e) => {
              const m = e.target as L.Marker;
              const { lat, lng } = m.getLatLng();
              onDragPending(lat, lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
