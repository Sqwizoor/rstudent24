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
  const labelStyle = "text-xs font-medium text-zinc-300"

  // Style for form field inputs
  const inputStyle = "bg-zinc-900/80 text-zinc-100 placeholder:text-zinc-500 border border-zinc-800 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 rounded-xl text-xs sm:text-sm"

  return (
    <Card className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl shadow-xl backdrop-blur-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
          <Bed className="h-4 w-4 text-zinc-300" />
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
                  <span className="absolute top-8.5 left-3 text-zinc-500 text-xs">R</span>
                </div>

                <CreateFormField
                  name="squareFeet"
                  label="Square Feet (Optional)"
                  type="number"
                  labelClassName={labelStyle}
                  inputClassName={inputStyle}
                  min={0}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CreateFormField
                  name="roomType"
                  label="Room Type"
                  type="select"
                  options={[
                    { value: "PRIVATE", label: "Private Room" },
                    { value: "SHARED", label: "Shared Room" },
                  ]}
                  labelClassName={labelStyle}
                  inputClassName={inputStyle}
                />

                <CreateFormField
                  name="capacity"
                  label="Capacity"
                  type="number"
                  labelClassName={labelStyle}
                  inputClassName={inputStyle}
                  min={1}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CreateFormField
                  name="bathroomPrivacy"
                  label="Bathroom"
                  type="select"
                  options={[
                    { value: "PRIVATE", label: "Private Bathroom" },
                    { value: "SHARED", label: "Shared Bathroom" },
                  ]}
                  labelClassName={labelStyle}
                  inputClassName={inputStyle}
                />

                <CreateFormField
                  name="kitchenPrivacy"
                  label="Kitchen"
                  type="select"
                  options={[
                    { value: "PRIVATE", label: "Private Kitchen" },
                    { value: "SHARED", label: "Shared Kitchen" },
                  ]}
                  labelClassName={labelStyle}
                  inputClassName={inputStyle}
                />
              </div>
            </div>

            {/* Room Photos */}
            <div className="space-y-2">
              <label className={labelStyle}>Room Photos</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer bg-zinc-900/40 hover:bg-zinc-900/70 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-6 h-6 mb-2 text-zinc-400" />
                    <p className="mb-1 text-xs text-zinc-300">
                      <span className="font-semibold text-white">Click to upload photos</span>
                    </p>
                    <p className="text-[10px] text-zinc-500">PNG, JPG, WEBP up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* Photo Previews */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-zinc-400 mb-2">Selected room photos ({uploadedFiles.length}):</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="relative bg-zinc-900 rounded-lg p-1 h-20 flex items-center justify-center overflow-hidden border border-zinc-800"
                      >
                        <Image
                          src={URL.createObjectURL(file) || "/placeholder.svg"}
                          alt={`Preview ${index}`}
                          width={300}
                          height={200}
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs px-3.5 py-1.5"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddRoom}
                className="rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold px-4 py-1.5 shadow-md active:scale-95 transition-all"
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
    <div className="space-y-3 mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-zinc-300">Added Rooms ({rooms.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {rooms.map((room, index) => (
          <Card key={index} className="bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 rounded-xl transition-colors shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-zinc-300" />
                  <h4 className="text-sm font-semibold text-white">{room.name}</h4>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveRoom(index)}
                  className="text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 h-7 w-7 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 text-xs">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <CircleDollarSign className="h-3.5 w-3.5 text-zinc-500" />
                  <span>R{room.pricePerMonth}/mo</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <CircleDollarSign className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Top-up: R{(room as any).topUp ?? 0}</span>
                </div>
                {room.squareFeet && (
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <Home className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{room.squareFeet} m²</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <SquareUser className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Cap: {room.capacity}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Bed className="h-3.5 w-3.5 text-zinc-500" />
                  <span>{room.roomType}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[11px] border-t border-zinc-800/60 pt-2 text-zinc-400">
                <div>Bath: <span className="text-zinc-200">{room.bathroomPrivacy}</span></div>
                <div>Kitchen: <span className="text-zinc-200">{room.kitchenPrivacy}</span></div>
              </div>

              {/* Room Photos Preview */}
              {room.photoUrls && room.photoUrls.length > 0 && (
                <div className="mt-3">
                  <div className="grid grid-cols-3 gap-1.5">
                    {(room.photoUrls as (File | string)[]).map((photo, photoIndex) => (
                      <div
                        key={photoIndex}
                        className="relative aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800"
                      >
                        <Image
                          src={typeof photo === 'string' ? photo : URL.createObjectURL(photo)}
                          alt={`Room photo ${photoIndex + 1}`}
                          fill
                          className="object-cover"
                          unoptimized={typeof photo === 'string'}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-image.png';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
