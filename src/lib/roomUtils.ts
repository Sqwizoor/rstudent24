// Utility functions for calculating room-based property statistics

import type { Room } from '@/types/prismaTypes';

/**
 * Calculate total beds from all rooms in a property
 */
export function calculateTotalBeds(rooms: Room[] | undefined): number {
  if (!rooms || rooms.length === 0) return 0;
  
  // For each room, assume 1 bed per room by default
  // You can adjust this logic based on your room types or add a beds field to rooms
  return rooms.length;
}

/**
 * Calculate total bathrooms from all rooms in a property
 */
export function calculateTotalBaths(rooms: Room[] | undefined): number {
  if (!rooms || rooms.length === 0) return 0;
  
  // Count bathrooms based on room amenities or features
  return rooms.reduce((total, room) => {
    // Check if room has private bathroom amenity
    const hasPrivateBath = room.amenities?.includes('Private Bathroom') || 
                          room.features?.includes('Ensuite') ||
                          room.features?.includes('Private Bathroom');
    
    // If room has private bathroom, count as 1, otherwise assume shared (0.5)
    return total + (hasPrivateBath ? 1 : 0.5);
  }, 0);
}

/**
 * Calculate total square feet from all rooms in a property
 */
export function calculateTotalSquareFeet(rooms: Room[] | undefined): number {
  if (!rooms || rooms.length === 0) return 0;
  
  return rooms.reduce((total, room) => {
    return total + (room.squareFeet || 0);
  }, 0);
}

/**
 * Get the minimum room price for property pricing display
 */
export function getMinRoomPrice(rooms: Room[] | undefined): number {
  if (!rooms || rooms.length === 0) return 0;
  
  const availableRooms = rooms.filter(room => room.isAvailable);
  if (availableRooms.length === 0) return 0;
  
  return Math.min(...availableRooms.map(room => room.pricePerMonth));
}

/**
 * Get room statistics for property cards
 */
export function getRoomStats(rooms: Room[] | undefined) {
  return {
    totalBeds: calculateTotalBeds(rooms),
    totalBaths: calculateTotalBaths(rooms),
    totalSquareFeet: calculateTotalSquareFeet(rooms),
    minPrice: getMinRoomPrice(rooms),
    availableRooms: rooms?.filter(room => room.isAvailable).length || 0,
    totalRooms: rooms?.length || 0
  };
}
