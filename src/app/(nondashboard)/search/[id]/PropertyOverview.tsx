import { useGetPropertyQuery, useGetRoomsQuery } from "@/state/api";
import { PropertyCardSkeleton } from "@/components/ui/skeletons";
import { MapPin, Star } from "lucide-react";
import React from "react";
import { Property } from "@/types/property";
import { getRoomStats } from "@/lib/roomUtils";

interface PropertyOverviewProps {
  propertyId: string | number;
}

const PropertyOverview = ({ propertyId }: PropertyOverviewProps) => {
  const {
    data: property,
    isError,
    isLoading,
  } = useGetPropertyQuery(propertyId);

  // Fetch rooms data for calculating stats
  const { data: rooms } = useGetRoomsQuery(propertyId, { 
    skip: !property 
  });

  // Calculate room-based statistics
  const roomStats = getRoomStats(rooms);
  
  // Use room stats or fallback to property values for backward compatibility
  const displayBeds = roomStats.totalBeds || property?.beds || 0;
  const displayBaths = roomStats.totalBaths || property?.baths || 0;
  const displaySquareFeet = roomStats.totalSquareFeet || property?.squareFeet || 0;

  if (isLoading) return <PropertyCardSkeleton />;
  if (isError || !property) {
    return <>Property not Found</>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-1">
          {property.location?.country} / {property.location?.state} /{" "}
          <span className="font-semibold text-gray-600">
            {property.location?.city}
          </span>
        </div>
        <h1 className="text-3xl font-bold my-5 text-[#043e55]">{property.name}</h1>
        <div className="flex justify-between items-center">
          <span className="flex items-center text-[#536167] font-normal">
            <MapPin className="w-4 h-4 mr-1 text-[#536167]" />
            {property.location?.city}, {property.location?.state},{" "}
            {property.location?.country}
          </span>
          <div className="flex justify-between items-center gap-3">
            <span className="flex items-center text-yellow-500 font-normal">
              <Star className="w-4 h-4 mr-1 fill-current" />
              {property.averageRating ? property.averageRating.toFixed(1) : '0.0'} ({property.numberOfReviews || 0}{" "}
              Reviews)
            </span>
            <span className="text-green-600 font-normal">Verified Listing</span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="border border-primary-200 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center gap-4 px-5">
          <div>
            <div className="text-sm text-[#536167] font-normal">Monthly Rent</div>
            <div className="font-semibold text-green-600">
              R {(property?.price || 0).toLocaleString('en-ZA')}
            </div>
          </div>
          <div className="border-l border-gray-300 h-10"></div>
          <div>
            <div className="text-sm text-[#536167] font-normal">Bedrooms</div>
            <div className="font-normal text-[#536167]">{displayBeds} bd</div>
          </div>
          <div className="border-l border-gray-300 h-10"></div>
          <div>
            <div className="text-sm text-[#536167] font-normal">Bathrooms</div>
            <div className="font-normal text-[#536167]">{displayBaths} ba</div>
          </div>
          <div className="border-l border-gray-300 h-10"></div>
          <div>
            <div className="text-sm text-[#536167] font-normal">Square Feet</div>
            <div className="font-normal text-[#536167]">
              {displaySquareFeet ? displaySquareFeet.toLocaleString() : 'N/A'} sq ft
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="my-16">
        <h2 className="text-xl font-bold mb-5 text-[#043e55]">About {property.name}</h2>
        <p className="text-[#536167] font-normal leading-7">
          {property.description}

        </p>
      </div>
    </div>
  );
};

export default PropertyOverview;