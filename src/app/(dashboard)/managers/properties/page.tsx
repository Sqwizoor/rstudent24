"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { anyApi } from "convex/server";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Image as ImageIcon,
  ExternalLink,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRoomStats } from "@/lib/roomUtils";
import { toast } from "sonner";

const DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80";

// Robust image component with auto fallback on loading error
const SafePropertyImage = ({
  src,
  alt,
  className = "w-full h-full object-cover"
}: {
  src?: string;
  alt: string;
  className?: string;
}) => {
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (!src || src.includes("undefined") || src.includes("null")) return DEFAULT_FALLBACK_IMAGE;
    return src;
  });

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (imgSrc !== DEFAULT_FALLBACK_IMAGE) {
          setImgSrc(DEFAULT_FALLBACK_IMAGE);
        }
      }}
    />
  );
};

const MIGRATED_LANDLORD_IDS: Record<string, string> = {
  "clip-plod-lesser@duck.com": "a0dc393c-a001-7078-2d0f-c1281d72a110",
  "info@staysouthpoint.co.za": "50bc293c-c0c1-70b1-c593-4b2d2a4f1f40",
  "infokiarashomestay@gmail.com": "d04cc9ac-1001-708d-2b4c-9d877fbdf21b",
  "parklanejohn@hotmail.com": "e0fce95c-d081-7011-3934-5fe8e083a64d",
  "marketingadmin@mosaicgroup.co.za": "30bc291c-2021-70ee-bb87-d158fbaebee2",
  "shaeekahisra@gmail.com": "60fc69fc-7071-702c-c927-f70b14e6d334",
  "zwelakhe.samuel@gmail.com": "101c293c-5081-7043-8179-30abb82807dc",
  "unathindlovu28@gmail.com": "d04c697c-f061-7015-5342-9f4fd8909467",
  "allistairem@gmail.com": "405c093c-2051-702e-e86d-8a625d775b0e",
  "meevsuu@hotmail.com": "f04cb9ac-6041-7060-a1da-90eacad6fb62",
  "rosaliefloresfranco@gmail.com": "40ccb93c-60c1-70c0-bfe2-16551e4395a1",
};

const Properties = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const managerId = (session?.user as any)?.id || (session?.user as any)?.sub || "";
  const managerEmail = session?.user?.email || "";
  const migratedId = managerEmail ? MIGRATED_LANDLORD_IDS[managerEmail.toLowerCase()] : undefined;

  // ── Convex queries ──
  // @ts-ignore
  const propertiesById = useQuery(
    anyApi.properties.getManagerProperties,
    managerId ? { managerId } : "skip"
  );
  // @ts-ignore
  const propertiesByEmail = useQuery(
    anyApi.properties.getManagerProperties,
    managerEmail && managerEmail !== managerId ? { managerId: managerEmail } : "skip"
  );
  // @ts-ignore
  const propertiesByMigratedId = useQuery(
    anyApi.properties.getManagerProperties,
    migratedId && migratedId !== managerId ? { managerId: migratedId } : "skip"
  );

  const managerProperties = useMemo(() => {
    if (propertiesById === undefined && propertiesByEmail === undefined && propertiesByMigratedId === undefined) {
      return undefined;
    }
    const list = [
      ...(propertiesById ?? []),
      ...(propertiesByEmail ?? []),
      ...(propertiesByMigratedId ?? []),
    ];
    const seen = new Set<string>();
    return list.filter((p: any) => {
      const id = p?._id || p?.id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [propertiesById, propertiesByEmail, propertiesByMigratedId]);

  // @ts-ignore
  const deletePropertyMutation = useMutation(anyApi.properties.deleteProperty);

  const isLoading = managerId && managerProperties === undefined;

  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "date">("name");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter properties based on search term
  const filteredProperties = useMemo(() => {
    return (managerProperties ?? []).filter((property: any) =>
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (property.address && property.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (property.city && property.city.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [managerProperties, searchTerm]);

  // Sort properties
  const sortedProperties = useMemo(() => {
    return [...filteredProperties].sort((a: any, b: any) => {
      if (sortBy === "price") {
        const aPrice = a.pricePerMonth ?? 0;
        const bPrice = b.pricePerMonth ?? 0;
        return aPrice - bPrice;
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredProperties, sortBy]);

  // Paginated properties
  const totalPages = Math.max(1, Math.ceil(sortedProperties.length / itemsPerPage));
  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProperties.slice(start, start + itemsPerPage);
  }, [sortedProperties, currentPage, itemsPerPage]);

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
      <div className="min-h-screen bg-[#000000] text-zinc-100 p-6 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-20 w-full rounded-2xl bg-zinc-900/60 animate-pulse border border-zinc-800/80" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-24 rounded-2xl bg-zinc-900/40 animate-pulse border border-zinc-800/50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Property Portfolio
              </h1>
              <span className="rounded-full bg-zinc-800/80 border border-zinc-700/60 px-2.5 py-0.5 text-xs font-mono text-zinc-300">
                {managerProperties?.length || 0} Listed
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Manage student accommodation listings, room availability, and photos.
            </p>
          </div>
          <Button
            onClick={() => router.push("/managers/newproperty")}
            className="rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-zinc-200 transition-all shadow-md active:scale-95"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add New Property
          </Button>
        </div>
      </div>

      {/* Search, Sort & View Mode Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search properties by name, city, address..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 rounded-xl border-zinc-800 bg-zinc-950/80 pl-10 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
          />
        </div>
        <div className="flex items-center gap-2.5">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="h-10 w-[150px] rounded-xl border-zinc-800 bg-zinc-950/80 text-xs text-zinc-200 focus:border-zinc-600">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
                <SelectValue placeholder="Sort By" />
              </div>
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-200 rounded-xl">
              <SelectItem value="name" className="text-xs">Name</SelectItem>
              <SelectItem value="price" className="text-xs">Monthly Rent</SelectItem>
              <SelectItem value="date" className="text-xs">Date Added</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-950/80 p-1 gap-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              title="List View"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Properties Content */}
      {paginatedProperties && paginatedProperties.length > 0 ? (
        viewMode === "list" ? (
          /* List View Rows */
          <div className="space-y-3">
            {paginatedProperties.map((property: any) => (
              <PropertyRowItem
                key={property._id}
                property={property}
                onEdit={handleEditProperty}
                onManagePhotos={handleManagePhotos}
                onDelete={handleDeleteProperty}
              />
            ))}
          </div>
        ) : (
          /* Grid View Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedProperties.map((property: any) => (
              <PropertyCardItem
                key={property._id}
                property={property}
                onEdit={handleEditProperty}
                onManagePhotos={handleManagePhotos}
                onDelete={handleDeleteProperty}
              />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400 mb-4">
            <Home className="h-7 w-7 text-zinc-400" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">No Properties Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-6">
            {searchTerm ? "No properties match your search term. Try adjusting your filters." : "You have not listed any properties yet. Add your first accommodation listing to get started."}
          </p>
          <Button
            onClick={() => router.push("/managers/newproperty")}
            className="rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 text-xs px-4 py-2"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add First Property
          </Button>
        </div>
      )}

      {/* Pagination Controls */}
      {sortedProperties.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800/80">
          <p className="text-xs text-zinc-400">
            Showing <span className="font-semibold text-zinc-200">{((currentPage - 1) * itemsPerPage) + 1}</span> to{" "}
            <span className="font-semibold text-zinc-200">{Math.min(currentPage * itemsPerPage, sortedProperties.length)}</span> of{" "}
            <span className="font-semibold text-zinc-200">{sortedProperties.length}</span> properties
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1 px-2 text-xs font-mono text-zinc-400">
              Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Confirm Property Deletion</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 mt-1.5">
              Are you sure you want to delete this property? This action is irreversible and will remove all associated rooms and photos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              {isDeleting ? "Deleting..." : "Delete Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Property List Row Item (Compact List View) ──
const PropertyRowItem = ({
  property,
  onEdit,
  onManagePhotos,
  onDelete,
}: {
  property: any;
  onEdit: (id: string) => void;
  onManagePhotos: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const roomStats = getRoomStats(property.rooms);
  const displayBeds = roomStats.totalBeds || property.beds || 0;
  const displayBaths = roomStats.totalBaths || property.baths || 0;
  const rawPrice = Number(property.pricePerMonth) || Number(property.price) || 0;
  const displayPrice = (roomStats.minPrice && roomStats.minPrice > 0)
    ? roomStats.minPrice
    : rawPrice;
  const firstImage = property.imageUrls?.[0] || property.photoUrls?.[0];

  return (
    <div className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl hover:border-zinc-700 transition-all duration-200 hover:shadow-lg hover:shadow-black/40">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Compact Thumbnail with Image Fallback */}
        <div className="relative h-20 w-28 sm:h-22 sm:w-32 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0">
          <SafePropertyImage
            src={firstImage}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Link href={`/managers/properties/${property._id}`} className="hover:text-blue-400 transition-colors font-semibold text-sm sm:text-base text-zinc-100 truncate">
              {property.name}
            </Link>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 shrink-0">
              {property.status || "Approved"}
            </span>
          </div>

          <div className="flex items-center text-zinc-400 text-xs truncate">
            <MapPin className="h-3 w-3 mr-1 text-zinc-500 shrink-0" />
            <span className="truncate">{property.address ? `${property.address}, ${property.city || ''}` : property.city || 'South Africa'}</span>
          </div>

          <div className="flex items-center gap-3 text-zinc-400 text-xs pt-0.5">
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5 text-zinc-500" />
              {displayBeds} Beds
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-zinc-500" />
              {displayBaths} Baths
            </span>
            {property.rooms?.length > 0 && (
              <span className="text-zinc-500 text-[11px]">
                ({property.rooms.length} Room Types)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Price & Actions */}
      <div className="flex sm:flex-col items-end justify-between sm:justify-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60 gap-3 shrink-0">
        <div className="text-left sm:text-right">
          <span className="text-base font-bold text-white tracking-tight">
            R{displayPrice.toLocaleString()}
          </span>
          <span className="text-xs text-zinc-400 font-normal"> /mo</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Link href={`/managers/properties/${property._id}`}>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs h-8 px-2.5"
              title="View Property"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onManagePhotos(property._id)}
            className="rounded-xl border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs h-8 px-2.5"
          >
            <ImageIcon className="h-3.5 w-3.5 mr-1 text-zinc-400" />
            Photos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(property._id)}
            className="rounded-xl border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs h-8 px-2.5"
          >
            <Edit3 className="h-3.5 w-3.5 mr-1 text-zinc-400" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(property._id)}
            className="rounded-xl border-rose-950/50 bg-rose-950/20 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-xs h-8 px-2"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Property Grid Card Item ──
const PropertyCardItem = ({
  property,
  onEdit,
  onManagePhotos,
  onDelete,
}: {
  property: any;
  onEdit: (id: string) => void;
  onManagePhotos: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const roomStats = getRoomStats(property.rooms);
  const displayBeds = roomStats.totalBeds || property.beds || 0;
  const displayBaths = roomStats.totalBaths || property.baths || 0;
  const rawPrice = Number(property.pricePerMonth) || Number(property.price) || 0;
  const displayPrice = (roomStats.minPrice && roomStats.minPrice > 0)
    ? roomStats.minPrice
    : rawPrice;
  const firstImage = property.imageUrls?.[0] || property.photoUrls?.[0];

  return (
    <Card className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl hover:border-zinc-700 transition-all duration-200 group flex flex-col justify-between shadow-sm hover:shadow-lg hover:shadow-black/40">
      <div>
        <div className="p-3 pb-0">
          <div className="relative w-full h-44 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80">
            <SafePropertyImage
              src={firstImage}
              alt={property.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute top-2.5 left-2.5">
              <span className="rounded-lg bg-black/85 backdrop-blur-md border border-white/10 px-2 py-0.5 text-xs font-bold text-white shadow-md">
                R{displayPrice.toLocaleString()}<span className="text-[10px] font-normal text-zinc-400">/mo</span>
              </span>
            </div>
            <div className="absolute top-2.5 right-2.5">
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 backdrop-blur-md">
                {property.status || "Approved"}
              </span>
            </div>
          </div>
        </div>

        <CardContent className="p-3.5 space-y-2.5">
          <div>
            <Link href={`/managers/properties/${property._id}`} className="group-hover:text-blue-400 transition-colors">
              <h3 className="font-semibold text-sm text-zinc-100 line-clamp-1 flex items-center gap-1.5">
                {property.name}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400" />
              </h3>
            </Link>
            <div className="flex items-center text-zinc-400 text-[11px] mt-0.5">
              <MapPin className="h-3 w-3 mr-1 text-zinc-500 shrink-0" />
              <span className="line-clamp-1">{property.address ? `${property.address}, ${property.city || ''}` : property.city || 'South Africa'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-zinc-400 text-[11px] border-y border-zinc-800/80 py-2">
            <div className="flex items-center gap-1">
              <BedDouble className="h-3 w-3 text-zinc-500" />
              <span>{displayBeds} Beds</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-3 w-3 text-zinc-500" />
              <span>{displayBaths} Baths</span>
            </div>
          </div>
        </CardContent>
      </div>

      <div className="p-3.5 pt-0 flex items-center justify-between gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onManagePhotos(property._id)}
          className="rounded-lg border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white text-[11px] h-7.5 px-2.5"
        >
          <ImageIcon className="h-3 w-3 mr-1 text-zinc-400" />
          Photos
        </Button>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(property._id)}
            className="rounded-lg border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white text-[11px] h-7.5 px-2.5"
          >
            <Edit3 className="h-3 w-3 mr-1 text-zinc-400" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(property._id)}
            className="rounded-lg border-rose-950/50 bg-rose-950/20 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-[11px] h-7.5 px-2"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default Properties;
