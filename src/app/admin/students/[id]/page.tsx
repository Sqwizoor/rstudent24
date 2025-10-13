"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGetTenantDetailsQuery } from "@/state/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User2, Mail, Phone, ArrowLeft, Eye } from "lucide-react";

// Student details page showing favorites, applications, and leases
export default function StudentDetailsPage() {
  // Get the id from the URL using useParams
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  // Fetch student details using the API hook
  const { data: tenantDetails, isLoading, error: fetchError } = useGetTenantDetailsQuery(id);
  
  // Extract error message if there's an error
  const error = fetchError ? (fetchError as any)?.data?.error || "Failed to load student information. Please try again." : null;

  // Function to navigate to landlord details
  const viewLandlordDetails = (landlordId: number) => {
    router.push(`/admin/landlords/${landlordId}`);
  };

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
            onClick={() => router.push("/admin/students")}
          >
            Go to Students List
          </Button>
        </Card>
      </div>
    );
  }
  
  if (!tenantDetails) {
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
          <h1 className="text-2xl font-bold">Student Details</h1>
        </div>
        <Card className="p-6">
          <p className="text-gray-500">No student details found.</p>
        </Card>
      </div>
    );
  }
  
  const { tenantInfo, favorites = [], applications = [], leases = [] } = tenantDetails;
  
  return (
    <div className="max-w-4xl mx-auto">
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
        <h1 className="text-2xl font-bold">Student Details</h1>
      </div>
      
      {/* Student Profile Card */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold mr-4 bg-blue-100 text-blue-800">
              {tenantInfo.firstName?.charAt(0) || "S"}
            </div>
            <div>
              <h2 className="text-xl font-bold">{tenantInfo.firstName} {tenantInfo.lastName}</h2>
              <div className="flex items-center text-sm mt-1">
                <Mail className="h-4 w-4 mr-1 text-blue-500" />
                <span>{tenantInfo.email}</span>
              </div>
              {tenantInfo.phoneNumber && (
                <div className="flex items-center text-sm mt-1">
                  <Phone className="h-4 w-4 mr-1 text-blue-500" />
                  <span>{tenantInfo.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Card className="p-3 bg-blue-50 text-blue-800">
              <p className="text-xs text-blue-600">Favorites</p>
              <p className="text-xl font-bold">{favorites.length}</p>
            </Card>
            <Card className="p-3 bg-amber-50 text-amber-800">
              <p className="text-xs text-amber-600">Applications</p>
              <p className="text-xl font-bold">{applications.length}</p>
            </Card>
            <Card className="p-3 bg-green-50 text-green-800">
              <p className="text-xs text-green-600">Leases</p>
              <p className="text-xl font-bold">{leases.length}</p>
            </Card>
          </div>
        </div>
      </Card>
      
      {/* Favorites Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Favorited Properties</h3>
        {favorites.length > 0 ? (
          <div className="space-y-2">
            {favorites.map((favorite) => (
              <Card key={favorite.id} className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{favorite.name}</h4>
                    <p className="text-sm text-gray-500">{favorite.address}</p>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 flex items-center">
                        <User2 className="h-3 w-3 mr-1" />
                        Landlord: {favorite.landlord}
                      </p>
                      {favorite.landlordEmail && (
                        <p className="text-xs text-gray-400 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {favorite.landlordEmail}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View Property
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      onClick={() => viewLandlordDetails(favorite.landlordId)}
                    >
                      <User2 className="h-3.5 w-3.5 mr-1" />
                      View Landlord
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No favorited properties.</p>
        )}
      </div>
      
      {/* Applications Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Applications</h3>
        {applications.length > 0 ? (
          <div className="space-y-2">
            {applications.map((application) => (
              <Card key={application.id} className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{application.propertyName}</h4>
                    <p className="text-sm text-gray-500">Applied: {application.date}</p>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 flex items-center">
                        <User2 className="h-3 w-3 mr-1" />
                        Landlord: {application.landlord}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {application.landlordEmail}
                      </p>
                    </div>
                    <Badge variant={application.status === "approved" ? "default" : "outline"}>
                      {application.status}
                    </Badge>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View Application
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      onClick={() => viewLandlordDetails(application.landlordId)}
                    >
                      <User2 className="h-3.5 w-3.5 mr-1" />
                      View Landlord
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No applications submitted.</p>
        )}
      </div>
      
      {/* Leases Section */}
      <div>
        <h3 className="text-lg font-medium mb-2">Active Leases</h3>
        {leases.length > 0 ? (
          <div className="space-y-2">
            {leases.map((lease) => (
              <Card key={lease.id} className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{lease.propertyName}</h4>
                    <p className="text-sm text-gray-500">
                      {lease.startDate} to {lease.endDate}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 flex items-center">
                        <User2 className="h-3 w-3 mr-1" />
                        Landlord: {lease.landlord}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {lease.landlordEmail}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-green-600">
                      {lease.rent} per month
                    </p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View Lease
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      onClick={() => viewLandlordDetails(lease.landlordId)}
                    >
                      <User2 className="h-3.5 w-3.5 mr-1" />
                      View Landlord
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No active leases.</p>
        )}
      </div>
    </div>
  );
}
