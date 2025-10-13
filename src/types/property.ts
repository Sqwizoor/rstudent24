export type PropertyType = 'APARTMENT' | 'HOUSE' | 'CONDO' | 'TOWNHOUSE';

export interface Location {
  id: number;
  address: string;
  city: string;
  suburb?: string;
  state?: string;
  country: string;
  postalCode?: string;
  coordinates?: {
    longitude: number;
    latitude: number;
  };
}

export interface Property {
  id: number;
  name: string;
  description?: string;
  propertyType: PropertyType;
  photoUrls: string[];
  images?: string[];      // Added images property
  beds: number;
  baths: number;
  kitchens: number;
  squareFeet: number;
  pricePerMonth?: number; // Keep optional for backward compatibility
  price?: number;        // Add alternative field name for compatibility
  priceUnit?: string;
  minRoomPrice?: number; // Computed on API: lowest available room price
  securityDeposit?: number;
  isPetsAllowed: boolean;
  isParkingIncluded: boolean;
  isNsfassAccredited: boolean;
  amenities?: string[];
  highlights?: string[];
  closestUniversities?: string[];
  closestCampuses?: string[];
  averageRating?: number;
  numberOfReviews?: number;
  managerCognitoId: string;
  location: Location;
  locationId: number;
  createdAt: string;
  updatedAt: string;
} 