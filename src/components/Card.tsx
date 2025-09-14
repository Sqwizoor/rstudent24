"use client"

import type React from "react"
import type { ImageLoaderProps } from "next/image"
import { Bath, Bed, ChefHat, Edit, Heart, Home, MapPin, Star, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getRoomStats } from "@/lib/roomUtils"
import type { Room } from "@/types/prismaTypes"

interface PropertyCardProps {
  property: {
    id: number
    name: string
    description?: string
    location: {
      address: string
      city: string
    }
    photoUrls?: string[]
    images?: string[]
    beds: number
    baths: number
    kitchens?: number
    squareFeet: number
    pricePerMonth?: number
    price?: number
    averageRating?: number
    numberOfReviews: number
    isPetsAllowed?: boolean
    isParkingIncluded?: boolean
    isNsfassAccredited?: boolean
    availableRooms?: number
    rooms?: Room[] // Add rooms data for calculation
    closestUniversities?: string[]
  }
  isFavorite?: boolean
  onFavoriteToggle?: () => void
  showFavoriteButton?: boolean
  propertyLink?: string
  showActions?: boolean
  userRole?: "tenant" | "manager" | "admin" | null
  onClick?: () => void
  // Optional: customize hover ring color class (e.g., "hover:ring-[#00acee]/50")
  hoverRingClass?: string
  // Optional: disable image zoom effect on hover
  disableImageHoverZoom?: boolean
  // Optional: disable card hover scale (prevents layout touch with map)
  disableHoverScale?: boolean
  // Make the image touch the card edges (remove inner padding/rounding)
  edgeToEdgeImage?: boolean
  // Optional additional classes for the root Card container
  className?: string
  // Optional: reviews count to display above title/description (fallback to property.numberOfReviews)
  reviewsCount?: number
  // Optional: make action icons (NSFAS badge and favorite) larger
  largeActionIcons?: boolean
  // Optional: override image wrapper padding/margins when not edgeToEdge
  imagePaddingClass?: string
  // Optional: use simple blog-like shadow style (rounded-xl, shadow-md, hover:shadow-lg, no ring/scale)
  simpleShadow?: boolean
  // Optional: control how location is displayed (full address or just suburb + city)
  locationDisplayMode?: 'full' | 'suburbCity'
  // Optional: override width utility classes (defaults widened from previous slim size)
  widthClass?: string
  // Optional: choose image aspect ratio (default 4/3, can set to 4/2 for shorter banner style)
  imageAspect?: '4/3' | '4/2'
}

function PropertyCard({
  property,
  isFavorite = false,
  onFavoriteToggle,
  showFavoriteButton = true,
  propertyLink,
  showActions = false,
  userRole = null,
  onClick,
  hoverRingClass = "hover:ring-[#00acee]/30",
  disableImageHoverZoom = false,
  disableHoverScale = false,
  edgeToEdgeImage = false,
  className,
  reviewsCount,
  largeActionIcons = false,
  imagePaddingClass = "p-1",
  simpleShadow = false,
  locationDisplayMode = 'full',
  widthClass,
  imageAspect = '4/3',
}: PropertyCardProps) {
  // Access images directly from the property object as it comes from the API
  const [imgSrc, setImgSrc] = useState<string>(
    // First try images array
    property.images && property.images.length > 0 ? property.images[0] :
    // Then try photoUrls array
    property.photoUrls && property.photoUrls.length > 0 ? property.photoUrls[0] :
    // Default placeholder
    "/placeholder.jpg"
  )
  const [isHovered, setIsHovered] = useState(false)
  const [imgError, setImgError] = useState(false)

  // Calculate room-based statistics for price fallback
  const roomStats = getRoomStats(property.rooms);
  
  // Use property-level specifications directly
  const displayBeds = property.beds || 0;
  const displayBaths = property.baths || 0;
  const displayKitchens = property.kitchens || 0;
  const displaySquareFeet = property.squareFeet || 0;
  const displayPrice = roomStats.minPrice || property.price || property.pricePerMonth || 0;

  // Custom loader that just returns the URL as-is
  const loaderFunc = ({ src }: ImageLoaderProps) => {
    return src
  }

  // Handle image error
  const handleImageError = () => {
    console.error(`Failed to load image: ${imgSrc}`)
    setImgError(true)
    setImgSrc("/placeholder.jpg")
  }

  const [isLoaded, setIsLoaded] = useState(false)

  // Match image rounding to card style
  const roundedImageClass = edgeToEdgeImage
    ? "rounded-md"
    : simpleShadow
    ? "rounded-3xl"
    : "rounded-2xl"

  return (
    <Card
      className={
        simpleShadow
          ? `group overflow-hidden bg-white rounded-2xl relative ${widthClass || 'max-w-sm md:max-w-md'} w-full cursor-pointer transition-all ease-out duration-300 shadow-md hover:shadow-lg border border-transparent hover:border-[#00acee] hover:ring-2 ring-[#00acee]/35 py-0 gap-0 mt-4 p-3 ${className ?? ""}`
          : `group overflow-hidden transition-all duration-300 bg-white rounded-2xl relative ${widthClass || 'max-w-sm md:max-w-md'} w-full cursor-pointer transform ${disableHoverScale ? "" : "hover:scale-[1.01]"} shadow-sm hover:shadow-[0_0_16px_rgba(0,172,238,0.15)] hover:ring-2 ${hoverRingClass} mt-4 p-3 ${className ?? ""}`
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Image wrapper restored to original taller aspect ratio (4/3) for larger image height */}
  {/** Determine aspect ratio class explicitly so Tailwind sees both variants */}
  {/** Available: aspect-[4/3] (default), aspect-[4/2] (shorter) */}
  {/** Apply custom imagePaddingClass (e.g. "px-2 pt-2") so top padding can match left/right */}
  <div className={`relative w-full ${edgeToEdgeImage ? '' : (imagePaddingClass || 'px-2')} ${imageAspect === '4/2' ? 'aspect-[4/2]' : 'aspect-[4/3]'}` }>
        <div className="relative w-full h-full">
          {!imgError ? (
            <Image
              src={imgSrc}
              alt={property.name}
              fill
              loader={loaderFunc}
              unoptimized={true}
              className={`object-cover transition-transform ${edgeToEdgeImage ? roundedImageClass : 'rounded-xl'} duration-500 ease-out ${disableImageHoverZoom ? 'scale-100' : isHovered ? (simpleShadow ? 'scale-[1.02]' : 'scale-110') : 'scale-100'}`}
              onError={handleImageError}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center bg-gray-100 ${edgeToEdgeImage ? roundedImageClass : 'rounded-xl'}`}>
              <Home className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Price tag - Now clearly in Rands with "From" prefix and green background */}
        <div className="absolute top-3 right-3 z-20">
          <div className="bg-[#3dca00] shadow-md text-white px-3 py-1.5 rounded-2xl flex items-center border border-[#3dca00]">
            <span className="font-bold text-white mr-1">From</span>
            <span className="font-bold">R {displayPrice.toLocaleString('en-ZA')}</span>
          </div>
        </div>
        
        {/* Available rooms badge */}
        {property.availableRooms !== undefined && property.availableRooms > 0 && (
          <div className="absolute top-3 left-3 z-20">
            <Badge className="bg-green-500 text-white text-xs font-medium rounded-2xl">
              {property.availableRooms} {property.availableRooms === 1 ? 'Room' : 'Rooms'} Available
            </Badge>
          </div>
        )}

        {/* Feature badges */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 z-20">
          {property.isPetsAllowed && (
            <Badge className="bg-white/90 text-gray-800 text-xs font-medium backdrop-blur-sm border border-gray-200 rounded-2xl">
              Pets Allowed
            </Badge>
          )}
          {property.isParkingIncluded && (
            <Badge className="bg-white/90 text-gray-800 text-xs font-medium backdrop-blur-sm border border-gray-200 rounded-2xl">
              Parking Included
            </Badge>
          )}
        </div>

  {/* NSFAS and Favorite Icons - Straddle image and content (half above, half below) */}
  {/* Action icons container: lowered z-index so it doesn't overlap the site navbar when scrolling */}
  {/* NSFAS + Favorite icons straddling image/content: half above, half below */}
  <div className="absolute bottom-0 right-3 transform translate-y-1/2 flex items-center gap-2 z-[60]">
          {/* NSFAS Accredited Badge with Image */}
          {property.isNsfassAccredited && (
            <div className={`relative ${largeActionIcons ? "w-[3.8rem] h-[3.8rem] p-1.5" : "w-[3.3rem] h-[3.3rem] p-1"} bg-white rounded-full shadow-lg border border-gray-200`}>
              <Image
                src="/universities/nasfas.png"
                alt="NSFAS Accredited"
                width={44}
                height={44}
                className="w-full h-full rounded-full object-contain hover:scale-110 transition-transform duration-200"
                title="NSFAS Accredited Property"
              />
            </div>
          )}

          {/* Favorite button */}
      {showFavoriteButton && (
            <Button
              size="icon"
              variant="ghost"
        className={`${largeActionIcons ? "h-[3.8rem] w-[3.8rem]" : "h-[3.3rem] w-[3.3rem]"} rounded-full p-0 transition-all duration-300 ${
                isFavorite 
                  ? "bg-white text-red-500 shadow-lg border border-gray-200 scale-105" 
                  : "bg-white/95 text-[#00acee] border border-gray-200 shadow-lg hover:scale-105"
              }`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onFavoriteToggle?.()
              }}
              title="Add to favorites"
            >
        <Heart className={`${largeActionIcons ? "h-7 w-7" : "h-6 w-6"} transition-all duration-300 ${isFavorite ? "fill-red-500 text-red-500" : "text-[#00acee]"}`} />
              <span className="sr-only">Toggle favorite</span>
            </Button>
          )}
        </div>
      </div>

  <div className={`p-4 ${largeActionIcons ? "pt-10" : "pt-12"} space-y-3 bg-white`}>
        {/* Reviews row */}
        {typeof (reviewsCount ?? property.numberOfReviews) === "number" && (
          <div className="flex items-center text-xs text-[#536167]">
            <Star className={`h-3.5 w-3.5 mr-1.5 ${simpleShadow ? "text-[#536167]" : "text-[#00acee]"}`} />
            <span className="font-normal">{((reviewsCount ?? property.numberOfReviews) as number).toLocaleString()} reviews</span>
          </div>
        )}
        <div className="space-y-1">
          <h2 className="line-clamp-1 text-lg font-bold text-[#043e55] group-hover:text-[#00acee]">
            {propertyLink ? (
              <Link href={propertyLink} className="hover:text-[#00acee]" scroll={false}>
                {property.name}
              </Link>
            ) : (
              property.name
            )}
          </h2>
          {property.description && <p className={`text-[13px] sm:text-sm text-[#536167] ${simpleShadow ? "font-semibold" : "font-normal"} line-clamp-4`}>{property.description}</p>}
        </div>

        {/* Location and University Information */}
  <div className="space-y-2">
          <div className="flex items-center text-sm text-[#536167]">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded-full mr-2 flex-shrink-0">
              <MapPin className="h-4 w-4 text-[#00acee]" />
            </div>
            <p className="line-clamp-1 font-normal">
              {(() => {
                if (!property.location) return 'No location';
                const address = property.location.address || '';
                const city = property.location.city || '';
                if (locationDisplayMode === 'suburbCity') {
                  // Attempt to extract suburb + city from the address string.
                  // Example input: "43 Amanda avenue, Arcadia, Johannesburg" -> "Arcadia, Johannesburg"
                  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
                  if (parts.length >= 2) {
                    // If city prop matches one of the parts, use the preceding part as suburb
                    const cityLower = city.toLowerCase();
                    let cityIndex = parts.findIndex(p => p.toLowerCase() === cityLower);
                    if (cityIndex === -1 && parts.length >= 2) {
                      // Fallback: assume last part is city if explicit city missing in parts
                      cityIndex = parts.length - 1;
                    }
                    if (cityIndex > 0) {
                      const suburb = parts[cityIndex - 1];
                      const finalCity = city || parts[cityIndex];
                      return `${suburb}, ${finalCity}`;
                    }
                    // If we cannot find a suburb preceding city, fallback to last two segments
                    const suburb = parts[parts.length - 2];
                    const finalCity = city || parts[parts.length - 1];
                    return `${suburb}${finalCity ? `, ${finalCity}` : ''}`;
                  }
                  // If we only have one segment, just return city or that segment
                  return city || address || 'No location';
                }
                // Default full display
                return `${address || 'No address'}${city ? ', ' + city : ''}`;
              })()}
            </p>
          </div>
          
          {/* Closest University */}
          {property.closestUniversities && property.closestUniversities.length > 0 && (
            <div className="flex items-center text-sm text-[#536167]">
              <div className="flex items-center justify-center w-7 h-7 bg-gray-50 rounded-full mr-2 flex-shrink-0">
                <svg className="h-3.5 w-3.5 text-[#00acee]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="line-clamp-1 font-normal">
                Close to {property.closestUniversities.slice(0, 2).join(", ")}
                {property.closestUniversities.length > 2 && ` +${property.closestUniversities.length - 2} more`}
              </p>
            </div>
          )}
        </div>
        
        {/* Room Information Section - Detailed view */}
        {property.availableRooms !== undefined && property.availableRooms > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100">
            <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
              <Bed className="h-4 w-4 mr-1 text-[#00acee]" /> Available Rooms
            </h3>
            <div className="space-y-2">
              {/* Room example 1 */}
              <div className="bg-white p-2 rounded border border-blue-100 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Standard Room</p>
                  <p className="text-xs text-gray-500 font-normal italic">Private Bath • 18m²</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#00acee]">R {Math.round(displayPrice * 0.6).toLocaleString('en-ZA')}</p>
                  <p className="text-xs text-gray-500">per month</p>
                </div>
              </div>
              
              {/* Room example 2 */}
              {property.availableRooms > 1 && (
                <div className="bg-white p-2 rounded border border-blue-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Deluxe Room</p>
                    <p className="text-xs text-gray-500 font-normal italic">Private Bath • 22m²</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">R {Math.round(displayPrice * 0.8).toLocaleString('en-ZA')}</p>
                    <p className="text-xs text-gray-500 font-normal">per month</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center mt-1">
                <Link href={propertyLink || `#`} className="text-xs text-blue-600 hover:text-blue-600 font-medium">
                  View all {property.availableRooms} available rooms
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* The tooltip for managers is now handled through the disabled state of the main button */}
      </div>
    </Card>
  );
}

export default PropertyCard;
