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
    <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl overflow-hidden mb-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-900/40 transition-colors" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200">
            <Bed size={18} />
          </div>
          <h2 className="text-sm font-semibold text-white">Rooms</h2>
          {rooms.length > 0 && (
            <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono px-2.5 py-0.5 rounded-full">
              {rooms.length} Listed
            </span>
          )}
        </div>
        <div className="text-zinc-400">{isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
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
            <div className="p-5 border-t border-zinc-800/80 bg-zinc-950/50">
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
                      setShowForm(true)
                    }}
                    type="button"
                    className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-xl px-4 py-2 flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
                  >
                    <Plus size={15} />
                    Add Room
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
