"use client";

import React, { useEffect, KeyboardEvent, ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { setFilters } from "@/state";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CityCardProps {
  city: {
    name: string;
    shortName?: string;
    description: string;
    image: string;
    coordinates?: [number, number];
    lat?: number;
    lng?: number;
  };
  index: number;
}

const cities = [
  {
    name: "Johannesburg",
    shortName: "Jo'burg",
    description: "Find res in Jo'burg",
    image: "/johannesburg.webp",
    coordinates: [28.042114, -26.204678] as [number, number],
    lat: -26.1825,
    lng: 28.0002,
  },
  {
    name: "Cape Town",
    description: "Find res in Cape Town",
    image: "/universities/cape-town.webp",
    coordinates: [18.4241, -33.9249] as [number, number],
    lat: -33.9249,
    lng: 18.4241,
  },
  {
    name: "Durban",
    description: "Accommodations Durban",
    image: "/durban.webp",
    coordinates: [31.0218, -29.8587] as [number, number],
    lat: -29.8587,
    lng: 31.0218,
  },
  {
    name: "Pretoria",
    description: "Find res in Pretoria",
    image: "/universities/pretoria.webp",
    coordinates: [28.1881, -25.7461] as [number, number],
    lat: -25.7461,
    lng: 28.1881,
  },
  {
    name: "Bloemfontein",
    description: "Find res in Bloemfontein",
    image: "/bloemfontein.webp",
    coordinates: [26.2041, -29.0852] as [number, number],
    lat: -29.0852,
    lng: 26.2041,
  },
];

const CityCard = ({ city, index }: CityCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const handleCityClick = () => {
    const fullLocation = `${city.name}, South Africa`;

    dispatch(
      setFilters({
        location: fullLocation,
        coordinates: city.coordinates || ([0, 0] as [number, number]),
      })
    );

    const params = new URLSearchParams({
      location: fullLocation,
      coordinates: city.coordinates ? city.coordinates.toString() : "0,0",
      lat: city.lat?.toString() || "0",
      lng: city.lng?.toString() || "0",
    });

    router.push(`/search?${params.toString()}`);
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.03 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleCityClick}
    >
      {/* ✅ Adjusted height for mobile */}
      <div className="relative h-[110px] md:h-[180px] w-full overflow-hidden rounded-2xl">
        <Image
          src={city.image || "/placeholder.svg"}
          alt={city.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <div className="absolute inset-0 z-10 p-5">
          <motion.div
            className={`absolute left-0 w-full ${
              isHovered ? "top-1/2 -translate-y-1/2" : "bottom-3 md:bottom-5"
            }`}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <div className="flex items-center mb-1 px-3 md:px-5">
              <MapPin className="w-4 h-4 text-[#4F9CF9] mr-1" />
              <h3 className="text-base md:text-xl font-bold text-white">
                {city.name}
              </h3>
            </div>
            <p className="text-xs md:text-sm text-gray-300 font-normal italic px-3 md:px-5">
              {city.description}
            </p>
          </motion.div>

          <motion.div
            className="absolute left-0 bottom-2 md:bottom-3 w-full flex items-center justify-center text-[#4F9CF9] text-xs md:text-sm font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.3, delay: isHovered ? 0.1 : 0 }}
          >
            <span>Explore properties in {city.name}</span>
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
          </motion.div>
        </div>

        <motion.div
          className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
};

export default function CitySelection() {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();

  const shuffleArrayByDate = (array: any[], date: Date) => {
    const shuffled = [...array];
    const seed =
      date.getFullYear() * 10000 +
      (date.getMonth() + 1) * 100 +
      date.getDate();

    let randomSeed = seed;
    const seededRandom = () => {
      randomSeed = (randomSeed * 9301 + 49297) % 233280;
      return randomSeed / 233280;
    };

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getShuffledCities = () => {
    const today = new Date();
    return shuffleArrayByDate(cities, today);
  };

  const shuffledCities = getShuffledCities();

  return (
    <div className="py-12 px-4 md:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* ✅ Mobile: Horizontal scroll */}
        <div className="block md:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex space-x-4 snap-x snap-mandatory">
            {shuffledCities.map((city, index) => (
              <div
                key={city.name}
                className="min-w-[200px] max-w-[200px] flex-shrink-0 snap-start"
              >
                <CityCard city={city} index={index} />
              </div>
            ))}
          </div>
        </div>

        {/* ✅ Desktop grid */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {shuffledCities.map((city, index) => (
            <CityCard key={city.name} city={city} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
