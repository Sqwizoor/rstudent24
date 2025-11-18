'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Property } from '@/types/property';

export default function PropertyList() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        
        const params = new URLSearchParams();
        
        if (searchParams.get('location')) {
          params.set('location', searchParams.get('location')!);
        }
        
        if (searchParams.get('coordinates')) {
          params.set('coordinates', searchParams.get('coordinates')!);
        }
        
        if (searchParams.get('priceMin')) {
          params.set('priceMin', searchParams.get('priceMin')!);
        }
        if (searchParams.get('priceMax')) {
          params.set('priceMax', searchParams.get('priceMax')!);
        }
        
        if (searchParams.get('beds')) {
          params.set('beds', searchParams.get('beds')!);
        }
        if (searchParams.get('baths')) {
          params.set('baths', searchParams.get('baths')!);
        }
        if (searchParams.get('propertyType')) {
          params.set('propertyType', searchParams.get('propertyType')!);
        }

        const response = await fetch(`/api/properties?${params.toString()}`);
        const data = await response.json();
        
        setProperties(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setLoading(false);
      }
    };

    fetchProperties();
  }, [searchParams]);

  if (loading) {
    return <div>Loading properties...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {properties.map((property) => (
        <div key={property.id} className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold">{property.name}</h3>
          <p className="text-gray-600">{property.description}</p>
          <p className="text-blue-600 font-bold">R{property.price}</p>
        </div>
      ))}
    </div>
  );
}
