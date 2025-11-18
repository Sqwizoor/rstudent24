// --- BEGIN FILE: @/components/PropertyEditPageRoomFormModal.tsx ---
import React, { useEffect, useState as useStateModal } from 'react';
import { useForm as useFormModal, Controller as ControllerModal } from 'react-hook-form';
import { zodResolver as zodResolverModal } from '@hookform/resolvers/zod';
import {
  Dialog as UIDialog,
  DialogContent as UIDialogContent,
  DialogHeader as UIDialogHeader,
  DialogTitle as UIDialogTitle,
  DialogDescription as UIDialogDescription,
  DialogFooter as UIDialogFooter,
  DialogClose as UIDialogClose,
} from '@/components/ui/dialog'
import { Button as UIButton } from '@/components/ui/button';
import { Input as UIInput } from '@/components/ui/input';
import { Checkbox as UICheckbox } from '@/components/ui/checkbox';
import { Switch as UISwitch } from '@/components/ui/switch';
import { Label as UILabel } from '@/components/ui/label';
import { Badge as UIBadge } from '@/components/ui/badge';
import Image from 'next/image'; // Use NextImage

import { RoomFormData as ModalRoomFormDataBase, roomSchema as modalRoomSchema } from '@/lib/schemas';

// Extend the form data type to include optional id for editing
type ModalRoomFormData = ModalRoomFormDataBase & { id?: number };
import { RoomTypeEnum as ModalRoomTypeEnum, RedirectTypeEnum } from '@/lib/constants';
import { CreateFormField as ModalCreateFormField } from '@/components/CreateFormField';
import { cn } from '@/lib/utils';
import { DatePickerDemo as UIDatePicker } from '@/components/ui/date-picker';
import { useCreateRoomMutation as useCreateRoomHook, useUpdateRoomMutation as useUpdateRoomHook } from '@/state/api'; // Use actual hooks

import { Trash2 as ModalTrash, CheckIcon as ModalCheck } from 'lucide-react';
import { processImageFiles } from '@/lib/imageUtils';
import { toast as modalToast } from 'sonner'; // Use toast from sonner
import { Form } from './ui/form';

interface RoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string; // Property ID (as string from URL)
  initialRoomData: Partial<ModalRoomFormData> | null;
  onSaveSuccess: (savedRoom: any) => void;
}

// Custom styles for dropdown items to ensure text is white
const dropdownItemStyles = "text-white hover:bg-gray-700/70 focus:bg-gray-700/70 focus:text-white";
const inputStyles = "text-white bg-gray-800 border-gray-700 focus:border-primary";
const labelStyles = "text-white font-medium";
const checkboxLabelStyles = "text-white font-normal";
const selectBoxStyles = "text-white bg-gray-800 border-gray-700 focus:border-primary";
const multiSelectStyles = "text-white bg-gray-800 border-gray-700 focus:border-primary";
const multiSelectItemStyles = "text-white hover:bg-gray-700 focus:bg-gray-700";
const multiSelectItemSelectedStyles = "bg-blue-600 text-white hover:bg-blue-700";


export function PropertyEditPageRoomFormModal({
  isOpen,
  onClose,
  propertyId,
  initialRoomData,
  onSaveSuccess,
}: RoomFormModalProps) {
  const {
    control: roomControl,
    handleSubmit: handleRoomSubmit,
    reset: resetRoomForm,
    watch: watchRoomForm,
    setValue: setRoomFormValue,
  } = useFormModal<ModalRoomFormData>({
    resolver: zodResolverModal(modalRoomSchema),
    // Default values are set in useEffect based on initialRoomData
  });

  const [createRoom, { isLoading: isCreatingRoom }] = useCreateRoomHook();
  const [updateRoom, { isLoading: isUpdatingRoom }] = useUpdateRoomHook();

  const [currentPhotosInModal, setCurrentPhotosInModal] = useStateModal<string[]>([]);
  const [newPhotoFilesModal, setNewPhotoFilesModal] = useStateModal<FileList | null>(null);
  const [photosToDeleteModal, setPhotosToDeleteModal] = useStateModal<string[]>([]);
  const [replacePhotosFlagModal, setReplacePhotosFlagModal] = useStateModal(false);

  useEffect(() => {
    if (isOpen) {
      const defaults = {
        propertyId: typeof propertyId === "string" ? Number(propertyId) : propertyId,
        name: "", pricePerMonth: 0, securityDeposit: 0, topUp: 0, squareFeet: undefined,
  isAvailable: true, availableFrom: null, roomType: ModalRoomTypeEnum.PRIVATE, capacity: 1,
  bathroomPrivacy: 'SHARED' as const, kitchenPrivacy: 'SHARED' as const, photoUrls: [], newPhotos: null, photosToDelete: [], replacePhotos: false,
        redirectType: RedirectTypeEnum.NONE, whatsappNumber: "", customLink: "",
        ...initialRoomData, // Apply initial data for editing
      };
      // Ensure date is a Date object if present
      if (initialRoomData?.availableFrom) {
        defaults.availableFrom = new Date(initialRoomData.availableFrom);
      } else {
        defaults.availableFrom = null;
      }
      resetRoomForm(defaults);
      setCurrentPhotosInModal(initialRoomData?.photoUrls || []);
      setNewPhotoFilesModal(null);
      setPhotosToDeleteModal([]);
      setReplacePhotosFlagModal(false);
    }
  }, [isOpen, initialRoomData, propertyId, resetRoomForm, setCurrentPhotosInModal, setNewPhotoFilesModal, setPhotosToDeleteModal, setReplacePhotosFlagModal]);

  const handleFileChangeModal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Check file sizes - reduce limit to 2MB per file for better stability
      const maxSize = 2 * 1024 * 1024; // 2MB limit
      const oversizedFiles = Array.from(files).filter(file => file.size > maxSize);
      
      if (oversizedFiles.length > 0) {
        modalToast.error(`Some files are too large (max 2MB each): ${oversizedFiles.map(f => f.name).join(', ')}`);
        // Filter out oversized files
        const validFiles = Array.from(files).filter(file => file.size <= maxSize);
        if (validFiles.length > 0) {
          // Create a new FileList with only valid files
          const dt = new DataTransfer();
          validFiles.forEach(file => dt.items.add(file));
          setNewPhotoFilesModal(dt.files);
        } else {
          setNewPhotoFilesModal(null);
        }
      } else {
        // Also limit total number of files to 3 to reduce payload size
        const filesToAdd = Array.from(files).slice(0, 3);
        if (filesToAdd.length < files.length) {
          modalToast.warning(`Only the first 3 files will be uploaded. Total limit: 3 photos per room.`);
        }
        
        const dt = new DataTransfer();
        filesToAdd.forEach(file => dt.items.add(file));
        setNewPhotoFilesModal(dt.files);
      }
    } else {
      setNewPhotoFilesModal(null);
    }
  };

  const togglePhotoForDeleteModal = (url: string) => {
    setPhotosToDeleteModal(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const onRoomFormSubmit = async (data: ModalRoomFormData) => {
    const formData = new FormData();
    // Ensure propertyId is a single value
    formData.append("propertyId", String(propertyId));

    Object.entries(data).forEach(([key, value]) => {
        // Skip frontend-only or handled-separately fields
    if (['id', 'photoUrls', 'newPhotos', 'photosToDelete', 'replacePhotos', 'propertyId'].includes(key)) return;

    if (key === 'amenities' || key === 'features') {
      return; // removed in simplified form
        } else if (key === 'availableFrom' && value instanceof Date) {
            formData.append(key, value.toISOString());
        } else if (typeof value === 'boolean') {
            formData.append(key, String(value));
        } else if (value !== null && value !== undefined && value !== '') {
            formData.append(key, String(value));
        }
    });

    if (newPhotoFilesModal) {
      try {
        // Process and compress images before uploading
        const filesToProcess = Array.from(newPhotoFilesModal);
        const processedImages = await processImageFiles(
          filesToProcess,
          2 * 1024 * 1024, // 2MB per file
          8 * 1024 * 1024  // 8MB total
        );
        
        console.log(`Processed ${processedImages.length} images for room modal`);
        processedImages.forEach(file => formData.append("photos", file));
      } catch (imageError) {
        console.error('Error processing images:', imageError);
        modalToast.error(`Image processing failed: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
        return;
      }
    }
    formData.append("replacePhotos", String(replacePhotosFlagModal));

    // Handle selective deletion/keeping photos for UPDATE
    if (initialRoomData?.id && !replacePhotosFlagModal) {
        const finalPhotoUrlsToKeep = currentPhotosInModal.filter(url => !photosToDeleteModal.includes(url));
        formData.append('finalPhotoUrlsToKeep', JSON.stringify(finalPhotoUrlsToKeep));
    }

    try {
      let savedRoomResponse;
      if (initialRoomData?.id) {
        // For updates, include both the room ID and property ID
        savedRoomResponse = await updateRoom({ 
          propertyId: Number(propertyId),
          roomId: Number(initialRoomData.id), 
          data: formData 
        }).unwrap();
        modalToast.success(`Room "${data.name}" updated!`);
      } else {
        savedRoomResponse = await createRoom({ 
          propertyId: Number(propertyId), 
          body: formData 
        }).unwrap();
        modalToast.success(`Room "${data.name}" created!`);
      }
      onSaveSuccess(savedRoomResponse);
      onClose();
    } catch (error: any) {
      console.error("Failed to save room:", error);
      modalToast.error(error?.data?.message || "Failed to save room.");
    }
  };

  const isLoadingAction = isCreatingRoom || isUpdatingRoom;

  return (
    <UIDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <UIDialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto p-6 bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700">
        <UIDialogHeader>
          <UIDialogTitle className="text-slate-900 dark:text-gray-100">{initialRoomData?.id ? "Edit Room" : "Add New Room"}</UIDialogTitle>
          {initialRoomData?.id && <UIDialogDescription className="text-slate-600 dark:text-gray-400">Modifying: {initialRoomData.name}</UIDialogDescription>}
        </UIDialogHeader>
        {/* Provide the correct type for the Form component */}
        <Form {...({ control: roomControl, handleSubmit: handleRoomSubmit, reset: resetRoomForm, watch: watchRoomForm, setValue: setRoomFormValue } as any)}>
          <form onSubmit={handleRoomSubmit(onRoomFormSubmit)} className="space-y-4 text-slate-900 dark:text-white mt-4">
            <ModalCreateFormField name="name" label="Room Name / Number" placeholder="e.g., Master Bedroom, Unit A-102" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-900 dark:text-white">
              <ModalCreateFormField name="pricePerMonth" label="Price / Month (R)" type="number" min={1} placeholder="e.g., 4500" />
              <ModalCreateFormField name="securityDeposit" label="Security Deposit (R)" type="number" min={0} placeholder="e.g., 2000" />
              <ModalCreateFormField name="topUp" label="Top-up (R)" type="number" min={0} placeholder="e.g., 0" />
              <ModalCreateFormField name="capacity" label="Capacity (Persons)" type="number" min={1} placeholder="e.g., 2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-slate-900 dark:text-white items-end">
              <ModalCreateFormField name="roomType" label="Room Type" type="select" options={Object.values(ModalRoomTypeEnum).map(rt => ({ value: rt, label: rt }))} />
              <ModalCreateFormField name="bathroomPrivacy" label="Bathroom" type="select" options={[{ value: 'PRIVATE', label: 'Private' }, { value: 'SHARED', label: 'Shared' }]} />
              <ModalCreateFormField name="kitchenPrivacy" label="Kitchen" type="select" options={[{ value: 'PRIVATE', label: 'Private' }, { value: 'SHARED', label: 'Shared' }]} />
              <div className="space-y-2">
                <UILabel className="text-sm font-medium text-slate-800 dark:text-white">Availability</UILabel>
                <ControllerModal
                  control={roomControl}
                  name="isAvailable"
                  render={({ field }) => (
                    <div className="flex items-center gap-3 pt-2">
                      <UISwitch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                      <span className="text-xs text-slate-600 dark:text-gray-300">{field.value ? 'Available' : 'Unavailable'}</span>
                    </div>
                  )}
                />
              </div>
            </div>
            <div className="space-y-2">
              <UILabel className="text-sm font-medium text-slate-800 dark:text-white">Available From (Optional)</UILabel>
              <ControllerModal
                control={roomControl}
                name="availableFrom"
                render={({ field }) => (
                  <UIDatePicker value={field.value instanceof Date ? field.value : (field.value ? new Date(field.value as any) : null)} onSelect={(date) => field.onChange(date)} />
                )}
              />
              <p className="text-[10px] text-slate-500 dark:text-gray-400">Leave empty if immediately available.</p>
            </div>
            {/* Amenities and Features removed for simplified room form */}

            {/* Photo Management for Room */}
      <div className="space-y-3 border-t border-slate-200 dark:border-gray-700 pt-4 mt-4">
        <UILabel className="text-base font-semibold text-slate-900 dark:text-gray-100">Room Photos</UILabel>
                <div>
          <UILabel htmlFor={`roomPhotosFile-${initialRoomData?.id || 'new'}`} className="text-sm font-medium text-slate-900 dark:text-white">Upload New Photos</UILabel>
          <UIInput id={`roomPhotosFile-${initialRoomData?.id || 'new'}`} type="file" multiple onChange={handleFileChangeModal} className="mt-1 bg-white border-slate-300 text-slate-900 file:text-primary dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:file:text-primary-foreground"/>
                    <div className="mt-2 flex items-center space-x-2">
            <UICheckbox id={`replaceRoomPhotos-${initialRoomData?.id || 'new'}`} checked={replacePhotosFlagModal} onCheckedChange={(checked) => setReplacePhotosFlagModal(Boolean(checked))} className="border-slate-300 data-[state=checked]:bg-primary dark:border-gray-600 dark:data-[state=checked]:bg-primary" />
            <UILabel htmlFor={`replaceRoomPhotos-${initialRoomData?.id || 'new'}`} className="text-xs font-normal text-slate-700 dark:text-white">Replace all existing photos for this room</UILabel>
                    </div>
                </div>

                {newPhotoFilesModal && Array.from(newPhotoFilesModal).length > 0 && (
                    <div>
            <p className="text-xs text-slate-700 dark:text-white mb-1">New photos preview:</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {Array.from(newPhotoFilesModal).map((file, index) => (
                <div key={index} className="relative aspect-square w-20 h-20 bg-slate-100 dark:bg-gray-700 rounded-md overflow-hidden">
                                    <Image src={URL.createObjectURL(file)} alt={`New room photo ${index}`} layout="fill" objectFit="cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {currentPhotosInModal.length > 0 && (
                    <div className="mt-2">
            <p className="text-xs text-slate-700 dark:text-white mb-1">Current photos ({currentPhotosInModal.length}):</p>
                        <div className="grid grid-cols-2 gap-4">
                            {currentPhotosInModal.map((url) => (
                                <div key={url} className="relative group aspect-square w-20 h-20">
                  <Image src={url} alt="Current room photo" layout="fill" objectFit="cover" className="rounded-md border border-slate-200 dark:border-gray-600" />
                                    <UIButton type="button" variant="destructive" size="icon"
                                        onClick={() => togglePhotoForDeleteModal(url)}
                    className={`absolute top-0.5 right-0.5 h-5 w-5 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity
                          ${photosToDeleteModal.includes(url) ? '!opacity-100 bg-green-500 hover:bg-green-600' : 'bg-red-600 hover:bg-red-700'}`}>
                                        {photosToDeleteModal.includes(url) ? <ModalCheck size={12} /> : <ModalTrash size={12} />}
                                    </UIButton>
                                </div>
                            ))}
                        </div>
             {photosToDeleteModal.length > 0 && !replacePhotosFlagModal && (
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                                ({photosToDeleteModal.length}) photo(s) marked for deletion. Actual deletion depends on backend logic if not replacing all.
                            </p>
                        )}
                    </div>
                )}
            </div>


            <UIDialogFooter className="pt-8">
              <UIButton type="button" variant="outline" onClick={onClose} disabled={isLoadingAction} className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white">
                Cancel
              </UIButton>
              <UIButton type="submit" disabled={isLoadingAction} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                {isLoadingAction && <div className="mr-2 h-4 w-4 bg-white/30 rounded animate-pulse" />}
                {initialRoomData?.id ? "Save Room Changes" : "Create Room"}
              </UIButton>
            </UIDialogFooter>
          </form>
        </Form>
      </UIDialogContent>
    </UIDialog>
  );
}
// --- END FILE: @/components/PropertyEditPageRoomFormModal.tsx ---