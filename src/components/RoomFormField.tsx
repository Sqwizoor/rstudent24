"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"

// Components
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { CreateFormField } from "@/components/CreateFormField"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Icons
import { Bed, Upload, X, Trash2, CircleDollarSign, SquareUser, Home } from "lucide-react"
import { RedirectTypeEnum } from "@/lib/constants"

// Room schema
export const roomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  pricePerMonth: z.number().min(0, "Price must be a positive number"),
  securityDeposit: z.number().min(0, "Security deposit must be a positive number"),
  topUp: z.number().min(0, "Top up must be a positive number").default(0),
  squareFeet: z.number().min(0, "Square feet must be a positive number").optional(),
  isAvailable: z.boolean().default(true),
  availableFrom: z.date().optional().nullable(),
  roomType: z.enum(["PRIVATE", "SHARED"]).default("PRIVATE"),
  capacity: z.number().min(1, "Capacity must be at least 1").default(1),
  bathroomPrivacy: z.enum(["PRIVATE", "SHARED"]).default("SHARED"),
  kitchenPrivacy: z.enum(["PRIVATE", "SHARED"]).default("SHARED"),
  photoUrls: z.any().optional(),
  
  // Redirect settings for applications
  redirectType: z.enum(["NONE", "WHATSAPP", "CUSTOM_LINK", "BOTH"]).optional(),
  whatsappNumber: z.string().optional(),
  customLink: z.string().optional(),
})

export type RoomFormData = z.infer<typeof roomSchema>

// Removed legacy amenities/features for simplified room form

interface RoomFormProps {
  onAddRoom: (room: RoomFormData) => void
  onCancel: () => void
}

export const RoomForm = ({ onAddRoom, onCancel }: RoomFormProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: "",
      pricePerMonth: 0,
      securityDeposit: 0,
      topUp: 0,
      capacity: 1,
      isAvailable: true,
      roomType: "PRIVATE",
      bathroomPrivacy: "SHARED",
      kitchenPrivacy: "SHARED",
      redirectType: RedirectTypeEnum.NONE,
      whatsappNumber: "",
      customLink: "",
    },
  })

  // Handle file selection to show preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const files = Array.from(e.target.files)
      setUploadedFiles(files)
    }
  }

  // Removed amenities/features handlers in simplified form

  const handleAddRoom = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const data = form.getValues()
    const roomData = {
      ...data,
      photoUrls: uploadedFiles,
    }

    onAddRoom(roomData)
    form.reset()
    setUploadedFiles([])
  }

  // Style for form field labels
  const labelStyle = "text-sm font-medium text-slate-700 dark:text-gray-200"

  // Style for form field inputs
  const inputStyle = "bg-white text-slate-900 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-md dark:bg-[#0B1120] dark:text-white dark:border-[#1E2A45] dark:focus:border-[#4F9CF9] dark:focus:ring-[#4F9CF9]"

  return (
    <Card className="bg-white border border-slate-200 shadow-sm dark:bg-[#0B1120]/90 dark:border-[#1E2A45] dark:shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-slate-900 dark:text-white flex items-center gap-2">
          <Bed className="h-5 w-5 text-[#4F9CF9]" />
          Add New Room
        </CardTitle>
      </CardHeader>
  <CardContent>
        <Form {...form}>
          <div className="space-y-4">
            {/* Basic Room Information */}
            <div className="space-y-4">
              <CreateFormField
                name="name"
                label="Room Name"
                labelClassName={labelStyle}
                inputClassName={inputStyle}
                placeholder="Master Bedroom"
              />


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <CreateFormField
                    name="pricePerMonth"
                    label="Monthly Rent"
                    type="number"
                    labelClassName={labelStyle}
                    inputClassName={`${inputStyle} pl-7`}
                    min={0}
                  />
                  <span className="absolute top-9 left-3 text-slate-500 dark:text-gray-400">R</span>
                </div>

                <div className="relative">
                  <CreateFormField
                    name="securityDeposit"
                    label="Security Deposit"
                    type="number"
                    labelClassName={labelStyle}
                    inputClassName={`${inputStyle} pl-7`}
                    min={0}
                  />
                  <span className="absolute top-9 left-3 text-slate-500 dark:text-gray-400">R</span>
                </div>
                <div className="relative">
                  <CreateFormField
                    name="topUp"
                    label="Top-up"
                    type="number"
                    labelClassName={labelStyle}
                    inputClassName={`${inputStyle} pl-7`}
                    min={0}
                  />
                  <span className="absolute top-9 left-3 text-slate-500 dark:text-gray-400">R</span>
                </div>
              </div>
            </div>

            {/* Room Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <CreateFormField
                  name="roomType"
                  label="Room Type"
                  type="select"
                  options={[
                    { value: "PRIVATE", label: "Private" },
                    { value: "SHARED", label: "Shared" },
                  ]}
                  labelClassName={labelStyle}
                  inputClassName={inputStyle}
                />
                <CreateFormField
                  name="bathroomPrivacy"
                  label="Bathroom"
                  type="select"
                  options={[
                    { value: "PRIVATE", label: "Private" },
                    { value: "SHARED", label: "Shared" },
                  ]}
                  labelClassName={labelStyle}
                  inputClassName={inputStyle}
                />
                <CreateFormField
                  name="kitchenPrivacy"
                  label="Kitchen"
                  type="select"
                  options={[
                    { value: "PRIVATE", label: "Private" },
                    { value: "SHARED", label: "Shared" },
                  ]}
                  labelClassName={labelStyle}
                  inputClassName={inputStyle}
                />
                <CreateFormField
                  name="isAvailable"
                  label="Available"
                  type="switch"
                  labelClassName={labelStyle}
                />
              </div>

              <CreateFormField
                name="availableFrom"
                label="Available From"
                type="date"
                labelClassName={labelStyle}
                inputClassName={inputStyle}
              />
            </div>

            {/* Amenities and Features removed for simplified room form */}

            {/* Room Photos */}
            <div>
              <label className={labelStyle}>Room Photos</label>
              <div className="mt-2">
                <label
                  htmlFor="roomPhotos"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 border-slate-300 transition-colors dark:border-[#1E2A45] dark:bg-[#0B1120]/50 dark:hover:bg-[#0B1120]"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-blue-600 dark:text-[#4F9CF9]" />
                    <p className="mb-2 text-sm text-slate-600 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-500 dark:text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                  <input
                    id="roomPhotos"
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* File preview */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-slate-600 dark:text-gray-400 mb-2">Selected files ({uploadedFiles.length}):</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="relative bg-slate-100 rounded-md p-1 h-20 flex items-center justify-center overflow-hidden dark:bg-[#0B1120]"
                      >
                        <Image
                          src={URL.createObjectURL(file) || "/placeholder.svg"}
                          alt={`Preview ${index}`}
                          width={300}
                          height={200}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-[#1E2A45] dark:text-gray-300 dark:hover:bg-[#1E2A45]/50"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddRoom}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-gradient-to-r dark:from-[#0070F3] dark:to-[#4F9CF9] dark:hover:from-[#0060D3] dark:hover:to-[#3F8CE9]"
              >
                Add Room
              </Button>
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  )
}

// Component to display a list of rooms
interface RoomListProps {
  rooms: RoomFormData[]
  onRemoveRoom: (index: number) => void
}

export const RoomList = ({ rooms, onRemoveRoom }: RoomListProps) => {
  if (rooms.length === 0) return null

  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-medium text-white">Added Rooms ({rooms.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map((room, index) => (
          <Card key={index} className="bg-[#0B1120]/60 border border-[#1E2A45] hover:border-[#4F9CF9] transition-colors">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Bed className="h-5 w-5 text-[#4F9CF9]" />
                  <h4 className="text-lg font-medium text-white">{room.name}</h4>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveRoom(index)}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Description removed in simplified view */}

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300">R{room.pricePerMonth}/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Top-up: R{(room as any).topUp ?? 0}</span>
                </div>
                {room.squareFeet && (
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{room.squareFeet} sq ft</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <SquareUser className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Capacity: {room.capacity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300">{room.roomType}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Bathroom:</span>
                  <span className="text-sm text-gray-300">{room.bathroomPrivacy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Kitchen:</span>
                  <span className="text-sm text-gray-300">{room.kitchenPrivacy}</span>
                </div>
              </div>

              {/* Room Photos Preview */}
              {room.photoUrls && room.photoUrls.length > 0 && (
                <div className="mt-3">
                  <div className="grid grid-cols-3 gap-2">
                    {(room.photoUrls as (File | string)[]).map((photo, photoIndex) => (
                      <div
                        key={photoIndex}
                        className="relative aspect-square bg-[#0B1120] rounded-md overflow-hidden border border-[#1E2A45]"
                      >
                        <Image
                          src={typeof photo === 'string' ? photo : URL.createObjectURL(photo)}
                          alt={`Room photo ${photoIndex + 1}`}
                          fill
                          className="object-cover"
                          unoptimized={typeof photo === 'string'}
                          onError={(e) => {
                            console.error('Error loading image:', e);
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-image.png'; // Fallback image
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities and Features removed in simplified view */}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
