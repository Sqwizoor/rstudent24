import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Star, Upload, X, ArrowUp, ArrowDown } from 'lucide-react';

interface PhotoManagerProps {
  propertyId: number;
  initialPhotos: string[];
  onPhotosUpdated?: (photos: string[]) => void;
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({
  propertyId,
  initialPhotos,
  onPhotosUpdated
}) => {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [isUploading, setIsUploading] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // Update photos when initialPhotos change
  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  const setFeaturedImage = async (index: number) => {
    if (index === 0) return; // Already featured

    const reorderedPhotos = [...photos];
    const featuredPhoto = reorderedPhotos.splice(index, 1)[0];
    reorderedPhotos.unshift(featuredPhoto);

    try {
      setIsReordering(true);
      const response = await fetch(`/api/properties/${propertyId}/photos/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoUrls: reorderedPhotos,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder photos');
      }

      setPhotos(reorderedPhotos);
      onPhotosUpdated?.(reorderedPhotos);
      toast.success('Featured image updated successfully!');
    } catch (error) {
      console.error('Error setting featured image:', error);
      toast.error('Failed to update featured image');
    } finally {
      setIsReordering(false);
    }
  };

  const movePhoto = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const reorderedPhotos = [...photos];
    const [movedPhoto] = reorderedPhotos.splice(fromIndex, 1);
    reorderedPhotos.splice(toIndex, 0, movedPhoto);

    try {
      setIsReordering(true);
      const response = await fetch(`/api/properties/${propertyId}/photos/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoUrls: reorderedPhotos,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder photos');
      }

      setPhotos(reorderedPhotos);
      onPhotosUpdated?.(reorderedPhotos);
      toast.success('Photos reordered successfully!');
    } catch (error) {
      console.error('Error reordering photos:', error);
      toast.error('Failed to reorder photos');
    } finally {
      setIsReordering(false);
    }
  };

  const deletePhoto = async (index: number) => {
    const photoToDelete = photos[index];
    
    try {
      setIsReordering(true);
      const response = await fetch(`/api/properties/${propertyId}/photos/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoUrl: photoToDelete,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }

      const updatedPhotos = photos.filter((_, i) => i !== index);
      setPhotos(updatedPhotos);
      onPhotosUpdated?.(updatedPhotos);
      toast.success('Photo deleted successfully!');
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    } finally {
      setIsReordering(false);
    }
  };

  const uploadNewPhotos = async (files: FileList) => {
    if (files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('photos', file);
    });

    try {
      setIsUploading(true);
      const response = await fetch(`/api/properties/${propertyId}/photos/batch`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photos');
      }

      const result = await response.json();
      setPhotos(result.allPhotoUrls || [...photos, ...result.photoUrls]);
      onPhotosUpdated?.(result.allPhotoUrls || [...photos, ...result.photoUrls]);
      toast.success(`${files.length} photo(s) uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload photos');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Photo Management
        </CardTitle>
        <p className="text-sm text-gray-600">
          The first image will be displayed on property cards and search results.
          Drag and drop or use controls to reorder photos.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && uploadNewPhotos(e.target.files)}
            className="w-full"
            disabled={isUploading}
          />
          {isUploading && (
            <p className="text-sm text-blue-600 mt-2">Uploading photos...</p>
          )}
        </div>

        {/* Photos Grid */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div key={photo} className="relative group">
                <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200">
                  <Image
                    src={photo}
                    alt={`Property photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Featured Badge */}
                  {index === 0 && (
                    <Badge className="absolute top-2 left-2 bg-green-600 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}

                  {/* Photo Number */}
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 right-2"
                  >
                    #{index + 1}
                  </Badge>

                  {/* Controls - show on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex gap-1">
                      {/* Make Featured Button */}
                      {index !== 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setFeaturedImage(index)}
                          disabled={isReordering}
                          className="text-xs"
                        >
                          <Star className="w-3 h-3" />
                        </Button>
                      )}

                      {/* Move Up */}
                      {index > 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => movePhoto(index, index - 1)}
                          disabled={isReordering}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                      )}

                      {/* Move Down */}
                      {index < photos.length - 1 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => movePhoto(index, index + 1)}
                          disabled={isReordering}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      )}

                      {/* Delete */}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deletePhoto(index)}
                        disabled={isReordering}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Photo Info */}
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-600">
                    {index === 0 ? 'Main Image' : `Image ${index + 1}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No photos uploaded yet.</p>
            <p className="text-sm">Upload photos using the area above.</p>
          </div>
        )}

        {/* Loading State */}
        {isReordering && (
          <div className="text-center py-2">
            <p className="text-sm text-blue-600">Updating photos...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
