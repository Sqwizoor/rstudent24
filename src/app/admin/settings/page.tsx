"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useGetAuthUserQuery, useUpdateAdminSettingsMutation } from "@/state/api";
import { checkAdminAuth } from "../adminAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Settings, User, Mail, Phone, Save } from "lucide-react";

// Admin Settings Page
export default function AdminSettings() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // Get current user data
  const { data: authUser, isLoading, refetch } = useGetAuthUserQuery();
  
  // Get the update admin settings mutation
  const [updateAdminSettings, { isLoading: isUpdating }] = useUpdateAdminSettingsMutation();
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: ""
  });
  
  // Initialize form with user data once it's loaded
  useEffect(() => {
    if (authUser?.userInfo) {
      setFormData({
        name: authUser.userInfo.name || "",
        email: authUser.userInfo.email || "",
        phoneNumber: authUser.userInfo.phoneNumber || ""
      });
    }
  }, [authUser]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Check admin auth first to ensure user is still authenticated
      const { isAuthenticated } = await checkAdminAuth();
      
      if (!isAuthenticated) {
        toast.error("Authentication error. Please log in again.");
        return;
      }
      
      // Use the mutation hook to update admin settings
      await updateAdminSettings(formData).unwrap();
      
      // Refetch user data to get updated information
      refetch();
    } catch (error) {
      console.error("Error updating settings:", error);
      // Error message is handled by the mutation hook (through withToast)
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 bg-blue-200 dark:bg-blue-800 rounded-full animate-pulse"></div>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "max-w-3xl mx-auto",
      isDark ? "text-white" : "text-slate-800"
    )}>
      <div className="flex items-center mb-6">
        <Settings className="h-8 w-8 mr-3 text-blue-500" />
        <h1 className="text-2xl font-bold">Admin Settings</h1>
      </div>
      
      <div className={cn(
        "rounded-lg p-6 shadow-md",
        isDark ? "bg-slate-800" : "bg-white"
      )}>
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Name field */}
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1",
                isDark ? "text-slate-300" : "text-slate-700"
              )}>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Full Name
                </div>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={cn(
                  "w-full px-4 py-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:outline-none",
                  isDark 
                    ? "bg-slate-700 border-slate-600 text-white" 
                    : "bg-white border-slate-300"
                )}
                placeholder="Your full name"
              />
            </div>
            
            {/* Email field */}
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1",
                isDark ? "text-slate-300" : "text-slate-700"
              )}>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Address
                </div>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={cn(
                  "w-full px-4 py-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:outline-none",
                  isDark 
                    ? "bg-slate-700 border-slate-600 text-white" 
                    : "bg-white border-slate-300"
                )}
                placeholder="your.email@example.com"
              />
            </div>
            
            {/* Phone field */}
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1",
                isDark ? "text-slate-300" : "text-slate-700"
              )}>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone Number
                </div>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={cn(
                  "w-full px-4 py-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:outline-none",
                  isDark 
                    ? "bg-slate-700 border-slate-600 text-white" 
                    : "bg-white border-slate-300"
                )}
                placeholder="+27 12 345 6789"
              />
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isUpdating}
                className={cn(
                  "w-full flex items-center justify-center px-4 py-2 rounded-md font-medium text-white",
                  isUpdating
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {isUpdating ? (
                  <>
                    <div className="h-4 w-4 mr-2 bg-white/30 rounded animate-pulse"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <div className={cn(
        "mt-6 rounded-lg p-6 shadow-md",
        isDark ? "bg-slate-800" : "bg-white"
      )}>
        <h2 className="text-xl font-semibold mb-4">Account Status</h2>
        <div className={cn(
          "px-4 py-3 rounded-md",
          isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
        )}>
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
            <span className="font-medium">Active Admin Account</span>
          </div>
          <p className="mt-1 text-sm">
            You have full administrative privileges on the Student24 Rental App platform.
          </p>
        </div>
      </div>
    </div>
  );
}
