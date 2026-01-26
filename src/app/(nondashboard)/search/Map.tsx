"use client";
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAppSelector } from "@/state/redux";
import { useGetPropertiesQuery, useGetRoomsQuery } from "@/state/api";
import { Property } from "@/types/prismaTypes";
import { getRoomStats } from "@/lib/roomUtils";

// Extended Property type with location and other properties needed for the map
// Use Omit to avoid type conflict with the overridden location field
interface PropertyWithLocation extends Omit<Property, "location"> {
  location?: {
    address?: string;
    city?: string;
    suburb?: string;
    state?: string;
    province?: string;
    country?: string;
    postalCode?: string;
    coordinates?: {
      longitude: number;
      latitude: number;
    };
    id: number;
  };
  availableRooms?: number;
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string;

const Map = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const filters = useAppSelector((state) => state.global.filters);
  const {
    data: properties,
    isLoading,
    isError,
  } = useGetPropertiesQuery(filters);

  useEffect(() => {
    if (isLoading || isError || !properties) return;

    // South African map boundaries (to make sure we stay within South Africa)
    const southAfricaBoundingBox = {
      minLng: 16.3, // western-most point of South Africa
      maxLng: 33.0, // eastern-most point of South Africa
      minLat: -35.0, // southern-most point
      maxLat: -22.0, // northern-most point
    };

    // Default coordinates for South Africa (Johannesburg)
    const defaultCoordinates: [number, number] = [28.0473, -26.2041];
    
    // Validate coordinates to ensure they're valid numbers within South Africa's range
    let validCoordinates: [number, number];
    if (
      filters.coordinates && 
      Array.isArray(filters.coordinates) && 
      filters.coordinates.length === 2 &&
      typeof filters.coordinates[0] === 'number' && 
      typeof filters.coordinates[1] === 'number' &&
      filters.coordinates[0] >= southAfricaBoundingBox.minLng && 
      filters.coordinates[0] <= southAfricaBoundingBox.maxLng &&
      filters.coordinates[1] >= southAfricaBoundingBox.minLat && 
      filters.coordinates[1] <= southAfricaBoundingBox.maxLat
    ) {
      validCoordinates = filters.coordinates;
    } else {
      validCoordinates = defaultCoordinates;
    }
    
    // Clean up existing markers first to avoid duplicates
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Initialize map if it doesn't exist, otherwise just update properties
    if (!mapRef.current) {
      try {
        mapRef.current = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: "mapbox://styles/alexbsibanda/cm9r6ojpt008m01s046hwhlbp",
          center: validCoordinates,
          zoom: 9, // Use a wider view to show more of the neighborhood/city (like Centurion)
          maxBounds: [
            [southAfricaBoundingBox.minLng, southAfricaBoundingBox.minLat], // Southwest
            [southAfricaBoundingBox.maxLng, southAfricaBoundingBox.maxLat]  // Northeast
          ],
        });
        
        // Add navigation controls
        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Add event listener to map load
        mapRef.current.on('load', () => {
          console.log("Map loaded");
          resizeMap();
        });
      } catch (err) {
        console.error("Error creating map:", err);
      }
    } else {
      // Update existing map's center
      mapRef.current.flyTo({
        center: validCoordinates,
        zoom: 11,
        speed: 1.5,
        curve: 1.5,
      });
    }

    // Wait a bit for the map to be fully initialized before adding markers
    setTimeout(() => {
      if (mapRef.current && properties.length > 0) {
        // Collect all valid property coordinates to calculate viewport
        const validPropertyCoordinates: [number, number][] = [];
        
        // If user searched a specific area, restrict markers to that area radius
        const hasSearchCenter = !!filters.coordinates && Array.isArray(filters.coordinates) && (
          typeof filters.coordinates[0] === 'number' && typeof filters.coordinates[1] === 'number' &&
          (filters.coordinates[0] !== 0 || filters.coordinates[1] !== 0)
        );
        const searchCenter: [number, number] | null = hasSearchCenter ? [filters.coordinates[0], filters.coordinates[1]] : null;
        const radiusKm = 20; // keep in sync with API ST_DWithin radius (20km)
        
        // Add markers for properties
        properties.forEach((property: Property) => {
          try {
            if (property.location?.coordinates?.longitude && property.location?.coordinates?.latitude) {
              const lng = property.location.coordinates.longitude;
              const lat = property.location.coordinates.latitude;
              
              // Only create markers for properties within South Africa boundaries
              if (
                lng >= southAfricaBoundingBox.minLng && 
                lng <= southAfricaBoundingBox.maxLng &&
                lat >= southAfricaBoundingBox.minLat && 
                lat <= southAfricaBoundingBox.maxLat
              ) {
                // If we have a search center, only show markers within the search radius
                if (searchCenter) {
                  const [clng, clat] = searchCenter;
                  // Use Haversine formula for accurate distance calculation
                  const R = 6371; // Earth's radius in km
                  const dLat = (lat - clat) * Math.PI / 180;
                  const dLng = (lng - clng) * Math.PI / 180;
                  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                           Math.cos(clat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                           Math.sin(dLng/2) * Math.sin(dLng/2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                  const distance = R * c;
                  
                  if (distance > radiusKm) {
                    return;
                  }
                }
                const marker = createPropertyMarker(property, mapRef.current!);
                if (marker) {
                  // Store the marker for future cleanup
                  markersRef.current.push(marker);
                  
                  // Collect valid coordinates for viewport calculation
                  validPropertyCoordinates.push([lng, lat]);
                  
                  // Style the marker
                  const markerElement = marker.getElement();
                  const path = markerElement.querySelector("path[fill='#3FB1CE']");
                  if (path) path.setAttribute("fill", "#3366FF"); // Blue marker color
                }
              } else {
                console.warn(`Property ${property.id} has coordinates outside South Africa:`, [lng, lat]);
              }
            }
          } catch (err) {
            console.error(`Error creating marker for property ${property.id}:`, err);
          }
        });
        
        // If we have valid properties, fit the map accordingly
        if (validPropertyCoordinates.length > 0) {
          // If we have a search center, bias the viewport to the searched area
          if (searchCenter) {
            // If only one marker in area, zoom in close
            if (validPropertyCoordinates.length === 1) {
              mapRef.current.flyTo({
                center: validPropertyCoordinates[0],
                zoom: 14,
                speed: 1.5,
              });
            } else {
              // Fit bounds to markers within search area
              const bounds = validPropertyCoordinates.reduce((box, coord) => {
                return box.extend(new mapboxgl.LngLat(coord[0], coord[1]));
              }, new mapboxgl.LngLatBounds(validPropertyCoordinates[0], validPropertyCoordinates[0]));
              mapRef.current.fitBounds(bounds, {
                padding: 50,
                maxZoom: 14,
                duration: 1000,
              });
            }
          } else {
            // No specific search center: fit to all returned markers
            if (validPropertyCoordinates.length === 1) {
              mapRef.current.flyTo({
                center: validPropertyCoordinates[0],
                zoom: 14,
                speed: 1.5,
              });
            } else {
              const bounds = validPropertyCoordinates.reduce((box, coord) => {
                return box.extend(new mapboxgl.LngLat(coord[0], coord[1]));
              }, new mapboxgl.LngLatBounds(validPropertyCoordinates[0], validPropertyCoordinates[0]));
              mapRef.current.fitBounds(bounds, {
                padding: 50,
                maxZoom: 15,
                duration: 1000,
              });
            }
          }
        }
      }
    }, 300); // Short delay to ensure map is ready

    const resizeMap = () => {
      if (mapRef.current) setTimeout(() => mapRef.current?.resize(), 300);
    };
    
    // Handle window resize
    window.addEventListener('resize', resizeMap);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('resize', resizeMap);
      if (mapRef.current && !mapRef.current.isStyleLoaded()) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
  }, [isLoading, isError, properties, filters.coordinates, filters.location]);

  if (isLoading) return (
    <div className="hidden pt-5 md:flex md:basis-5/12 grow-0 relative rounded-xl">
      <div className="w-full h-full max-h-[calc(100vh-250px)] min-h-[400px] rounded-xl overflow-hidden">
        <div className="h-full w-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    </div>
  );

  if (isError || !properties) return (
    <div className="hidden pt-5 md:flex md:basis-5/12 grow-0 relative rounded-xl">
      <div className="w-full h-full max-h-[calc(100vh-250px)] min-h-[400px] rounded-xl overflow-hidden">
        <div className="h-full w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-300">Failed to load map</p>
        </div>
      </div>
    </div>
  );

  // Check if we have any properties with valid coordinates
  const hasValidProperties = properties.some(property => 
    property.location?.coordinates?.longitude && 
    property.location?.coordinates?.latitude
  );

  return (
    <div className="hidden pt-5 md:block grow relative rounded-xl">
      <div
        className="map-container rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        ref={mapContainerRef}
        style={{
          height: "100%",
          width: "100%",
          minHeight: "400px",
          maxHeight: "calc(100vh - 250px)"
        }}
      />
      
      {/* Overlay message when no properties found for location */}
      {properties.length === 0 && filters.location && filters.location !== 'any' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl z-10">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md text-center">
            <div className="text-blue-500 p-3 bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Properties Found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We couldn&apos;t find any properties in <span className="font-semibold">{filters.location && filters.location.length > 30 ? "this area" : filters.location}</span>. The map is showing the searched area, but there are currently no listings available here.
            </p>
          </div>
        </div>
      )}
      
      {/* Message for when no properties have valid coordinates */}
      {properties.length > 0 && !hasValidProperties && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl z-10">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md text-center">
            <p className="text-amber-600 dark:text-amber-500 font-medium">
              Properties found, but location data is missing or invalid.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const createPropertyMarker = (property: PropertyWithLocation, map: mapboxgl.Map) => {
  // Validate property coordinates before creating marker
  if (!property.location?.coordinates?.longitude || !property.location?.coordinates?.latitude) {
    console.error(`Property ${property.id} has invalid coordinates`);
    return null;
  }
  
  // Check if coordinates are within valid ranges
  const lng = property.location.coordinates.longitude;
  const lat = property.location.coordinates.latitude;
  
  // South African boundaries check
  const southAfricaBoundingBox = {
    minLng: 16.3, // western-most point of South Africa
    maxLng: 33.0, // eastern-most point of South Africa
    minLat: -35.0, // southern-most point
    maxLat: -22.0, // northern-most point
  };
  
  if (
    lng < southAfricaBoundingBox.minLng || 
    lng > southAfricaBoundingBox.maxLng || 
    lat < southAfricaBoundingBox.minLat || 
    lat > southAfricaBoundingBox.maxLat
  ) {
    console.error(`Property ${property.id} has coordinates outside South Africa: [${lng}, ${lat}]`);
    return null;
  }
  
  try {
    // Format price in South African Rands with thousands separator
    const formattedPrice = property.price ? property.price.toLocaleString('en-ZA') : 'N/A';
    
    // Determine if we have available rooms to display
    const availableRoomsText = property.availableRooms 
      ? `<div class="mt-1 text-sm"><span class="font-medium">${property.availableRooms}</span> room${property.availableRooms > 1 ? 's' : ''} available</div>` 
      : '';
    
    // Property features - using property values for now as fetching room data for all map markers would be inefficient
    // TODO: Consider optimizing room data loading for map popups if needed
    const features = [];
    if (property.beds) features.push(`${property.beds} beds`);
    if (property.baths) features.push(`${property.baths} baths`);
    if (property.squareFeet) features.push(`${property.squareFeet}m²`);
    
    const featuresText = features.length > 0 
      ? `<div class="text-xs text-gray-500 mt-1">${features.join(' • ')}</div>` 
      : '';
    
    // Location info
    const locationText = property.location?.city 
      ? `<div class="text-xs text-gray-500 mt-1">${property.location.city}, South Africa</div>` 
      : '';
    
    const marker = new mapboxgl.Marker({
      color: '#3366FF',
    })
      .setLngLat([lng, lat])
      .setPopup(
        new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          className: 'property-popup'
        }).setHTML(
          `
          <div class="p-2 max-w-[240px]">
            <div class="font-medium text-blue-800 mb-1 text-sm">
              <a href="/search/${property.id}" class="hover:text-blue-600 hover:underline">${property.name}</a>
            </div>
            
            <div class="font-bold text-base text-blue-600">R ${formattedPrice}<span class="text-xs font-normal text-gray-500"> / month</span></div>
            
            ${featuresText}
            ${locationText}
            ${availableRoomsText}
            
            <div class="mt-2 pt-1 border-t border-gray-200">
              <a href="/search/${property.id}" class="text-xs text-blue-500 hover:text-blue-700 hover:underline font-medium">View details</a>
            </div>
          </div>
          `
        )
      )
      .addTo(map);
    
    // Add CSS to the document head for styling the popup
    if (!document.getElementById('map-popup-styles')) {
      const style = document.createElement('style');
      style.id = 'map-popup-styles';
      style.innerHTML = `
        .property-popup .mapboxgl-popup-content {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          padding: 0;
          overflow: hidden;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .property-popup .mapboxgl-popup-tip {
          border-top-color: white;
        }
        @media (prefers-color-scheme: dark) {
          .property-popup .mapboxgl-popup-content {
            background: #1f2937;
            color: #f3f4f6;
          }
          .property-popup .mapboxgl-popup-tip {
            border-top-color: #1f2937;
          }
          .property-popup a {
            color: #3b82f6 !important;
          }
          .property-popup .text-blue-800, .property-popup .text-blue-600, .property-popup .text-gray-500 {
            color: #93c5fd !important;
          }
          .property-popup .text-gray-500 {
            color: #9ca3af !important;
          }
          .property-popup .border-gray-200 {
            border-color: #374151 !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    return marker;
  } catch (err) {
    console.error(`Error creating marker for property ${property.id}:`, err);
    return null;
  }
};

export default Map;