"use client";

import { NAVBAR_HEIGHT } from "@/lib/constants";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect } from "react";
import FiltersBar from "./FiltersBar";
import FiltersFull from "./FiltersFull";
import { cleanParams } from "@/lib/utils";
import { setFilters } from "@/state";
import dynamic from "next/dynamic";
const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />,
});
import Listings from "./Listings";

// Component that uses useSearchParams wrapped in Suspense
const SearchPageContent = () => {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const isFiltersFullOpen = useAppSelector(
    (state) => state.global.isFiltersFullOpen
  );

  useEffect(() => {
    console.log('========== PAGE INIT - PARSING URL ==========');
    console.log('Search params:', Object.fromEntries(searchParams.entries()));
    
    const initialFilters = Array.from(searchParams.entries()).reduce(
      (acc: any, [key, value]) => {
        if (key === "priceRange" || key === "squareFeet") {
          acc[key] = value.split(",").map((v) => (v === "" ? null : Number(v)));
        } else if (key === "coordinates") {
          const coords = value.split(",").map(Number);
          acc[key] = coords;
        } else if (key === "propertyName") {
          acc[key] = value; // Handle property name search parameter
        } else {
          acc[key] = value === "any" ? null : value;
        }

        return acc;
      },
      {}
    );

    const cleanedFilters = cleanParams(initialFilters);
    dispatch(setFilters(cleanedFilters));
  }, [searchParams, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="w-full mx-auto px-4 md:px-5 flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      style={{
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`
      }}
    >
      <div className="h-10"/>
      <FiltersBar />
      <div className="flex justify-between flex-1 overflow-hidden md:gap-6 mb-5">
        <div
          className={`h-full overflow-auto transition-all duration-300 ease-in-out ${
            isFiltersFullOpen
              ? "w-3/12 opacity-100 visible"
              : "w-0 opacity-0 invisible"
          }`}
        >
          <FiltersFull />
        </div>
        <div className="hidden md:block md:basis-5/12 grow-0">
          <Map />
        </div>
        <div className="w-full md:basis-7/12 overflow-y-auto md:pl-[1rem] md:pr-0">
          <Listings />
        </div>
      </div>
    </div>
  );
};

// Main component that wraps SearchPageContent with Suspense
const SearchPage = () => {
  return (
    <Suspense fallback={<div />}>
      <SearchPageContent />
    </Suspense>
  );
};

export default SearchPage;
