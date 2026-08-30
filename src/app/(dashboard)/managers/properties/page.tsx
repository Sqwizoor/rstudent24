"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { anyApi } from "convex/server";
import { useSession } from "next-auth/react";
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
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRoomStats } from "@/lib/roomUtils";
import { toast } from "sonner";

const Properties = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const managerId = (session?.user as any)?.id || (session?.user as any)?.sub || "";

  // ── Convex queries ──────────────────────────────────────────────────────
  // @ts-ignore
  const managerProperties = useQuery(anyApi.properties.getManagerProperties, managerId ? { managerId } : "skip");
  // @ts-ignore
  const deletePropertyMutation = useMutation(anyApi.properties.deleteProperty);

  const isLoading = managerId && managerProperties === undefined;

  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "date">("name");

  // Filter properties based on search term
  const filteredProperties = (managerProperties ?? []).filter((property: any) =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (property.address && property.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (property.city && property.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a: any, b: any) => {
    if (sortBy === "price") {
      const aPrice = a.pricePerMonth ?? 0;
      const bPrice = b.pricePerMonth ?? 0;
      return aPrice - bPrice;
    }
    return a.name.localeCompare(b.name);
  });

  const handleEditProperty = (id: string) => {
    router.push(`/managers/properties/${id}/edit`);
  };

  const handleManagePhotos = (id: string) => {
    router.push(`/managers/properties/${id}/photos`);
  };

  const handleDeleteProperty = (id: string) => {
    setDeletePropertyId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletePropertyId || !managerId) return;
    setIsDeleting(true);
    try {
      await deletePropertyMutation({
        propertyId: deletePropertyId as any,
        managerId,
      });
      toast.success("Property deleted successfully");
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete property");
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

  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
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

      {/* Filters */}
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

      {/* Count */}
      <div className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center">
        <Filter className="h-4 w-4 mr-2 text-blue-500" />
        Showing <span className="font-semibold mx-1 text-blue-600 dark:text-blue-400">{sortedProperties.length}</span> of <span className="font-semibold mx-1 text-blue-600 dark:text-blue-400">{managerProperties?.length || 0}</span> properties
      </div>

      {/* Properties grid */}
      {sortedProperties && sortedProperties.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-[1700px] mx-auto">
          {sortedProperties.map((property: any) => (
            <PropertyCard
              key={property._id}
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
              Are you sure you want to delete this property? This action cannot be undone. All images and rooms will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Property"}
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
  onEdit: (id: string) => void;
  onManagePhotos: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const roomStats = getRoomStats(property.rooms);
  const displayBeds = roomStats.totalBeds || property.beds || 0;
  const displayBaths = roomStats.totalBaths || property.baths || 0;
  const displaySquareFeet = roomStats.totalSquareFeet || property.squareFeet || 0;
  const displayPrice = roomStats.minPrice ?? property.pricePerMonth ?? 0;
  // imageUrls come directly from Convex (resolved CDN URLs)
  const firstImage = property.imageUrls?.[0] || "/placeholder.jpg";

  return (
    <Card className="overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200 w-full min-w-[400px] max-w-[800px] mx-auto">
      <div className="flex flex-col lg:flex-row">
        {/* Image */}
        <div className="relative w-full lg:w-2/5 h-56 lg:h-64 overflow-hidden">
          <Image
            src={firstImage}
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

        {/* Content */}
        <CardContent className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <Link href={`/managers/properties/${property._id}`} className="hover:text-blue-600 transition-colors">
                <h3 className="font-heading font-semibold text-lg line-clamp-1">{property.name}</h3>
              </Link>
            </div>

            <div className="space-y-2 text-slate-500 dark:text-slate-400 text-sm mb-3">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="line-clamp-1">{property.address || 'No address'}</span>
              </div>
              <div className="flex items-center pl-6">
                <span className="line-clamp-1">
                  {property.city ? `${property.city}, ${property.state || ''}` : 'No city'}
                </span>
              </div>
              <div className="flex items-center pl-6">
                <span>{property.postalCode ? `${property.postalCode}, ${property.country || 'South Africa'}` : 'South Africa'}</span>
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
              onClick={() => onManagePhotos(property._id)}
              className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Photos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(property._id)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(property._id)}
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
