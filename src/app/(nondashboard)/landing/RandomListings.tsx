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
  
  // Fetch ALL properties without location filter for random display
  const { data: allProperties, isLoading } = useGetPropertiesQuery({
    // Don't pass any filters - fetch all properties
  }, {
    // Add staleTime to reduce unnecessary refetches
    pollingInterval: 0, // Disable polling for home page
    refetchOnMountOrArgChange: false, // Don't refetch unnecessarily
  });
  
  // State for filtered properties
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  
  // Process and randomize properties
  const randomProperties = React.useMemo(() => {
    if (!allProperties || allProperties.length === 0) return [];

    try {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const storageKey = `randomListings:${selectedCity}`;

      let storedIds: number[] | null = null;
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.date === today && Array.isArray(parsed.ids)) {
            storedIds = parsed.ids as number[];
          }
        }
      }

      // Build a quick index by id
      const byId = new Map<number, any>(allProperties.map((p: any) => [p.id, p]));

      let chosen: any[] = [];
      if (storedIds && storedIds.length) {
        chosen = storedIds.map((id) => byId.get(id)).filter(Boolean);
      }

      // If not enough chosen (first load or new items), fill up with shuffled remainder
      if (chosen.length < 9) {
        const remaining = allProperties.filter((p: any) => !chosen.some((c: any) => c.id === p.id));
        const shuffled = [...remaining];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const need = 9 - chosen.length;
        chosen = [...chosen, ...shuffled.slice(0, Math.max(0, need))];

        if (typeof window !== 'undefined') {
          const idsToStore = chosen.slice(0, 9).map((p: any) => p.id);
          localStorage.setItem(storageKey, JSON.stringify({ date: today, ids: idsToStore }));
        }
      }

      return chosen.slice(0, 9).map((property: any) => ({
        ...property,
        price: typeof property.price === 'number' ? property.price : 0,
        squareFeet: typeof property.squareFeet === 'number' ? property.squareFeet : 0,
        images: Array.isArray(property.images) && property.images.length > 0 ? property.images : [],
        numberOfReviews: typeof property.numberOfReviews === 'number' ? property.numberOfReviews : 0,
        description: property.description || '',
        closestUniversities: property.closestUniversities || [],
        closestCampuses: property.closestCampuses || [],
        location: property.location || {
          address: 'No address provided',
          city: 'Unknown location',
          province: ''
        }
      }));
    } catch (e) {
      console.error('Error computing daily random properties', e);
      // Fallback to simple shuffle if anything goes wrong
      const propertiesCopy = [...allProperties];
      for (let i = propertiesCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [propertiesCopy[i], propertiesCopy[j]] = [propertiesCopy[j], propertiesCopy[i]];
      }
      return propertiesCopy.slice(0, 9).map((property: any) => ({
        ...property,
        price: typeof property.price === 'number' ? property.price : 0,
        squareFeet: typeof property.squareFeet === 'number' ? property.squareFeet : 0,
        images: Array.isArray(property.images) && property.images.length > 0 ? property.images : [],
        numberOfReviews: typeof property.numberOfReviews === 'number' ? property.numberOfReviews : 0,
        description: property.description || '',
        closestUniversities: property.closestUniversities || [],
        closestCampuses: property.closestCampuses || [],
        location: property.location || {
          address: 'No address provided',
          city: 'Unknown location',
          province: ''
        }
      }));
    }
  }, [allProperties, selectedCity]);
  
  // Initialize filtered properties with random properties
  useEffect(() => {
    // Always show random properties initially
    setFilteredProperties(randomProperties);
  }, [randomProperties]);
  
  // Reset to random properties when city changes
  useEffect(() => {
    // When city changes, reset to showing random properties
    if (randomProperties.length > 0) {
      setFilteredProperties(randomProperties);
    }
  }, [selectedCity, randomProperties]);
  
  // South African university coordinates - copied from HeroSection
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

  // Handle university button click - similar to HeroSection
  const handleUniversityClick = (universityKey: string) => {
    const university = universityLocations[universityKey as keyof typeof universityLocations];
    if (university) {
      // Get the coordinates in the correct format
      const [lat, lng] = university.coordinates;
      
      // Add city and country for better geocoding results
      // This is critical for university locations to ensure properties are found
      const formattedLocation = `${university.name}, Johannesburg, South Africa`;
      
      // Update the filters in the redux store with the correct coordinate format
      dispatch(
        setFilters({
          location: formattedLocation,
          coordinates: [lng, lat] as [number, number], // Use [lng, lat] format to match search page
        })
      );

      // Navigate to the search page with the university coordinates
      const params = new URLSearchParams({
        location: formattedLocation,
        coordinates: `${lng},${lat}`, // Format as lng,lat for consistency
        lat: lat.toString(),
        lng: lng.toString(),
      });

      router.push(`/search?${params.toString()}`);
    }
  };
    
  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    if (key === "city") {
      setSelectedCity(value);
      return;
    }
    
    let newValue = value;
    
    if (key === "priceRange") {
      const [min, max] = value;
      newValue = [
        min === "any" ? null : Number(min),
        max === "any" ? null : Number(max)
      ];
    }
    
    setLocalFilters(prev => ({
      ...prev,
      [key]: newValue
    }));
  };
  
  // Apply filters locally instead of navigating to search page
  const handleApplyFilters = () => {
    // Create a full location string with city and country for better geocoding
    const fullLocation = `${selectedCity}, South Africa`;
    
    // Prepare filters to apply
    const filtersToApply = {
      ...localFilters,
      location: fullLocation,
    };
    
    // Set the filters in Redux store (still useful for other components)
    dispatch(setFilters(filtersToApply));
    
    // Filter properties locally based on criteria
    if (!allProperties || allProperties.length === 0) {
      setFilteredProperties([]);
      return;
    }
    
    const filtered = allProperties.filter(property => {
      // Filter by property type if not set to "any"
      if (localFilters.propertyType !== "any" && property.propertyType !== localFilters.propertyType) {
        return false;
      }
      
      // Filter by price range
      const propertyPrice = typeof property.price === 'number' ? property.price : 0;
      if (propertyPrice < localFilters.priceRange[0] || propertyPrice > localFilters.priceRange[1]) {
        return false;
      }
      
      // Filter by location text if provided
      if (localFilters.location && localFilters.location.trim() !== "") {
        const locationText = localFilters.location.toLowerCase();
        const propertyAddress = property.location?.address?.toLowerCase() || "";
        const propertyCity = property.location?.city?.toLowerCase() || "";
        
        if (!propertyAddress.includes(locationText) && !propertyCity.includes(locationText)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Process filtered properties similar to randomProperties
    const processedProperties = filtered.map(property => ({
      ...property,
      price: typeof property.price === 'number' ? property.price : 0,
      squareFeet: typeof property.squareFeet === 'number' ? property.squareFeet : 0,
      images: Array.isArray(property.images) && property.images.length > 0 ? property.images : [],
      numberOfReviews: typeof property.numberOfReviews === 'number' ? property.numberOfReviews : 0,
      description: property.description || '',
      closestUniversities: property.closestUniversities || [],
      closestCampuses: property.closestCampuses || [],
      location: property.location || {
        address: 'No address provided',
        city: 'Unknown location',
        province: ''
      }
    }));
    
    setFilteredProperties(processedProperties);
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
        ) : filteredProperties.length === 0 ? (
          <div className="flex flex-col justify-center items-center min-h-[300px]">
            <div className="text-xl font-semibold mb-2">No properties found</div>
            <p className="text-gray-600">Try adjusting your filters or selecting a different city</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
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
              // Reset filters to default values except for city
              setLocalFilters({
                location: `${selectedCity}, South Africa`,
                propertyType: "any",
                priceRange: [2000, 50000] as [number, number],
              });
              
              // Apply the reset filters to show all properties
              setTimeout(handleApplyFilters, 0);
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
