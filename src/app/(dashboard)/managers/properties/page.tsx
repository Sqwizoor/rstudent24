"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetAuthUserQuery, useGetManagerPropertiesQuery, useDeletePropertyMutation } from "@/state/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GridSkeleton, PropertyCardSkeleton, PageHeaderSkeleton } from "@/components/ui/skeletons";
import {
  Plus,
  Search,
  BedDouble,
  Bath,
  Ruler,
  MapPin,
  Edit3,
  Trash2,
  ArrowUpDown,
  Home,
  Filter,
  Image as ImageIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRoomStats } from "@/lib/roomUtils";

const Properties = () => {
  const router = useRouter();
  const { data: authUser } = useGetAuthUserQuery();
  const {
    data: managerProperties,
    isLoading,
    error,
    refetch,
  } = useGetManagerPropertiesQuery(authUser?.cognitoInfo?.userId || "", {
    skip: !authUser?.cognitoInfo?.userId,
  });
  
  const [deleteProperty, { isLoading: isDeletePropertyLoading }] = useDeletePropertyMutation();

  const [deletePropertyId, setDeletePropertyId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "date">("name");

  // Filter properties based on search term
  const filteredProperties = managerProperties?.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    // Only search address/city if location info available
    ((property as any).address && (property as any).address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    ((property as any).city && (property as any).city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort properties based on sort selection
  const sortedProperties = [...(filteredProperties || [])].sort((a, b) => {
    if (sortBy === "price") {
      const aPrice = (a as any).minRoomPrice ?? (a as any).pricePerMonth ?? 0;
      const bPrice = (b as any).minRoomPrice ?? (b as any).pricePerMonth ?? 0;
      return aPrice - bPrice;
    }
    if (sortBy === "name") return a.name.localeCompare(b.name);
    // Default sort by name
    return a.name.localeCompare(b.name);
  });

  const handleEditProperty = (id: number) => {
    router.push(`/managers/properties/${id}/edit`);
  };

  const handleManagePhotos = (id: number) => {
    router.push(`/managers/properties/${id}/photos`);
  };

  const handleDeleteProperty = (id: number) => {
    setDeletePropertyId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletePropertyId || !authUser?.cognitoInfo?.userId) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      // Use the RTK Query mutation hook instead of direct fetch
      await deleteProperty({
        id: deletePropertyId,
        managerCognitoId: authUser.cognitoInfo.userId
      }).unwrap();
      
      // Close the dialog after successful deletion
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error("Error deleting property:", error);

      // Handle token expired or invalid cases
      if (error.message?.includes("token") || error.message?.includes("unauthorized") || error.message?.includes("Unauthorized")) {
        setErrorMessage("Your session has expired. Please log in again.");
      } else {
        setErrorMessage(error.data?.message || error.message || "An unexpected error occurred.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <PageHeaderSkeleton />
          <GridSkeleton items={6} Component={PropertyCardSkeleton} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg max-w-md text-center">
          <h3 className="font-semibold mb-2">Error Loading Properties</h3>
          <p className="text-sm">{(error as any)?.data?.message || "Failed to load properties. Please try again later."}</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header section with gradient background */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-6 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            My Properties
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            View and manage your property listings
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push("/managers/newproperty")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 shadow-sm dark:shadow-blue-900/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>
      </div>
      
      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <span>Sort by</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="date">Date Added</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Properties count */}
      <div className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center">
        <Filter className="h-4 w-4 mr-2 text-blue-500" />
        Showing <span className="font-semibold mx-1 text-blue-600 dark:text-blue-400">{sortedProperties.length}</span> of <span className="font-semibold mx-1 text-blue-600 dark:text-blue-400">{managerProperties?.length || 0}</span> properties
      </div>
      
      {/* Error message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}
      
      {/* Properties grid */}
      {sortedProperties && sortedProperties.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-[1700px] mx-auto">
          {sortedProperties.map((property) => (
            <PropertyCard 
              key={property.id} 
              property={property} 
              onEdit={handleEditProperty} 
              onManagePhotos={handleManagePhotos}
              onDelete={handleDeleteProperty} 
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
          <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-full mb-4">
            <Home className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Properties Found</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">You don&apos;t manage any properties yet. Add your first property to get started.</p>
          <Button
            onClick={() => router.push("/managers/newproperty")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this property? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 mr-2 bg-white/30 rounded animate-pulse"></div>
                  Deleting...
                </>
              ) : (
                "Delete Property"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Property Card component
const PropertyCard = ({ property, onEdit, onManagePhotos, onDelete }: {
  property: any;
  onEdit: (id: number) => void;
  onManagePhotos: (id: number) => void;
  onDelete: (id: number) => void;
}) => {
  // Calculate room-based statistics
  const roomStats = getRoomStats(property.rooms);
  
  // Use room stats or fallback to property values for backward compatibility
  const displayBeds = roomStats.totalBeds || property.beds || 0;
  const displayBaths = roomStats.totalBaths || property.baths || 0;
  const displaySquareFeet = roomStats.totalSquareFeet || property.squareFeet || 0;
  const displayPrice = (property as any).minRoomPrice ?? roomStats.minPrice ?? property.pricePerMonth ?? 0;
  return (
    <Card className="overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200 w-full min-w-[400px] max-w-[800px] mx-auto">
      <div className="flex flex-col lg:flex-row">
        {/* Image container on the left */}
        <div className="relative w-full lg:w-2/5 h-56 lg:h-64 overflow-hidden">
          <Image
            src={property.photoUrls?.[0] || "/placeholder.jpg"}
            alt={property.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 35vw"
            className="object-cover ml-3 rounded-md"
          />
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-blue-500/90 backdrop-blur-sm text-white hover:bg-blue-600 text-sm px-3 py-1.5 shadow-lg">
              R{displayPrice.toLocaleString()}/mo
            </Badge>
          </div>
        </div>
        
        {/* Content on the right */}
        <CardContent className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <Link href={`/managers/properties/${property.id}`} className="hover:text-blue-600 transition-colors">
                <h3 className="font-heading font-semibold text-lg line-clamp-1">{property.name}</h3>
              </Link>
            </div>
            
            <div className="space-y-2 text-slate-500 dark:text-slate-400 text-sm mb-3">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="line-clamp-1">
                  {property.location?.address || 'No address'}
                </span>
              </div>
              <div className="flex items-center pl-6">
                <span className="line-clamp-1">
                  {property.location?.city ? 
                    `${property.location.city}, ${property.location.state || ''}` : 
                    'No city'
                  }
                </span>
              </div>
              <div className="flex items-center pl-6">
                <span>
                  {property.location?.postalCode ? 
                    `${property.location.postalCode}, ${property.location.country || 'South Africa'}` : 
                    `South Africa`
                  }
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center text-slate-500 dark:text-slate-400">
                <BedDouble className="h-4 w-4 mr-1" />
                <span className="text-sm">{displayBeds}</span>
              </div>
              <div className="flex items-center text-slate-500 dark:text-slate-400">
                <Bath className="h-4 w-4 mr-1" />
                <span className="text-sm">{displayBaths}</span>
              </div>
              <div className="flex items-center text-slate-500 dark:text-slate-400">
                <Ruler className="h-4 w-4 mr-1" />
                <span className="text-sm">{displaySquareFeet} sq ft</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManagePhotos(property.id)}
              className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Photos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(property.id)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(property.id)}
              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default Properties;
