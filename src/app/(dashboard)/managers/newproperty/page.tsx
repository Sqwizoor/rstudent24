"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import Image from "next/image";
import { fetchAuthSession } from "aws-amplify/auth";
// Components
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CreateFormField } from "@/components/CreateFormField";
import { CustomFormField } from "@/components/FormField";
import { Badge } from "@/components/ui/badge";
import { RoomsSection } from "@/components/RoomsSection"; // Assuming this component handles its own file states for rooms
import type { RoomFormData } from "@/components/RoomFormField"; // Assuming this type includes how room photos are handled
import { Progress } from "@/components/ui/progress";
// Removed presigned helper import for grouped upload approach

// Icons
import {
  Building,
  Home,
  MapPin,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Coffee,
  Upload,
  ArrowLeft,
  ArrowRight,
  ImageDown,
  X,
  CircleDollarSign,
  CheckCircle2,
} from "lucide-react";

// Data & API
import { type PropertyFormData, propertySchema } from "@/lib/schemas";
import { processImageFiles } from "@/lib/imageUtils";
import { useCreatePropertyMutation, useCreateRoomMutation, useGetAuthUserQuery } from "@/state/api";
import { AmenityEnum, HighlightEnum, PropertyTypeEnum, UNIVERSITY_OPTIONS } from "@/lib/constants";


// Form step component for slider form
interface FormStepProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
  isCompleted: boolean;
  stepNumber: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

const FormStep = ({
  title,
  icon,
  children,
  isActive,
  isCompleted,
  stepNumber,
  totalSteps,
  onStepClick,
}: FormStepProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className={`${isActive ? 'block' : 'hidden'} w-full`}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => onStepClick && onStepClick(stepNumber)}
            role="button"
            tabIndex={0}
            aria-label={`Go to step ${stepNumber}: ${title}`}
          >
            <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-600/20 text-green-400' : 'bg-[#1E2A45] text-[#4F9CF9]'}`}>
              {isCompleted ? <CheckCircle2 size={20} /> : icon}
            </div>
            <h2 className="text-xl font-semibold text-white hover:text-blue-400 transition-colors">{title}</h2>
          </div>
          <div className="text-sm text-gray-400">
            Step {stepNumber} of {totalSteps}
          </div>
        </div>
        <Progress value={(stepNumber / totalSteps) * 100} className="h-1.5 mb-6 bg-[#1E2A45]" />
      </div>
      <div className="p-6 border border-[#1E2A45] rounded-xl bg-[#0B1120]/60 shadow-lg">
        {children}
      </div>
    </motion.div>
  );
};

// Navigation buttons for form steps
interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  isSubmitting: boolean;
  isLastStep: boolean;
}

const StepNavigation = ({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  isSubmitting,
  isLastStep,
}: StepNavigationProps) => {
  return (
    <div className="flex justify-between mt-8">
      {currentStep > 1 && (
        <Button
          type="button"
          onClick={onPrev}
          className="bg-[#1E2A45] hover:bg-[#2A3A55] text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"
          disabled={isSubmitting}
        >
          <ArrowLeft size={16} />
          Previous
        </Button>
      )}
      
      {currentStep === 1 && <div></div>}
      
      <Button
        type={isLastStep ? "submit" : "button"}
        onClick={isLastStep ? undefined : onNext}
        className="bg-gradient-to-r from-[#0070F3] to-[#4F9CF9] hover:from-[#0060D3] hover:to-[#3F8CE9] text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 ml-auto"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 bg-white/30 rounded animate-pulse" />
            Processing...
          </>
        ) : isLastStep ? (
          <>
            <Check className="w-4 h-4" />
            Submit
          </>
        ) : (
          <>
            Next
            <ArrowRight size={16} />
          </>
        )}
      </Button>
    </div>
  );
};

// Main component
const NewProperty = () => {
  const [createProperty, { isLoading: isCreatingProperty }] = useCreatePropertyMutation();
  const [createRoom, { isLoading: isCreatingRoom }] = useCreateRoomMutation();
  const { data: authUser } = useGetAuthUserQuery(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]); // For property photo previews
  const [featuredImageIndex, setFeaturedImageIndex] = useState<number>(0); // Selected default image
  const [rooms, setRooms] = useState<RoomFormData[]>([]);
  const router = useRouter();
  
  // Slider form state
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const totalSteps = 6; // Total number of steps in the form

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: "",
      description: "",
      pricePerMonth: 1000,
      securityDeposit: 500,
      isNsfassAccredited: false,
      isParkingIncluded: true,
      photoUrls: [] as unknown as FileList, // Important for react-hook-form with file inputs
      amenities: [],
      highlights: [],
      propertyType: PropertyTypeEnum.Apartment,
      beds: 0,
      baths: 0,
      kitchens: 0,
      squareFeet: 0,
      address: "",
      city: "",
      state: "",
      country: "",
      closestUniversities: [],
    },
    mode: "onChange", // Validate on change for better UX
  });
  
  // Step validation functions
  const validateStep = (step: number): boolean => {
    let isValid = true;
    const formState = form.getValues();
    
    switch(step) {
      case 1: // Basic Information
        isValid = !!formState.name && formState.name.trim() !== '' && 
                 !!formState.description && formState.description.trim() !== '' && 
                 !!formState.propertyType;
        break;
      case 2: // Pricing & Fees
        isValid = formState.pricePerMonth > 0 && 
                 formState.securityDeposit >= 0;
        break;
      case 3: // Rooms
        // At least one room should be added
        isValid = rooms.length > 0;
        break;
      case 4: // Amenities & Highlights
        // At least one amenity required
        isValid = (formState.amenities && formState.amenities.length > 0);
        break;
      case 5: // Property Photos
        // At least one photo required
        isValid = (uploadedFiles.length > 0 || (formState.photoUrls && formState.photoUrls.length > 0));
        break;      case 6: // Location Information
        isValid = !!formState.address && formState.address.trim() !== '' && 
                 !!formState.city && formState.city.trim() !== '' && 
                 !!formState.country && formState.country.trim() !== '' &&
                 !!formState.postalCode && formState.postalCode.trim() !== '' &&
                 formState.closestUniversities && formState.closestUniversities.length > 0;
        break;
      default:
        isValid = true;
    }
    
    return isValid;
  };
  
  // Navigation functions
  const goToStep = (step: number) => {
    if (step < 1 || step > totalSteps) return;
    
    // To move forward, all previous steps must be valid
    if (step > currentStep) {
      // Validate all steps up to the target step
      for (let i = currentStep; i < step; i++) {
        if (!validateStep(i)) {
          toast.error(`Please complete all required fields in Step ${i} before proceeding`, {
            position: "top-center",
            duration: 3000,
          });
          return;
        }
        // Mark step as completed
        if (!completedSteps.includes(i)) {
          setCompletedSteps((prev) => [...prev, i]);
        }
      }
    }
    
    // Safe to navigate now
    setCurrentStep(step);
  };
  
  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      if (validateStep(currentStep)) {
        // Mark current step as completed
        if (!completedSteps.includes(currentStep)) {
          setCompletedSteps([...completedSteps, currentStep]);
        }
        setCurrentStep(currentStep + 1);
      } else {
        toast.error(`Please complete all required fields for Step ${currentStep} before proceeding`, {
          position: "top-center",
          duration: 3000,
        });
      }
    }
  };
  
  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle file selection to show preview for property photos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const filesArray = Array.from(e.target.files);
      setUploadedFiles(filesArray);
      // Ensure currently selected featured index stays valid; default to first if none
      if (featuredImageIndex >= filesArray.length) {
        setFeaturedImageIndex(0);
      }
    }
  };

  // Handle adding a room
  const handleAddRoom = (room: RoomFormData) => {
    setRooms([...rooms, room]);
  };

  // Handle removing a room
  const handleRemoveRoom = (index: number) => {
    const updatedRooms = [...rooms];
    updatedRooms.splice(index, 1);
    setRooms(updatedRooms);
  };

  // Handle removing an amenity
  const handleRemoveAmenity = (amenityToRemove: string) => {
    const currentAmenities = form.getValues("amenities") || [];
    const updatedAmenities = currentAmenities.filter(
      (amenity) => amenity !== amenityToRemove
    );
    form.setValue("amenities", updatedAmenities);
  };

  // Handle removing a highlight
  const handleRemoveHighlight = (highlightToRemove: string) => {
    const currentHighlights = form.getValues("highlights") || [];
    const updatedHighlights = currentHighlights.filter(
      (highlight) => highlight !== highlightToRemove
    );
    form.setValue("highlights", updatedHighlights);
  };

  const onSubmit = async (data: PropertyFormData) => {
    if (submitting) return;
    
    // Validate the final step before submitting
    if (!validateStep(currentStep)) {
      toast.error("Please complete all required fields before submitting", {
        position: "top-center",
        duration: 3000,
      });
      setSubmitting(false);
      return;
    }

    try {
      setSubmitting(true);

      // Initialize counters that will be used for toast messages
      let roomsSuccessfullyCreated = 0;
      let failedRooms = 0;

      if (!authUser?.cognitoInfo?.userId) {
        toast.error("You must be logged in to create a property", {
          className: "bg-red-500 text-white font-medium",
          position: "top-center",
          duration: 4000,
        });
        setSubmitting(false);
        return;
      }

      // Use state-managed uploadedFiles for ordering & featured
      let photoFiles: File[] = [...uploadedFiles];
      if (photoFiles.length > 1 && featuredImageIndex >= 0 && featuredImageIndex < photoFiles.length) {
        const reordered = [...photoFiles];
        const [feat] = reordered.splice(featuredImageIndex, 1);
        reordered.unshift(feat);
        photoFiles = reordered;
        console.log(`Reordered photos: featured index ${featuredImageIndex} moved to front.`);
      }

      // Prepare property data as JSON
      const propertyData = {
        ...data,
        managerCognitoId: authUser.cognitoInfo.userId,
        // Convert arrays to comma-separated strings if needed
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
        highlights: Array.isArray(data.highlights) ? data.highlights : [],
        // Remove the FileList which can't be serialized to JSON
        photoUrls: []
      };

      // Create property using direct fetch instead of RTK Query
      // Get the auth token for the request
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      
      // Create property first (with JSON data)
      const createResponse = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(propertyData),
      });
      
      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        console.error('Error creating property:', errorData);
        throw new Error(errorData.message || 'Failed to create property');
      }
      
      const propertyResponse = await createResponse.json();
      console.log("Property created successfully:", propertyResponse);

      // Upload photos in groups (server handles S3). Max 3 per request.
      if (photoFiles.length > 0) {
        console.log(`Grouped uploading ${photoFiles.length} photos for property ID ${propertyResponse.id}`);
        const GROUP_SIZE = 3;
        let uploadedCount = 0;
        let failedCount = 0;
        for (let start = 0; start < photoFiles.length; start += GROUP_SIZE) {
          const slice = photoFiles.slice(start, start + GROUP_SIZE);
          const formData = new FormData();
          slice.forEach((f) => formData.append('photos', f));
          // For first group pass featured index (0 because we reordered already)
          if (start === 0) formData.append('featuredIndex', '0');
          try {
            const res = await fetch(`/api/properties/${propertyResponse.id}/photos/group`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${idToken}` },
              body: formData
            });
            if (!res.ok) {
              const err = await res.json().catch(()=>({}));
              console.error('Group upload failed', err);
              failedCount += slice.length;
            } else {
              const json = await res.json();
              console.log(`Uploaded group starting at ${start}:`, json.uploaded?.length || slice.length);
              uploadedCount += slice.length;
            }
          } catch (e) {
            console.error('Error during group upload', e);
            failedCount += slice.length;
          }
        }
        if (failedCount > 0) {
          toast.error(`${failedCount} photo(s) failed to upload`, { position: 'top-center' });
        }
        console.log(`Grouped upload complete. Success: ${uploadedCount}, Failed: ${failedCount}`);
      }
      
      // If we have rooms to add, create them for this property
      if (rooms.length > 0) {
        for (const room of rooms) {
          try {
            console.log('Creating room for property:', propertyResponse.id, 'room name:', room.name);
            
            // Create a clean JSON object from the room data first
            const cleanRoomData: {
              name: string;
              description: string;
              pricePerMonth: number;
              securityDeposit: number;
              squareFeet: number;
              roomType: 'PRIVATE' | 'SHARED';
              capacity: number;
              isAvailable: boolean;
              propertyId: any;
              amenities: string[];
              features: string[];
              availableFrom?: string; // Add this property as optional
            } = {
              name: room.name || 'Unnamed Room',
              description: room.description || '',
              pricePerMonth: Math.min(Math.max(0, Number(room.pricePerMonth || 0)), 100000),
              securityDeposit: Math.min(Math.max(0, Number(room.securityDeposit || 0)), 100000),
              squareFeet: Math.min(Math.max(0, Number(room.squareFeet || 0)), 10000),
              roomType: room.roomType || 'PRIVATE',
              capacity: Math.max(1, Number(room.capacity || 1)),
              isAvailable: room.isAvailable !== false,
              propertyId: propertyResponse.id,
              amenities: Array.isArray(room.amenities) ? room.amenities : [],
              features: Array.isArray(room.features) ? room.features : [],
            };
            
            if (room.availableFrom) {
              cleanRoomData.availableFrom = new Date(room.availableFrom).toISOString();
            }
            
            console.log('Room data (sanitized):', cleanRoomData);
            
            // Create a fresh FormData object
            const roomFormData = new FormData();
            
            // Add all sanitized room data to FormData
            Object.entries(cleanRoomData).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                  if (value.length > 0) {
                    roomFormData.append(key, JSON.stringify(value));
                  }
                } else {
                  roomFormData.append(key, String(value));
                }
              }
            });
            
            // Process and compress image files before adding to FormData
            if (room.photoUrls && Array.isArray(room.photoUrls)) {
              console.log(`Room photos array has ${room.photoUrls.length} items:`, 
                room.photoUrls.map(p => p instanceof File ? `File: ${p.name}` : `Other: ${typeof p}`));
              
              // Filter out only the File objects
              const imageFiles = room.photoUrls.filter(photo => photo instanceof File) as File[];
              
              if (imageFiles.length > 0) {
                try {
                  // Process and compress images
                  const processedImages = await processImageFiles(
                    imageFiles,
                    2 * 1024 * 1024, // 2MB per file
                    8 * 1024 * 1024  // 8MB total
                  );
                  
                  console.log(`Processed ${processedImages.length} images for room`);
                  
                  // Add processed files to FormData
                  processedImages.forEach((photo, index) => {
                    roomFormData.append('photos', photo);
                    console.log(`Appending processed photo ${index}: ${photo.name}, size: ${Math.round(photo.size / 1024)}KB`);
                  });
                } catch (imageError) {
                  console.error('Error processing images:', imageError);
                  throw new Error(`Image processing failed: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
                }
              }
            }
            
            // Log FormData keys
            const formDataKeys: string[] = [];
            for (const key of roomFormData.keys()) {
              formDataKeys.push(key);
            }
            console.log('FormData keys:', formDataKeys.join(', '));
            
            // Use the updated createRoom mutation
            const roomResponse = await createRoom({
              propertyId: propertyResponse.id,
              body: roomFormData
            }).unwrap();
            
            console.log("Room created successfully:", roomResponse);
            roomsSuccessfullyCreated++;
          } catch (roomError) {
            console.error("Error creating a room:", roomError);
            
            // Create a safe copy of the room data for logging
            const safeCopy = { ...room };
            console.error("Room data that failed:", safeCopy);
            failedRooms++;
          }
        }
        
        // Log summary to console, but don't show multiple toasts
        console.log(`Created ${roomsSuccessfullyCreated} of ${rooms.length} rooms. Failed: ${failedRooms}`);
        
        // Store the room creation results to use in the final toast message
        // We'll show a combined property and room toast at the end
        // Only show immediate toast for failures
        if (failedRooms > 0) {
          toast.error(`Failed to create ${failedRooms} room(s)`, {
            className: "bg-red-500 text-white font-medium",
            position: "top-center",
            duration: 3000,
          });
        }
      }

      // Reset form and states on overall success
      form.reset();
      setUploadedFiles([]);
      setRooms([]); // Clear rooms as well

      // Navigate to the properties page
      router.push("/managers/properties");

      // Show a combined success toast message with property name and room count
      if (propertyResponse && roomsSuccessfullyCreated > 0) {
        toast.success(
          `Property "${data.name}" created with ${roomsSuccessfullyCreated} room${roomsSuccessfullyCreated > 1 ? 's' : ''}`,
          {
            className: "bg-green-500 text-white font-medium",
            position: "top-center",
            duration: 4000,
          }
        );
      } else if (propertyResponse) {
        toast.success(
          `Property "${data.name}" created successfully`, 
          {
            className: "bg-green-500 text-white font-medium",
            position: "top-center",
            duration: 3000,
          }
        );
      }

    } catch (error: any) {
      console.error("Error during property/room creation process:", error);
      toast.error(
        error?.data?.message || "Failed to complete property creation. Please try again.",
        {
          className: "bg-red-500 text-white font-medium",
          position: "top-center",
          duration: 4000,
        }
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Style for form field labels
  const labelStyle = "text-sm font-medium text-slate-700 dark:text-gray-200";

  // Style for form field inputs
  const inputStyle =
    "bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white border border-slate-300 dark:border-[#1E2A45] focus:border-blue-500 focus:ring-blue-500 dark:focus:border-[#4F9CF9] dark:focus:ring-[#4F9CF9] rounded-md";

  return (
  <div className="min-h-screen bg-slate-50 dark:bg-[#070C17] text-slate-900 dark:text-white">
      <Toaster richColors position="top-center" />
      <div className="relative max-w-5xl mx-auto px-4 py-6">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
        {/* <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 z-0"></div> */}
        {/* Header with back button */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white bg-white dark:bg-[#0B1120]/80 hover:bg-slate-100 dark:hover:bg-[#1E2A45] border border-slate-200 dark:border-transparent rounded-full"
              onClick={() => router.back()}
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Add New Property</h1>
              <p className="text-slate-600 dark:text-gray-400 mt-1">Create a new property listing with our step-by-step form</p>
            </div>
          </div>
        </div>
        
        {/* Step indicators */}
        <div className="mb-8 hidden md:flex justify-between">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNum = index + 1;
            const isActive = currentStep === stepNum;
            const isCompleted = completedSteps.includes(stepNum);
            
            return (
              <div 
                key={stepNum} 
                className="flex flex-col items-center cursor-pointer" 
                onClick={() => goToStep(stepNum)}
                role="button"
                tabIndex={0}
                aria-label={`Go to step ${stepNum}`}
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors border ${isActive ? 'bg-blue-600 text-white border-blue-600' : isCompleted ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-[#1E2A45] text-slate-500 dark:text-gray-400 border-slate-300 dark:border-[#1E2A45]'}`}
                >
                  {isCompleted ? <CheckCircle2 size={16} /> : stepNum}
                </div>
                <div className={`text-xs ${isActive ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-gray-500'}`}>
                  {stepNum === 1 && 'Basic Info'}
                  {stepNum === 2 && 'Pricing'}
                  {stepNum === 3 && 'Details'}
                  {stepNum === 4 && 'Amenities'}
                  {stepNum === 5 && 'Photos'}
                  {stepNum === 6 && 'Location'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Form */}
  <div className="rounded-xl p-6 shadow-xl border border-slate-200 dark:border-[#1E2A45] bg-white dark:bg-[#0B1120]/60">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Step 1: Basic Information */}
              <FormStep 
                title="Basic Information" 
                icon={<Building size={20} />} 
                isActive={currentStep === 1}
                isCompleted={completedSteps.includes(1)}
                stepNumber={1}
                totalSteps={totalSteps}
                onStepClick={goToStep}
              >
                <div className="space-y-6">
                  <CreateFormField
                    name="name"
                    label="Property Name"
                    labelClassName={labelStyle}
                    inputClassName={inputStyle}
                    placeholder="Enter property name"
                  />

                  <CreateFormField
                    name="description"
                    label="Description"
                    type="textarea"
                    labelClassName={labelStyle}
                    inputClassName={`${inputStyle} min-h-[100px] resize-y`}
                    placeholder="Describe your property..."
                  />

                  <CreateFormField
                    name="propertyType"
                    label="Property Type"
                    type="select"
                    options={Object.keys(PropertyTypeEnum).map((type) => ({
                      value: type,
                      label: type,
                    }))}
                    labelClassName={labelStyle}
                    inputClassName={`${inputStyle} h-10`}
                  />

                  {/* NSFAS Accreditation - Making it prominent */}
                  <div className="bg-green-50 dark:bg-gradient-to-r dark:from-green-500/10 dark:to-blue-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-4">
                    <CreateFormField
                      name="isNsfassAccredited"
                      label="NSFAS Accredited Property"
                      type="switch"
                      labelClassName={`${labelStyle} text-green-400 font-semibold`}
                    />
                    <p className="text-xs text-green-700 dark:text-green-300/70 mt-1">
                      Mark if this property accepts NSFAS funding. NSFAS accredited properties are prioritized for students with government funding.
                    </p>
                  </div>
                </div>
                
                <StepNavigation
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  onNext={goToNextStep}
                  onPrev={goToPrevStep}
                  isSubmitting={submitting}
                  isLastStep={false}
                />
              </FormStep>

              {/* Step 2: Pricing & Fees */}
              <FormStep 
                title="Pricing & Fees" 
                icon={<CircleDollarSign size={20} />} 
                isActive={currentStep === 2}
                isCompleted={completedSteps.includes(2)}
                stepNumber={2}
                totalSteps={totalSteps}
                onStepClick={goToStep}
              >
                <div className="space-y-6">
                  <div className="relative">
                    <CustomFormField
                      name="pricePerMonth"
                      label="Monthly Rent"
                      type="number"
                      labelClassName={labelStyle}
                      inputClassName={`${inputStyle} pl-7`}
                      min={0}
                    />
                    <span className="absolute top-9 left-3 text-gray-400">R</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div className="relative">
                      <CustomFormField
                        name="securityDeposit"
                        label="Security Deposit"
                        type="number"
                        labelClassName={labelStyle}
                        inputClassName={`${inputStyle} pl-7`}
                        min={0}
                      />
                      <span className="absolute top-9 left-3 text-gray-400">R</span>
                    </div>
                  </div>
                  <CreateFormField
                    name="isParkingIncluded"
                    label="Parking Included"
                    type="switch"
                    labelClassName={labelStyle}
                  />

                  {/* Property Specifications */}
                  <div className="border-t border-slate-200 dark:border-gray-700 pt-6">
                    <h4 className="text-lg font-medium text-slate-800 dark:text-white mb-4">Property Specifications</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <CreateFormField
                        name="beds"
                        label="Total Bedrooms"
                        type="number"
                        labelClassName={labelStyle}
                        inputClassName={inputStyle}
                        min={0}
                        placeholder="e.g., 4"
                      />
                      <CreateFormField
                        name="baths"
                        label="Total Bathrooms"
                        type="number"
                        labelClassName={labelStyle}
                        inputClassName={inputStyle}
                        min={0}
                        step="0.5"
                        placeholder="e.g., 2.5"
                      />
                      <CreateFormField
                        name="kitchens"
                        label="Total Kitchens"
                        type="number"
                        labelClassName={labelStyle}
                        inputClassName={inputStyle}
                        min={0}
                        placeholder="e.g., 1"
                      />
                    </div>
                    <div className="mt-4">
                      <CreateFormField
                        name="squareFeet"
                        label="Total Square Feet"
                        type="number"
                        labelClassName={labelStyle}
                        inputClassName={inputStyle}
                        min={0}
                        placeholder="e.g., 2500"
                      />
                    </div>
                  </div>
                </div>
                
                <StepNavigation
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  onNext={goToNextStep}
                  onPrev={goToPrevStep}
                  isSubmitting={submitting}
                  isLastStep={false}
                />
              </FormStep>

              {/* Step 3: Rooms */}
              <FormStep 
                title="Rooms" 
                icon={<Home size={20} />}
                isActive={currentStep === 3}
                isCompleted={completedSteps.includes(3)}
                stepNumber={3}
                totalSteps={totalSteps}
                onStepClick={goToStep}
              >
                <div className="space-y-6">
                  {/* Rooms Section */}
                  <RoomsSection rooms={rooms} onAddRoom={handleAddRoom} onRemoveRoom={handleRemoveRoom} />
                </div>
                
                <StepNavigation
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  onNext={goToNextStep}
                  onPrev={goToPrevStep}
                  isSubmitting={submitting}
                  isLastStep={false}
                />
              </FormStep>

              {/* Step 4: Amenities & Highlights */}
              <FormStep 
                title="Amenities & Highlights" 
                icon={<Sparkles size={20} />}
                isActive={currentStep === 4}
                isCompleted={completedSteps.includes(4)}
                stepNumber={4}
                totalSteps={totalSteps}
                onStepClick={goToStep}
              >
                <div className="space-y-6">
                  <div>
                    <CreateFormField
                      name="amenities"
                      label="Amenities"
                      type="multi-select"
                      options={Object.keys(AmenityEnum).map((amenity) => ({
                        value: amenity,
                        label: amenity,
                      }))}
                      labelClassName={labelStyle}
                      inputClassName={`${inputStyle}`}
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.watch("amenities")?.map((amenity, idx) => (
                        <Badge
                          key={idx}
                          className="bg-[#1E3A8A]/30 text-[#60A5FA] border-[#1E3A8A] px-3 py-1.5 flex items-center gap-1.5"
                        >
                          <Coffee className="w-3 h-3" />
                          {amenity}
                          <button
                            type="button"
                            onClick={() => handleRemoveAmenity(amenity)}
                            className="ml-1 hover:bg-[#1E3A8A] rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <CreateFormField
                      name="highlights"
                      label="Highlights"
                      type="multi-select"
                      options={Object.keys(HighlightEnum).map((highlight) => ({
                        value: highlight,
                        label: highlight,
                      }))}
                      labelClassName={labelStyle}
                      inputClassName={`${inputStyle}`}
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.watch("highlights")?.map((highlight, idx) => (
                        <Badge
                          key={idx}
                          className="bg-[#5B21B6]/30 text-[#A78BFA] border-[#5B21B6] px-3 py-1.5 flex items-center gap-1.5"
                        >
                          <Check className="w-3 h-3" />
                          {highlight}
                          <button
                            type="button"
                            onClick={() => handleRemoveHighlight(highlight)}
                            className="ml-1 hover:bg-[#5B21B6] rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <StepNavigation
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  onNext={goToNextStep}
                  onPrev={goToPrevStep}
                  isSubmitting={submitting}
                  isLastStep={false}
                />
              </FormStep>

              {/* Step 5: Property Photos */}
              <FormStep 
                title="Property Photos" 
                icon={<ImageDown size={20} />}
                isActive={currentStep === 5}
                isCompleted={completedSteps.includes(5)}
                stepNumber={5}
                totalSteps={totalSteps}
                onStepClick={goToStep}
              >
                <div>
                  <CustomFormField
                    name="photoUrls" // This is for react-hook-form
                    label="Upload Photos"
                    type="file"
                    accept="image/*"
                    multiple
                    labelClassName={labelStyle}
                    inputClassName="hidden" // The actual input is hidden, styled by the label
                    onChange={handleFileChange} // Updates `uploadedFiles` for preview AND calls field.onChange
                    render={({ field }) => ( // field.onChange is crucial for react-hook-form
                      <div className="mt-2">
                        <label
                          htmlFor={field.name}
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-[#1E2A45] rounded-lg cursor-pointer bg-white dark:bg-[#0B1120]/50 hover:bg-slate-50 dark:hover:bg-[#0B1120] transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-[#4F9CF9]" />
                            <p className="mb-2 text-sm text-slate-600 dark:text-gray-400">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-slate-500 dark:text-gray-500">PNG, JPG, GIF up to 10MB</p>
                          </div>
                          <input
                            id={field.name}
                            type="file"
                            className="hidden"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              field.onChange(e.target.files); // This updates react-hook-form's state for "photoUrls"
                              handleFileChange(e);             // This updates your local `uploadedFiles` state for previews
                            }}
                          />
                        </label>
                      </div>
                    )}
                  />

                  {/* File preview for property photos */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-slate-700 dark:text-gray-400 mb-2">Selected property files ({uploadedFiles.length}):</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {uploadedFiles.map((file, index) => {
                          const isFeatured = index === featuredImageIndex;
                          return (
                            <div
                              key={index}
                              className={`relative group bg-white dark:bg-[#0B1120] rounded-md p-1 h-24 flex items-center justify-center overflow-hidden ring-2 ${isFeatured ? 'ring-blue-500' : 'ring-transparent'} border border-slate-200 dark:border-transparent`}
                            >
                              <Image
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index}`}
                                width={300}
                                height={200}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => setFeaturedImageIndex(index)}
                                className={`absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-white/70 dark:bg-black/60 backdrop-blur-sm border border-slate-300 dark:border-white/20 transition ${isFeatured ? 'text-blue-700 dark:text-white font-semibold' : 'text-slate-700 dark:text-gray-300 group-hover:bg-white/80 dark:group-hover:bg-black/70'}`}
                                title={isFeatured ? 'Featured image' : 'Set as featured'}
                              >
                                {isFeatured ? 'Featured' : 'Set'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-xs text-slate-600 dark:text-gray-500">The featured image appears first in listings. Click a thumbnail label to change.</p>
                    </div>
                  )}
                </div>
                
                <StepNavigation
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  onNext={goToNextStep}
                  onPrev={goToPrevStep}
                  isSubmitting={submitting}
                  isLastStep={false}
                />
              </FormStep>

              {/* Step 6: Location */}
              <FormStep 
                title="Location Information" 
                icon={<MapPin size={20} />}
                isActive={currentStep === 6}
                isCompleted={completedSteps.includes(6)}
                stepNumber={6}
                totalSteps={totalSteps}
                onStepClick={goToStep}
              >
                <div className="space-y-4">
                  <CreateFormField
                    name="address"
                    label="Street Address"
                    labelClassName={labelStyle}
                    inputClassName={inputStyle}
                    placeholder="123 Main St, Apt 4B"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CreateFormField
                      name="city"
                      label="City"
                      className="w-full"
                      labelClassName={labelStyle}
                      inputClassName={inputStyle}
                      placeholder="Cape Town"
                    />

                    <CreateFormField
                      name="state"
                      label="State/Province"
                      className="w-full"
                      labelClassName={labelStyle}
                      inputClassName={inputStyle}
                      placeholder="Western Cape"
                    />

                    <CreateFormField
                      name="postalCode"
                      label="Postal Code"
                      className="w-full"
                      labelClassName={labelStyle}
                      inputClassName={inputStyle}
                      placeholder="8001"
                    />
                  </div>

                  <CreateFormField
                    name="country"
                    label="Country"
                    labelClassName={labelStyle}
                    inputClassName={inputStyle}
                    placeholder="South Africa"
                  />

                  <CreateFormField
                    name="closestUniversities"
                    label="Closest Universities"
                    type="multi-select"
                    options={UNIVERSITY_OPTIONS}
                    labelClassName={labelStyle}
                    inputClassName={`${inputStyle}`}
                  />
                  <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                    Select the universities that are closest to this property. This helps students find accommodation near their campus.
                  </p>
                </div>
                
                <StepNavigation
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  onNext={goToNextStep}
                  onPrev={goToPrevStep}
                  isSubmitting={submitting}
                  isLastStep={true}
                />
              </FormStep>

              {/* Form completion progress */}
              <div className="mt-8 mb-4 bg-[#0B1120]/80 p-4 rounded-lg border border-[#1E2A45] shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-white">Form Progress</h3>
                  <span className="text-sm text-blue-400">
                    {completedSteps.length} of {totalSteps} steps completed
                  </span>
                </div>
                <Progress 
                  value={(completedSteps.length / totalSteps) * 100} 
                  className="h-2 bg-[#1E2A45]" 
                />
                
                {/* Step indicators */}
                <div className="flex justify-between mt-2">
                  {Array.from({ length: totalSteps }).map((_, index) => {
                    const stepNum = index + 1;
                    const isCompleted = completedSteps.includes(stepNum);
                    
                    return (
                      <div 
                        key={stepNum} 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${isCompleted ? 'bg-green-500 text-white' : 'bg-[#1E2A45] text-gray-400'} cursor-pointer transition-colors`}
                        onClick={() => {
                          // Allow jumping to completed steps or the next available step
                          if (isCompleted || stepNum === Math.min(currentStep + 1, totalSteps)) {
                            setCurrentStep(stepNum);
                          } else if (stepNum < currentStep) {
                            setCurrentStep(stepNum);
                          }
                        }}
                      >
                        {isCompleted ? <CheckCircle2 size={14} /> : stepNum}
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default NewProperty;