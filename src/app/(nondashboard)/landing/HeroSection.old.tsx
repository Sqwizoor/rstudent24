"use client";
import Image from "next/image";
import React, { useState, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { setFilters } from "@/state";
import { Search, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MobileSearch = ({
  searchQuery,
  handleInputChange,
  handleKeyPress,
  handleLocationSearch
}: {
  searchQuery: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleKeyPress: (e: KeyboardEvent<HTMLInputElement>) => void;
  handleLocationSearch: () => void;
}) => {
  return (
    <div className="space-y-3 w-full max-w-md mx-auto">
      {/* Location Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <MapPin size={20} />
        </div>
        <Input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Name of the city or suburb"
          className="w-full h-12 pl-10 bg-white border-0 rounded-lg text-base"
        />
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-3 gap-3">
        <Select defaultValue="any">
          <SelectTrigger className="h-12 bg-white border-0 rounded-lg">
            <SelectValue placeholder="Rent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">any</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="any">
          <SelectTrigger className="h-12 bg-white border-0 rounded-lg">
            <SelectValue placeholder="Property" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">any</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="any">
          <SelectTrigger className="h-12 bg-white border-0 rounded-lg">
            <SelectValue placeholder="Funding" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">any</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Search Button */}
      <Button
        className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-base"
        onClick={handleLocationSearch}
      >
        Find res
      </Button>
    </div>
  );
};

const DesktopSearch = ({
  searchQuery,
  handleInputChange,
  handleKeyPress,
  handleLocationSearch
}: {
  searchQuery: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleKeyPress: (e: KeyboardEvent<HTMLInputElement>) => void;
  handleLocationSearch: () => void;
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <MapPin size={20} />
          </div>
          <Input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Search by city or address"
            className="w-full h-14 pl-11 bg-white border-0 rounded-full text-base"
          />
        </div>
        
        <Select defaultValue="any">
          <SelectTrigger className="w-48 h-14 bg-white border-0 rounded-full">
            <SelectValue placeholder="Property Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Type</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          className="h-14 px-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
          onClick={handleLocationSearch}
        >
          <Search className="mr-2" />
          Search
        </Button>
      </div>
    </div>
  );
};

const HeroSection = () => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("rent");
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Check if screen is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // South African university coordinates
  const universityLocations = {
    UCT: {
      name: "University of Cape Town",
      coordinates: [-33.9577, 18.4612], // Verified
    },
    WITS: {
      name: "University of the Witwatersrand",
      coordinates: [-26.1908, 28.0303], // Slightly adjusted
    },
    UJ: {
      name: "University of Johannesburg",
      coordinates: [-26.1825, 28.0002], // Verified coordinates
    },
    UKZN: {
      name: "University of KwaZulu-Natal",
      coordinates: [-29.8667, 30.9724], // Slightly adjusted
    },
    UWC: {
      name: "University of the Western Cape",
      coordinates: [-33.9308, 18.6272], // Slightly adjusted
    },
    UP: {
      name: "University of Pretoria",
      coordinates: [-25.7545, 28.2314], // Verified
    },
    SU: {
      name: "Stellenbosch University",
      coordinates: [-33.9330, 18.8669], // Slightly adjusted
    }
  };


  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  const handleLocationSearch = async () => {
    try {
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) return;
      
      // First, search for properties by name/description
      const propertySearchResponse = await fetch(
        `/api/properties?propertyName=${encodeURIComponent(trimmedQuery)}`
      );
      
      if (propertySearchResponse.ok) {
        const properties = await propertySearchResponse.json();
        
        // If we found exact property matches, navigate directly to search results
        if (properties && properties.length > 0) {
          console.log(`Found ${properties.length} property matches for "${trimmedQuery}"`);
          
          // Update the filters in the redux store
          dispatch(
            setFilters({
              location: trimmedQuery,
              coordinates: [0, 0] as [number, number], // Default coordinates for property name search
              propertyName: trimmedQuery, // Add property name to filters
            })
          );
          
          // Navigate to the search page with the property name search
          const params = new URLSearchParams({
            location: trimmedQuery,
            propertyName: trimmedQuery,
          });
          
          router.push(`/search?${params.toString()}`);
          return; // Exit early since we found property matches
        }
      }
      
      // If no property matches found, fallback to geocoding search
      console.log(`No property matches found for "${trimmedQuery}", trying geocoding...`);
      
      // Search for locations without country restriction
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          trimmedQuery
        )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        }&fuzzyMatch=true&types=place,locality,neighborhood,address,poi`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        // Use the first result directly
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        
        // Extract just the place name without country
        const locationName = feature.place_name.split(',')[0];
        
        // Update the filters in the redux store
        dispatch(
          setFilters({
            location: locationName,
            coordinates: [lng, lat] as [number, number],
          })
        );
        
        // Navigate to the search page with the query parameters
        const params = new URLSearchParams({
          location: locationName,
          coordinates: `${lng},${lat}`,
          lat: lat.toString(),
          lng: lng.toString(),
        });
        
        router.push(`/search?${params.toString()}`);
      } else {
        console.log("No location results found");
        // Still search with the raw query as location
        dispatch(
          setFilters({
            location: trimmedQuery,
            coordinates: [0, 0] as [number, number],
          })
        );
        
        const params = new URLSearchParams({
          location: trimmedQuery,
        });
        
        router.push(`/search?${params.toString()}`);
      }
    } catch (error) {
      console.error("Error searching:", error);
      // Fallback: search with the raw query
      dispatch(
        setFilters({
          location: searchQuery.trim(),
          coordinates: [0, 0] as [number, number],
        })
      );
      
      const params = new URLSearchParams({
        location: searchQuery.trim(),
      });
      
      router.push(`/search?${params.toString()}`);
    }
  };

  // Handle university button click
  const handleUniversityClick = (universityKey: string) => {
    setActiveTab(universityKey.toLowerCase());

    const university = universityLocations[universityKey as keyof typeof universityLocations];
    if (university) {
      // Get the coordinates in the correct format
      const [lat, lng] = university.coordinates;

      // Update the search query to the university name
      setSearchQuery(university.name);

      // Update the filters in the redux store with the correct coordinate format
      dispatch(
        setFilters({
          location: university.name,
          coordinates: [lng, lat] as [number, number], // Use [lng, lat] format to match search page
        })
      );

      // Navigate to the search page with the university coordinates
      const params = new URLSearchParams({
        location: university.name,
        coordinates: `${lng},${lat}`, // Format as lng,lat for consistency
        lat: lat.toString(),
        lng: lng.toString(),
      });

      router.push(`/search?${params.toString()}`);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleLocationSearch();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="relative h-screen md:h-[80vh]">
      {/* Background Image with gradient overlay */}
      <div className="absolute inset-0">
        <Image
          src="/houses.jpg"
          alt="Rental Platform Hero"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/40"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full flex items-center px-4">
        <div className={cn(
          "w-full mx-auto",
          isMobile ? "max-w-sm pt-0" : "max-w-5xl pt-12"
        )}>
          {/* Hero Content */}
          <div className="space-y-8">
            {/* Text Content */}
            <div className="text-center space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className={cn(
                  "font-bold text-white tracking-tight",
                  isMobile ? "text-4xl" : "text-6xl md:text-7xl"
                )}
              >
                Find any res.
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={cn(
                  "text-white/80",
                  isMobile ? "text-base" : "text-xl"
                )}
              >
                Find accommodations close to campus at your budget.
              </motion.p>
            </div>

              {/* Search Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={cn(
                "w-full mx-auto",
                isMobile ? "space-y-3" : "max-w-3xl"
              )}
            >
              {/* Location Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <MapPin size={20} />
                </div>
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Name of the city or suburb"
                  className={cn(
                    "w-full pl-10 bg-white border-0 text-base",
                    isMobile ? "h-12 rounded-lg" : "h-14 rounded-full"
                  )}
                />
              </div>

              {isMobile ? (
                <>
                  {/* Mobile Filter Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <Select defaultValue="any">
                      <SelectTrigger className="h-12 bg-white border-0 rounded-lg">
                        <SelectValue placeholder="Rent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">any</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select defaultValue="any">
                      <SelectTrigger className="h-12 bg-white border-0 rounded-lg">
                        <SelectValue placeholder="Property" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">any</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select defaultValue="any">
                      <SelectTrigger className="h-12 bg-white border-0 rounded-lg">
                        <SelectValue placeholder="Funding" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">any</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mobile Search Button */}
                  <Button
                    className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-base"
                    onClick={handleLocationSearch}
                  >
                    Find res
                  </Button>
                </>
              ) : (
                <div className="flex gap-3">
                  {/* Desktop filters and button here */}
                  <div className="flex-1">
                    <Select defaultValue="any">
                      <SelectTrigger className="h-14 bg-white border-0 rounded-full">
                        <SelectValue placeholder="Property Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Type</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    className="h-14 px-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                    onClick={handleLocationSearch}
                  >
                    <Search className="mr-2" />
                    Search
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Define the prop types for PropertyTypeTab component
interface PropertyTypeTabProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

// Property Type Tab Component with TypeScript props
const PropertyTypeTab: React.FC<PropertyTypeTabProps> = ({
  icon,
  label,
  isActive,
  onClick,
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-5 py-3 flex items-center gap-2 font-medium rounded-md md:rounded-full transition-all duration-300 ${isActive
          ? "bg-blue-500 text-white shadow-lg"
          : "bg-white/80 text-gray-800 hover:bg-white"
        }`}
    >
      {icon}
      {label}
    </motion.button>
  );
};

export default HeroSection;
