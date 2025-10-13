"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { RoomForm, RoomList, type RoomFormData } from "@/components/RoomFormField"
import { Bed, ChevronDown, ChevronUp, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface RoomsSectionProps {
  rooms: RoomFormData[]
  onAddRoom: (room: RoomFormData) => void
  onRemoveRoom: (index: number) => void
}

export const RoomsSection = ({ rooms, onAddRoom, onRemoveRoom }: RoomsSectionProps) => {
  const [isOpen, setIsOpen] = useState(true) // Default to open
  const [showForm, setShowForm] = useState(false)

  const handleAddRoom = (room: RoomFormData) => {
    onAddRoom(room)
    setShowForm(false)
  }

  const handleCancel = () => {
    setShowForm(false)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6 shadow-sm dark:bg-[#0B1120]/80 dark:border-[#1E2A45] dark:shadow-lg">
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg text-blue-600 dark:bg-[#1E2A45] dark:text-[#4F9CF9]">
            <Bed size={20} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Rooms</h2>
          {rooms.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-[#1E3A8A]/30 dark:text-[#60A5FA]">
              {rooms.length}
            </span>
          )}
        </div>
        <div className="text-slate-500 dark:text-gray-400">{isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-slate-200 bg-white dark:border-[#1E2A45] dark:bg-[#0B1120]/60">
              <div className="space-y-6">
                {/* Show room form if adding a new room */}
                {showForm && (
                  <div className="mb-6">
                    <RoomForm onAddRoom={handleAddRoom} onCancel={handleCancel} />
                  </div>
                )}

                {/* Show list of added rooms */}
                {rooms.length > 0 && <RoomList rooms={rooms} onRemoveRoom={onRemoveRoom} />}

                {/* Show add room button */}
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowForm(true)
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-[#1E2A45] dark:hover:bg-[#2A3A55]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {rooms.length === 0 ? "Add First Room" : "Add Another Room"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
