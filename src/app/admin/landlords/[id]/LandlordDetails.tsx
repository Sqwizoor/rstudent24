"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
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
  Users,
  Building,
  Eye,
  Ban,
  CheckCircle,
  Loader2,
  MapPin
} from "lucide-react";
import { useGetManagerDetailsQuery } from "@/state/api";

export default function LandlordDetailsComponent() {
  const params = useParams();
  const id = params.id as string;
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
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.push("/admin/landlords")} className="bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Landlords
        </Button>
        <Badge variant={landlordData.status === "Active" ? "default" : "secondary"}>
          {landlordData.status}
        </Badge>
      </div>

      <Card className="p-6 bg-zinc-950/70 border border-zinc-800/80 text-zinc-100">
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
        </div>
      </Card>

      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="properties" className="data-[state=active]:bg-zinc-800 text-zinc-200">
            Properties ({landlordData.properties.length})
          </TabsTrigger>
          <TabsTrigger value="tenants" className="data-[state=active]:bg-zinc-800 text-zinc-200">
            Tenants ({landlordData.tenants.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="mt-4 space-y-4">
          {landlordData.properties.map((property: any) => {
            const propId = String(property.id || property._id);
            const currentStatus = statusOverrides[propId] || property.status || "Approved";
            const isDisabled = currentStatus.toLowerCase() === "disabled" || currentStatus.toLowerCase() === "denied";

            return (
              <Card key={propId} className="p-5 bg-zinc-950/70 border border-zinc-800 text-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                </div>

                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800"
                    onClick={() => {
                      setSelectedProperty(property);
                      setIsModalOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1.5 text-blue-400" /> View Details
                  </Button>

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
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {selectedProperty && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{selectedProperty.name}</DialogTitle>
              <DialogDescription className="text-zinc-400">
                {selectedProperty.address || "Address unavailable"}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Rent</span>
                <span className="font-bold text-emerald-400">R{selectedProperty.pricePerMonth || 3500}/month</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Status</span>
                <Badge>{selectedProperty.status || "Active"}</Badge>
              </div>
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
