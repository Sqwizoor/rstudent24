'use client';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      // Change from streets-v12 to a simpler style that doesn't use "len"
      style: 'mapbox://styles/mapbox/light-v11', // or 'dark-v11', 'satellite-streets-v12'
      // ...existing config...
    });

    // ...existing code...

    return () => map.current?.remove();
  }, []);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
}