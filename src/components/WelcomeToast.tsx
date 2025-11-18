"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { X, Bell } from "lucide-react";
import { usePathname } from "next/navigation";

export default function WelcomeToast() {
  const pathname = usePathname();

  useEffect(() => {
    // Show welcome toast on homepage and landlord page
    const isHomePage = pathname === "/";
    const isLandlordPage = pathname === "/landlords";
    
    // Only show the toast on homepage or landlord page
    if (isHomePage || isLandlordPage) {
      // Get welcome toast state from localStorage
      const hasShownWelcomeToast = localStorage.getItem("hasShownWelcomeToast");
      const lastToastTime = localStorage.getItem("lastWelcomeToastTime");
      const currentTime = new Date().getTime();
      
      // Show toast if not shown before or shown more than 24 hours ago
      const shouldShowToast = !hasShownWelcomeToast || 
        (lastToastTime && (currentTime - parseInt(lastToastTime)) > 24 * 60 * 60 * 1000);
      
      if (shouldShowToast) {
        const toastId = toast(
          <div className="flex items-center gap-3 py-1">
            <div className="flex items-center gap-3 flex-1">
              <Bell size={18} className="text-blue-100" />
              <p className="font-medium text-white">Welcome to our updated site</p>
            </div>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast.dismiss(toastId);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast.dismiss(toastId);
              }}
              className="p-2 rounded-full hover:bg-blue-600/20 active:bg-blue-600/30 transition-colors ml-auto group min-w-[32px] min-h-[32px] flex items-center justify-center touch-manipulation"
              aria-label="Close notification"
              type="button"
            >
              <X 
                size={18} 
                className="text-blue-100 group-hover:text-white transition-colors pointer-events-none" 
              />
            </button>
          </div>,
          {
            position: "top-center",
            duration: 60000, // 1 minute
            className: "bg-gradient-to-r from-blue-600 to-blue-500 border border-blue-400/30 shadow-lg",
            style: {
              color: "white",
              padding: "14px 18px",
              borderRadius: "12px",
              maxWidth: "440px",
              margin: "0 auto",
              backdropFilter: "blur(8px)",
            },
          }
        );
        
        // Update localStorage to record that we've shown the toast
        localStorage.setItem("hasShownWelcomeToast", "true");
        localStorage.setItem("lastWelcomeToastTime", currentTime.toString());
        
        // Cleanup function to dismiss toast if component unmounts
        return () => {
          toast.dismiss(toastId);
        };
      }
    }
  }, [pathname]);

  return null; // This component doesn't render anything
}
