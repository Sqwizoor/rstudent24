"use client";

import { useQuery, useMutation } from "convex/react";
import { anyApi } from "convex/server";
import { uploadImageToConvex, uploadMultipleImagesToConvex } from "@/lib/convexImageUpload";

// We define type-safe wrappers around Convex functions
export function useNearbyProperties(searchLat?: number, searchLng?: number, radiusKm: number = 20) {
  // If coordinates are available, run the nearby search query
  const shouldFetch = searchLat !== undefined && searchLng !== undefined && (searchLat !== 0 || searchLng !== 0);
  
  // @ts-ignore
  const properties = useQuery(
    // @ts-ignore
    anyApi.properties.getNearbyProperties,
    shouldFetch ? { searchLat, searchLng, radiusKm } : "skip"
  );

  return {
    properties: properties ?? [],
    isLoading: shouldFetch && properties === undefined,
  };
}

export function useManagerProperties(managerId?: string) {
  // @ts-ignore
  const properties = useQuery(
    // @ts-ignore
    anyApi.properties.getManagerProperties,
    managerId ? { managerId } : "skip"
  );

  return {
    properties: properties ?? [],
    isLoading: !!managerId && properties === undefined,
  };
}

export function usePropertyById(id?: string) {
  // @ts-ignore
  const property = useQuery(
    // @ts-ignore
    anyApi.properties.getPropertyById,
    id ? { id } : "skip"
  );

  return {
    property,
    isLoading: !!id && property === undefined,
  };
}

export function useConvexUpload() {
  // @ts-ignore
  const generateUploadUrl = useMutation(anyApi.files.generateUploadUrl);
  // @ts-ignore
  const deleteFile = useMutation(anyApi.files.deleteFile);

  const uploadSingle = async (file: File | Blob) => {
    return await uploadImageToConvex(file, () => generateUploadUrl());
  };

  const uploadMultiple = async (files: (File | Blob)[], onProgress?: (done: number, total: number) => void) => {
    return await uploadMultipleImagesToConvex(files, () => generateUploadUrl(), onProgress);
  };

  return {
    uploadSingle,
    uploadMultiple,
    deleteFile,
  };
}
