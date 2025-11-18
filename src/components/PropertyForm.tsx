"use client";

import { useState, useRef } from "react";
import { Property } from "@/types/property";
import Image from "next/image";
interface PropertyFormProps {
  initialData?: Property;
  onSubmit: (formData: FormData) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText: string;
}

export const PropertyForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  submitButtonText,
}: PropertyFormProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    initialData?.photoUrls || []
  );
  const [featuredImageIndex, setFeaturedImageIndex] = useState<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);

    // Create preview URLs for selected files
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);

    // Create ordered files array with featured image first
    const orderedFiles: File[] = [];
    const orderedUrls: string[] = [];
    
    // Add featured image first
    if (featuredImageIndex < selectedFiles.length) {
      orderedFiles.push(selectedFiles[featuredImageIndex]);
      orderedUrls.push(previewUrls[featuredImageIndex]);
    }
    
    // Add remaining files
    selectedFiles.forEach((file, index) => {
      if (index !== featuredImageIndex) {
        orderedFiles.push(file);
        orderedUrls.push(previewUrls[index]);
      }
    });

    // Append files to form data in the correct order
    orderedFiles.forEach((file) => {
      formData.append("photos", file);
    });

    // Also send the featured image index for reference
    formData.append("featuredImageIndex", featuredImageIndex.toString());

    await onSubmit(formData);
  };

  const removeImage = (index: number) => {
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    
    // Adjust featured image index if necessary
    if (index === featuredImageIndex) {
      setFeaturedImageIndex(0); // Reset to first image
    } else if (index < featuredImageIndex) {
      setFeaturedImageIndex(prev => prev - 1); // Shift down
    }
  };

  const setAsFeatured = (index: number) => {
    setFeaturedImageIndex(index);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Property Name
            </label>
            <input
              type="text"
              name="name"
              defaultValue={initialData?.name}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={initialData?.description}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Property Type
            </label>
            <select
              name="propertyType"
              defaultValue={initialData?.propertyType}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="APARTMENT">Apartment</option>
              <option value="HOUSE">House</option>
              <option value="CONDO">Condo</option>
              <option value="TOWNHOUSE">Townhouse</option>
            </select>
          </div>
        </div>

        {/* Location Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Location</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              name="address"
              defaultValue={initialData?.location?.address}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                name="city"
                defaultValue={initialData?.location?.city}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                State
              </label>
              <input
                type="text"
                name="state"
                defaultValue={initialData?.location?.state}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                type="text"
                name="country"
                defaultValue={initialData?.location?.country}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Postal Code
              </label>
              <input
                type="text"
                name="postalCode"
                defaultValue={initialData?.location?.postalCode}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Property Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total Bedrooms
              </label>
              <input
                type="number"
                name="beds"
                defaultValue={initialData?.beds}
                min="0"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total Bathrooms
              </label>
              <input
                type="number"
                name="baths"
                defaultValue={initialData?.baths}
                min="0"
                step="0.5"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total Kitchens
              </label>
              <input
                type="number"
                name="kitchens"
                defaultValue={initialData?.kitchens}
                min="0"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Total Square Feet
            </label>
            <input
              type="number"
              name="squareFeet"
              defaultValue={initialData?.squareFeet}
              min="0"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          {/* Removed property-level pricing; price comes from rooms */}
        </div>

        {/* Additional Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Additional Details</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Security Deposit
            </label>
            <input
              type="number"
              name="securityDeposit"
              defaultValue={initialData?.securityDeposit}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isNsfassAccredited"
                defaultChecked={initialData?.isNsfassAccredited}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-3 block text-sm font-semibold text-blue-800">
                NSFAS Accredited Property
              </label>
            </div>
            <p className="mt-2 text-xs text-blue-600">
              Check this box if your property is accredited to accept NSFAS students
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isParkingIncluded"
              defaultChecked={initialData?.isParkingIncluded}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Parking Included
            </label>
          </div>
        </div>

        {/* Photos */}
        <div className="col-span-2 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Property Photos</h3>
            <p className="text-sm text-gray-600 mt-1">
              Upload property images and select which one to use as the featured image for listing cards.
            </p>
          </div>

          {previewUrls.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="relative w-full h-32 rounded-lg overflow-hidden">
                    <Image
                      src={url}
                      alt={`Property photo ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                      unoptimized={
                        url.startsWith("blob:") || url.startsWith("data:")
                      }
                    />
                    
                    {/* Featured image badge */}
                    {index === featuredImageIndex && (
                      <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                        ⭐ Featured
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {index !== featuredImageIndex && (
                      <button
                        type="button"
                        onClick={() => setAsFeatured(index)}
                        className="bg-green-500 text-white rounded-full p-1 hover:bg-green-600 text-xs"
                        title="Set as featured image"
                      >
                        ⭐
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>

                  {/* Image order indicator */}
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>

                  {/* Featured indicator at bottom */}
                  {index === featuredImageIndex && (
                    <div className="absolute bottom-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                      Main Image
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Featured image info */}
          {previewUrls.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Featured Image:</strong> Image #{featuredImageIndex + 1} will be displayed on property cards and search results.
                Click the ⭐ button on any image to make it the featured image.
              </p>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <label className="cursor-pointer">
                <span className="text-sm font-medium text-gray-700">
                  {previewUrls.length === 0 ? 'Upload Property Photos' : 'Add More Photos'}
                </span>
                <input
                  type="file"
                  name="photos"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
                <span className="block text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF up to 10MB each. You can select any image as featured after upload.
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : submitButtonText}
        </button>
      </div>
    </form>
  );
};
