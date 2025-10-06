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
  CheckCircle2,
} from "lucide-react";

// Data & API
import { type PropertyFormData, propertySchema } from "@/lib/schemas";
import { processImageFiles } from "@/lib/imageUtils";
import { useCreatePropertyMutation, useCreateRoomMutation, useGetAuthUserQuery } from "@/state/api";
import { AmenityEnum, HighlightEnum, PropertyTypeEnum, RedirectTypeEnum, UNIVERSITY_OPTIONS, PROVINCES, getUniversityOptionsByProvince, getCampusOptionsByProvince, getCampusOptionsByUniversity } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


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
  const totalSteps = 5; // Removed Pricing step to simplify

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
  name: "",
  description: "",
      isNsfassAccredited: false,
      isParkingIncluded: true,
      photoUrls: [] as unknown as FileList, // Important for react-hook-form with file inputs
      amenities: [],
      highlights: [],
      propertyType: PropertyTypeEnum.Apartment,
      address: "",
      city: "",
      province: "",
      state: "",
      country: "",
      suburb: "",
  closestUniversities: [],
  closestCampuses: [],
  closestUniversity: "",
  redirectType: RedirectTypeEnum.NONE,
  whatsappNumber: "",
  customLink: "",
    },
    mode: "onChange", // Validate on change for better UX
  });
  
  // Filtered university options based on selected province
  const watchedProvince = form.watch("province");
  const watchedClosestUniversity = form.watch("closestUniversity");
  const filteredUniversityOptions = getUniversityOptionsByProvince(watchedProvince);
  const filteredCampusOptions = watchedClosestUniversity
    ? getCampusOptionsByUniversity(watchedClosestUniversity as any)
    : getCampusOptionsByProvince(watchedProvince as any);
  
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
      case 2: // Rooms
        // At least one room should be added
        isValid = rooms.length > 0;
        break;
      case 3: // Amenities & Highlights
        // At least one amenity required
        isValid = (formState.amenities && formState.amenities.length > 0);
        break;
      case 4: // Property Photos
        // At least one photo required
        isValid = (uploadedFiles.length > 0 || (formState.photoUrls && formState.photoUrls.length > 0));
        break;      case 5: // Location Information
  isValid = !!formState.address && formState.address.trim() !== '' && 
    !!formState.city && formState.city.trim() !== '' && 
    !!formState.province && formState.province.trim() !== '' &&
    !!formState.country && formState.country.trim() !== '' &&
    !!formState.postalCode && formState.postalCode.trim() !== '' &&
    !!formState.closestCampuses && formState.closestCampuses.length > 0;
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

      // Prefer files stored in react-hook-form (FilePond), fallback to local state
      let photoFiles: File[] = [];
      const formFiles = form.getValues('photoUrls') as unknown as File[] | undefined;
      if (Array.isArray(formFiles) && formFiles.length > 0) {
        photoFiles = [...formFiles];
      } else {
        photoFiles = [...uploadedFiles];
      }
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
        accreditedBy: Array.isArray(data.accreditedBy) ? data.accreditedBy : [],
        closestUniversity: data.closestUniversity || undefined,
        closeToUniversity: data.closeToUniversity || undefined,
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
        if (!idToken) {
          console.warn('Missing idToken; cannot upload photos.');
        } else {
          // Compress / process main property images (reuse room processing constraints but slightly larger total)
          try {
            // Allow a larger total budget so many images (9+)
            // can be compressed without tripping the total cap client-side
            const processed = await processImageFiles(
              photoFiles,
              2 * 1024 * 1024,   // 2MB per file target
              40 * 1024 * 1024   // 40MB total to accommodate many images
            );
            console.log(`Processed main property images: original=${photoFiles.length}, processed=${processed.length}`);
            photoFiles = processed;
          } catch (procErr) {
            console.error('Failed processing main property images, proceeding with originals:', procErr);
          }
          // Group files by cumulative size to avoid 413s on hosts with low limits
          // Aim for <= ~4MB per request and max 2 files per group for safety
          const MAX_GROUP_BYTES = 4_000_000; // ~3.8MB to leave overhead margin
          const MAX_FILES_PER_GROUP = 2;
          const groups: File[][] = [];
          let current: File[] = [];
          let currentBytes = 0;
          for (const f of photoFiles) {
            const willExceed = currentBytes + f.size > MAX_GROUP_BYTES;
            const willHitCount = current.length >= MAX_FILES_PER_GROUP;
            if (current.length > 0 && (willExceed || willHitCount)) {
              groups.push(current);
              current = [];
              currentBytes = 0;
            }
            current.push(f);
            currentBytes += f.size;
          }
          if (current.length > 0) groups.push(current);

          console.log(`Uploading ${photoFiles.length} photos in ${groups.length} size-based group(s) for property ID ${propertyResponse.id}`);
          let uploadedCount = 0;
          let failedCount = 0;
          const failedFiles: File[] = [];
          let latestPhotoUrls: string[] = [];
          for (let gi = 0; gi < groups.length; gi++) {
            const slice = groups[gi];
            const formData = new FormData();
            slice.forEach((f) => formData.append('photos', f));
            if (gi === 0) formData.append('featuredIndex', '0');
            console.log(`Uploading photo group #${gi + 1}/${groups.length} containing ${slice.length} file(s), totalBytes=${slice.reduce((s, f) => s + f.size, 0)}`);
            try {
              const res = await fetch(`/api/properties/${propertyResponse.id}/photos/group`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}` },
                body: formData
              });
              if (!res.ok) {
                let err: any = {};
                try { err = await res.json(); } catch {}
                console.error('Group upload failed', { status: res.status, err });
                failedCount += slice.length;
                failedFiles.push(...slice);
              } else {
                const json = await res.json();
                console.log(`Uploaded group #${gi + 1}:`, json);
                uploadedCount += slice.length;
                if (Array.isArray(json.photoUrls)) {
                  latestPhotoUrls = json.photoUrls;
                }
              }
            } catch (e) {
              console.error('Error during group upload', e);
              failedCount += slice.length;
              failedFiles.push(...slice);
            }
          }
          if (failedCount > 0) {
            toast.error(`${failedCount} photo(s) failed to upload`, { position: 'top-center' });
          } else if (uploadedCount > 0) {
            console.log('All property photos uploaded successfully. Total:', uploadedCount);
          }
          console.log(`Grouped upload complete. Success: ${uploadedCount}, Failed: ${failedCount}. Latest photoUrls length: ${latestPhotoUrls.length}`);
          // Refetch property to confirm persisted photoUrls
          try {
            const confirmRes = await fetch(`/api/properties/${propertyResponse.id}`);
            if (confirmRes.ok) {
              const confirmed = await confirmRes.json();
              console.log('Post-upload property refetch photoUrls length:', confirmed.photoUrls?.length, confirmed.photoUrls);
              // Fallback: if zero persisted OR we have known failed files, upload those sequentially
              if (((confirmed.photoUrls?.length ?? 0) === 0 && photoFiles.length > 0) || failedFiles.length > 0) {
                const toUploadSeq = failedFiles.length > 0 ? failedFiles : photoFiles;
                console.warn(`Initiating sequential fallback uploads for ${toUploadSeq.length} file(s)...`);
                let seqSuccess = 0; let seqFail = 0;
                for (let i = 0; i < toUploadSeq.length; i++) {
                  const f = toUploadSeq[i];
                  const fd = new FormData();
                  fd.append('photo', f);
                  if (i === 0) fd.append('featuredImageIndex', '0');
                  try {
                    const resp = await fetch(`/api/properties/${propertyResponse.id}/photos`, { method: 'POST', body: fd });
                    if (!resp.ok) {
                      let err: any = {}; try { err = await resp.json(); } catch {}
                      console.error('Sequential upload failed', f.name, { status: resp.status, err });
                      seqFail++;
                    } else {
                      const js = await resp.json();
                      console.log('Sequential upload success', f.name, js.photoUrl);
                      seqSuccess++;
                    }
                  } catch (se) {
                    console.error('Sequential upload exception', f.name, se);
                    seqFail++;
                  }
                }
                try {
                  const finalCheck = await fetch(`/api/properties/${propertyResponse.id}`);
                  if (finalCheck.ok) {
                    const finalProp = await finalCheck.json();
                    console.log('After sequential fallback photoUrls length:', finalProp.photoUrls?.length, finalProp.photoUrls);
                  }
                } catch {}
                if (seqSuccess > 0 && seqFail === 0) {
                  toast.success('Property photos uploaded via fallback', { position: 'top-center' });
                } else if (seqSuccess > 0) {
                  toast.warning(`Fallback partial success: ${seqSuccess} ok, ${seqFail} failed`, { position: 'top-center' });
                } else {
                  toast.error('All photo uploads failed (group + fallback)', { position: 'top-center' });
                }
              }
            } else {
              console.warn('Property refetch after uploads failed with status', confirmRes.status);
            }
          } catch (confirmErr) {
            console.warn('Failed to refetch property after uploads:', confirmErr);
          }
        }
      } else {
        console.log('No property photos selected; skipping grouped upload.');
      }
      
      // If we have rooms to add, create them for this property
      if (rooms.length > 0) {
        for (const room of rooms) {
          try {
            console.log('Creating room for property:', propertyResponse.id, 'room name:', room.name);
            
            // Create a clean JSON object from the room data first
            const cleanRoomData: {
              name: string;
              pricePerMonth: number;
              securityDeposit: number;
              topUp: number;
              squareFeet: number;
              roomType: 'PRIVATE' | 'SHARED';
              capacity: number;
              isAvailable: boolean;
              propertyId: any;
              bathroomPrivacy?: 'PRIVATE' | 'SHARED';
              kitchenPrivacy?: 'PRIVATE' | 'SHARED';
              availableFrom?: string;
            } = {
              name: room.name || 'Unnamed Room',
              pricePerMonth: Math.min(Math.max(0, Number(room.pricePerMonth || 0)), 100000),
              securityDeposit: Math.min(Math.max(0, Number(room.securityDeposit || 0)), 100000),
              topUp: Math.min(Math.max(0, Number((room as any).topUp || 0)), 100000),
              squareFeet: Math.min(Math.max(0, Number(room.squareFeet || 0)), 10000),
              roomType: room.roomType || 'PRIVATE',
              capacity: Math.max(1, Number(room.capacity || 1)),
              isAvailable: room.isAvailable !== false,
              propertyId: propertyResponse.id,
              bathroomPrivacy: room.bathroomPrivacy,
              kitchenPrivacy: room.kitchenPrivacy,
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
                  {stepNum === 2 && 'Rooms'}
                  {stepNum === 3 && 'Amenities'}
                  {stepNum === 4 && 'Photos'}
                  {stepNum === 5 && 'Location'}
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

                  {/* Simple specs & parking */}
                  {/* Parking toggle */}
                  <CreateFormField
                    name="isParkingIncluded"
                    label="Parking Included"
                    type="switch"
                    labelClassName={labelStyle}
                  />

                  {/* NSFAS Accreditation - Accessible + Dark Mode Optimized */}
                  <div
                    className="relative group rounded-lg p-4 border
                    bg-green-50/70 dark:bg-slate-800/70
                    border-green-200 dark:border-slate-600
                    shadow-sm dark:shadow-[0_0_0_1px_rgba(56,189,248,0.15)] transition-colors"
                  >
                    <div className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-green-500/5 via-emerald-400/5 to-cyan-400/5" />
                    <div className="relative flex items-start justify-between gap-4">
                      <CreateFormField
                        name="isNsfassAccredited"
                        label="NSFAS Accredited Property"
                        type="switch"
                        labelClassName={`${labelStyle} font-semibold text-green-700 dark:text-green-300`}
                      />
                      {/* Visual status pill (mirrors switch state via form value in future if desired) */}
                    </div>
                    <p className="relative text-xs mt-1 leading-relaxed text-green-700 dark:text-slate-300/80">
                      Mark if this property accepts NSFAS funding. Accredited listings surface faster for students with government funding.
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

              {/* Step 2: Rooms */}
              

              <FormStep 
                title="Rooms" 
                icon={<Home size={20} />}
                isActive={currentStep === 2}
                isCompleted={completedSteps.includes(2)}
                stepNumber={2}
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

              {/* Step 3: Amenities & Highlights */}
              <FormStep 
                title="Amenities & Highlights" 
                icon={<Sparkles size={20} />}
                isActive={currentStep === 3}
                isCompleted={completedSteps.includes(3)}
                stepNumber={3}
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

              {/* Step 4: Property Photos */}
              <FormStep 
                title="Property Photos" 
                icon={<ImageDown size={20} />}
                isActive={currentStep === 4}
                isCompleted={completedSteps.includes(4)}
                stepNumber={4}
                totalSteps={totalSteps}
                onStepClick={goToStep}
              >
                <div>
                  {/* File preview for property photos - Moved above upload area */}
                  {(() => {
                    const watched = form.watch('photoUrls') as unknown as File[] | undefined;
                    const previewFiles: File[] = (Array.isArray(watched) && watched.length > 0)
                      ? watched
                      : uploadedFiles;
                    return previewFiles.length > 0 ? (
                    <div className="mb-6">
                      <p className="text-sm text-slate-700 dark:text-gray-400 mb-3">Selected property files ({previewFiles.length}):</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {previewFiles.map((file, index) => {
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
                                unoptimized={true}
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
                      <p className="mt-3 text-xs text-slate-600 dark:text-gray-500">The featured image appears first in listings. Click a thumbnail label to change.</p>
                    </div>
                    ) : null;
                  })()}

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
                          htmlFor={`${field.name}-input`}
                          className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 dark:border-[#1E2A45] rounded-lg cursor-pointer bg-white dark:bg-[#0B1120]/50 hover:bg-slate-50 dark:hover:bg-[#0B1120] transition-colors shadow-sm"
                        >
                          <div className="flex flex-col items-center justify-center pt-6 pb-6">
                            <Upload className="w-10 h-10 mb-4 text-[#4F9CF9]" />
                            <p className="mb-2 text-sm text-slate-600 dark:text-gray-400">
                              <span className="font-semibold">Click to upload more photos</span> or drag and drop
                            </p>
                            <p className="text-xs text-slate-500 dark:text-gray-500">PNG, JPG, GIF up to 10MB</p>
                          </div>
                          <input
                            id={`${field.name}-input`}
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

              {/* Step 5: Location */}
              <FormStep 
                title="Location Information" 
                icon={<MapPin size={20} />}
                isActive={currentStep === 5}
                isCompleted={completedSteps.includes(5)}
                stepNumber={5}
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
                      name="suburb"
                      label="Suburb"
                      className="w-full"
                      labelClassName={labelStyle}
                      inputClassName={inputStyle}
                      placeholder="e.g., Rondebosch"
                    />

                    <CreateFormField
                      name="province"
                      label="Province"
                      type="select"
                      options={PROVINCES.map(p => ({ value: p, label: p }))}
                      className="w-full"
                      labelClassName={labelStyle}
                      inputClassName={inputStyle}
                      placeholder="Select a province"
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

                  {/* Closest University (filters campuses) */}
                  <CreateFormField
                    name="closestUniversity"
                    label="Closest University"
                    type="select"
                    options={filteredUniversityOptions}
                    labelClassName={labelStyle}
                    inputClassName={`${inputStyle}`}
                    placeholder="Select a university"
                  />

                  {/* Closest campus (single-select stored as array[0]) */}
                  <CreateFormField
                    name="closestCampuses"
                    label="Closest Compaus"
                    type="select"
                    labelClassName={labelStyle}
                    inputClassName={`${inputStyle}`}
                    render={(field) => (
                      <Select
                        value={Array.isArray(field.value) ? (field.value[0] ?? "") : ""}
                        onValueChange={(val) => field.onChange(val ? [val] : [])}
                      >
                        <SelectTrigger className={`${inputStyle}`}>
                          <SelectValue placeholder="Select campus" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredCampusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />

                  {/* Accredited by (multi-select) */}
                  <CreateFormField
                    name="accreditedBy"
                    label="Accredited by University"
                    type="multi-select"
                    options={filteredUniversityOptions}
                    labelClassName={labelStyle}
                    inputClassName={`${inputStyle}`}
                  />

                  {/* Divider for redirect settings */}
                  <div className="pt-6 mt-6 border-t border-[#1E2A45]">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="bg-blue-500/20 p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                      </span>
                      After Application Redirect (Optional)
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Configure where students are redirected after submitting an application. This helps you connect with applicants faster!
                    </p>
                  </div>

                  {/* Redirect Type Selection */}
                  <CreateFormField
                    name="redirectType"
                    label="Redirect Type"
                    type="select"
                    options={[
                      { value: RedirectTypeEnum.NONE, label: "No Redirect (Default)" },
                      { value: RedirectTypeEnum.WHATSAPP, label: "WhatsApp Message" },
                      { value: RedirectTypeEnum.CUSTOM_LINK, label: "Custom Website/Link" },
                    ]}
                    labelClassName={labelStyle}
                    inputClassName={`${inputStyle}`}
                    placeholder="Select redirect type"
                  />

                  {/* WhatsApp Number (conditional) */}
                  {form.watch("redirectType") === RedirectTypeEnum.WHATSAPP && (
                    <div className="space-y-2 bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                      <CreateFormField
                        name="whatsappNumber"
                        label="WhatsApp Number"
                        type="text"
                        labelClassName={labelStyle}
                        inputClassName={`${inputStyle}`}
                        placeholder="27123456789 (with country code, no + or spaces)"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        📱 Enter your WhatsApp number with country code (e.g., 27123456789 for South Africa). 
                        Students will be redirected to WhatsApp after applying.
                      </p>
                    </div>
                  )}

                  {/* Custom Link (conditional) */}
                  {form.watch("redirectType") === RedirectTypeEnum.CUSTOM_LINK && (
                    <div className="space-y-2 bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                      <CreateFormField
                        name="customLink"
                        label="Custom Link/Website"
                        type="text"
                        labelClassName={labelStyle}
                        inputClassName={`${inputStyle}`}
                        placeholder="https://your-website.com/contact"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        🔗 Enter the URL where students should be redirected after applying 
                        (e.g., your website, booking system, or contact form).
                      </p>
                    </div>
                  )}
                  
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