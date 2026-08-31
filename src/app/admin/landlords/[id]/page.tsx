"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  User2, 
  Mail, 
  Phone, 
  ArrowLeft, 
  Home, 
  ClipboardList, 
  Users,
  Building,
  Eye,
  Ban,
  CheckCircle,
  Loader2,
  MapPin
} from "lucide-react";
import { useGetManagerDetailsQuery } from "@/state/api";

export default function LandlordDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  
  const { data: landlord, isLoading, error: fetchError, refetch } = useGetManagerDetailsQuery(id);

  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingPropId, setUpdatingPropId] = useState<string | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});

  const handleTogglePropertyStatus = async (property: any) => {
    const propId = String(property.id || property._id);
    const currentStatus = statusOverrides[propId] || property.status || "Approved";
    const nextStatus = currentStatus.toLowerCase() === "disabled" || currentStatus.toLowerCase() === "denied" ? "Approved" : "Disabled";

    setUpdatingPropId(propId);
    try {
      const res = await fetch("/api/admin/properties/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: propId, status: nextStatus }),
      });

      if (res.ok) {
        setStatusOverrides(prev => ({ ...prev, [propId]: nextStatus }));
        refetch?.();
      }
    } catch (e) {
      console.error("Failed to update property status:", e);
    } finally {
      setUpdatingPropId(null);
    }
  };

  const error = fetchError ? (fetchError as any)?.data?.error || "Failed to load landlord information." : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        <Card className="p-6">
          <p className="text-red-500">{error}</p>
          <Button className="mt-4" onClick={() => router.push("/admin/landlords")}>
            Go to Landlords Directory
          </Button>
        </Card>
      </div>
    );
  }
  
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
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <Button variant="outline" size="sm" onClick={() => router.push("/admin/landlords")} className="bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Landlords
        </Button>
        <Badge variant={landlordData.status === "Active" ? "default" : "secondary"}>
          {landlordData.status}
        </Badge>
      </div>

      {/* Profile Banner */}
      <Card className="p-6 bg-zinc-950/70 border border-zinc-800/80 text-zinc-100 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-2xl font-bold">
              {(landlordData.name || "L").charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{landlordData.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mt-1">
                <span className="flex items-center"><Mail className="h-4 w-4 mr-1 text-blue-400" /> {landlordData.email}</span>
                {landlordData.phoneNumber && (
                  <span className="flex items-center"><Phone className="h-4 w-4 mr-1 text-green-400" /> {landlordData.phoneNumber}</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6">
            <div>
              <p className="text-xs text-zinc-400 uppercase">Properties</p>
              <p className="text-2xl font-bold text-blue-400">{landlordData.stats.propertyCount}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase">Tenants</p>
              <p className="text-2xl font-bold text-green-400">{landlordData.stats.tenantCount}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="properties" className="data-[state=active]:bg-zinc-800 text-zinc-200">
            Properties ({landlordData.properties.length})
          </TabsTrigger>
          <TabsTrigger value="tenants" className="data-[state=active]:bg-zinc-800 text-zinc-200">
            Tenants ({landlordData.tenants.length})
          </TabsTrigger>
        </TabsList>

        {/* Properties List Tab */}
        <TabsContent value="properties" className="mt-4 space-y-4">
          {landlordData.properties.map((property: any) => {
            const propId = String(property.id || property._id);
            const currentStatus = statusOverrides[propId] || property.status || "Approved";
            const isDisabled = currentStatus.toLowerCase() === "disabled" || currentStatus.toLowerCase() === "denied";

            return (
              <Card key={propId} className="p-5 bg-zinc-950/70 border border-zinc-800/80 text-zinc-100 hover:border-zinc-700 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 shrink-0">
                      <Building className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-lg">{property.name}</h3>
                        <Badge className={isDisabled ? "bg-red-950/80 text-red-400 border border-red-800" : "bg-emerald-950/80 text-emerald-400 border border-emerald-800"}>
                          {isDisabled ? "Disabled" : "Active"}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-400 flex items-center mt-1">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-zinc-500" />
                        {property.address || property.location?.address || "Address unavailable"}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-zinc-400 mt-2">
                        <span>{property.roomCount || property.beds || 1} Rooms / Beds</span>
                        <span>•</span>
                        <span>{property.tenantCount || 0} Active Tenants</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">R{property.pricePerMonth || 3500}/mo</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-center">
                    {/* View Details Modal Trigger */}
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-200"
                      onClick={() => {
                        setSelectedProperty(property);
                        setIsModalOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1.5 text-blue-400" />
                      View Details
                    </Button>

                    {/* Disable / Enable Toggle Button */}
                    <Button 
                      size="sm"
                      variant={isDisabled ? "default" : "destructive"}
                      disabled={updatingPropId === propId}
                      className={isDisabled ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-red-900/80 hover:bg-red-800 text-red-200 border border-red-700"}
                      onClick={() => handleTogglePropertyStatus(property)}
                    >
                      {updatingPropId === propId ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      ) : isDisabled ? (
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                      ) : (
                        <Ban className="h-4 w-4 mr-1.5" />
                      )}
                      {isDisabled ? "Enable Property" : "Disable Property"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          {landlordData.properties.length === 0 && (
            <Card className="p-8 text-center bg-zinc-950/70 border border-zinc-800 text-zinc-400">
              No properties found for this landlord.
            </Card>
          )}
        </TabsContent>

        {/* Tenants Tab */}
        <TabsContent value="tenants" className="mt-4 space-y-4">
          {landlordData.tenants.map((tenant: any) => (
            <Card key={tenant.id} className="p-4 bg-zinc-950/70 border border-zinc-800 text-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-base">{tenant.name}</h3>
                <p className="text-sm text-zinc-400">{tenant.email}</p>
                {tenant.propertyName && (
                  <p className="text-xs text-blue-400 mt-1 flex items-center">
                    <Home className="h-3 w-3 mr-1" /> {tenant.propertyName}
                  </p>
                )}
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800"
                onClick={() => router.push(`/admin/students/${tenant.id}`)}
              >
                <Eye className="h-3.5 w-3.5 mr-1" /> View Student
              </Button>
            </Card>
          ))}

          {landlordData.tenants.length === 0 && (
            <Card className="p-8 text-center bg-zinc-950/70 border border-zinc-800 text-zinc-400">
              No tenants currently assigned to this landlord.
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Property Details Modal */}
      {selectedProperty && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-zinc-100">{selectedProperty.name}</DialogTitle>
              <DialogDescription className="text-zinc-400">
                {selectedProperty.address || selectedProperty.location?.address || "Address unavailable"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="grid grid-cols-2 gap-4 bg-zinc-900/60 p-4 rounded-lg border border-zinc-800">
                <div>
                  <p className="text-xs text-zinc-400 uppercase">Rent per month</p>
                  <p className="text-lg font-bold text-emerald-400">R{selectedProperty.pricePerMonth || 3500}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 uppercase">Property Type</p>
                  <p className="text-lg font-semibold text-zinc-200">{selectedProperty.propertyType || "Apartment"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 uppercase">Bedrooms / Baths</p>
                  <p className="text-sm font-medium text-zinc-300">{selectedProperty.beds || 1} Beds / {selectedProperty.baths || 1} Baths</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 uppercase">Status</p>
                  <Badge className="mt-1">{selectedProperty.status || "Active"}</Badge>
                </div>
              </div>

              {selectedProperty.description && (
                <div>
                  <h4 className="text-sm font-semibold text-zinc-300 mb-1">Description</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">{selectedProperty.description}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="bg-zinc-900 border-zinc-800 text-zinc-200">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
