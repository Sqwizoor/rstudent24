"use client";

import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import Image from "next/image";
import { optimizedImageLoader, IMAGE_QUALITY } from "@/lib/imageLoader";
import React, { useState, useEffect } from "react";

interface ImagePreviewsProps {
  images: string[];
}

const ImagePreviews = ({ images }: ImagePreviewsProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  
  // Process images on component mount and when images prop changes
  useEffect(() => {
    console.log('Processing images in ImagePreviews:', images);
    if (Array.isArray(images) && images.length > 0) {
      // Filter out any invalid image URLs
      const validImages = images.filter(img => img && typeof img === 'string' && img.trim() !== '');
      console.log('Valid images after filtering:', validImages);
      
      if (validImages.length > 0) {
        setProcessedImages(validImages);
        return;
      }
    }
    
    // Default to placeholder if no valid images
    setProcessedImages(["/placeholder.jpg"]);
  }, [images]);
  
  // Handle image error
  const handleImageError = (index: number) => {
    console.error(`Failed to load image at index ${index}`);
    const newImages = [...processedImages];
    newImages[index] = "/placeholder.jpg";
    setProcessedImages(newImages);
  };

  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? processedImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === processedImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative h-[350px] md:h-[400px] lg:h-[450px] xl:h-[500px] w-full max-w-5xl mx-auto mt-6 pt-4 pb-2 px-2">
      {processedImages.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 rounded-lg">
          <Home className="h-16 w-16 text-gray-400" />
          <p className="text-gray-500 mt-4">No images available</p>
        </div>
      ) : (
        processedImages.map((image, index) => (
          <div
            key={`image-${index}`}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={image}
              alt={`Property Image ${index + 1}`}
              fill
              unoptimized={false}
              loader={(props) => optimizedImageLoader({ ...props, quality: index === 0 ? IMAGE_QUALITY.hero : IMAGE_QUALITY.detail })}
              priority={index === 0}
              quality={index === 0 ? IMAGE_QUALITY.hero : IMAGE_QUALITY.detail}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
              className="object-cover cursor-pointer transition-transform duration-500 ease-in-out rounded-lg shadow-md"
              onError={() => handleImageError(index)}
            />
          </div>
        ))
      )}
      {processedImages.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-primary-700 bg-opacity-50 p-2 rounded-full focus:outline-none focus:ring focus:ring-secondary-300 z-20"
            aria-label="Previous image"
          >
            <ChevronLeft className="text-white" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary-700 bg-opacity-50 p-2 rounded-full focus:outline-none focus:ring focus:ring-secondary-300 z-20"
            aria-label="Next image"
          >
            <ChevronRight className="text-white" />
          </button>
        </>
      )}
    </div>
  );
};

export default ImagePreviews;