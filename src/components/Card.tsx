"use client"

import type React from "react"
import type { ImageLoaderProps } from "next/image"
import { Heart, Home, MapPin, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getRoomStats } from "@/lib/roomUtils"
import { getCampusLabelsByIds } from "@/lib/constants"
import { optimizedImageLoader, PROPERTY_CARD_SIZES, IMAGE_QUALITY } from "@/lib/imageLoader"
import type { Property, Room } from "@/types/prismaTypes"

interface PropertyCardProps {
  property: Property & {
    rooms?: Room[] // Add rooms data for calculation
    availableRooms?: number
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
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  // Calculate room-based statistics for price fallback
  const roomStats = getRoomStats(property.rooms);
  
  // Use property-level specifications directly
  const displayBeds = property.beds || 0;
  const displayBaths = property.baths || 0;
  const displayKitchens = property.kitchens || 0;
  const displaySquareFeet = property.squareFeet || 0;
  const displayPrice = property.minRoomPrice ?? roomStats.minPrice ?? property.price ?? property.pricePerMonth ?? 0;

  // Use optimized image loader with quality setting
  const loaderFunc = (props: ImageLoaderProps) => {
    return optimizedImageLoader({ ...props, quality: IMAGE_QUALITY.card })
  }

  // Handle image error with better fallback
  const handleImageError = () => {
    console.warn(`Failed to load image: ${imgSrc}`)
    
    // Try images array first
    if (property.images && property.images.length > 1 && !imgError) {
      const currentIndex = property.images.indexOf(imgSrc)
      const nextIndex = currentIndex + 1
      
      if (nextIndex < property.images.length) {
        setImgSrc(property.images[nextIndex])
        return
      }
    }
    
    // Then try photoUrls array
    if (property.photoUrls && property.photoUrls.length > 1 && !imgError) {
      const currentIndex = property.photoUrls.indexOf(imgSrc)
      const nextIndex = currentIndex + 1
      
      if (nextIndex < property.photoUrls.length) {
        setImgSrc(property.photoUrls[nextIndex])
        return
      }
    }
    
    // If all images fail, use placeholder
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
          {!isImageLoaded && (
            <div className={`absolute inset-0 bg-gray-200 animate-pulse ${edgeToEdgeImage ? roundedImageClass : 'rounded-xl'}`} />
          )}
          {!imgError ? (
            <Image
              src={imgSrc}
              alt={property.name}
              fill
              loader={loaderFunc}
              unoptimized={false}
              priority={false}
              loading="lazy"
              sizes={PROPERTY_CARD_SIZES}
              quality={IMAGE_QUALITY.card}
              className={`object-cover transition-transform ${edgeToEdgeImage ? roundedImageClass : 'rounded-xl'} duration-500 ease-out ${disableImageHoverZoom ? 'scale-100' : isHovered ? (simpleShadow ? 'scale-[1.02]' : 'scale-110') : 'scale-100'}`}
              onError={handleImageError}
              onLoadingComplete={() => setIsImageLoaded(true)}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center bg-gray-100 ${edgeToEdgeImage ? roundedImageClass : 'rounded-xl'}`}>
              <Home className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>        {/* Price tag - Now clearly in Rands with "From" prefix and green background */}
        <div className="absolute top-3 right-3 z-20">
          <div className="bg-[#3dca00] shadow-md text-white px-3 py-1.5 rounded-2xl flex items-center border border-[#3dca00]">
            <span className="font-bold text-white mr-1">From</span>
            <span className="font-bold">R {displayPrice.toLocaleString('en-ZA')}</span>
          </div>
        </div>

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
                  const parts = address.split(',').map((p: string) => p.trim()).filter(Boolean);
                  if (parts.length >= 2) {
                    // If city prop matches one of the parts, use the preceding part as suburb
                    const cityLower = city.toLowerCase();
                    let cityIndex = parts.findIndex((p: string) => p.toLowerCase() === cityLower);
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
          
          {/* Closest Campus */}
          {property.closestCampuses && property.closestCampuses.length > 0 && (
            <div className="flex items-center text-sm text-[#536167]">
              <div className="flex items-center justify-center w-7 h-7 bg-gray-50 rounded-full mr-2 flex-shrink-0">
                <svg className="h-3.5 w-3.5 text-[#00acee]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="line-clamp-1 font-normal">
                {(() => {
                  const campusLabels = getCampusLabelsByIds(property.closestCampuses);
                  const displayLabels = campusLabels.slice(0, 2);
                  return displayLabels.join(", ") + (campusLabels.length > 2 ? ` +${campusLabels.length - 2} more` : "");
                })()}
              </p>
            </div>
          )}
        </div>
        
        {/* The tooltip for managers is now handled through the disabled state of the main button */}
      </div>
    </Card>
  );
}

export default PropertyCard;
