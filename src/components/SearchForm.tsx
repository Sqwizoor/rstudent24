'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SearchForm() {
  const router = useRouter();
  const [location, setLocation] = useState<string>('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Geocode the location to get coordinates
    const geocodeResponse = await fetch(
      `/api/geocode?address=${encodeURIComponent(location)}`
    );
    const geocodeData = await geocodeResponse.json();

    const params = new URLSearchParams();
    params.set('location', location);

    // ✅ Add coordinates if geocoding was successful
    if (geocodeData.coordinates) {
      const { lng, lat } = geocodeData.coordinates;
      params.set('coordinates', `${lng},${lat}`);
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch}>
      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Search by city or address"
      />
      <button type="submit">Search</button>
    </form>
  );
}