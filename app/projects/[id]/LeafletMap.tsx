'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface NearbyPlace {
  name: string;
  type: string;
  distance: string;
  icon: string;
}

interface Props {
  lat: number;
  lng: number;
  projectName: string;
  nearbyPlaces: NearbyPlace[];
}

/* Fix Leaflet default icon paths for Next.js */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TYPE_COLORS: Record<string, string> = {
  School: '#3B82F6',
  Hospital: '#EF4444',
  Metro: '#8B5CF6',
  Mall: '#F59E0B',
};

export default function LeafletMap({ lat, lng, projectName, nearbyPlaces }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current).setView([lat, lng], 14);
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Project marker (orange)
    const projectIcon = L.divIcon({
      html: `<div style="width:28px;height:28px;background:#F97316;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">🏗</div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    L.marker([lat, lng], { icon: projectIcon })
      .addTo(map)
      .bindPopup(`<strong>${projectName}</strong><br/>Project Location`);

    // Nearby place markers with offset positions
    nearbyPlaces.forEach((place, idx) => {
      // Generate positions around the project in a circle
      const angle = (idx / nearbyPlaces.length) * 2 * Math.PI;
      const distKm = parseFloat(place.distance) || 1.5;
      const offsetLat = lat + (distKm / 111) * Math.cos(angle);
      const offsetLng = lng + (distKm / (111 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);

      const color = TYPE_COLORS[place.type] || '#6B7280';
      const poiIcon = L.divIcon({
        html: `<div style="width:24px;height:24px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;font-size:12px;">${place.icon}</div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([offsetLat, offsetLng], { icon: poiIcon })
        .addTo(map)
        .bindPopup(`<strong>${place.name}</strong><br/>${place.type} - ${place.distance}`);
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [lat, lng, projectName, nearbyPlaces]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}
