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
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import posthog from 'posthog-js';
import { AmenityEnum, HighlightEnum, PropertyTypeEnum, RedirectTypeEnum, UNIVERSITY_OPTIONS, PROVINCES, getUniversityOptionsByProvince, getCampusOptionsByProvince, getCampusOptionsByUniversity } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MIGRATED_LANDLORD_IDS: Record<string, string> = {
  "clip-plod-lesser@duck.com": "a0dc393c-a001-7078-2d0f-c1281d72a110",
  "info@staysouthpoint.co.za": "50bc293c-c0c1-70b1-c593-4b2d2a4f1f40",
  "student@student24.co.za": "802c697c-9071-70b7-c6b2-da6a401cbb1e",
  "fezekile@student24.co.za": "a0dc393c-a001-7078-2d0f-c1281d72a110",
  "thebe@student24.co.za": "30cc59ec-7031-70c8-47e1-3fe4870f803c",
  "landlord@student24.co.za": "90cc39ac-d041-701d-5a21-fa363989c445",
  "respublica@student24.co.za": "b06ce90c-9051-70d5-bb90-b19bf383a54d",
  "campuskey@student24.co.za": "703c393c-9031-70b1-ce6e-52f65a7bc1d1",
  "urbanstudent@student24.co.za": "20ac79dc-8031-7006-eb18-8f551c6c5ad3",
  "dunvegancottages@gmail.com": "007c093c-7051-7043-34e8-8b091f0a205d",
  "s.v.propdev@gmail.com": "a02c39dc-70c1-7065-02fc-883a8b417e2c",
  "zwelakhe.samuel@gmail.com": "101c293c-5081-7043-8179-30abb82807dc",
  "unathindlovu28@gmail.com": "d04c697c-f061-7015-5342-9f4fd8909467",
  "allistairem@gmail.com": "405c093c-2051-702e-e86d-8a625d775b0e",
  "meevsuu@hotmail.com": "f04cb9ac-6041-7060-a1da-90eacad6fb62",
  "rosaliefloresfranco@gmail.com": "40ccb93c-60c1-70c0-bfe2-16551e4395a1",
};


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
            <div className={`p-2 rounded-xl border transition-colors ${
              isCompleted 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-100'
            }`}>
              {isCompleted ? <CheckCircle2 size={18} /> : icon}
            </div>
            <h2 className="text-lg font-bold text-zinc-100 hover:text-white transition-colors">{title}</h2>
          </div>
          <div className="text-xs text-zinc-400 font-mono">
            Step {stepNumber} of {totalSteps}
          </div>
        </div>
        <Progress value={(stepNumber / totalSteps) * 100} className="h-1 mb-6 bg-zinc-900 [&>div]:bg-white" />
      </div>
      <div className="p-6 sm:p-7 border border-zinc-800/80 rounded-2xl bg-zinc-950/70 backdrop-blur-xl shadow-xl shadow-black/50">
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
    <div className="flex justify-between items-center mt-8 pt-4 border-t border-zinc-800/80">
      {currentStep > 1 ? (
        <Button
          type="button"
          onClick={onPrev}
          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-medium py-2 px-4 rounded-xl flex items-center gap-2 text-xs transition-all active:scale-95"
          disabled={isSubmitting}
        >
          <ArrowLeft size={15} />
          Previous
        </Button>
      ) : <div />}
      
      <Button
        type={isLastStep ? "submit" : "button"}
        onClick={isLastStep ? undefined : onNext}
        className="bg-white hover:bg-zinc-200 text-black font-semibold py-2.5 px-6 rounded-xl flex items-center gap-2 text-xs ml-auto transition-all active:scale-95 shadow-md"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : isLastStep ? (
          <>
            <Check className="w-4 h-4" />
            Submit Property
          </>
        ) : (
          <>
            Next Step
            <ArrowRight size={15} />
          </>
        )}
      </Button>
    </div>
  );
};

// Main component
const NewProperty = () => {
  const createConvexProperty = useMutation(api.properties.createProperty);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createConvexRoom = useMutation(api.properties.createRoom);
  const { user, isAuthenticated } = useUnifiedAuth();
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
    
    if (!validateStep(currentStep)) {
      toast.error("Please complete all required fields before submitting", {
        position: "top-center",
        duration: 3000,
      });
      return;
    }

    try {
      setSubmitting(true);

      let roomsSuccessfullyCreated = 0;
      let failedRooms = 0;

      // Extract manager info from Unified User / NextAuth / Cognito
      const sessionUser = (user as any);
      const managerEmail = user?.email || sessionUser?.email || "";
      const mappedId = managerEmail ? MIGRATED_LANDLORD_IDS[managerEmail.toLowerCase()] : "";
      const managerId = sessionUser?.id || sessionUser?.sub || sessionUser?.userId || mappedId || managerEmail || "manager-default";

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
      }

      // 1. Upload photos to Convex Storage
      const storageIds: any[] = [];
      if (photoFiles.length > 0) {
        toast.info(`Uploading ${photoFiles.length} photo(s) to Convex...`, { position: "top-center", duration: 2500 });
        for (const file of photoFiles) {
          try {
            const uploadUrl = await generateUploadUrl();
            const res = await fetch(uploadUrl, {
              method: "POST",
              headers: { "Content-Type": file.type || "image/jpeg" },
              body: file,
            });
            const { storageId } = await res.json();
            if (storageId) storageIds.push(storageId);
          } catch (uploadErr) {
            console.error("Photo upload error:", uploadErr);
          }
        }
      }

      // Calculate aggregated price / beds / baths from rooms if available
      let minPrice = Number(data.pricePerMonth) || 0;
      let totalBeds = Number(data.beds) || 0;
      let totalBaths = Number(data.baths) || 0;
      if (rooms.length > 0) {
        const roomPrices = rooms.map(r => Number(r.pricePerMonth) || 0).filter(p => p > 0);
        if (roomPrices.length > 0) minPrice = Math.min(...roomPrices);
        totalBeds = rooms.length;
        totalBaths = rooms.filter(r => r.bathroomPrivacy === "PRIVATE").length || 1;
      }

      // 2. Create Property in Convex
      const propertyId = await createConvexProperty({
        name: data.name,
        description: data.description || "",
        pricePerMonth: minPrice || 3500,
        securityDeposit: Number(data.securityDeposit) || 0,
        beds: totalBeds || 1,
        baths: totalBaths || 1,
        kitchens: Number(data.kitchens) || 1,
        squareFeet: Number(data.squareFeet) || undefined,
        propertyType: data.propertyType || "Apartment",
        images: storageIds,
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
        highlights: Array.isArray(data.highlights) ? data.highlights : [],
        accreditedBy: Array.isArray(data.accreditedBy) ? data.accreditedBy : [],
        closestUniversity: data.closestUniversity || undefined,
        closestCampuses: Array.isArray(data.closestCampuses) ? data.closestCampuses : (data.closestCampuses ? [data.closestCampuses] : undefined),
        isPetsAllowed: Boolean((data as any).isPetsAllowed),
        isParkingIncluded: Boolean(data.isParkingIncluded),
        isNsfassAccredited: Boolean(data.isNsfassAccredited),
        address: data.address || "",
        city: data.city || "",
        suburb: data.suburb || undefined,
        state: data.province || data.state || undefined,
        country: data.country || "South Africa",
        postalCode: data.postalCode || undefined,
        latitude: -26.2041,
        longitude: 28.0473,
        managerId: managerId,
        redirectType: data.redirectType || undefined,
        whatsappNumber: data.whatsappNumber || undefined,
        customLink: data.customLink || undefined,
      });

      console.log("Convex property created with ID:", propertyId);

      // 3. Create rooms in Convex
      if (rooms.length > 0 && propertyId) {
        for (const room of rooms) {
          try {
            const roomStorageIds: any[] = [];
            if (Array.isArray(room.photoUrls)) {
              for (const file of room.photoUrls) {
                if (file instanceof File) {
                  try {
                    const roomUploadUrl = await generateUploadUrl();
                    const rRes = await fetch(roomUploadUrl, {
                      method: "POST",
                      headers: { "Content-Type": file.type || "image/jpeg" },
                      body: file,
                    });
                    const { storageId } = await rRes.json();
                    if (storageId) roomStorageIds.push(storageId);
                  } catch (rErr) {
                    console.error("Room photo upload error:", rErr);
                  }
                }
              }
            }

            await createConvexRoom({
              propertyId: propertyId as any,
              name: room.name || "Room",
              pricePerMonth: Number(room.pricePerMonth) || 0,
              securityDeposit: Number(room.securityDeposit) || 0,
              topUp: Number((room as any).topUp) || undefined,
              beds: 1,
              baths: room.bathroomPrivacy === "PRIVATE" ? 1 : 0,
              squareFeet: Number(room.squareFeet) || undefined,
              images: roomStorageIds,
              isAvailable: Boolean(room.isAvailable),
              roomType: room.roomType || "PRIVATE",
              capacity: Number(room.capacity) || 1,
              features: [],
            });
            roomsSuccessfullyCreated++;
          } catch (roomErr) {
            console.error("Room creation error:", roomErr);
            failedRooms++;
          }
        }
      }

      // Reset form and navigate
      form.reset();
      setUploadedFiles([]);
      setRooms([]);

      toast.success(`Property "${data.name}" created successfully in Convex!`, {
        position: "top-center",
        duration: 4000,
      });

      router.push("/managers/properties");
    } catch (err: any) {
      console.error("Failed to create property in Convex:", err);
      toast.error(err.message || "Failed to create property in Convex. Please try again.", {
        position: "top-center",
        duration: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Style for form field labels
  const labelStyle = "text-xs font-medium text-zinc-300";

  // Style for form field inputs
  const inputStyle =
    "bg-zinc-900/80 text-zinc-100 placeholder:text-zinc-500 border border-zinc-800 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 rounded-xl text-xs sm:text-sm";

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 selection:bg-zinc-800 pb-16">
      <Toaster richColors position="top-center" theme="dark" />
      <div className="relative max-w-4xl mx-auto px-4 py-6">
        {/* Background glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Header with back button */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl h-9 w-9"
              onClick={() => router.back()}
            >
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Add New Property</h1>
              <p className="text-xs text-zinc-400 mt-0.5">Create a student accommodation listing step-by-step</p>
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
                className="flex flex-col items-center cursor-pointer group" 
                onClick={() => goToStep(stepNum)}
                role="button"
                tabIndex={0}
                aria-label={`Go to step ${stepNum}`}
              >
                <div 
                  className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-all text-xs font-semibold border ${
                    isActive 
                      ? 'bg-white text-black border-white shadow-md' 
                      : isCompleted 
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800 group-hover:border-zinc-700'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={15} /> : stepNum}
                </div>
                <div className={`text-[11px] font-medium ${
                  isActive ? 'text-zinc-100' : isCompleted ? 'text-emerald-400' : 'text-zinc-500'
                }`}>
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
        <div className="rounded-2xl p-6 sm:p-8 border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl shadow-2xl shadow-black/80">
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
                      <p className="text-xs text-zinc-400 mb-3">Selected property photos ({previewFiles.length}):</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {previewFiles.map((file, index) => {
                          const isFeatured = index === featuredImageIndex;
                          return (
                            <div
                              key={index}
                              className={`relative group bg-zinc-900 rounded-xl p-1 h-24 flex items-center justify-center overflow-hidden border ${isFeatured ? 'border-white ring-2 ring-white/20' : 'border-zinc-800'}`}
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
                                className={`absolute top-1 left-1 text-[10px] px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm border border-white/20 transition ${isFeatured ? 'text-emerald-400 font-semibold border-emerald-500/40' : 'text-zinc-300 hover:text-white'}`}
                                title={isFeatured ? 'Featured image' : 'Set as featured'}
                              >
                                {isFeatured ? 'Featured' : 'Set Featured'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-[11px] text-zinc-500">The featured image appears first in listings. Click thumbnail badge to set featured photo.</p>
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
                          className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-2xl cursor-pointer bg-zinc-900/40 hover:bg-zinc-900/80 transition-colors shadow-sm"
                        >
                          <div className="flex flex-col items-center justify-center pt-6 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-zinc-400" />
                            <p className="mb-1 text-xs text-zinc-300">
                              <span className="font-semibold text-white">Click to upload photos</span> or drag and drop
                            </p>
                            <p className="text-[10px] text-zinc-500">PNG, JPG, WEBP up to 10MB</p>
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
                    label="Closest Campus"
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
                        <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-200">
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
                  <div className="pt-6 mt-6 border-t border-zinc-800">
                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <span className="bg-zinc-800 p-1.5 rounded-lg text-zinc-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                      </span>
                      After Application Redirect (Optional)
                    </h3>
                    <p className="text-xs text-zinc-400 mb-4">
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
                    <div className="space-y-2 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                      <CreateFormField
                        name="whatsappNumber"
                        label="WhatsApp Number"
                        type="text"
                        labelClassName={labelStyle}
                        inputClassName={`${inputStyle}`}
                        placeholder="27123456789 (with country code, no + or spaces)"
                      />
                      <p className="text-[11px] text-zinc-400 mt-1">
                        📱 Enter your WhatsApp number with country code (e.g., 27123456789 for South Africa). 
                        Students will be redirected to WhatsApp after applying.
                      </p>
                    </div>
                  )}

                  {/* Custom Link (conditional) */}
                  {form.watch("redirectType") === RedirectTypeEnum.CUSTOM_LINK && (
                    <div className="space-y-2 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                      <CreateFormField
                        name="customLink"
                        label="Custom Link/Website"
                        type="text"
                        labelClassName={labelStyle}
                        inputClassName={`${inputStyle}`}
                        placeholder="https://your-website.com/contact"
                      />
                      <p className="text-[11px] text-zinc-400 mt-1">
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
              <div className="mt-8 mb-4 bg-zinc-950/80 p-5 rounded-2xl border border-zinc-800 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Form Progress</h3>
                  <span className="text-xs text-zinc-400 font-mono">
                    {completedSteps.length} of {totalSteps} steps completed
                  </span>
                </div>
                <Progress 
                  value={(completedSteps.length / totalSteps) * 100} 
                  className="h-1.5 bg-zinc-900 [&>div]:bg-white mb-3" 
                />
                
                {/* Step indicators */}
                <div className="flex justify-between mt-2">
                  {Array.from({ length: totalSteps }).map((_, index) => {
                    const stepNum = index + 1;
                    const isCompleted = completedSteps.includes(stepNum);
                    
                    return (
                      <div 
                        key={stepNum} 
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'} cursor-pointer transition-colors`}
                        onClick={() => {
                          // Allow jumping to completed steps or the next available step
                          if (isCompleted || stepNum === Math.min(currentStep + 1, totalSteps)) {
                            setCurrentStep(stepNum);
                          } else if (stepNum < currentStep) {
                            setCurrentStep(stepNum);
                          }
                        }}
                      >
                        {isCompleted ? <CheckCircle2 size={13} /> : stepNum}
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