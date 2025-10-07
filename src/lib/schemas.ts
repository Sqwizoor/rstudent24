import * as z from "zod";
import { PropertyTypeEnum, RoomTypeEnum, AmenityEnum, HighlightEnum, RedirectTypeEnum } from "@/lib/constants";

export const propertySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  pricePerMonth: z.number().min(0, "Price must be positive").optional().default(0),
  securityDeposit: z.number().min(0, "Security deposit must be positive").optional().default(0),
  isNsfassAccredited: z.boolean().default(false),
  isParkingIncluded: z.boolean().default(true),
  photoUrls: z.any(), // This will be handled by the file input
  amenities: z.array(z.nativeEnum(AmenityEnum)).min(1, "At least one amenity is required"),
  highlights: z.array(z.nativeEnum(HighlightEnum)).min(1, "At least one highlight is required"),
  propertyType: z.nativeEnum(PropertyTypeEnum),
  beds: z.number().min(0, "Beds must be 0 or more").optional().nullable(),
  baths: z.number().min(0, "Baths must be 0 or more").optional().nullable(),
  kitchens: z.number().min(0, "Kitchens must be 0 or more").optional().nullable(),
  squareFeet: z.number().min(0, "Square footage must be 0 or more").optional().nullable(),
  closestCampuses: z.array(z.string()).min(1, "At least one closest campus is required"),
  // Keep previous university fields as optional for compatibility
  closestUniversities: z.array(z.string()).optional().default([]),
  accreditedBy: z.array(z.string()).optional().default([]),
  closestUniversity: z.string().optional(),
  closeToUniversity: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  province: z.string().min(1, "Province is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  suburb: z.string().min(1, "Suburb is required"),
  locationId: z.number().optional(),
  // Redirect settings for applications (property-level defaults)
  redirectType: z.nativeEnum(RedirectTypeEnum).optional().default(RedirectTypeEnum.NONE),
  whatsappNumber: z.string().optional(),
  customLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

export const applicationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  message: z.string().optional(),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;

export const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;


// Add these to your lib/schemas.ts file



// Room form data schema
export const roomSchema = z.object({
  id: z.number().optional(), // For editing existing rooms
  propertyId: z.number().or(z.string().transform(val => parseInt(val))),
  name: z.string().min(1, "Room name is required"),
  description: z.string().optional().nullable(),
  pricePerMonth: z.number().min(1, "Price is required")
    .or(z.string().transform(val => parseFloat(val)).refine(val => val >= 1, { message: "Price is required" })),
  securityDeposit: z.number().or(z.string().transform(val => parseFloat(val))).default(0),
  topUp: z.number().or(z.string().transform(val => parseFloat(val))).default(0),
  squareFeet: z.number().or(z.string().transform(val => parseInt(val))).optional().nullable(),
  isAvailable: z.boolean().or(z.string().transform(val => val === "true")).default(true),
  availableFrom: z.date().or(z.string().transform(val => new Date(val))).optional().nullable(),
  roomType: z.nativeEnum(RoomTypeEnum).default(RoomTypeEnum.PRIVATE),
  capacity: z.number().min(1).or(z.string().transform(val => parseInt(val)).refine(val => val >= 1, { message: "Capacity must be at least 1" })).default(1),
  bathroomPrivacy: z.enum(["PRIVATE", "SHARED"]).default("SHARED"),
  kitchenPrivacy: z.enum(["PRIVATE", "SHARED"]).default("SHARED"),
  photoUrls: z.any().optional(), // handles File objects for upload
});

// Type for room form data
export type RoomFormData = z.infer<typeof roomSchema>;



export interface ApiProperty {
  id: number;
  name: string;
  description?: string | null;
  photoUrls: string[];
  pricePerMonth: number;
  securityDeposit?: number | null;
  isPetsAllowed: boolean;
  isParkingIncluded: boolean;
  isNsfassAccredited: boolean;
  propertyType: PropertyTypeEnum;
  beds: number;
  baths: number;
  squareFeet?: number | null;
  amenities: AmenityEnum[];
  highlights: HighlightEnum[];
  closestCampuses?: string[];
  accreditedBy?: string[];
  closestUniversity?: string | null;
  managerCognitoId: string;
  locationId: number;
  
  // Redirect settings for applications
  redirectType?: RedirectTypeEnum;
  whatsappNumber?: string | null;
  customLink?: string | null;
  
  // Location fields - may be populated directly or through a nested location object
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  location?: {
    address: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  };

  createdAt: string;
  updatedAt: string;
  // Add other potential fields like manager: ApiManager if included
}

export interface ApiRoom {
  id: number;
  propertyId: number;
  name: string;
  description?: string | null;
  photoUrls: string[];
  pricePerMonth: number;
  securityDeposit?: number | null;
  topUp?: number | null;
  squareFeet?: number | null;
  isAvailable: boolean;
  availableFrom?: string | null;
  roomType: RoomTypeEnum;
  capacity?: number | null;
  amenities: AmenityEnum[];
  features: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
  // Add property?: ApiProperty if included by the backend
}


