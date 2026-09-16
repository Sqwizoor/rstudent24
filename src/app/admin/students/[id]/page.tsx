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
            className="mr-4 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white">Error</h1>
        </div>
        <Card className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/70">
          <p className="text-rose-400 text-sm">{error}</p>
          <Button 
            className="mt-4 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700" 
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
            className="mr-4 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white">Student Details</h1>
        </div>
        <Card className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/70">
          <p className="text-zinc-400 text-sm">No student details found.</p>
        </Card>
      </div>
    );
  }
  
  const { tenantInfo, favorites = [], applications = [], leases = [] } = tenantDetails;
  
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white text-xs h-9"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Student Details</h1>
            <p className="text-xs text-zinc-400 mt-0.5">{tenantInfo.firstName} {tenantInfo.lastName}</p>
          </div>
        </div>
      </div>
      
      {/* Student Profile Card */}
      <Card className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl text-zinc-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">
              {tenantInfo.firstName?.charAt(0) || "S"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{tenantInfo.firstName} {tenantInfo.lastName}</h2>
              <div className="flex items-center text-xs text-zinc-400 mt-1">
                <Mail className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                <span>{tenantInfo.email}</span>
              </div>
              {tenantInfo.phoneNumber && (
                <div className="flex items-center text-xs text-zinc-400 mt-1 font-mono">
                  <Phone className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                  <span>{tenantInfo.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/80 text-center min-w-[90px]">
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Favorites</p>
              <p className="text-2xl font-bold text-white mt-0.5">{favorites.length}</p>
            </div>
            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/80 text-center min-w-[90px]">
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Applications</p>
              <p className="text-2xl font-bold text-white mt-0.5">{applications.length}</p>
            </div>
            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/80 text-center min-w-[90px]">
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Leases</p>
              <p className="text-2xl font-bold text-white mt-0.5">{leases.length}</p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Favorites Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Favorited Properties</h3>
        {favorites.length > 0 ? (
          <div className="grid gap-3">
            {favorites.map((favorite: any) => (
              <Card key={favorite.id} className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl text-zinc-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-white">{favorite.name}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">{favorite.address}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                      <span className="flex items-center">
                        <User2 className="h-3 w-3 mr-1 text-zinc-400" />
                        {favorite.landlord}
                      </span>
                      {favorite.landlordEmail && (
                        <span className="flex items-center">
                          <Mail className="h-3 w-3 mr-1 text-zinc-400" />
                          {favorite.landlordEmail}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white text-xs h-8"
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
          <Card className="p-6 text-center rounded-2xl border border-zinc-800 bg-zinc-950/70">
            <p className="text-zinc-500 text-xs">No favorited properties.</p>
          </Card>
        )}
      </div>
      
      {/* Applications Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Applications</h3>
        {applications.length > 0 ? (
          <div className="grid gap-3">
            {applications.map((application: any) => (
              <Card key={application.id} className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl text-zinc-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-white">{application.propertyName}</h4>
                      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                        {application.status || "Pending"}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">Applied: {application.date}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                      <span className="flex items-center">
                        <User2 className="h-3 w-3 mr-1 text-zinc-400" />
                        {application.landlord}
                      </span>
                      {application.landlordEmail && (
                        <span className="flex items-center">
                          <Mail className="h-3 w-3 mr-1 text-zinc-400" />
                          {application.landlordEmail}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white text-xs h-8"
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
          <Card className="p-6 text-center rounded-2xl border border-zinc-800 bg-zinc-950/70">
            <p className="text-zinc-500 text-xs">No applications submitted.</p>
          </Card>
        )}
      </div>
      
      {/* Leases Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Active Leases</h3>
        {leases.length > 0 ? (
          <div className="grid gap-3">
            {leases.map((lease: any) => (
              <Card key={lease.id} className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl text-zinc-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-white">{lease.propertyName}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {lease.startDate} to {lease.endDate}
                    </p>
                    <p className="text-sm font-semibold text-emerald-400 mt-1">
                      {lease.rent} per month
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white text-xs h-8"
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
          <Card className="p-6 text-center rounded-2xl border border-zinc-800 bg-zinc-950/70">
            <p className="text-zinc-500 text-xs">No active leases.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
