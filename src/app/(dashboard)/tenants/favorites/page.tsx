"use client";

import ModernPropertyCard from "@/components/ModernPropertyCard";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import {
  useGetAuthUserQuery,
  useGetPropertiesQuery,
  useGetTenantQuery,
  useRemoveFavoritePropertyMutation,
} from "@/state/api";
import { Heart } from "lucide-react";
import React, { useState } from "react";
import { useSignInRedirect } from "@/hooks/useSignInRedirect";

const Favorites = () => {
  const { data: authUser, isLoading: authLoading, error: authError } = useGetAuthUserQuery();
  const [removeFavorite] = useRemoveFavoritePropertyMutation();
  const { signinUrl } = useSignInRedirect();

  if (authLoading) return <Loading />;

  if (authError || !authUser) {
    return (
      <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header
          title="Favorited Properties"
          subtitle="Browse and manage your saved property listings"
        />
        <div className="flex flex-col items-center justify-center p-12 mt-8 bg-white dark:bg-[#0F1112] border border-gray-200 dark:border-[#333] rounded-xl text-center shadow-md">
          <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4">
            <Heart className="h-12 w-12 text-blue-400 dark:text-blue-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Sign in to view favorites</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
            You need to be signed in with your student account to see saved properties. Please log in to continue.
          </p>
          <a
            href={signinUrl}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 transition"
          >
            Go to sign in
          </a>
        </div>
      </div>
    );
  }
  const { data: tenant, refetch: refetchTenant, isLoading: tenantLoading, error: tenantError } = useGetTenantQuery(
    authUser?.cognitoInfo?.userId || "",
    {
      // Skip if no user ID or if user is a manager
      skip: !authUser?.cognitoInfo?.userId || authUser?.userRole === "manager",
    }
  );

  if (authUser.userRole === "manager") {
    return (
      <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header
          title="Favorited Properties"
          subtitle="Browse and manage your saved property listings"
        />
        <div className="flex flex-col items-center justify-center p-12 mt-8 bg-white dark:bg-[#0F1112] border border-gray-200 dark:border-[#333] rounded-xl text-center shadow-md">
          <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4">
            <Heart className="h-12 w-12 text-blue-400 dark:text-blue-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Favorites unavailable for managers</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Manager accounts don&apos;t have a favorites list. Switch to a student account to save properties.
          </p>
        </div>
      </div>
    );
  }

  const {
    data: favoriteProperties,
    isLoading,
    error,
    refetch: refetchProperties,
  } = useGetPropertiesQuery(
    { favoriteIds: tenant?.favorites?.map((fav: { id: number }) => fav.id) },
    { skip: !tenant?.favorites || tenant?.favorites.length === 0 }
  );

  const handleRemoveFavorite = async (propertyId: number) => {
    try {
      // Pass both cognitoId and propertyId as an object to match the expected type
      await removeFavorite({ 
        cognitoId: authUser?.cognitoInfo?.userId || "", 
        propertyId 
      }).unwrap();
      // Refetch to update the UI
      refetchTenant();
      refetchProperties();
    } catch (err) {
      console.error("Failed to remove from favorites:", err);
    }
  };

  // Show loading state while fetching tenant data
  if (tenantLoading) return <Loading />;
  
  // Handle tenant error gracefully
  if (tenantError) {
    return (
      <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header
          title="Favorited Properties"
          subtitle="Browse and manage your saved property listings"
        />
        <div className="flex flex-col items-center justify-center p-12 mt-8 bg-white dark:bg-[#0F1112] border border-gray-200 dark:border-[#333] rounded-xl text-center shadow-md">
          <div className="p-4 rounded-full bg-red-50 dark:bg-red-900/20 mb-4">
            <Heart className="h-12 w-12 text-red-400 dark:text-red-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Unable to Load Profile</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">We couldn&apos;t load your profile information. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  // Show loading state while fetching properties
  if (isLoading) return <Loading />;
  
  // Handle property loading error gracefully
  if (error) {
    return (
      <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header
          title="Favorited Properties"
          subtitle="Browse and manage your saved property listings"
        />
        <div className="flex flex-col items-center justify-center p-12 mt-8 bg-white dark:bg-[#0F1112] border border-gray-200 dark:border-[#333] rounded-xl text-center shadow-md">
          <div className="p-4 rounded-full bg-red-50 dark:bg-red-900/20 mb-4">
            <Heart className="h-12 w-12 text-red-400 dark:text-red-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Unable to Load Favorites</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">We couldn&apos;t load your favorite properties. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ">
      <Header
        title="Favorited Properties"
        subtitle="Browse and manage your saved property listings"
      />
      
      {/* Enhanced card grid with larger, wider cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10 max-w-screen-xl mx-auto">
        {favoriteProperties?.map((property) => {
          try {
            // Debug the raw property data
            console.log('RAW PROPERTY FROM API:', {
              id: property.id,
              price: property.price,
              priceType: typeof property.price
            });
            
            // Transform property to add any missing required fields
            const locationData = (property.location && typeof property.location === 'object')
              ? (property.location as Record<string, unknown>)
              : {};

            const normalizedPhotoUrls = Array.isArray(property.photoUrls)
              ? property.photoUrls.filter((url) => typeof url === 'string' && /^https?:\/\//.test(url))
              : [];

            const enhancedProperty = {
              ...property,
              // Pass through the original price data
              price: property.price,
              // Ensure squareFeet is always a number (required by ModernPropertyCard)
              squareFeet: property.squareFeet || 0,
              // Ensure location field has all required properties
              location: {
                ...locationData,
                address: typeof locationData.address === 'string' ? locationData.address : '',
                city: typeof locationData.city === 'string' ? locationData.city : ''
              },
              // Ensure photoUrls is an array
              photoUrls: normalizedPhotoUrls
            };
            
          
            
            return (
              <div key={property.id} className="transform transition-all ml-[-2.5rem] duration-300 hover:scale-[1.02] hover:shadow-xl">
                <ModernPropertyCard
                  property={enhancedProperty}
                  isFavorite={true}
                  onFavoriteToggle={() => handleRemoveFavorite(property.id)}
                  showFavoriteButton={true}
                  propertyLink={`/properties/${property.id}`}
                  userRole="tenant"
                />
              </div>
            );
          } catch (cardError) {
            console.error(`Error rendering property card ${property.id}:`, cardError);
            return (
              <div key={property.id} className="transform transition-all ml-[-2.5rem] duration-300">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">Unable to display property</p>
                </div>
              </div>
            );
          }
        })}
      </div>
      
      {(!favoriteProperties || favoriteProperties.length === 0) && (
        <div className="flex flex-col items-center justify-center p-12 mt-8 bg-white dark:bg-[#0F1112] border border-gray-200 dark:border-[#333] rounded-xl text-center shadow-md">
          <div className="p-4 rounded-full bg-red-50 dark:bg-red-900/20 mb-4">
            <Heart className="h-12 w-12 text-red-400 dark:text-red-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Favorites Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">You haven&apos;t added any properties to your favorites yet. Browse properties and click the heart icon to add them here.</p>
        </div>
      )}
    </div>
  );
};

export default Favorites;
