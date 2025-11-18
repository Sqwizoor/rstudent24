// --- BEGIN FILE: app/managers/properties/edit/[id]/page.tsx ---
"use client";

import React, { useEffect, useState as usePageState } from "react";
import { useForm as usePropertyForm, Controller } from "react-hook-form";
import { zodResolver as zodPropertyResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

// UI Components
import { Form as PropertyFormUI } from "@/components/ui/form";
import { Button as UIButton } from "@/components/ui/button";
import { Input as UIInput } from "@/components/ui/input";
import { Checkbox as UICheckbox } from "@/components/ui/checkbox";
import { Label as UILabel } from "@/components/ui/label";
import { Badge as UIBadge } from "@/components/ui/badge";
import {
  Dialog as UIDialog,
  DialogContent as UIDialogContent,
  DialogHeader as UIDialogHeader,
  DialogTitle as UIDialogTitle,
  DialogDescription as UIDialogDescription,
  DialogFooter as UIDialogFooter,
  DialogTrigger as UIDialogTrigger,
  DialogClose as UIDialogClose,
} from "@/components/ui/dialog";
import { Toaster, toast } from "sonner";

// Custom Components

import { PropertyEditPageRoomFormModal } from "@/components/PropretyEditPageRoomFormModal";
import { FormFieldSkeleton, RoomCardSkeleton, PageHeaderSkeleton } from "@/components/ui/skeletons";

// Icons
import {
  Building, Home, MapPin, CheckIcon, ChevronDown, ChevronUp, Sparkles, Upload as UploadIcon, ArrowLeft, ImageDown, XIcon, CircleDollarSign, Trash2, Edit3, PlusCircle, BedDouble, Bath, Ruler, XCircle as XCircleIcon
} from "lucide-react";

// Schemas, Types, Constants, and API Hooks
import { PropertyFormData, propertySchema } from "@/lib/schemas";
import { processImageFiles } from '@/lib/imageUtils';
import { RoomFormData } from "@/lib/schemas"; // Use for typing
import { PropertyTypeEnum, AmenityEnum, HighlightEnum, RedirectTypeEnum, PROVINCES, UNIVERSITY_OPTIONS, getUniversityOptionsByProvince, getCampusOptionsByProvince, getCampusOptionsByUniversity } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiProperty, ApiRoom } from "@/lib/schemas"; // Use defined API types
import { useGetPropertyQuery, useUpdatePropertyMutation, useDeletePropertyMutation, useGetRoomsQuery, useDeleteRoomMutation } from "@/state/api"; // Use the re-exported hooks
import type { Property } from "@/types/property";
import { CreateFormFieldt } from "@/components/CreateFormFieldT";

// Step-based form components
import { Progress } from "@/components/ui/progress";

// FormStep component for slider form
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`${isActive ? 'block' : 'hidden'} w-full max-w-4xl mx-auto`}
    >
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => onStepClick && onStepClick(stepNumber)}
            role="button"
            tabIndex={0}
            aria-label={`Go to step ${stepNumber}: ${title}`}
          >
            <div 
              className={`p-2 rounded-full transition-colors ${isCompleted 
                ? 'text-green-500 bg-green-500/10 group-hover:bg-green-500/20' 
                : 'text-blue-500 bg-blue-500/10 group-hover:bg-blue-500/20'}`}
            >
              {isCompleted ? <CheckIcon size={20} /> : icon}
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
              {title}
            </h2>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Step {stepNumber} of {totalSteps}
          </div>
        </div>
        <Progress 
          value={(stepNumber / totalSteps) * 100} 
          className="h-1 bg-slate-100 dark:bg-slate-800" 
        />
      </div>
      <div className="space-y-6">
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
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
      <UIButton
        type="button"
        variant="outline"
        onClick={onPrev}
        disabled={currentStep === 1 || isSubmitting}
        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Previous
      </UIButton>

      {isLastStep ? (
        <UIButton
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-all duration-200 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 bg-white/30 rounded animate-pulse"></div>
              Saving Changes...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              Save Changes
            </>
          )}
        </UIButton>
      ) : (
        <UIButton
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-all duration-200"
        >
          Next
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </UIButton>
      )}
    </div>
  );
};
// FormSection component for collapsible form sections
interface FormSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  actions?: React.ReactNode;
}

function FormSection({ title, icon, children, defaultOpen = false, actions }: FormSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="mb-6 last:mb-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full text-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 transition-colors">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-4">
          {actions}
          <div className="text-slate-400 dark:text-slate-500 transition-transform duration-200 transform">
            {isOpen ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-5 border-t border-slate-200 dark:border-slate-700">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
// End FormSection

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyIdString = params?.id as string;
  const propertyIdNumber = Number(propertyIdString);

  const [isOverallPageLoading, setIsOverallPageLoading] = usePageState(true);
  
  // Step form state
  const [currentStep, setCurrentStep] = usePageState(1);
  const [completedSteps, setCompletedSteps] = usePageState<number[]>([]);
  const totalSteps = 5; // Total number of steps in the form

  // Property Photos State
  const [currentPropertyPhotos, setCurrentPropertyPhotos] = usePageState<string[]>([]);
  const [featuredPhotoIndex, setFeaturedPhotoIndex] = usePageState<number>(0);
  const [newPropertyPhotoFiles, setNewPropertyPhotoFiles] = usePageState<FileList | null>(null);
  const [propertyPhotosMarkedForDelete, setPropertyPhotosMarkedForDelete] = usePageState<string[]>([]);
  const [replacePropertyPhotosFlag, setReplacePropertyPhotosFlag] = usePageState(false);

  // Room Modal State
  const [isRoomModalOpen, setIsRoomModalOpen] = usePageState(false);
  const [editingRoomInitialData, setEditingRoomInitialData] = usePageState<Partial<RoomFormData> | null>(null);

  // RTK Query Hooks
  const { data: fetchedPropertyData, isLoading: isLoadingProperty, isError: isPropertyError, refetch: refetchProperty } = useGetPropertyQuery(propertyIdNumber, { skip: !propertyIdNumber || isNaN(propertyIdNumber) }) as { data: Property | undefined, isLoading: boolean, isError: boolean, refetch: () => void };
  const [updateProperty, { isLoading: isUpdatingProperty }] = useUpdatePropertyMutation();
  const [deleteProperty, { isLoading: isDeletingProperty }] = useDeletePropertyMutation();

  const { data: fetchedRoomsData, isLoading: isLoadingRooms, isError: isRoomsError, error: roomsError, refetch: refetchRooms } = useGetRoomsQuery(propertyIdNumber, { 
    skip: !propertyIdNumber || isNaN(propertyIdNumber)
  });

  useEffect(() => {
    if (fetchedRoomsData && !isLoadingRooms) {
      console.log("Rooms fetched successfully:", fetchedRoomsData);
    }
  }, [fetchedRoomsData, isLoadingRooms]);

  useEffect(() => {
    if (isRoomsError && roomsError) {
      console.error("Error fetching rooms:", roomsError);
      
      // Provide more detailed error information for debugging
      if ('status' in roomsError) {
        console.error("Room error status:", roomsError.status);
      }
      
      if ('data' in roomsError && roomsError.data) {
        console.error("Room error data:", roomsError.data);
        if (typeof roomsError.data === 'object' && 'message' in roomsError.data) {
          console.error("Room error message:", (roomsError.data as any).message);
        }
      } else if ('message' in roomsError) {
        console.error("Room error message:", roomsError.message);
      }
      
      // Only show user-facing error if it's not a 404 (rooms might just not exist yet)
      if ('status' in roomsError && roomsError.status !== 404) {
        console.warn("Rooms query failed with non-404 error. This might indicate a server issue.");
      }
    }
  }, [isRoomsError, roomsError]);

  const [deleteRoom, { isLoading: isDeletingRoom }] = useDeleteRoomMutation();

  const propertyForm = usePropertyForm<PropertyFormData>({
    resolver: zodPropertyResolver(propertySchema),
    defaultValues: { /* Populated in useEffect */ },
  });

  // Watch province and closestUniversity to filter dependent selects
  const watchedProvince = propertyForm.watch("province");
  const watchedClosestUniversity = propertyForm.watch("closestUniversity");
  const filteredUniversityOptions = getUniversityOptionsByProvince(watchedProvince as any);
  const filteredCampusOptions = watchedClosestUniversity
    ? getCampusOptionsByUniversity(watchedClosestUniversity as any)
    : getCampusOptionsByProvince(watchedProvince as any);

  // Coerce API string arrays to enum arrays for form types
  const coerceAmenityArray = (vals: unknown): AmenityEnum[] => {
    if (!Array.isArray(vals)) return [];
    const allowed = new Set(Object.values(AmenityEnum) as string[]);
    return ((vals as unknown[]).filter((v): v is AmenityEnum => typeof v === 'string' && allowed.has(v as string))) as AmenityEnum[];
  };

  const coerceHighlightArray = (vals: unknown): HighlightEnum[] => {
    if (!Array.isArray(vals)) return [];
    const allowed = new Set(Object.values(HighlightEnum) as string[]);
    return ((vals as unknown[]).filter((v): v is HighlightEnum => typeof v === 'string' && allowed.has(v as string))) as HighlightEnum[];
  };

  useEffect(() => {
    if (fetchedPropertyData) {
      propertyForm.reset({
        name: fetchedPropertyData.name || "",
        description: fetchedPropertyData.description || "",
        pricePerMonth: fetchedPropertyData.pricePerMonth || 0,
        securityDeposit: fetchedPropertyData.securityDeposit ?? undefined, // Use undefined for optional numbers
        isParkingIncluded: fetchedPropertyData.isParkingIncluded || false,
        isNsfassAccredited: fetchedPropertyData.isNsfassAccredited || false,
        amenities: coerceAmenityArray(fetchedPropertyData.amenities),
        highlights: coerceHighlightArray(fetchedPropertyData.highlights),
        closestUniversities: (fetchedPropertyData as any).closestUniversities || [],
        closestCampuses: (fetchedPropertyData as any).closestCampuses || [],
        closestUniversity: (fetchedPropertyData as any).closestUniversity || "",
        accreditedBy: (fetchedPropertyData as any).accreditedBy || [],
        propertyType: fetchedPropertyData.propertyType ? (fetchedPropertyData.propertyType as PropertyTypeEnum) : PropertyTypeEnum.Apartment,
        beds: fetchedPropertyData.beds || 0,
        baths: fetchedPropertyData.baths || 0,
        squareFeet: fetchedPropertyData.squareFeet ?? undefined, // Use undefined for optional numbers
        // Get location data from either the location object or create empty values
        address: fetchedPropertyData.location?.address || "",
        city: fetchedPropertyData.location?.city || "",
        state: fetchedPropertyData.location?.state || "",
        province: fetchedPropertyData.location?.state || "",
        suburb: fetchedPropertyData.location?.suburb || "",
        country: fetchedPropertyData.location?.country || "",
        postalCode: fetchedPropertyData.location?.postalCode || "",
        locationId: fetchedPropertyData.locationId,
        // Redirect settings
        redirectType: (fetchedPropertyData as any).redirectType || RedirectTypeEnum.NONE,
        whatsappNumber: (fetchedPropertyData as any).whatsappNumber || "",
        customLink: (fetchedPropertyData as any).customLink || "",
      });
      setCurrentPropertyPhotos(fetchedPropertyData.photoUrls || []);
  setFeaturedPhotoIndex(0);
      setNewPropertyPhotoFiles(null);
      setPropertyPhotosMarkedForDelete([]);
      setReplacePropertyPhotosFlag(false);
      setIsOverallPageLoading(false);
    }
  }, [fetchedPropertyData, propertyForm, setCurrentPropertyPhotos, setNewPropertyPhotoFiles, setPropertyPhotosMarkedForDelete, setReplacePropertyPhotosFlag, setIsOverallPageLoading, setFeaturedPhotoIndex]);

  useEffect(() => {
    if (isPropertyError && !isLoadingProperty) {
      toast.error("Failed to load property data. It might not exist or an error occurred.");
      router.push("/managers/properties");
    }
  }, [isPropertyError, isLoadingProperty, router]);

  const handlePropertyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPropertyPhotoFiles(e.target.files);
  };

  const togglePropertyPhotoForDelete = (url: string) => {
    setPropertyPhotosMarkedForDelete(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const onSubmitPropertyHandler = async (data: PropertyFormData) => {
    // Set loading state
    toast.loading("Updating property...");
    
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        const isArrayField = ['amenities', 'highlights', 'closestUniversities', 'closestCampuses', 'accreditedBy'].includes(key);
        if (isArrayField) {
          if (Array.isArray(value)) {
            value.forEach(v => formData.append(key, v));
          }
          return;
        }
        if (key === 'province') {
          if (value) formData.append('state', String(value));
          return; // do not send unsupported 'province' key
        }
        if (typeof value === 'boolean') {
          formData.append(key, String(value));
        } else if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else if (value !== null && value !== undefined && value !== '') {
          formData.append(key, String(value));
        } else if (['squareFeet','securityDeposit','beds','baths','kitchens','pricePerMonth'].includes(key)) {
          if (value === 0) formData.append(key, '0');
        }
    });

    let latestPhotoUrls: string[] = currentPropertyPhotos.slice();
    if (newPropertyPhotoFiles) {
      try {
        const files = Array.from(newPropertyPhotoFiles);
        const processed = await processImageFiles(files, 3 * 1024 * 1024, 15 * 1024 * 1024); // 3MB per file, 15MB total
        
        // Sequential single-file uploads with retry on 413
        const compressOnce = async (file: File): Promise<File> => {
          const MAX_TARGET = 2.5 * 1024 * 1024;
          if (file.size <= MAX_TARGET) return file;
          return new Promise<File>((resolve) => {
            const img = document.createElement('img');
            const reader = new FileReader();
            reader.onload = e => { img.onload = () => {
              const canvas = document.createElement('canvas');
              const scale = Math.min(1, Math.sqrt(MAX_TARGET / file.size));
              canvas.width = img.width * scale;
              canvas.height = img.height * scale;
              const ctx = canvas.getContext('2d');
              if (!ctx) { resolve(file); return; }
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(blob => {
                if (blob && blob.size < file.size) {
                  resolve(new File([blob], file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '.jpg'), { type: 'image/jpeg' }));
                } else resolve(file);
              }, 'image/jpeg', 0.75);
            }; img.src = e.target?.result as string; };
            reader.readAsDataURL(file);
          });
        };
        const aggressive = async (file: File): Promise<File> => {
          const TARGET = 1 * 1024 * 1024;
          if (file.size <= TARGET) return file;
          return new Promise<File>((resolve) => {
            const img = document.createElement('img');
            const reader = new FileReader();
            reader.onload = e => { img.onload = () => {
              const canvas = document.createElement('canvas');
              const scale = Math.min(1, Math.sqrt(TARGET / file.size));
              canvas.width = Math.max(320, img.width * scale);
              canvas.height = Math.max(320, img.height * scale);
              const ctx = canvas.getContext('2d');
              if (!ctx) { resolve(file); return; }
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(blob => {
                if (blob && blob.size < file.size) {
                  resolve(new File([blob], file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '.jpg'), { type: 'image/jpeg' }));
                } else resolve(file);
              }, 'image/jpeg', 0.65);
            }; img.src = e.target?.result as string; };
            reader.readAsDataURL(file);
          });
        };
        const compressed: File[] = [];
        for (const f of processed) compressed.push(await compressOnce(f));
        for (let i=0;i<compressed.length;i++) {
          let attemptFile = compressed[i];
          for (let attempt=0; attempt<2; attempt++) {
            const form = new FormData();
            form.append('photo', attemptFile);
            if (replacePropertyPhotosFlag && featuredPhotoIndex >=0 && i===0) {
              form.append('featuredImageIndex','0');
            }
            const resp = await fetch(`/api/properties/${propertyIdString}/photos`, { method:'POST', body: form });
            if (resp.ok) break;
            if (resp.status === 413 && attempt===0) { attemptFile = await aggressive(compressed[i]); continue; }
            const txt = await resp.text();
            throw new Error(`Photo ${i+1}/${compressed.length} failed: ${txt}`);
          }
        }
        // After uploads, refresh property photos from API so we include new ones in kept list
        try {
          const refreshed = await fetch(`/api/properties/${propertyIdString}`);
          if (refreshed.ok) {
            const refreshedData = await refreshed.json();
            if (Array.isArray(refreshedData.photoUrls)) {
              latestPhotoUrls = refreshedData.photoUrls;
              setCurrentPropertyPhotos(refreshedData.photoUrls);
            }
          }
        } catch (refreshErr) {
          console.warn('Failed to refresh property photos after upload; continuing with local state', refreshErr);
        }
      } catch (e:any) {
        toast.dismiss();
        toast.error(e?.message || 'Image processing failed');
        return;
      }
    }
    formData.append("replacePhotos", String(replacePropertyPhotosFlag));

    // Handle image deletion - send the list of photos to keep
    if (!replacePropertyPhotosFlag) {
      // Build kept list from latestPhotoUrls (ensures newly uploaded ones are preserved)
      const baseList = latestPhotoUrls.length ? latestPhotoUrls : currentPropertyPhotos;
      const keptPhotoUrls = baseList.filter(url => !propertyPhotosMarkedForDelete.includes(url));
      // Reorder so featured comes first
      if (keptPhotoUrls.length > 1 && featuredPhotoIndex >= 0 && featuredPhotoIndex < keptPhotoUrls.length) {
        const [featured] = keptPhotoUrls.splice(featuredPhotoIndex, 1);
        keptPhotoUrls.unshift(featured);
      }
      formData.append('finalPhotoUrlsToKeep', JSON.stringify(keptPhotoUrls));
    }

    try {
      // Debug: Log FormData contents
      console.log('=== FORM SUBMISSION DEBUG ===');
      console.log('FormData entries:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      console.log('=== END FORM DEBUG ===');
      
      // Validate FormData before sending
      console.log('FormData validation:');
      console.log('- Constructor:', formData.constructor.name);
      console.log('- Has entries:', Array.from(formData.entries()).length > 0 ? 'Yes' : 'No');
      console.log('- Entry count:', Array.from(formData.entries()).length);
      
      // Test if FormData can be iterated (basic validity check)
      let entryCount = 0;
      for (const [key, value] of formData.entries()) {
        entryCount++;
        if (entryCount >= 3) break; // Just test first few entries
      }
      console.log('- Iteration test passed, entries found:', entryCount);
      
      // Make the API call to update the property
      const result = await updateProperty({ id: propertyIdString, body: formData }).unwrap();
      toast.dismiss();
      toast.success("Property updated successfully!");
      
      // Update the UI with the new data
      await refetchProperty();
      await refetchRooms();
      
      // Reset the image states
      setNewPropertyPhotoFiles(null);
      setPropertyPhotosMarkedForDelete([]);
    } catch (error: any) {
      toast.dismiss();
      toast.error(error?.data?.message || "Failed to update property.");
      console.error('Error updating property:', error);
    }
  };

  const handleDeleteProperty = async () => {
    try {
      await deleteProperty({ id: propertyIdNumber, managerCognitoId: fetchedPropertyData?.managerCognitoId }).unwrap();
      toast.success("Property deleted successfully!");
      router.push("/managers/properties");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete property.");
    }
  };

  const openRoomModalForCreate = () => {
    setEditingRoomInitialData(null);
    setIsRoomModalOpen(true);
  };

  const openRoomModalForEdit = (roomFromApi: ApiRoom) => {
    // Derive privacy from features (e.g., "Bathroom:PRIVATE", "Kitchen:SHARED")
    const features = Array.isArray(roomFromApi.features) ? roomFromApi.features : [];
    const bathroomFeature = features.find((f: string) => f.startsWith("Bathroom:"));
    const kitchenFeature = features.find((f: string) => f.startsWith("Kitchen:"));
    const bathroomPrivacy = ((bathroomFeature?.split(":")[1] || '').toUpperCase() as 'PRIVATE' | 'SHARED') || 'SHARED';
    const kitchenPrivacy = ((kitchenFeature?.split(":")[1] || '').toUpperCase() as 'PRIVATE' | 'SHARED') || 'SHARED';

    const roomFormDataForModal: Partial<RoomFormData> = {
        id: roomFromApi.id,
        propertyId: roomFromApi.propertyId,
        name: roomFromApi.name,
        photoUrls: roomFromApi.photoUrls || [],
        pricePerMonth: roomFromApi.pricePerMonth,
        securityDeposit: roomFromApi.securityDeposit ?? undefined,
        squareFeet: roomFromApi.squareFeet ?? undefined,
        isAvailable: roomFromApi.isAvailable,
        availableFrom: roomFromApi.availableFrom ? new Date(roomFromApi.availableFrom) : null,
        roomType: roomFromApi.roomType,
        capacity: roomFromApi.capacity ?? 1,
        bathroomPrivacy,
        kitchenPrivacy,
    };
    setEditingRoomInitialData(roomFormDataForModal);
    setIsRoomModalOpen(true);
  };

  const handleDeleteRoomFromList = async (roomId: number, roomName: string) => {
      try {
          await deleteRoom({ propertyId: propertyIdNumber, roomId: roomId }).unwrap();
          toast.success(`Room "${roomName}" deleted successfully!`);
          refetchRooms();
      } catch (error: any) {
          toast.error(error?.data?.message || "Failed to delete room.");
      }
  };


  if (isOverallPageLoading || isLoadingProperty) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <PageHeaderSkeleton />
          <div className="space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                    <div className="w-32 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                  </div>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <FormFieldSkeleton key={j} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isPropertyError || !fetchedPropertyData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background dark:bg-gray-900 p-6 text-center">
        <XCircleIcon className="h-20 w-20 text-destructive mb-6" />
        <h2 className="text-2xl font-semibold text-destructive mb-3">Error Loading Property</h2>
        <p className="text-lg text-muted-foreground dark:text-gray-400 mb-8">
          The property data could not be loaded. It might have been deleted, or an unexpected error occurred.
        </p>
        <UIButton onClick={() => router.push("/managers/properties")} variant="outline" size="lg">
          <ArrowLeft className="mr-2 h-5 w-5" /> Go Back to Properties
        </UIButton>
      </div>
    );
  }

  const isAnyMutationLoading = isUpdatingProperty || isDeletingProperty || isDeletingRoom;

  return (
    <div className="min-h-screen dark:text-slate-800 text-white">
      <Toaster richColors position="top-center" />
      <div className="relative container mx-auto px-4 py-8 mb-20">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
       
        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <UIButton variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={() => router.back()}>
              <ArrowLeft size={20} />
            </UIButton>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Edit Property</h1>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1 truncate max-w-md">
                {fetchedPropertyData?.name || "Loading name..."}
              </p>
            </div>
          </div>
          <UIDialog>
            <UIDialogTrigger asChild>
              <UIButton variant="destructive" disabled={isAnyMutationLoading} className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Property
              </UIButton>
            </UIDialogTrigger>
            <UIDialogContent className="dark:bg-gray-800 dark:border-gray-700">
              <UIDialogHeader>
                <UIDialogTitle className="dark:text-gray-100">Are you absolutely sure?</UIDialogTitle>
                <UIDialogDescription className="dark:text-gray-400">
                  This action cannot be undone. This will permanently delete the property
                  and all its associated data, including rooms and photos from the database and S3.
                </UIDialogDescription>
              </UIDialogHeader>
              <UIDialogFooter className="mt-4">
                <UIDialogClose asChild><UIButton variant="outline">Cancel</UIButton></UIDialogClose>
                <UIButton variant="destructive" onClick={handleDeleteProperty} disabled={isDeletingProperty}>
                  {isDeletingProperty && <div className="mr-2 h-4 w-4 bg-white/30 rounded animate-pulse"></div>}
                  Yes, delete property
                </UIButton>
              </UIDialogFooter>
            </UIDialogContent>
          </UIDialog>
        </div>

        {/* Main Property Form */}
        <PropertyFormUI {...propertyForm}>
          <form onSubmit={propertyForm.handleSubmit(onSubmitPropertyHandler, (errors) => {
            console.error('Validation errors:', errors);
            const first = Object.values(errors)[0];
            if (first && 'message' in first) {
              toast.error((first as any).message || 'Fix validation errors before saving');
            } else {
              toast.error('Please fix the highlighted form errors.');
            }
          })} className="space-y-8">
            {/* Basic Information */}
            <FormSection title="Basic Information" icon={<Building size={20} />} defaultOpen={true}>
              <div className="space-y-6">
                <CreateFormFieldt name="name" label="Property Name" control={propertyForm.control} placeholder="e.g., The Grand Residence" />
                <CreateFormFieldt name="description" label="Description" type="textarea" control={propertyForm.control} placeholder="Detailed description of the property and its unique selling points..." inputClassName="min-h-[150px]" />
                <CreateFormFieldt name="propertyType" label="Property Type" type="select" control={propertyForm.control} options={Object.values(PropertyTypeEnum).map(type => ({ value: type, label: type }))} />
              </div>
            </FormSection>

            {/* Pricing & Fees */}
             <FormSection title="Pricing & Fees" icon={<CircleDollarSign size={20} />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5 space-y-6">
                <div className="relative ">
                  {/* Use CreateFormFieldt */}
                  <CreateFormFieldt name="pricePerMonth" label="Monthly Rent" type="number" control={propertyForm.control} min={0} inputClassName="pl-8" placeholder="0.00" />
                  <span className="absolute top-[2.3rem] left-3 text-muted-foreground font-medium dark:text-gray-400">R</span>
                </div>
                <div className="relative">
                   {/* Use CreateFormFieldt */}
                  <CreateFormFieldt name="securityDeposit" label="Security Deposit" type="number" control={propertyForm.control} min={0} inputClassName="pl-8" placeholder="0.00" />
                  <span className="absolute top-[2.3rem] left-3 text-muted-foreground font-medium dark:text-gray-400">R</span>
                </div>
                <CreateFormFieldt name="isParkingIncluded" label="Parking Included with Property" type="switch" control={propertyForm.control} />
                <CreateFormFieldt name="isNsfassAccredited" label="NSFAS Accredited Property" type="switch" control={propertyForm.control} />
              </div>
            </FormSection>

            {/* Property Features & Specs */}
            <FormSection title="Property Features & Specs" icon={<Home size={20} />}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5">
                  <CreateFormFieldt name="beds" label="Total Bedrooms" type="number" control={propertyForm.control} min={0} placeholder="e.g., 4" />
                  <CreateFormFieldt name="baths" label="Total Bathrooms" type="number" control={propertyForm.control} min={0} step={0.5} placeholder="e.g., 2.5" />
                  <CreateFormFieldt name="kitchens" label="Total Kitchens" type="number" control={propertyForm.control} min={0} placeholder="e.g., 1" />
                  <CreateFormFieldt name="squareFeet" label="Total Square Feet" type="number" control={propertyForm.control} min={0} placeholder="e.g., 2500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 items-center pt-2">
                  <CreateFormFieldt name="isNsfassAccredited" label="NSFAS Accredited" type="switch" control={propertyForm.control} />
                </div>
              </div>
            </FormSection>

            {/* Property Amenities & Highlights */}
            <FormSection title="Property Amenities & Highlights" icon={<Sparkles size={20} />}>
              <div className="space-y-6">
                <CreateFormFieldt name="amenities" label="Property-Wide Amenities" type="multi-select" control={propertyForm.control} options={Object.values(AmenityEnum).map(amenity => ({ value: amenity, label: amenity }))} description="Select all amenities that apply to the entire property."/>
                <CreateFormFieldt name="highlights" label="Key Property Highlights" type="multi-select" control={propertyForm.control} options={Object.values(HighlightEnum).map(highlight => ({ value: highlight, label: highlight }))} description="Select distinctive features or selling points."/>
              </div>
            </FormSection>

            {/* Property Photos */}
            <FormSection title="Property Photos" icon={<ImageDown size={20} />}>
                <div className="space-y-5">
                    <div>
                        <UILabel htmlFor="propertyPhotosFile" className="block text-sm font-medium text-muted-foreground dark:text-gray-400 mb-1.5">Upload New Photos</UILabel>
                        <UIInput id="propertyPhotosFile" type="file" multiple onChange={handlePropertyFileChange} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:file:bg-primary/30 dark:file:text-primary-foreground dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"/>
                        <div className="mt-3 flex items-center space-x-2">
                            <UICheckbox id="replacePropertyPhotosFlag" checked={replacePropertyPhotosFlag} onCheckedChange={(checked) => setReplacePropertyPhotosFlag(Boolean(checked))} className="dark:border-gray-600 dark:data-[state=checked]:bg-primary" />
                            <UILabel htmlFor="replacePropertyPhotosFlag" className="text-xs font-normal text-muted-foreground dark:text-gray-400">Replace all existing photos with new uploads</UILabel>
                        </div>
                         <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
                            If &quot;Replace all&quot; is unchecked, new photos will be added. To remove specific old photos without replacing all, your backend needs to support selective deletion via an update. Otherwise, only &quot;Replace all&quot; or deleting the entire property will remove old photos from S3.
                        </p>
                    </div>

                    {newPropertyPhotoFiles && Array.from(newPropertyPhotoFiles).length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground dark:text-gray-400 mb-2">New photos preview ({Array.from(newPropertyPhotoFiles).length}): Select one existing photo below to be featured. New uploads append after featured unless replacing all.</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {Array.from(newPropertyPhotoFiles).map((file, index) => {
                                  return (
                                    <div key={index} className="relative aspect-video bg-muted dark:bg-gray-700 rounded-md overflow-hidden shadow">
                                      <Image src={URL.createObjectURL(file)} alt={`New Property Preview ${index}`} layout="fill" objectFit="cover" />
                                    </div>
                                  );
                                })}
                            </div>
                        </div>
                    )}

                    {currentPropertyPhotos.length > 0 && (
                        <div className="mt-4">
                            <p className="text-sm font-medium text-muted-foreground dark:text-gray-400 mb-2">Current Photos ({currentPropertyPhotos.length}): Click &quot;Feature&quot; to set default image.</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {currentPropertyPhotos.map((url, index) => {
                                  const isFeatured = index === featuredPhotoIndex;
                                  return (
                                    <div key={url} className={`relative aspect-video bg-muted dark:bg-gray-700 rounded-md group overflow-hidden shadow ring-2 ${isFeatured ? 'ring-blue-500' : 'ring-transparent'}`}>
                                      <Image src={url} alt={`Property Photo ${index + 1}`} layout="fill" objectFit="cover" />
                                      <div className="absolute top-1 left-1 flex gap-1">
                                        <button
                                          type="button"
                                          onClick={() => setFeaturedPhotoIndex(index)}
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium backdrop-blur-sm border transition ${isFeatured ? 'bg-blue-600 text-white border-blue-400' : 'bg-black/50 text-gray-200 border-white/20 hover:bg-black/60'}`}
                                          title={isFeatured ? 'Featured image' : 'Set as featured'}
                                        >
                                          {isFeatured ? 'Featured' : 'Feature'}
                                        </button>
                                      </div>
                                      <UIButton type="button" variant="secondary" size="icon"
                                          onClick={() => togglePropertyPhotoForDelete(url)}
                                          className={`absolute top-1.5 right-1.5 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-150
                                                      ${propertyPhotosMarkedForDelete.includes(url) ? '!opacity-100 bg-green-500 hover:bg-green-600 text-white' : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'}`}>
                                          {propertyPhotosMarkedForDelete.includes(url) ? <CheckIcon size={16} /> : <Trash2 size={16} />}
                                      </UIButton>
                                      {propertyPhotosMarkedForDelete.includes(url) && <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-md"><UIBadge variant="destructive">Marked</UIBadge></div>}
                                    </div>
                                  );
                                })}
                            </div>
                            {propertyPhotosMarkedForDelete.length > 0 && !replacePropertyPhotosFlag && (
                                <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                                    ({propertyPhotosMarkedForDelete.length}) photo(s) marked. Actual removal if not &quot;Replacing all&quot; depends on backend update logic.
                                </p>
                            )}
                        </div>
                    )}
                     {currentPropertyPhotos.length === 0 && (!newPropertyPhotoFiles || Array.from(newPropertyPhotoFiles).length === 0) && (
                        <p className="text-sm text-muted-foreground dark:text-gray-400">No photos uploaded for this property yet.</p>
                     )}
                </div>
            </FormSection>

            {/* Location Information */}
            <FormSection title="Location Information" icon={<MapPin size={20} />}> 
              <div className="space-y-6">
                <CreateFormFieldt name="address" label="Street Address" control={propertyForm.control} placeholder="123 Main St, Apt 4B" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                  <CreateFormFieldt name="city" label="City" control={propertyForm.control} placeholder="e.g., Cape Town" />
                  <CreateFormFieldt name="suburb" label="Suburb" control={propertyForm.control} placeholder="e.g., Rondebosch" />
                  <CreateFormFieldt name="province" label="Province" type="select" control={propertyForm.control} options={PROVINCES.map((p) => ({ value: p, label: p }))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <CreateFormFieldt name="postalCode" label="Postal Code (Optional)" control={propertyForm.control} placeholder="e.g., 8001" />
                  <CreateFormFieldt name="country" label="Country" control={propertyForm.control} placeholder="e.g., South Africa" />
                </div>
                <p className="text-xs text-muted-foreground dark:text-gray-400">Note: Changing address details will re-geocode the location and update its coordinates on the map upon saving.</p>

                {/* Closest University */}
                <div className="space-y-1.5 w-full">
                  <UILabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Closest University</UILabel>
                  <CreateFormFieldt name="closestUniversity" label="" type="select" control={propertyForm.control} options={filteredUniversityOptions} />
                </div>

                {/* Closest campus selection (single-select, stored as array[0]) */}
                <div className="space-y-1.5 w-full">
                  <UILabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Closest Compaus</UILabel>
                  <Controller
                    name="closestCampuses"
                    control={propertyForm.control}
                    render={({ field, fieldState: { error } }) => (
                      <>
                        <Select
                          value={Array.isArray(field.value) ? (field.value[0] ?? "") : ""}
                          onValueChange={(val) => field.onChange(val ? [val] : [])}
                        >
                          <SelectTrigger className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 ${error ? 'border-destructive' : 'border-border dark:border-gray-600'}`}>
                            <SelectValue placeholder="Select campus" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            {filteredCampusOptions.map((opt) => (
                              <SelectItem key={opt.value} value={String(opt.value)} className="dark:text-gray-200 dark:focus:bg-gray-700">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground dark:text-gray-400 pt-1">Pick the single closest campus.</p>
                        {error && <p className="text-xs text-destructive pt-1">{error.message}</p>}
                      </>
                    )}
                  />
                </div>

                {/* Accredited by (multi-select) */}
                <CreateFormFieldt name="accreditedBy" label="Accredited by University" type="multi-select" control={propertyForm.control} options={filteredUniversityOptions} />

                {/* Divider for redirect settings */}
                <div className="pt-6 mt-6 border-t border-border dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <span className="bg-blue-500/20 p-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    </span>
                    After Application Redirect (Optional)
                  </h3>
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mb-4">
                    Configure where students are redirected after submitting an application. This helps you connect with applicants faster!
                  </p>
                </div>

                {/* Redirect Type */}
                <CreateFormFieldt 
                  name="redirectType" 
                  label="Redirect Type" 
                  type="select"
                  control={propertyForm.control}
                  options={[
                    { value: RedirectTypeEnum.NONE, label: "No Redirect (Default)" },
                    { value: RedirectTypeEnum.WHATSAPP, label: "WhatsApp Message" },
                    { value: RedirectTypeEnum.CUSTOM_LINK, label: "Custom Website/Link" },
                  ]}
                />

                {/* WhatsApp Number (conditional) */}
                {propertyForm.watch("redirectType") === RedirectTypeEnum.WHATSAPP && (
                  <div className="space-y-2 bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                    <CreateFormFieldt 
                      name="whatsappNumber" 
                      label="WhatsApp Number" 
                      control={propertyForm.control}
                      placeholder="27123456789 (with country code, no + or spaces)"
                    />
                    <p className="text-xs text-muted-foreground dark:text-gray-400">
                      📱 Enter your WhatsApp number with country code (e.g., 27123456789 for South Africa). 
                      Students will be redirected to WhatsApp after applying.
                    </p>
                  </div>
                )}

                {/* Custom Link (conditional) */}
                {propertyForm.watch("redirectType") === RedirectTypeEnum.CUSTOM_LINK && (
                  <div className="space-y-2 bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                    <CreateFormFieldt 
                      name="customLink" 
                      label="Custom Link/Website" 
                      control={propertyForm.control}
                      placeholder="https://your-website.com/contact"
                    />
                    <p className="text-xs text-muted-foreground dark:text-gray-400">
                      🔗 Enter the URL where students should be redirected after applying 
                      (e.g., your website, booking system, or contact form).
                    </p>
                  </div>
                )}
              </div>
            </FormSection>

            {/* Rooms Management Section */}
            <FormSection title="Manage Rooms" icon={<BedDouble size={20} />} defaultOpen={true} actions={
              <UIButton type="button" variant="outline" size="sm" onClick={openRoomModalForCreate} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Room
              </UIButton>
            }>
              {isLoadingRooms && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <RoomCardSkeleton key={i} />
                  ))}
                </div>
              )}
              {!isLoadingRooms && (!fetchedRoomsData || fetchedRoomsData.length === 0) && (
                <p className="text-center text-muted-foreground dark:text-gray-400 py-6">No rooms have been added to this property yet. Click &quot;Add New Room&quot; to get started.</p>
              )}
              {fetchedRoomsData && fetchedRoomsData.length > 0 && (
                <div className="space-y-4">
                  {(fetchedRoomsData as ApiRoom[]).map((room) => (
                    <div key={room.id} className="p-4 border dark:border-gray-700 rounded-lg bg-muted/30 dark:bg-gray-700/30 hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="flex-grow">
                        <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{room.name} <UIBadge variant={room.isAvailable ? "default" : "secondary"} className={`ml-2 ${room.isAvailable ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300'}`}>{room.isAvailable ? "Available" : "Unavailable"}</UIBadge></h4>
                        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-0.5">
                          Type: {room.roomType} | Capacity: {room.capacity || 'N/A'} | R{room.pricePerMonth}/month
                        </p>
                        {room.photoUrls && room.photoUrls.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {room.photoUrls.slice(0, 4).map(url => (
                                    <Image key={url} src={url} alt={`${room.name} photo`} width={40} height={40} className="rounded object-cover h-10 w-10 border dark:border-gray-600"/>
                                ))}
                                {room.photoUrls.length > 4 && <div className="h-10 w-10 rounded bg-slate-200 dark:bg-gray-600 flex items-center justify-center text-xs text-slate-600 dark:text-gray-300 border dark:border-gray-500">+{room.photoUrls.length - 4}</div>}
                            </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0 mt-2 sm:mt-0">
                        <UIButton type="button" variant="outline" size="sm" onClick={() => openRoomModalForEdit(room)} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                          <Edit3 size={16} className="mr-1.5" /> Edit
                        </UIButton>
                         <UIDialog>
                            <UIDialogTrigger asChild>
                               <UIButton type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-red-700/20"><Trash2 size={16} className="mr-1.5" /> Delete</UIButton>
                            </UIDialogTrigger>
                            <UIDialogContent className="dark:bg-gray-800 dark:border-gray-700">
                                <UIDialogHeader><UIDialogTitle className="dark:text-gray-100">Delete Room: &quot;{room.name}&quot;?</UIDialogTitle></UIDialogHeader>
                                <UIDialogDescription className="dark:text-gray-400">This will permanently delete this room and all its photos from S3. This action cannot be undone.</UIDialogDescription>
                                <UIDialogFooter className="mt-4">
                                    <UIDialogClose asChild><UIButton variant="outline">Cancel</UIButton></UIDialogClose>
                                    <UIButton variant="destructive" onClick={() => handleDeleteRoomFromList(room.id, room.name)} disabled={isDeletingRoom}>
                                        {isDeletingRoom && <div className="mr-2 h-4 w-4 bg-white/30 rounded animate-pulse"></div>} Delete Room
                                    </UIButton>
                                </UIDialogFooter>
                            </UIDialogContent>
                        </UIDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FormSection>

            {/* Sticky Submit Footer */}
            <div className="sticky bottom-0">
              <div className="max-w-6xl mx-auto flex justify-end px-4">
                <UIButton 
                  type="submit" 
                  size="lg" 
                  className="min-w-[200px] text-base mt-5 bg-blue-600 backdrop-blur-sm border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm hover:shadow-md transition-all duration-300 font-medium rounded-lg" 
                  disabled={isAnyMutationLoading}
                >
                  {isUpdatingProperty && <div className="mr-2 h-5 w-5 bg-white/30 rounded animate-pulse"></div>}
                  Save All Property Changes
                </UIButton>
              </div>
            </div>
          </form>
        </PropertyFormUI>

        {/* Room Modal */}
        <PropertyEditPageRoomFormModal
          isOpen={isRoomModalOpen}
          onClose={() => { setIsRoomModalOpen(false); setEditingRoomInitialData(null); }}
          propertyId={propertyIdString} // Pass string ID to modal
          initialRoomData={editingRoomInitialData}
          onSaveSuccess={(savedRoomData) => { // Expect the actual saved room data object
            refetchRooms(); // Refetch the list of rooms after save
            // The toast is now handled within the modal's submit handler
            // toast.success(`Room "${savedRoomData.name}" ${editingRoomInitialData?.id ? 'updated' : 'created'} successfully!`);
          }}
        />
      </div>
    </div>
  );
}
// --- END FILE: app/managers/properties/edit/[id]/page.tsx ---