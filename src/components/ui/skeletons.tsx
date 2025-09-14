"use client"

import { Skeleton } from "@/components/ui/skeleton"

// Property Card Skeleton
export function PropertyCardSkeleton() {
  return (
    <div className="group overflow-hidden border border-[#333] bg-gradient-to-br from-blue-950/80 to-black rounded-xl">
      {/* Image skeleton */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <Skeleton className="w-full h-full bg-gray-800" />
        {/* Price tag skeleton */}
        <div className="absolute top-4 left-4">
          <Skeleton className="w-20 h-6 bg-gray-700" />
        </div>
        {/* Badges skeleton */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Skeleton className="w-16 h-5 bg-gray-700" />
          <Skeleton className="w-14 h-5 bg-gray-700" />
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Title and rating */}
        <div className="flex items-start justify-between">
          <Skeleton className="w-3/4 h-6 bg-gray-800" />
          <Skeleton className="w-12 h-5 bg-gray-700" />
        </div>

        {/* Location */}
        <Skeleton className="w-2/3 h-4 bg-gray-800" />

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center justify-center p-2 rounded-md bg-[#111]/80">
              <Skeleton className="w-4 h-4 mb-1 bg-gray-700" />
              <Skeleton className="w-6 h-4 mb-1 bg-gray-800" />
              <Skeleton className="w-8 h-3 bg-gray-700" />
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-4 border-t border-[#333]/80">
          <Skeleton className="flex-1 h-9 bg-gray-800" />
          <Skeleton className="flex-1 h-9 bg-gray-800" />
        </div>
      </div>
    </div>
  )
}

// Compact Property Card Skeleton
export function PropertyCardCompactSkeleton() {
  return (
    <div className="border border-[#333] bg-gradient-to-br from-blue-950/80 to-black rounded-lg p-4">
      <div className="flex gap-4">
        <Skeleton className="w-20 h-20 rounded-lg bg-gray-800" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-3/4 h-5 bg-gray-800" />
          <Skeleton className="w-1/2 h-4 bg-gray-700" />
          <Skeleton className="w-2/3 h-4 bg-gray-700" />
        </div>
        <div className="flex flex-col justify-between">
          <Skeleton className="w-16 h-5 bg-gray-700" />
          <Skeleton className="w-12 h-4 bg-gray-800" />
        </div>
      </div>
    </div>
  )
}

// Room Card Skeleton
export function RoomCardSkeleton() {
  return (
    <div className="p-4 border border-gray-700 rounded-lg bg-gray-700/30">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-grow space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-32 h-6 bg-gray-600" />
            <Skeleton className="w-16 h-5 bg-gray-600" />
          </div>
          <Skeleton className="w-48 h-4 bg-gray-700" />
          <div className="flex gap-1.5 mt-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-10 h-10 rounded bg-gray-600" />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-16 h-8 bg-gray-600" />
          <Skeleton className="w-16 h-8 bg-gray-600" />
        </div>
      </div>
    </div>
  )
}

// Form Field Skeleton
export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="w-24 h-4 bg-gray-700" />
      <Skeleton className="w-full h-10 bg-gray-800" />
    </div>
  )
}

// Form Skeleton
export function FormSkeleton() {
  return (
    <div className="flex bg-[#0F1112] justify-center md:mx-w-10xl">
      <div className="w-full max-w-2xl p-6 space-y-6">
        {/* Form header */}
        <div className="space-y-2">
          <Skeleton className="w-48 h-6 bg-gray-700" />
          <Skeleton className="w-64 h-4 bg-gray-800" />
        </div>
        
        {/* Form fields */}
        <div className="space-y-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <Skeleton className="w-24 h-10 bg-gray-700" />
          <Skeleton className="w-32 h-10 bg-gray-800" />
        </div>
      </div>
    </div>
  )
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-700">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="w-full h-4 bg-gray-800" />
        </td>
      ))}
    </tr>
  )
}

// Table Skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      <div className="rounded-md border border-gray-700">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton className="w-20 h-4 bg-gray-700" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRowSkeleton key={i} columns={columns} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Navigation Skeleton
export function NavigationSkeleton() {
  return (
    <nav className="border-b border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-8 h-8 rounded-full bg-gray-700" />
          <Skeleton className="w-24 h-6 bg-gray-700" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-16 h-8 bg-gray-700" />
          <Skeleton className="w-16 h-8 bg-gray-700" />
          <Skeleton className="w-8 h-8 rounded-full bg-gray-700" />
        </div>
      </div>
    </nav>
  )
}

// Dashboard Stats Skeleton
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="w-16 h-4 bg-gray-700" />
              <Skeleton className="w-12 h-8 bg-gray-600" />
            </div>
            <Skeleton className="w-8 h-8 rounded bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Page Header Skeleton
export function PageHeaderSkeleton() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="w-48 h-8 bg-gray-700" />
          <Skeleton className="w-72 h-4 bg-gray-800" />
        </div>
        <Skeleton className="w-32 h-10 bg-gray-700" />
      </div>
    </div>
  )
}

// Profile Skeleton
export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border border-gray-700 rounded-lg">
      <Skeleton className="w-16 h-16 rounded-full bg-gray-700" />
      <div className="space-y-2">
        <Skeleton className="w-32 h-5 bg-gray-700" />
        <Skeleton className="w-24 h-4 bg-gray-800" />
        <Skeleton className="w-40 h-4 bg-gray-800" />
      </div>
    </div>
  )
}

// List Item Skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-700 last:border-b-0">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-full bg-gray-700" />
        <div className="space-y-1">
          <Skeleton className="w-32 h-4 bg-gray-700" />
          <Skeleton className="w-24 h-3 bg-gray-800" />
        </div>
      </div>
      <Skeleton className="w-16 h-6 bg-gray-700" />
    </div>
  )
}

// Grid Skeleton
export function GridSkeleton({ 
  items = 6, 
  Component = PropertyCardSkeleton 
}: { 
  items?: number; 
  Component?: React.ComponentType;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: items }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  )
}

// Modal Skeleton
export function ModalSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="w-32 h-6 bg-gray-700" />
        <Skeleton className="w-48 h-4 bg-gray-800" />
      </div>
      
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <FormFieldSkeleton key={i} />
        ))}
      </div>
      
      <div className="flex justify-end gap-2">
        <Skeleton className="w-16 h-9 bg-gray-700" />
        <Skeleton className="w-20 h-9 bg-gray-600" />
      </div>
    </div>
  )
}

// Search Results Skeleton
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="w-32 h-6 bg-gray-700" />
        <Skeleton className="w-24 h-8 bg-gray-700" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <PropertyCardCompactSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// Application Card Skeleton
export function ApplicationCardSkeleton() {
  return (
    <div className="border border-[#333] shadow-md overflow-hidden rounded-lg">
      <div className="flex flex-col md:flex-row">
        {/* Property Image skeleton */}
        <div className="relative md:w-1/4 h-28 md:h-auto p-2">
          <Skeleton className="w-full h-full bg-gray-800 rounded-md" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-4 flex flex-col space-y-3">
          {/* Status Row skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Skeleton className="w-48 h-6 bg-gray-800" />
              <Skeleton className="w-20 h-6 bg-gray-700 rounded-full" />
            </div>
            <Skeleton className="w-24 h-4 bg-gray-700" />
          </div>

          {/* Property Details skeleton */}
          <div className="space-y-2">
            <Skeleton className="w-64 h-4 bg-gray-800" />
            <div className="flex items-center gap-2">
              <Skeleton className="w-12 h-4 bg-gray-700" />
              <Skeleton className="w-20 h-4 bg-gray-800" />
              <Skeleton className="w-24 h-4 bg-gray-700" />
            </div>
          </div>

          {/* Status Details skeleton */}
          <div className="flex-1">
            <div className="p-3 rounded-md border border-gray-700/30">
              <div className="flex items-center">
                <Skeleton className="w-4 h-4 bg-gray-700 mr-2" />
                <Skeleton className="flex-1 h-4 bg-gray-800" />
              </div>
            </div>
          </div>

          {/* Actions skeleton */}
          <div className="flex justify-end space-x-3">
            <Skeleton className="w-28 h-8 bg-gray-800" />
            <Skeleton className="w-32 h-8 bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Applications Page Skeleton
export function ApplicationsPageSkeleton() {
  return (
    <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="w-32 h-8 bg-gray-800 mb-2" />
        <Skeleton className="w-96 h-4 bg-gray-700" />
      </div>
      
      {/* Applications list skeleton */}
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <ApplicationCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
