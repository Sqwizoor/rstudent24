// Custom type definitions for Prisma models
// These match the structure of your Prisma schema

// Manager model
export interface Manager {
  id: number;
  cognitoId: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string; // Add name field to match usage in the code
  phoneNumber?: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tenant model
export interface Tenant {
  id: number;
  cognitoId: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string; // Add name field to match usage in the code
  phoneNumber?: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  favorites?: any[];
}

// Application Status enum
export enum ApplicationStatus {
  Pending = 'Pending',
  Denied = 'Denied',
  Approved = 'Approved'
}

// Application model
export interface Application {
  id: number;
  tenantCognitoId: string | null;
  propertyId: number;
  roomId?: number | null;
  leaseId?: number | null;
  applicationDate: string | Date;
  status: ApplicationStatus;
  name: string;
  email: string;
  phoneNumber: string;
  message?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // Related models
  property?: Property;
  tenant?: Tenant | null;
  room?: Room | null;
}

// Location model
export interface Location {
  id: number;
  address: string;
  city: string;
  suburb?: string;
  state?: string;
  country: string;
  postalCode?: string;
  coordinates?: any;
}

// Property model
export interface Property {
  id: number;
  name: string;
  description?: string;
  propertyType?: string;
  price: number;
  pricePerMonth?: number;
  minRoomPrice?: number;
  securityDeposit?: number;
  beds: number;
  baths: number;
  kitchens?: number;
  squareFeet?: number;
  locationId?: number;
  isAvailable: boolean;
  images?: string[];
  photoUrls?: string[];
  // Ratings and reviews
  averageRating?: number;
  numberOfReviews?: number;
  // Property features
  isPetsAllowed?: boolean;
  isParkingIncluded?: boolean;
  isNsfassAccredited?: boolean;
  amenities?: string[];
  highlights?: string[];
  closestUniversities?: string[];
  closestCampuses?: string[];
  // Related models
  location?: Location;
  leases?: any[];
}

// Lease model
export interface Lease {
  id: number;
  tenantCognitoId: string;
  propertyId: number;
  startDate: string | Date;
  endDate: string | Date;
  status: string;
  monthlyRent: number;
  securityDeposit?: number;
  createdAt: Date;
  updatedAt: Date;
  tenant: {
    phoneNumber: string;
    name?: string;
    email?: string;
  };
  rent: number; // Adding this property as it's used in the component
}

// Payment model
export interface Payment {
  id: number;
  leaseId: number;
  amount: number;
  date: string | Date;
  status: string;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
  // Related models
  lease?: Lease;
}

// Room model
export interface Room {
  id: number;
  propertyId: number;
  name: string;
  description?: string;
  roomType: string;
  pricePerMonth: number;
  securityDeposit?: number;
  topUp?: number;
  squareFeet?: number;
  isAvailable: boolean;
  availableFrom?: Date | string | null;
  capacity: number;
  amenities?: string[];
  features?: string[];
  photoUrls?: string[];
  redirectType?: string | null;
  whatsappNumber?: string | null;
  customLink?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Related models
  property?: Property;
}

// Other types can be added as needed
