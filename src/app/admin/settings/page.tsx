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
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Admin Settings</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Manage administrator profile, credentials, and notification details.</p>
          </div>
        </div>
      </div>
      
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono mb-4">Account Information</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name field */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-zinc-500" />
                Full Name
              </div>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-xl border border-zinc-800 bg-zinc-900 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none transition"
              placeholder="Your full name"
            />
          </div>
          
          {/* Email field */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-zinc-500" />
                Email Address
              </div>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-xl border border-zinc-800 bg-zinc-900 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none transition"
              placeholder="your.email@example.com"
            />
          </div>
          
          {/* Phone field */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-zinc-500" />
                Phone Number
              </div>
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-xl border border-zinc-800 bg-zinc-900 text-xs text-zinc-100 font-mono placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none transition"
              placeholder="+27 12 345 6789"
            />
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 text-xs transition disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono mb-3">Account Status</h2>
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="font-semibold text-xs text-emerald-400 uppercase tracking-wider">Active Admin Console</span>
          </div>
          <p className="mt-1.5 text-xs text-emerald-200/80">
            You have full administrative privileges on the Student24 platform.
          </p>
        </div>
      </div>
    </div>
  );
}
