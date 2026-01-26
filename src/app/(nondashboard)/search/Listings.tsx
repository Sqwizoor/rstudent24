import {
  useAddFavoritePropertyMutation,
  useGetPropertiesQuery,
  useGetTenantQuery,
  useRemoveFavoritePropertyMutation,
} from "@/state/api";
import { toast } from "sonner";
import { useAppSelector } from "@/state/redux";
import { Property } from "@/types/prismaTypes";
import Card from "@/components/Card";
import CardCompact from "@/components/CardCompact";
import React, { useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useSignInRedirect } from "@/hooks/useSignInRedirect";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

const Listings = () => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Number of properties per page
  
  // Use unified auth to support both NextAuth (Google) and Cognito
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const userId = authUser?.id || "";
  
  const { data: tenant, isError: tenantError } = useGetTenantQuery(
    userId,
    {
      // Skip if no user ID or if user is a manager
      skip: !userId || authUser?.role === "manager",
      // Don't refetch on focus to prevent unnecessary error toasts
      refetchOnFocus: false,
      // Don't refetch on reconnect to prevent unnecessary error toasts
      refetchOnReconnect: false,
    }
  );
  const [addFavorite] = useAddFavoritePropertyMutation();
  const [removeFavorite] = useRemoveFavoritePropertyMutation();
  const viewMode = useAppSelector((state) => state.global.viewMode);
  const filters = useAppSelector((state) => state.global.filters);
  const { signinUrl } = useSignInRedirect();

  const {
    data: allProperties,
    isLoading,
    isError,
  } = useGetPropertiesQuery(filters, {
    // Make sure we can still fetch properties even if auth fails
    skip: false
  });
  
  // Validate and process property data to ensure required fields are present
  const properties = React.useMemo(() => {
    if (!allProperties || allProperties.length === 0) return [];
    
    // Return processed properties with guaranteed values for required fields
    return allProperties.map(property => ({
      ...property,
      // Ensure price is available (default to 0 for sorting/display purposes)
      price: typeof property.price === 'number' ? property.price : 0,
      // Ensure squareFeet is available (default to 0 when undefined)
      squareFeet: typeof property.squareFeet === 'number' ? property.squareFeet : 0,
      // Ensure images array is valid
      images: Array.isArray(property.images) && property.images.length > 0 ? property.images : [],
      // Ensure numberOfReviews is a number (not undefined)
      numberOfReviews: typeof property.numberOfReviews === 'number' ? property.numberOfReviews : 0,
      // Ensure other required fields have defaults
      location: property.location || {
        id: 0,
        address: 'No address provided',
        city: 'Unknown location',
        state: '',
        country: 'South Africa',
      }
    }));
  }, [allProperties]);

  // Local state to track favorite status changes for immediate UI feedback
  const [localFavorites, setLocalFavorites] = useState<Record<number, boolean>>({});

  // Initialize local favorites state from tenant data
  React.useEffect(() => {
    if (tenant?.favorites) {
      const initialFavorites: Record<number, boolean> = {};
      tenant.favorites.forEach((fav: Property) => {
        initialFavorites[fav.id] = true;
      });
      setLocalFavorites(initialFavorites);
    }
  }, [tenant?.favorites]);

  const handleFavoriteToggle = async (propertyId: number) => {
    // Check if user is logged in
    if (!authUser) {
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Login Required</span>
          <span className="text-sm">You must be logged in to save favorites</span>
        </div>,
        {
          id: 'login-required',
          action: {
            label: 'Log in',
            onClick: () => {
              window.location.href = signinUrl;
            }
          }
        }
      );
      return;
    }

    // Immediately update UI state before API call completes
    const currentFavoriteStatus = localFavorites[propertyId] || false;
    setLocalFavorites(prev => ({
      ...prev,
      [propertyId]: !currentFavoriteStatus
    }));

    try {
      const userId = authUser.id;
      
      if (currentFavoriteStatus) {
        await removeFavorite({
          cognitoId: userId,
          propertyId,
        });
        toast.success('Property removed from favorites');
        console.log('Property removed from favorites:', propertyId);
      } else {
        await addFavorite({
          cognitoId: userId,
          propertyId,
        });
        toast.success('Property added to favorites');
        console.log('Property added to favorites:', propertyId);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert the UI state if the API call fails
      setLocalFavorites(prev => ({
        ...prev,
        [propertyId]: currentFavoriteStatus
      }));
      toast.error('Failed to update favorites. Please try again.');
    }
  };

  if (isLoading) return (
    <div className="w-full px-1 md:px-0 md:pr-4 xl:pr-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 md:gap-6 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl overflow-hidden mt-6 shadow-md border border-transparent w-full">
            {/* Image skeleton */}
            <div className="relative w-full aspect-[4/3] px-2 pt-2">
              <div className="w-full h-full bg-gray-200 rounded-3xl animate-pulse"></div>
              
              {/* Price tag skeleton */}
              <div className="absolute top-3 right-3">
                <div className="bg-gray-300 rounded-xl w-20 h-8 animate-pulse"></div>
              </div>
              
              {/* Available rooms badge skeleton */}
              <div className="absolute top-3 left-3">
                <div className="bg-gray-300 rounded-xl w-16 h-6 animate-pulse"></div>
              </div>
              
              {/* Bottom right icons skeleton */}
              <div className="absolute bottom-0 right-3 transform translate-y-1/2 flex items-center gap-2">
                <div className="w-11 h-11 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="w-11 h-11 bg-gray-300 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Content skeleton */}
            <div className="p-4 pt-5 space-y-3">
              {/* Title skeleton */}
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded-xl animate-pulse w-3/4"></div>
                {/* Review skeleton */}
                <div className="h-4 bg-gray-200 rounded-xl animate-pulse w-20"></div>
              </div>
              
              {/* Description skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded-xl animate-pulse w-full"></div>
                <div className="h-4 bg-gray-200 rounded-xl animate-pulse w-2/3"></div>
              </div>
              
              {/* Location and university skeleton */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded-xl animate-pulse flex-1"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded-xl animate-pulse w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
    
  if (isError || !properties) return (
    <div className="flex justify-center items-center min-h-[300px] w-full">
      <div className="flex flex-col items-center text-center p-4">
        <div className="text-red-500 text-lg mb-2">Something went wrong</div>
        <p className="text-sm text-gray-600">Failed to fetch properties</p>
      </div>
    </div>
  );

  // Calculate pagination values
  const totalProperties = properties?.length || 0;
  const totalPages = Math.ceil(totalProperties / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalProperties);
  
  // Get current page properties
  const currentProperties = properties.slice(startIndex, endIndex);

  // No properties found after filtering
  if (properties.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[300px] w-full">
        <div className="text-xl font-semibold mb-2">No properties found</div>
        <p className="text-gray-600">Try adjusting your search filters</p>
      </div>
    );
  }

  return (
    <div className="w-full px-1 md:px-0 md:pr-4 xl:pr-8">
      {/* Property count heading */}
      <div className="mb-4">
        {filters.propertyName ? (
          <h2 className="text-xl font-semibold mb-2">
            Properties matching &quot;{filters.propertyName}&quot;
          </h2>
        ) : filters.location && filters.location !== 'any' ? (
          <h2 className="text-xl font-semibold mb-2">
            Properties in {filters.location.replace(/,\s*South Africa/i, '')}
          </h2>
        ) : null}
        {filters.propertyName && (
          <div className="mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              🏠 Property Name Search
            </span>
          </div>
        )}
        <div className="text-sm text-gray-600">
          Showing {startIndex + 1}-{endIndex} of {totalProperties} properties
        </div>
      </div>

      {/* Property grid */}
      <div
        className={`grid ${
          viewMode === "grid"
            ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-2"
            : "grid-cols-1"
        } gap-4 md:gap-6 mb-8`}
      >
        {currentProperties.map((property) => (
          viewMode === "grid" ? (
            <Card
              key={property.id}
              property={property}
              isFavorite={localFavorites[property.id] || false}
              onFavoriteToggle={() => handleFavoriteToggle(property.id)}
              propertyLink={`/search/${property.id}`}
              userRole={authUser?.role === 'student' ? 'tenant' : (authUser?.role || null)}
              showFavoriteButton={true}
              className="mt-0 border-0 !p-2"
              imagePaddingClass="p-0"
              largeActionIcons
              simpleShadow
              reviewsCount={(property as any).reviews ?? (property as any).reviewCount ?? (property as any).reviewsCount}
              locationDisplayMode="suburbCity"
              imageAspect="4/3"
              widthClass="max-w-full"
            />
          ) : (
            <CardCompact
              key={property.id}
              property={property}
              isFavorite={localFavorites[property.id] || false}
              onFavoriteToggle={() => handleFavoriteToggle(property.id)}
              propertyLink={`/search/${property.id}`}
              userRole={authUser?.role === 'student' ? 'tenant' : (authUser?.role || null)}
              showFavoriteButton={true}
            />
          )
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalProperties}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default Listings;
