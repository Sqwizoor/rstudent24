"use client";

import React, { useState, useEffect } from "react";
import { useGetPropertiesQuery, useAddFavoritePropertyMutation, useRemoveFavoritePropertyMutation } from "@/state/api";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import Card from "@/components/Card";
import { useAppSelector } from "@/state/redux";
import { useDispatch } from "react-redux";
import { setFilters } from "@/state";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { useSignInRedirect } from "@/hooks/useSignInRedirect";


const RandomListings = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { signinUrl } = useSignInRedirect();
  const filters = useAppSelector((state) => state.global.filters);
  
  // Authentication and favorites - use unified auth
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const [addFavoriteProperty] = useAddFavoritePropertyMutation();
  const [removeFavoriteProperty] = useRemoveFavoritePropertyMutation();
  
  // Local filter state
  const [localFilters, setLocalFilters] = useState({
    location: "",
    propertyType: "any",
    priceRange: [2000, 20000] as [number, number],
  });
  
  // Get the cities from the city selection component
  const cities = [
    "Johannesburg",
    "Cape Town",
    "Durban",
    "Pretoria",
    "Bloemfontein",
  ];
  
  const [selectedCity, setSelectedCity] = useState(cities[0]);
  
  // Update local filters when city changes
  useEffect(() => {
    setLocalFilters(prev => ({
      ...prev,
      location: `${selectedCity}, South Africa`,
    }));
  }, [selectedCity]);
  
  // Fetch properties based on selected city
  const { data: properties, isLoading } = useGetPropertiesQuery({
    location: `${selectedCity}, South Africa`,
    orderBy: 'random',
    limit: 9
  }, {
    // Cache for 1 hour (matching server revalidate)
    pollingInterval: 0,
    refetchOnMountOrArgChange: true, // Refetch when city changes
  });
  
  // South African university coordinates
  const universityLocations = {
    UP: {
      name: "University of Pretoria",
      coordinates: [-25.7545, 28.2314],
    },
    UKZN: {
      name: "University of KwaZulu-Natal",
      coordinates: [-29.8175, 30.9422],
    },
    DUT: {
      name: "Durban University of Technology",
      coordinates: [-29.8526, 31.0089],
    },
    CPUT: {
      name: "Cape Peninsula University of Technology",
      coordinates: [-33.9321, 18.6400],
    },
    UCT: {
      name: "University of Cape Town",
      coordinates: [-33.9577, 18.4612],
    },
    WITS: {
      name: "University of Witwatersrand",
      coordinates: [-26.1929, 28.0305],
    },
    UJ: {
      name: "University of Johannesburg",
      coordinates: [-26.1825, 28.0100],
    },
    TUT: {
      name: "Tshwane University of Technology",
      coordinates: [-25.7312, 28.1636],
    }
  };

  // Handle university button click
  const handleUniversityClick = (universityKey: string) => {
    const university = universityLocations[universityKey as keyof typeof universityLocations];
    if (university) {
      const [lat, lng] = university.coordinates;
      const formattedLocation = `${university.name}, Johannesburg, South Africa`;
      
      dispatch(
        setFilters({
          location: formattedLocation,
          coordinates: [lng, lat] as [number, number],
        })
      );

      const params = new URLSearchParams({
        location: formattedLocation,
        coordinates: `${lng},${lat}`,
        lat: lat.toString(),
        lng: lng.toString(),
      });

      router.push(`/search?${params.toString()}`);
    }
  };
    
  // Handle property card click
  const handlePropertyClick = (propertyId: number) => {
    router.push(`/search/${propertyId}`);
  };
  
  // Handle favorite toggle
  const handleFavoriteToggle = async (propertyId: number) => {
    // Check if user is authenticated (works for both NextAuth and Cognito)
    if (!authUser?.id) {
      console.log('❌ No user ID, redirecting to sign in');
      // Redirect to login if user is not authenticated
      router.push(signinUrl);
      return;
    }
    
    // Only tenants/students can have favorites
    if (authUser.role !== 'tenant' && authUser.role !== 'student') {
      console.log('❌ User role not allowed for favorites:', authUser.role);
      return;
    }
    
    console.log('🎯 Toggling favorite:', {
      userId: authUser.id,
      propertyId,
      role: authUser.role,
      provider: authUser.provider
    });
    
    try {
      const userId = authUser.id;
      const tenantInfo = authUser.userInfo as any; // Cast to access favorites
      const isCurrentlyFavorite = tenantInfo?.favorites?.some((fav: any) => fav.id === propertyId) || false;
      
      console.log('Current favorite status:', isCurrentlyFavorite);
      
      if (isCurrentlyFavorite) {
        console.log('Removing favorite...');
        const result = await removeFavoriteProperty({
          cognitoId: userId,
          propertyId: propertyId
        }).unwrap();
        console.log('✅ Remove favorite result:', result);
      } else {
        console.log('Adding favorite...');
        const result = await addFavoriteProperty({
          cognitoId: userId,
          propertyId: propertyId
        }).unwrap();
        console.log('✅ Add favorite result:', result);
      }
    } catch (error: any) {
      console.error('❌ Error toggling favorite:', {
        error,
        message: error?.message,
        data: error?.data,
        status: error?.status,
        originalStatus: error?.originalStatus
      });
    }
  };
  
  // Check if property is favorite
  const isPropertyFavorite = (propertyId: number) => {
    if (authUser?.role !== 'tenant' && authUser?.role !== 'student') {
      return false;
    }
    const tenantInfo = authUser.userInfo as any; // Cast to access favorites
    return tenantInfo?.favorites?.some((fav: any) => fav.id === propertyId) || false;
  };
  
  return (
    <div className="py-16 px-0 md:px-8 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-center items-center mb-10">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[#00acee]">
              Featured Properties
            </h2>
            <div className="mx-auto mt-2 mb-3 h-1.5 w-28 rounded-full bg-gradient-to-r from-[#00acee] to-[#3dca00]"></div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Discover our handpicked selection of premium accommodations in {selectedCity}. Find your perfect stay today.
            </p>
          </div>
        </div>
        
        {/* City Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCity === city
                  ? "bg-[#00acee] text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* University Buttons - Auto-scroll on mobile, wrap on desktop */}
        <div className="mt-4 mb-[2rem] md:mx-0 md:px-0">
          {/* Mobile: marquee auto-scroll, no manual scroll */}
          <div className="block md:hidden -mx-4 px-4 overflow-hidden">
            <div className="marquee-inner flex gap-2">
              {/* Track A */}
              <div className="flex gap-2 shrink-0">
                <Button 
                variant="outline" 
                size="sm" 
                className="shrink-0 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("UJ")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to UJ
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                  className="shrink-0 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("WITS")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to Wits
              </Button>
                <Button 
                variant="outline" 
                size="sm" 
                  className="shrink-0 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("UP")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to UP
              </Button>
                <Button 
                variant="outline" 
                size="sm" 
                  className="shrink-0 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("UKZN")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to UKZN
              </Button>
                <Button 
                variant="outline" 
                size="sm" 
                  className="shrink-0 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("DUT")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to DUT
              </Button>
                <Button 
                variant="outline" 
                size="sm" 
                  className="shrink-0 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("UCT")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to UCT
              </Button>
                <Button 
                variant="outline" 
                size="sm" 
                  className="shrink-0 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("TUT")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to TUT
              </Button>
                <Button variant="outline" size="sm" className="shrink-0 bg-white/90 hover:bg-white text-gray-700 rounded-full text-xs px-3 py-1 flex items-center">
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to UFS
              </Button>
              </div>
              {/* Track B (duplicate for seamless loop) */}
              <div className="flex gap-2 shrink-0" aria-hidden="true">
                <Button variant="outline" size="sm" className="shrink-0 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors" onClick={() => handleUniversityClick("UJ")}>
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Close to UJ
                </Button>
                <Button variant="outline" size="sm" className="shrink-0 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors" onClick={() => handleUniversityClick("WITS")}>
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Close to Wits
                </Button>
                <Button variant="outline" size="sm" className="shrink-0 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors" onClick={() => handleUniversityClick("UP")}>
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Close to UP
                </Button>
                <Button variant="outline" size="sm" className="shrink-0 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors" onClick={() => handleUniversityClick("UKZN")}>
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Close to UKZN
                </Button>
                <Button variant="outline" size="sm" className="shrink-0 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors" onClick={() => handleUniversityClick("DUT")}>
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Close to DUT
                </Button>
                <Button variant="outline" size="sm" className="shrink-0 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors" onClick={() => handleUniversityClick("UCT")}>
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Close to UCT
                </Button>
                <Button variant="outline" size="sm" className="shrink-0 bg-white/90 hover:bg-white text-gray-700 rounded-full text-xs px-3 py-1 flex items-center" onClick={() => handleUniversityClick("TUT")}>
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Close to TUT
                </Button>
                <Button variant="outline" size="sm" className="shrink-0 bg-white/90 hover:bg-white text-gray-700 rounded-full text-xs px-3 py-1 flex items-center">
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Close to UFS
                </Button>
              </div>
            </div>
          </div>

          {/* Desktop: wrapped chips, centered */}
          <div className="hidden md:flex flex-wrap justify-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("UJ")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to UJ
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("WITS")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to Wits
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("UP")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to UP
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("UKZN")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to UKZN
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("DUT")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to DUT
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("UCT")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to UCT
              </Button>
              <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white text-gray-700 rounded-full text-xs px-3 py-1 flex items-center" onClick={() => handleUniversityClick("TUT")}>
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to TUT
              </Button>
              <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white text-gray-700 rounded-full text-xs px-3 py-1 flex items-center">
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to UFS
              </Button>
          </div>
        </div>
        
        {/* Properties Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="bg-white rounded-3xl overflow-hidden mt-6 shadow-md border border-transparent">
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
        ) : !properties || properties.length === 0 ? (
          <div className="flex flex-col justify-center items-center min-h-[300px]">
            <div className="text-xl font-semibold mb-2">No properties found</div>
            <p className="text-gray-600">Try adjusting your filters or selecting a different city</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card
                key={property.id}
                property={property}
                isFavorite={isPropertyFavorite(property.id)}
                onFavoriteToggle={() => handleFavoriteToggle(property.id)}
                propertyLink={`/search/${property.id}`}
                userRole={authUser?.role === 'student' ? 'tenant' : (authUser?.role || null)}
                showFavoriteButton={true}
                onClick={() => handlePropertyClick(property.id)}
                className="mt-0 border-0 mx-auto !p-2"
                imagePaddingClass="p-0"
                largeActionIcons
                simpleShadow
                reviewsCount={(property as any).reviews ?? (property as any).reviewCount ?? (property as any).reviewsCount}
                locationDisplayMode="suburbCity"
                imageAspect="4/3"
              />
            ))}
          </div>
        )}
        
        {/* View All Button */}
        <div className="mt-10 flex justify-center">
          <Button 
            className="bg-[#00acee] hover:bg-[#00acee] text-white px-8 py-2 rounded-full"
            onClick={() => {
              const locationQuery = `${selectedCity}, South Africa`;
              
              // Update Redux state
              dispatch(setFilters({
                location: locationQuery,
                coordinates: [0, 0], // Reset coordinates to force text search or let search page handle it
                propertyName: undefined
              }));

              // Navigate to search page
              const params = new URLSearchParams({
                location: locationQuery
              });
              
              router.push(`/search?${params.toString()}`);
            }}
          >
            View All Properties in {selectedCity}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RandomListings;
