'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Leak, LeakStatus } from '@/types';
import LeakPopup from '@/components/LeakPopup';
import { STATUS_ICONS } from '@/components/StatusBadge';

// מרכז תל אביב-יפו
const TLV_CENTER: [number, number] = [32.0853, 34.7818];

// סימון לכל סטטוס – צבע מסגרת + אייקון שונה
function statusIcon(status: LeakStatus) {
  return L.divIcon({
    className: '',
    html: `<div class="leak-pin leak-pin-${status}"><span>${STATUS_ICONS[status]}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 32],
    popupAnchor: [0, -30],
  });
}

const leakIcons: Record<LeakStatus, L.DivIcon> = {
  open: statusIcon('open'),
  in_progress: statusIcon('in_progress'),
  resolved: statusIcon('resolved'),
};

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
  onLeakUpdated,
}: {
  leaks: Leak[];
  clickable: boolean;
  pending: { lat: number; lng: number } | null;
  pendingDraggable: boolean;
  flyTarget: FlyTarget | null;
  onPick: (lat: number, lng: number) => void;
  onDragPending: (lat: number, lng: number) => void;
  onLeakUpdated: (leak: Leak) => void;
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
        <Marker key={leak.id} position={[leak.lat, leak.lng]} icon={leakIcons[leak.status]}>
          <Popup minWidth={240} autoPanPaddingTopLeft={[20, 130]}>
            <LeakPopup leak={leak} onUpdated={onLeakUpdated} />
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
