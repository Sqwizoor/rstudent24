"use client";

import { useGetPropertyQuery, useGetRoomsQuery, useGetPropertiesQuery, useAddFavoritePropertyMutation, useRemoveFavoritePropertyMutation } from "@/state/api";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useState, lazy, Suspense, useEffect } from "react";
import posthog from 'posthog-js';
import Image from "next/image";
import { optimizedImageLoader, PROPERTY_CARD_SIZES, IMAGE_QUALITY } from "@/lib/imageLoader";
import ImagePreviews from "./ImagePreviews";
import PropertyOverview from "./PropertyOverview";
import PropertyReviews from "@/components/PropertyReviews";
import { Building2, Bed, Bath, Users, Home } from "lucide-react";
import { getRoomStats } from "@/lib/roomUtils";
import Card from "@/components/Card";
import { CAMPUSES, NAVBAR_HEIGHT, UniversityEnum, getCampusLabelById } from "@/lib/constants";
import { PropertyDetailSkeleton } from "@/components/ui/skeletons";

// ✨ NEW: Lazy load heavy components below the fold
const PropertyDetails = lazy(() => import("./PropertyDetails"));
const PropertyLocation = lazy(() => import("./PropertyLocation"));
const ContactWidget = lazy(() => import("./ContactWidget"));
const ApplicationModal = lazy(() => import("./ApplicationModal"));

// Define interfaces for type safety
interface Room {
  name?: string;
  price?: number;
  isAvailable?: boolean;
  availableFrom?: string | Date | null;
  description?: string;
  capacity?: string;
  features?: string[];
  photoUrls?: string[];
  images?: string[];
  id?: number;
}

const SingleListing = () => {
  const { id } = useParams();
  const propertyId = Number(id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{[key: string]: boolean}>({});
  const [imgErrors, setImgErrors] = useState<{[key: string]: boolean}>({});

  // University logo mapping
  const getUniversityLogo = (universityName: string): string | null => {
    const baseMap: Record<string, string> = {
      UCT: "/universities/UCT LOGO.png",
      "University of Cape Town": "/universities/UCT LOGO.png",
      WITS: "/universities/WITS UNI.png",
      "University of the Witwatersrand": "/universities/WITS UNI.png",
      UWC: "/universities/UWC.png",
      "University of the Western Cape": "/universities/UWC.png",
      UJ: "/universities/University_of_Johannesburg_Logo.svg-modified.png",
      "University of Johannesburg": "/universities/University_of_Johannesburg_Logo.svg-modified.png",
      UL: "/universities/UL.png",
      "University of Limpopo": "/universities/UL.png",
      UFS: "/universities/UFS 1.png",
      "University of the Free State": "/universities/UFS 1.png",
      SU: "/universities/Stellies.jpg",
      "Stellenbosch University": "/universities/Stellies.jpg",
      RU: "/universities/RHODES.png",
      "Rhodes University": "/universities/RHODES.png",
      UP: "/universities/University_of_Pretoria_Coat_of_Arms-modified.png",
      "University of Pretoria": "/universities/University_of_Pretoria_Coat_of_Arms-modified.png",
      UKZN: "/universities/UKZN (2).png",
      "University of KwaZulu-Natal": "/universities/UKZN (2).png",
      CPUT: "/universities/CPUT LOGO.png",
      "Cape Peninsula University of Technology": "/universities/CPUT LOGO.png",
      TUT: "/universities/TUT-Logo1-modified.png",
      "Tshwane University of Technology": "/universities/TUT-Logo1-modified.png",
      UNISA: "/universities/Unisa-Logo-1-1.jpg",
      "University of South Africa": "/universities/Unisa-Logo-1-1.jpg",
      NWU: "/universities/NWU.png",
      "North-West University": "/universities/NWU.png",
      UFH: "/universities/UFH.png",
      "University of Fort Hare": "/universities/UFH.png",
      WSU: "/universities/WSU (2).png",
      "Walter Sisulu University": "/universities/WSU (2).png",
      MUT: "/universities/MUT.png",
      "Mangosuthu University of Technology": "/universities/MUT.png",
      SPU: "/universities/SOL PLAATJIE.png",
      "Sol Plaatje University": "/universities/SOL PLAATJIE.png",
      CUT: "/universities/CUT.png",
      "Central University of Technology": "/universities/CUT.png",
      UMP: "/universities/UMP.png",
      "University of Mpumalanga": "/universities/UMP.png",
      NMU: "/universities/NMU.png",
      "Nelson Mandela University": "/universities/NMU.png",
      UNIVEN: "/universities/UNIVEN.png",
      "University of Venda": "/universities/UNIVEN.png",
      UNIZULU: "/universities/UNIZULU.png",
      "University of Zululand": "/universities/UNIZULU.png",
      VUT: "/universities/VUT 2.jpg",
      "Vaal University of Technology": "/universities/VUT 2.jpg",
      DUT: "/universities/DUT.jpg",
      "Durban University of Technology": "/universities/DUT.jpg",
      SMU: "/universities/Sefako Makgato University.png",
      "Sefako Makgatho Health Sciences University": "/universities/Sefako Makgato University.png",
    };

    const normalizedName = universityName?.trim();
    if (!normalizedName) return null;

    const directMatch = baseMap[normalizedName];
    if (directMatch) return directMatch;

    const upperMatch = baseMap[normalizedName.toUpperCase()];
    if (upperMatch) return upperMatch;

    const lowerMatch = baseMap[normalizedName.toLowerCase()];
    if (lowerMatch) return lowerMatch;

    return null;
  };
  
  // Debug modal state changes
  React.useEffect(() => {
    console.log('Modal state changed:', { isModalOpen, selectedRoom });
  }, [isModalOpen, selectedRoom]);
  
  // Toggle description expansion
  const toggleDescription = (roomId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  // Handle keyboard events for modal
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isImageModalOpen) {
          setIsImageModalOpen(false);
        } else if (isModalOpen) {
          setIsModalOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, isModalOpen]);
  
  // Use unified auth to support both NextAuth (Google) and Cognito
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const [addFavoriteProperty] = useAddFavoritePropertyMutation();
  const [removeFavoriteProperty] = useRemoveFavoritePropertyMutation();

  const { data: property, isLoading, isError } = useGetPropertyQuery(propertyId, {
    skip: !propertyId // Skip if propertyId is not available
  });

  // Track property_viewed event when property loads
  useEffect(() => {
    if (property && !isLoading) {
      posthog.capture('property_viewed', {
        property_id: property.id,
        property_name: property.name,
        city: property.location?.city,
        price: property.pricePerMonth || (property as any).price,
      });
    }
  }, [property, isLoading]);
  const { data: rooms, isLoading: roomsLoading } = useGetRoomsQuery(propertyId, { 
    skip: isError || !propertyId // Skip if there's an error or no propertyId
  });
  
  // Process property data to ensure image URLs are valid
  const processedProperty = React.useMemo(() => {
    if (!property) return null;
    
    console.log('Raw property data:', property);
    console.log('Property images:', property.images);
    console.log('Property photoUrls:', property.photoUrls);
    
    // Return processed property with guaranteed values
    const processed = {
      ...property,
      // Make sure price is a valid number
      price: typeof (property as any).pricePerMonth === 'number'
        ? (property as any).pricePerMonth
        : typeof (property as any).pricePerMonth === 'string'
          ? parseFloat((property as any).pricePerMonth)
          : 0,
      // Ensure images array is valid - use exactly the same approach as in CardCompact
      images: Array.isArray(property.images) && property.images.length > 0 ? 
        property.images.filter(img => img && typeof img === 'string' && img.trim() !== '') : 
        Array.isArray(property.photoUrls) && property.photoUrls.length > 0 ?
        property.photoUrls.filter(img => img && typeof img === 'string' && img.trim() !== '') :
        []
    };
    
    console.log('Processed property images:', processed.images);
    return processed;
  }, [property]);
  
  // Process rooms data to ensure image URLs are valid
  const processedRooms = React.useMemo(() => {
    if (!rooms || !Array.isArray(rooms)) return [];
    
    // Return processed rooms with guaranteed values
    return rooms.map((room) => ({
      ...room,
      // Make sure price is properly set from pricePerMonth
      price: typeof room.pricePerMonth === 'number' ? room.pricePerMonth : 
             typeof room.pricePerMonth === 'string' ? parseFloat(room.pricePerMonth) : 
             undefined,
      // Convert availableFrom to string if it's a Date object
      availableFrom: room.availableFrom instanceof Date ? 
        room.availableFrom.toISOString() : 
        (typeof room.availableFrom === 'string' ? room.availableFrom : undefined),
      // Ensure photoUrls array is valid and use it for images
      images: Array.isArray(room.photoUrls) && room.photoUrls.length > 0 ? 
        room.photoUrls.filter(img => img && typeof img === 'string' && img.trim() !== '') : 
        []
    }));
  }, [rooms]);
  
  // Use processed data
  const propertyRooms = processedRooms || [];

  // Nearby accommodations (same city) - lightweight: limit 6, skip if no property yet
  const { data: nearbyRaw } = useGetPropertiesQuery(
    property?.location?.city ? { location: property.location.city } : {},
    { skip: !property?.location?.city }
  );
  const nearby = React.useMemo(() => {
    if (!nearbyRaw || !Array.isArray(nearbyRaw)) return [];
    // Filter out current property and slice to 6
  return nearbyRaw.filter((p: any) => p.id !== propertyId).slice(0, 6);
  }, [nearbyRaw, propertyId]);

  // Favorite helpers (match home featured behavior)
  const isPropertyFavorite = (propId: number) => {
    if (authUser?.role !== 'tenant' && authUser?.role !== 'student') return false;
    const tenantInfo = (authUser as any).userInfo as any;
    return tenantInfo?.favorites?.some((fav: any) => fav.id === propId) || false;
  };

  const handleFavoriteToggle = async (propId: number) => {
    if (!authUser?.id) {
      // Redirect handled elsewhere; here we simply no-op to keep UI consistent
      return;
    }
    if (authUser.role !== 'tenant' && authUser.role !== 'student') return;
    
    try {
      const userId = authUser.id;
      const tenantInfo = (authUser as any).userInfo as any;
      const currentlyFavorite = tenantInfo?.favorites?.some((fav: any) => fav.id === propId) || false;
      
      if (currentlyFavorite) {
        await removeFavoriteProperty({ cognitoId: userId, propertyId: propId }).unwrap();

        // Track favorite_removed event with PostHog
        posthog.capture('favorite_removed', {
          property_id: propId,
        });
      } else {
        await addFavoriteProperty({ cognitoId: userId, propertyId: propId }).unwrap();

        // Track favorite_added event with PostHog
        posthog.capture('favorite_added', {
          property_id: propId,
        });
      }
    } catch (e) {
      console.error('Error toggling favorite for nearby card:', e);
      posthog.captureException(e);
    }
  };

  // Calculate room-based statistics
  const roomStats = getRoomStats(rooms);
  // Determine display price (fallback to property's pricePerMonth)
  const displayPrice = roomStats.minPrice || (
    typeof (property as any)?.pricePerMonth === 'number'
      ? (property as any).pricePerMonth
      : typeof (property as any)?.pricePerMonth === 'string'
        ? parseFloat((property as any).pricePerMonth)
        : 0
  );
  
  // Use room stats or fallback to property values for backward compatibility
  const displayBeds = roomStats.totalBeds || property?.beds || 0;
  const displayBaths = roomStats.totalBaths || property?.baths || 0;
  const displaySquareFeet = roomStats.totalSquareFeet || property?.squareFeet || 0;
  const primaryCampusId = property?.closestCampuses?.[0];
  const primaryCampusLabel = primaryCampusId ? getCampusLabelById(primaryCampusId) : null;
  const primaryCampusDetails = React.useMemo(() => {
    if (!primaryCampusId) return null;
    return CAMPUSES.find((campus) => campus.campusID === Number(primaryCampusId)) || null;
  }, [primaryCampusId]);

  const primaryUniversityLogo = React.useMemo(() => {
    if (!primaryCampusDetails) return null;
    const universityKey = primaryCampusDetails.universityID;
    const universityName = (UniversityEnum as Record<string, string | undefined>)?.[universityKey] || String(universityKey);
    return getUniversityLogo(universityName) || getUniversityLogo(String(universityKey));
  }, [primaryCampusDetails]);
  // Determine deposit and top-up from the earliest created room (first created)
  const firstCreatedRoom = React.useMemo(() => {
    if (!Array.isArray(rooms) || rooms.length === 0) return null;
    // API returns rooms ordered desc by createdAt; revert to find earliest
    const ordered = [...rooms].sort((a: any, b: any) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return da - db; // earliest first
    });
    return ordered[0] || null;
  }, [rooms]);

  const displayDeposit = (() => {
    // Prefer first room's securityDeposit if present, else property's
    const roomDep = firstCreatedRoom?.securityDeposit;
    if (typeof roomDep === 'number') return roomDep;
    const propDep = (property as any)?.securityDeposit;
    return typeof propDep === 'number' ? propDep : 0;
  })();

  const topUpAmount = (() => {
    const roomTopUp = (firstCreatedRoom as any)?.topUp;
    return typeof roomTopUp === 'number' ? roomTopUp : 0;
  })();

  if (isLoading || roomsLoading) return <PropertyDetailSkeleton />;
  if (isError || !property || !processedProperty) return <div>Property not found</div>;

  return (
    <div className="bg-white min-h-screen">
      {/* Outer wrapper adjusted: add mx-auto and narrower base width for better centering on very small screens */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Constrain content width and center on all breakpoints */}
        <div className="w-full max-w-5xl xl:max-w-6xl mx-auto">
  {/* Full Width Image Gallery with added top padding for consistent spacing */}
  <div className="mb-8 pt-4 sm:pt-6 lg:pt-8">
          {/* Desktop Layout */}
          {/* Reduced overall gallery height */}
          <div className="hidden md:grid md:grid-cols-6 gap-4 h-[420px]">
            {/* Main large image - takes 4/6 of the width (66.67%) */}
            <div className="col-span-4 relative rounded-lg overflow-hidden cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
              <Image
                src={processedProperty.images?.[0] || "/placeholder.jpg"}
                alt={property.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 67vw, 800px"
                priority={true}
                quality={IMAGE_QUALITY.detail}
                loader={(props) => optimizedImageLoader({ ...props, quality: IMAGE_QUALITY.detail })}
                className="object-cover hover:scale-105 transition-transform duration-300"
                unoptimized={false}
              />
            </div>
            
            {/* Right side images - takes 2/6 of the width with 1 column and rectangular layout */}
            <div className="col-span-2 flex flex-col gap-4 relative">
              {/* Show 2 side images */}
              {Array.from({ length: 2 }, (_, index) => {
                const imageIndex = index + 1;
                const imageUrl = processedProperty.images?.[imageIndex] || 
                                processedProperty.images?.[0] || 
                                "/placeholder.jpg";
                
                return (
                  <div key={index} className="relative h-[200px] rounded-lg overflow-hidden cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
                    <Image
                      src={imageUrl}
                      alt={`${property.name} ${index + 2}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 250px"
                      priority={index < 1}
                      quality={IMAGE_QUALITY.card}
                      loader={(props) => optimizedImageLoader({ ...props, quality: IMAGE_QUALITY.card })}
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      unoptimized={false}
                    />
                    {(!processedProperty.images?.[imageIndex] && processedProperty.images?.[0]) && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Main Photo</span>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* View all button positioned at bottom right of the last image */}
              {processedProperty.images && processedProperty.images.length > 0 && (
                <div className="absolute bottom-4 right-4 z-10">
                  <button 
                    onClick={() => setIsImageModalOpen(true)}
                    className="bg-[#00acee] text-white px-3 py-2 rounded-full text-xs font-medium shadow-lg transition-colors hover:bg-[#0095cc]"
                  >
                    View all ({processedProperty.images.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden">
            {/* Main image for mobile */}
            <div className="relative h-[260px] rounded-lg overflow-hidden cursor-pointer mb-4" onClick={() => setIsImageModalOpen(true)}>
              <Image
                src={processedProperty.images?.[0] || "/placeholder.jpg"}
                alt={property.name}
                fill
                sizes="100vw"
                priority={true}
                quality={IMAGE_QUALITY.card}
                loader={(props) => optimizedImageLoader({ ...props, quality: IMAGE_QUALITY.card })}
                className="object-cover"
                unoptimized={false}
              />
            </div>
            
            {/* View all button for mobile */}
            {processedProperty.images && processedProperty.images.length > 1 && (
              <button 
                onClick={() => setIsImageModalOpen(true)}
                className="mt-4 w-full bg-[#00acee] text-white px-4 py-3 rounded-full text-sm font-medium transition-colors hover:bg-[#0095cc]"
              >
                View all {processedProperty.images.length} photos
              </button>
            )}
          </div>
        </div>

  {/* Property Information Below Images (centered wrapper) */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
    {/* Main Content - Left on desktop (cols 1-2) */}
    <div className="lg:col-span-2 space-y-6">
            {/* Property Header */}
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.name}</h1>
                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`h-5 w-5 ${i < Math.floor(property.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">{(property.averageRating || 0).toFixed(1)} ({property.numberOfReviews || 0} reviews)</span>
                  </div>
                  {/* Address + University directly under title */}
                  <div className="mt-3 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-2xl bg-white/95 border border-slate-200 shadow-sm px-4 py-4 sm:bg-transparent sm:border-none sm:shadow-none sm:px-0 sm:py-0">
                      <div className="flex items-start gap-3">
                            <div className="grid grid-cols-[auto,1fr] gap-x-3 sm:gap-x-4 gap-y-3">
                              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 text-[#00acee] sm:h-14 sm:w-14 sm:rounded-full">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </span>
                              <div className="min-w-0">
                                <p className="text-base sm:text-lg font-semibold text-gray-900 leading-snug">
                                  {property.location?.address || 'No address'}
                                </p>
                              </div>

                              {primaryCampusLabel ? (
                                <>
                                  <span className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden bg-white border border-blue-100 shadow-sm flex-shrink-0">
                                    {primaryUniversityLogo ? (
                                      <Image
                                        src={primaryUniversityLogo}
                                        alt={primaryCampusDetails?.universityID ? `${primaryCampusDetails.universityID} logo` : "University logo"}
                                        fill
                                        sizes="(max-width: 640px) 48px, 56px"
                                        quality={IMAGE_QUALITY.thumbnail}
                                        className="object-contain p-1"
                                        priority={false}
                                        unoptimized={false}
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-[#00acee]">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253" />
                                        </svg>
                                      </div>
                                    )}
                                  </span>
                                  <div className="flex flex-col">
                                    <span className="text-[11px] uppercase tracking-wide text-slate-500">Close to</span>
                                    <span className="text-sm sm:text-base font-semibold text-slate-800 leading-tight">
                                      {primaryCampusLabel.replace(/^Close to\s*/i, "")}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="col-start-2 text-gray-600">
                                  {property.location?.city || 'No city'}
                                </div>
                              )}
                            </div>
                          </div>
                    </div>
                  </div>
                </div>

                {/* Favorite and Share buttons */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button className="p-2 sm:p-3 rounded-full hover:bg-gray-100 transition-colors border border-gray-200">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.682l-1.318-1.364a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <button className="p-2 sm:p-3 rounded-full hover:bg-gray-100 transition-colors border border-gray-200">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Property Description */}
            {property.description && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">About this property</h3>
                <p className="text-gray-700 leading-relaxed">
                  {property.description}
                </p>
              </div>
            )}
          </div>

          {/* Pricing Sidebar - Right on desktop (col 3) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Pricing Section */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-600">From</p>
                    <p className="text-3xl font-bold text-[#00acee]">
                      R {displayPrice.toLocaleString('en-ZA')}
                    </p>
                    <p className="text-sm text-gray-600">per month</p>
                  </div>
                  
                  {/* NSFAS Accreditation Block */}
                  {property.isNsfassAccredited && (
                    <div className="flex flex-col items-center gap-1 min-w-[90px]">
                      <Image
                        src="/universities/nasfas.png"
                        alt="NSFAS Accredited"
                        width={84}
                        height={84}
                        quality={IMAGE_QUALITY.thumbnail}
                        className="object-contain"
                        priority={false}
                        unoptimized={false}
                      />
                      <span className="text-[11px] font-semibold text-green-600 tracking-wide bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                        NSFAS Accredited
                      </span>
                    </div>
                  )}
                </div>

                {/* Deposit + Top-up: prefer first room values; fallback to property deposit */}
                {(displayDeposit !== undefined && displayDeposit !== null) && (
                  <div className="py-4 border-t border-gray-100">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <p className="text-sm text-gray-600">Security Deposit</p>
                        <p className="font-semibold">
                          {displayDeposit === 0 ? 'None' : `R${displayDeposit.toLocaleString('en-ZA')}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Top-up</p>
                        <p className="font-semibold">{`R${(topUpAmount || 0).toLocaleString('en-ZA')}`}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact/Apply Button */}
                <div className="mt-6 space-y-3">
                  <button 
                    onClick={() => {
                      // Scroll to rooms section
                      const roomsSection = document.getElementById('rooms-section');
                      if (roomsSection) {
                        roomsSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="w-full bg-[#00acee] hover:bg-[#0095cc] text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    View Available Rooms
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Apply for Property
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Rooms and Details */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Rooms Section */}
            {propertyRooms && propertyRooms.length > 0 && (
              <div id="rooms-section" className="bg-white shadow-sm rounded-2xl p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Available Rooms</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {propertyRooms.map((room: any, index: number) => (
        <div key={room.id || index} 
          className="border rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                      {/* Room Image */}
                      <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                        <Image
                          src={room.images && room.images.length > 0 ? 
                               room.images[0] : "/placeholder.jpg"}
                          alt={room.name || `Room ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                          quality={IMAGE_QUALITY.card}
                          loader={(props) => optimizedImageLoader({ ...props, quality: IMAGE_QUALITY.card })}
                          className="object-cover"
                          onError={() => setImgErrors(prev => ({...prev, [`room-${index}`]: true}))}
                          unoptimized={false}
                          loading="lazy"
                        />
                        
                        {/* Availability badge */}
                        <div className="absolute top-3 left-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            room.isAvailable 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {room.isAvailable ? 'Available' : 'Coming Soon'}
                          </span>
                        </div>
                        
                        {/* Price badge */}
                        <div className="absolute top-3 right-3 bg-[#00acee] text-white px-2 py-1 rounded text-sm font-medium">
                          R{room.price?.toLocaleString('en-ZA') || '0'}
                        </div>
                      </div>
                      
                      {/* Room Info */}
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{room.name}</h3>
                          {room.capacity && (
                            <span className="text-sm text-gray-500">{room.capacity}</span>
                          )}
                        </div>
                        
                        {/* Privacy summary (Bedroom / Kitchen / Bathroom) */}
                        <div className="mt-1 space-y-1 text-sm text-gray-700">
                          {(() => {
                            // Bedroom privacy derived from roomType
                            const bedroomStatus = room.roomType === 'SHARED' ? 'Sharing' : 'Private';
                            // Kitchen: assume only ENTIRE_UNIT guarantees private kitchen
                            const kitchenStatus = room.roomType === 'ENTIRE_UNIT' ? 'Private' : 'Sharing';
                            // Bathroom heuristic: private if not shared & capacity <=1, else sharing
                            const bathroomStatus = (room.roomType !== 'SHARED' && (room.capacity ?? 1) <= 1) ? 'Private' : 'Sharing';
                            return (
                              <>
                                <p><span className="font-medium text-gray-900">Bedroom:</span> {bedroomStatus}</p>
                                <p><span className="font-medium text-gray-900">Kitchen:</span> {kitchenStatus}</p>
                                <p><span className="font-medium text-gray-900">Bathroom:</span> {bathroomStatus}</p>
                              </>
                            );
                          })()}
                        </div>
                        
                        {room.availableFrom && !room.isAvailable && (
                          <div className="mt-3 text-sm text-gray-600">
                            Available from: {new Date(room.availableFrom).toLocaleDateString()}
                          </div>
                        )}

                        {/* Room-specific Apply button */}
                        <div className="mt-4">
                          <button
                            onClick={() => {
                              console.log('Apply button clicked for room:', room);
                              console.log('Room ID:', room.id);
                              console.log('Room name:', room.name);

                              // Track room_application_clicked event with PostHog
                              posthog.capture('room_application_clicked', {
                                property_id: propertyId,
                                property_name: property?.name,
                                room_id: room.id,
                                room_name: room.name,
                                room_price: room.pricePerMonth || room.price,
                                is_available: room.isAvailable,
                              });

                              setSelectedRoom(room);
                              setIsModalOpen(true);
                            }}
                            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                              room.isAvailable 
                                ? 'bg-[#00acee] hover:bg-[#0095cc] text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            disabled={!room.isAvailable}
                          >
                            {room.isAvailable ? 'Apply for this Room' : 'Not Available'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Property Details */}
            <div className="bg-white shadow-sm rounded-xl p-6">
              <Suspense fallback={<PropertyDetailSkeleton />}>
                <PropertyDetails propertyId={propertyId} deposit={displayDeposit} topUp={topUpAmount} />
              </Suspense>
            </div>
            
            {/* Property Reviews */}
            <div className="bg-white shadow-sm rounded-xl p-6">
              <PropertyReviews propertyId={propertyId} />
            </div>
            
            {/* Property Location */}
            <div className="bg-white shadow-sm rounded-xl p-6">
              <Suspense fallback={<PropertyDetailSkeleton />}>
                <PropertyLocation propertyId={propertyId} />
              </Suspense>
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Suspense fallback={<PropertyDetailSkeleton />}>
                <ContactWidget 
                  onOpenModal={() => setIsModalOpen(true)} 
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {isImageModalOpen && (
        <div
          className="fixed left-0 w-full bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          style={{
            top: `${NAVBAR_HEIGHT}px`,
            height: `calc(100vh - ${NAVBAR_HEIGHT}px)`
          }}
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{property.name} - Gallery</h3>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Image Preview Component */}
            <div className="p-4">
              <ImagePreviews images={processedProperty.images || []} />
            </div>
          </div>
        </div>
      )}

      {/* Nearby Accommodations */}
      {nearby.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 mt-4">
          <div className="border-t border-gray-200 pt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Nearby Accommodations</h2>
              <Link href="/search" className="text-[#00acee] text-sm font-medium hover:underline">View all</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearby.map((p: any) => (
                <Card
                  key={p.id}
                  property={p}
                  isFavorite={isPropertyFavorite(p.id)}
                  onFavoriteToggle={() => handleFavoriteToggle(p.id)}
                  propertyLink={`/search/${p.id}`}
                  userRole={authUser?.role === 'student' ? 'tenant' : (authUser?.role || null)}
                  showFavoriteButton={true}
                  className="mt-0 border-0 mx-auto !p-2"
                  imagePaddingClass="p-0"
                  largeActionIcons
                  simpleShadow
                  reviewsCount={(p as any).reviews ?? (p as any).reviewCount ?? (p as any).reviewsCount}
                  locationDisplayMode="suburbCity"
                  imageAspect="4/2"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Application Modal - Works for both property and room applications */}
      {isModalOpen && (
        <Suspense fallback={null}>
          <ApplicationModal
            isOpen={isModalOpen}
            onClose={() => {
              console.log('Closing application modal');
              setIsModalOpen(false);
              setSelectedRoom(null);
            }}
            propertyId={propertyId}
            roomId={selectedRoom?.id}
            roomName={selectedRoom?.name}
          />
        </Suspense>
      )}
    </div>
    
    {/* Close outermost container */}
    </div>
  );
};

export default SingleListing;