"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User2, 
  Mail, 
  Phone, 
  ArrowLeft, 
  Home, 
  ClipboardList, 
  Users,
  Building,
  Eye
} from "lucide-react";
import { useGetManagerDetailsQuery } from "@/state/api";

// Landlord details client component
export default function LandlordDetails({ id }: { id: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  
  // Fetch landlord details using the API hook
  const { data: landlord, isLoading, error: fetchError } = useGetManagerDetailsQuery(id);
  
  // Extract error message if there's an error
  const error = fetchError ? (fetchError as any)?.data?.error || "Failed to load landlord information. Please try again." : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 bg-blue-200 dark:bg-blue-800 rounded-full animate-pulse"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        <Card className="p-6">
          <p className="text-red-500">{error}</p>
          <Button 
            className="mt-4" 
            onClick={() => router.push("/admin/landlords")}
          >
            Go to Landlords List
          </Button>
        </Card>
      </div>
    );
  }
  
  // Extract manager info cleanly from API response
  const info = (landlord as any)?.managerInfo || landlord || {};
  const landlordData = {
    id: info.id || id,
    name: info.name || info.email || "Landlord",
    email: info.email || "",
    phoneNumber: info.phoneNumber || "",
    status: info.status || "Active",
    properties: (landlord as any)?.properties || [],
    tenants: (landlord as any)?.tenantDetails || [],
    stats: {
      propertyCount: (landlord as any)?.properties?.length || info.totalProperties || 0,
      tenantCount: (landlord as any)?.tenantDetails?.length || info.totalTenants || 0,
      occupancyRate: "85%",
      averageRent: "R4,200"
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.back()}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Landlord Details</h1>
      </div>
      
      {/* Landlord Profile Card */}
      <Card className={cn(
        "p-6 mb-6",
        isDark ? "bg-slate-800" : "bg-white"
      )}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className={cn(
              "h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold mr-4",
              isDark ? "bg-blue-800 text-white" : "bg-blue-100 text-blue-800"
            )}>
              {(landlordData.name || "L").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{landlordData.name}</h2>
              <div className="flex items-center text-sm mt-1">
                <Mail className="h-4 w-4 mr-1 text-blue-500" />
                <span>{landlordData.email}</span>
              </div>
              {landlordData.phoneNumber && (
                <div className="flex items-center text-sm mt-1">
                  <Phone className="h-4 w-4 mr-1 text-blue-500" />
                  <span>{landlordData.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <div className={cn(
              "px-3 py-1 rounded-full inline-block",
              landlordData.status === "Active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
              landlordData.status === "Pending" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
              landlordData.status === "Disabled" ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" :
              "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {landlordData.status}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className={cn(
          "p-4",
          isDark ? "bg-slate-800" : "bg-white"
        )}>
          <div className="flex items-center">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center mr-3",
              isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-600"
            )}>
              <Building className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Properties</p>
              <p className="text-xl font-bold">{landlordData.stats.propertyCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className={cn(
          "p-4",
          isDark ? "bg-slate-800" : "bg-white"
        )}>
          <div className="flex items-center">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center mr-3",
              isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-600"
            )}>
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tenants</p>
              <p className="text-xl font-bold">{landlordData.stats.tenantCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className={cn(
          "p-4",
          isDark ? "bg-slate-800" : "bg-white"
        )}>
          <div className="flex items-center">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center mr-3",
              isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-600"
            )}>
              <Home className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Occupancy</p>
              <p className="text-xl font-bold">{landlordData.stats.occupancyRate}</p>
            </div>
          </div>
        </Card>
        
        <Card className={cn(
          "p-4",
          isDark ? "bg-slate-800" : "bg-white"
        )}>
          <div className="flex items-center">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center mr-3",
              isDark ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-600"
            )}>
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg. Rent</p>
              <p className="text-xl font-bold">{landlordData.stats.averageRent}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Tabbed Content */}
      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
        </TabsList>
        
        {/* Properties Tab */}
        <TabsContent value="properties" className="mt-4">
          <div className="space-y-4">
            {landlordData.properties.map((property: any) => (
              <Card key={property.id} className={cn(
                "p-4 hover:shadow-md transition-shadow",
                isDark ? "bg-slate-800" : "bg-white"
              )}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{property.name}</h3>
                    <p className="text-sm text-gray-500">{property.address}</p>
                    <p className="text-xs mt-1">
                      <span className={cn(
                        "inline-flex items-center",
                        isDark ? "text-blue-400" : "text-blue-600"
                      )}>
                        <Users className="h-3 w-3 mr-1" />
                        {property.tenantCount} tenants
                      </span>
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const propId = property.id || property._id;
                      if (propId) {
                        router.push(`/search/${propId}`);
                      } else {
                        router.push(`/admin/properties`);
                      }
                    }}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                </div>
              </Card>
            ))}
            
            {landlordData.properties.length === 0 && (
              <Card className="p-4">
                <p className="text-center text-gray-500 py-4">No properties found.</p>
              </Card>
            )}
          </div>
        </TabsContent>
        
        {/* Tenants Tab */}
        <TabsContent value="tenants" className="mt-4">
          <div className="space-y-4">
            {landlordData.tenants.map((tenant: any) => (
              <Card key={tenant.id} className={cn(
                "p-4 hover:shadow-md transition-shadow",
                isDark ? "bg-slate-800" : "bg-white"
              )}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{tenant.name}</h3>
                    <p className="text-sm text-gray-500">{tenant.email}</p>
                    <p className="text-xs mt-1">
                      <span className={cn(
                        "inline-flex items-center",
                        isDark ? "text-blue-400" : "text-blue-600"
                      )}>
                        <Home className="h-3 w-3 mr-1" />
                        {tenant.propertyName}
                      </span>
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      if (tenant.id) {
                        router.push(`/admin/students/${tenant.id}`);
                      } else {
                        router.push(`/admin/students`);
                      }
                    }}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                </div>
              </Card>
            ))}
            
            {landlordData.tenants.length === 0 && (
              <Card className="p-4">
                <p className="text-center text-gray-500 py-4">No tenants found.</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
