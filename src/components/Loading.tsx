import { PageHeaderSkeleton, GridSkeleton, PropertyCardSkeleton } from "@/components/ui/skeletons";
import React from "react";

interface LoadingProps {
  type?: 'page' | 'grid' | 'card' | 'simple';
  message?: string;
}

const Loading = ({ type = 'simple', message }: LoadingProps) => {
  switch (type) {
    case 'page':
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <PageHeaderSkeleton />
            <GridSkeleton items={6} Component={PropertyCardSkeleton} />
          </div>
        </div>
      );
    
    case 'grid':
      return <GridSkeleton items={6} Component={PropertyCardSkeleton} />;
    
    case 'card':
      return <PropertyCardSkeleton />;
    
    default:
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm z-[100]">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-indigo-50 pointer-events-none opacity-70"></div>
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"></div>
          
          {/* Modern loading container */}
          <div className="relative flex flex-col items-center justify-center z-10 p-8 rounded-2xl">
            {/* Blue glow behind spinner */}
            <div className="absolute w-20 h-20 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
            
            {/* Main loading spinner */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
            </div>
            
            {/* Loading text */}
            <p className="mt-4 text-blue-600 font-medium animate-pulse">
              {message || "Loading..."}
            </p>
            
            {/* Modern progress bar */}
            <div className="mt-2 relative h-1 w-40 bg-gray-100 overflow-hidden rounded-full">
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-600 w-full animate-progress rounded-full"></div>
            </div>
          </div>
        </div>
      );
  }
};

export default Loading;