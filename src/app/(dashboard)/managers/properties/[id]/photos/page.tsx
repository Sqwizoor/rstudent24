"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetPropertyQuery } from '@/state/api';
import { PhotoManager } from '@/components/PhotoManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { Toaster } from 'sonner';

export default function PropertyPhotosPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id ? parseInt(params.id as string) : 0;

  const { data: property, isLoading, isError, refetch } = useGetPropertyQuery(propertyId);

  const handlePhotosUpdated = (updatedPhotos: string[]) => {
    // Trigger a refetch to update the property data
    refetch();
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-md w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">Error loading property</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="w-6 h-6" />
            Manage Photos
          </h1>
          <p className="text-gray-600">
            {property.name} - {typeof property.location === 'object' && property.location?.address 
              ? property.location.address 
              : "No address"}
          </p>
        </div>
      </div>

      {/* Property Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Property Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Property Name</p>
              <p className="font-medium">{property.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium">{property.propertyType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Photos</p>
              <p className="font-medium">
                {property.photoUrls?.length || 0} image(s)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Manager */}
      <PhotoManager
        propertyId={propertyId}
        initialPhotos={(property.photoUrls as string[]) || []}
        onPhotosUpdated={handlePhotosUpdated}
      />

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <div>
              <p className="font-medium">Upload New Photos</p>
              <p className="text-sm text-gray-600">Use the upload area to add new photos to your property</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <div>
              <p className="font-medium">Set Featured Image</p>
              <p className="text-sm text-gray-600">Click the star icon to make any image the featured image (shown on cards)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <div>
              <p className="font-medium">Reorder Photos</p>
              <p className="text-sm text-gray-600">Use the arrow buttons to change the order of your photos</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">4</div>
            <div>
              <p className="font-medium">Delete Photos</p>
              <p className="text-sm text-gray-600">Click the X button to remove photos you no longer want</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
