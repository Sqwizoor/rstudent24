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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HeroSection = () => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("rent");
  const [scrolled, setScrolled] = useState<boolean>(false);

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
      coordinates: [-33.933, 18.8669], // Slightly adjusted
    },
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

      // ✅ PRIORITY 1: Check if it's a property name search first
      // Try property name search for ALL queries (not just non-cities)
      try {
        const propertySearchResponse = await fetch(
          `/api/properties?propertyName=${encodeURIComponent(trimmedQuery)}`
        );

        if (propertySearchResponse.ok) {
          const properties = await propertySearchResponse.json();

          if (properties && properties.length > 0) {
            // Found properties matching the name
            const propertyFilters = {
              location: "",
              coordinates: [0, 0] as [number, number],
              propertyName: trimmedQuery,
            };

            dispatch(setFilters(propertyFilters));

            const params = new URLSearchParams({
              propertyName: trimmedQuery,
            });

            router.push(`/search?${params.toString()}`);
            return;
          }
        }
      } catch (error) {
        console.log("Property name search failed, trying geocoding:", error);
      }

      // ✅ PRIORITY 2: Try geocoding for location searches
      // This ensures city/suburb searches work correctly with 20km radius
      const geocodeQuery = trimmedQuery.toLowerCase().includes('south africa')
        ? trimmedQuery
        : `${trimmedQuery}, South Africa`;

      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      
      if (mapboxToken) {
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(geocodeQuery)}.json?access_token=${mapboxToken}&fuzzyMatch=true&types=address,place,locality,neighborhood,region&country=za&limit=10&language=en`;
        
        const response = await fetch(geocodeUrl);
        
        if (response.ok) {
          const data = await response.json();

          if (data.features && data.features.length > 0) {
            const southAfricanFeatures = data.features.filter((feature: any) => {
              const hasSouthAfricaContext = feature.context?.some(
                (ctx: any) => ctx.id.startsWith("country") && ctx.short_code === "za"
              );
              return hasSouthAfricaContext || feature.place_name.includes("South Africa");
            });

            if (southAfricanFeatures.length > 0) {
              const feature = southAfricanFeatures[0];
              const [lng, lat] = feature.center;
              const locationParts = feature.place_name.split(",").map((s: string) => s.trim());
              const placeTypes = feature.place_type || [];
              const geocodeIsAreaLevel = placeTypes.includes("place") || 
                                        placeTypes.includes("region") || 
                                        placeTypes.includes("locality");

              const lowerPlace = feature.place_name.toLowerCase();
              const isAddress =
                lowerPlace.includes("avenue") ||
                lowerPlace.includes("street") ||
                lowerPlace.includes("road") ||
                lowerPlace.includes("crescent") ||
                lowerPlace.includes("drive") ||
                /\d+\s+[A-Za-z]/.test(feature.place_name);

              const locationName = (isAddress && !geocodeIsAreaLevel
                ? locationParts.join(", ")
                : locationParts[0] || trimmedQuery
              ).trim();

              // Geocoding succeeded - use coordinates
              dispatch(
                setFilters({
                  location: locationName,
                  coordinates: [lng, lat] as [number, number],
                  propertyName: undefined,
                })
              );

              const params = new URLSearchParams({
                location: locationName,
                coordinates: `${lng},${lat}`,
              });

              router.push(`/search?${params.toString()}`);
              return;
            }
          }
        }
      }

      // ✅ PRIORITY 3: Final fallback - text-based location filter
      dispatch(
        setFilters({
          location: trimmedQuery,
          coordinates: [0, 0] as [number, number],
          propertyName: undefined,
        })
      );

      const params = new URLSearchParams({
        location: trimmedQuery,
      });

      router.push(`/search?${params.toString()}`);
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

    const university =
      universityLocations[universityKey as keyof typeof universityLocations];
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
    <div className="relative h-[80vh] md:h-[80vh]">
      {/* Animated background overlay */}

      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/30 to-black/40 z-10"></div>
      {/* 
{/* Dark black gradient background */}
<div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#000000] z-0"></div>


      {/* Subtle animation background shapes */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <motion.div
          className="absolute -top-20 -right-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 20,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-32 -left-20 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -20, 0],
            y: [0, 20, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 15,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Background Image */}
      <Image
        src="/houses.jpg"
        alt="Rentiful Rental Platform Hero Section"
        fill
        className="object-cover object-center brightness-100"
        priority
      />

      {/* Content Container */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="w-full md:max-w-5xl px-1 md:px-6"
        >
          {/* Staggered animations for text elements */}
          <div className="text-center mt-[6rem] md:mt-2 mb-2">
            <motion.h1
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl pt-6 font-extrabold text-white mb-6 tracking-tight drop-shadow-lg"
            >
              Find Any Res.
            </motion.h1>

            <motion.p
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-sm text-white mb-8 pb-5 mx-auto font-semibold"
            >
              Find accommodations close to campus at your budget.
            </motion.p>
          </div>

          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className=""
          >
            {/* Compact Search Bar */}
            <div className="max-w-5xl mx-auto md:bg-white dark:bg-gray-800 rounded-md md:rounded-full shadow-lg overflow-hidden mb-4 w-full p-2">
              <div className="flex flex-col md:flex-row items-center gap-2">
                {/* Location Input */}
                <div className="flex items-center bg-white rounded-full px-3 py-4 md:py-1 flex-1 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 w-full md:w-auto">
                  <div className="text-[#00acee] mr-2">
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1 group w-full">
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Search by property name, city, or address"
                      className="border-0 bg-white focus-visible:ring-0 focus-visible:ring-offset-0 p-2 bg-transparent text-gray-800 placeholder-gray-400 placeholder:font-bold placeholder:text-lg transition-all duration-300 group-hover:placeholder-[#00acee] focus:placeholder-[#00acee] text-lg w-full"
                    />
                    <div className="h-0.5 w-0 bg-[#00acee] transition-all duration-300 group-hover:w-full group-focus-within:w-full"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Price Range Dropdown */}
                  <div className="flex items-center bg-white rounded-full px-4 py-2 w-full md:w-48">
                    <div className="text-[#00acee] ">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 group relative">
                      <div className="relative overflow-hidden rounded-lg  shadow-inner transition-all duration-300 group-hover:bg-white/80 px-2 py-1">
                        <Select defaultValue="any">
                          <SelectTrigger className="border-0 focus:ring-0 p-0 bg-transparent h-auto text-gray-800 w-full outline-none">
                            <SelectValue placeholder="Price Range" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg shadow-lg border-gray-200 bg-white">
                            <SelectItem value="any">Any Price</SelectItem>
                            <SelectItem value="0-2000">R0 - R2k</SelectItem>
                            <SelectItem value="2000-4000">R2k- R4k</SelectItem>
                            <SelectItem value="4000-6000">R4k- R6k</SelectItem>
                            <SelectItem value="6000-8000">R6k- R8k</SelectItem>
                            <SelectItem value="8000-10000">
                              R8k- R10k
                            </SelectItem>
                            <SelectItem value="10000-15000">
                              R10k- R15k
                            </SelectItem>
                            <SelectItem value="15000-20000">
                              R15k- R20k
                            </SelectItem>
                            <SelectItem value="20000+">R20k+</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-[#00acee] transition-transform duration-300 group-hover:rotate-180 bg-white/70 rounded-full p-0.5 shadow-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Property Type Dropdown */}
                  <div className="flex items-center bg-white rounded-full px-4 py-0 w-full md:w-40">
                    <div className="text-[#00acee] mr-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 group relative">
                      <div className="relative overflow-hidden rounded-lg  shadow-inner transition-all duration-300 group-hover:bg-white/80 px-2 py-1">
                        <Select defaultValue="any">
                          <SelectTrigger className="border-0 focus:ring-0 p-0 bg-transparent h-auto text-gray-800 w-full outline-none">
                            <SelectValue placeholder="Property Type" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg shadow-lg border-gray-200 ">
                            <SelectItem value="any">Any Type</SelectItem>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="house">House</SelectItem>
                            <SelectItem value="room">Room</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-[#00acee] transition-transform duration-300 group-hover:rotate-180 bg-white/70 rounded-full p-0.5 shadow-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search Button */}
                <div className="w-full md:w-auto md:pt-0 pt-6 px-2">
                  <Button
                    className="w-full md:min-w-[15rem] bg-[#00acee] hover:bg-[#0099d4] text-white rounded-full md:rounded-full px-10 md:px-16 py-7 md:py-5 text-base md:text-sm font-medium"
                    onClick={handleLocationSearch}
                  >
                    <Search size={18} className="mr-1 rounded-lg" />
                    Find Res
                  </Button>
                </div>
              </div>
            </div>

            {/* University Location Buttons */}
            <div className="hidden md:flex  flex-wrap justify-center gap-3 mt-6">
              <PropertyTypeTab
                icon={<Search size={18} />}
                label="UCT"
                isActive={activeTab === "uct"}
                onClick={() => handleUniversityClick("UCT")}
              />
              <PropertyTypeTab
                icon={<Search size={18} />}
                label="WITS"
                isActive={activeTab === "wits"}
                onClick={() => handleUniversityClick("WITS")}
              />
              <PropertyTypeTab
                icon={<Search size={18} />}
                label="UJ"
                isActive={activeTab === "uj"}
                onClick={() => handleUniversityClick("UJ")}
              />
              <PropertyTypeTab
                icon={<Search size={18} />}
                label="UKZN"
                isActive={activeTab === "ukzn"}
                onClick={() => handleUniversityClick("UKZN")}
              />
              <PropertyTypeTab
                icon={<Search size={18} />}
                label="UWC"
                isActive={activeTab === "uwc"}
                onClick={() => handleUniversityClick("UWC")}
              />
              <PropertyTypeTab
                icon={<Search size={18} />}
                label="UP"
                isActive={activeTab === "up"}
                onClick={() => handleUniversityClick("UP")}
              />
              <PropertyTypeTab
                icon={<Search size={18} />}
                label="SU"
                isActive={activeTab === "su"}
                onClick={() => handleUniversityClick("SU")}
              />
            </div>
          </motion.div>
        </motion.div>
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
      className={`px-5 py-3 flex items-center gap-2 font-medium rounded-md md:rounded-full transition-all duration-300 ${
        isActive
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
