"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetAuthUserQuery, useGetAdminPropertiesQuery } from "@/state/api";
import { configureAdminAuth } from "../adminAuth";
import { fetchAuthSession } from "aws-amplify/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Pagination } from "@/components/ui/pagination";
import {
  Search,
  BedDouble,
  Bath,
  MapPin,
  Building,
  User,
  Home,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

export default function AdminPropertiesPage() {
  const router = useRouter();
  const [authInitialized, setAuthInitialized] = useState(false);
  
  // Initialize authentication for admin section
  useEffect(() => {
    const initAuth = async () => {
      try {
        configureAdminAuth();
        const isFlaggedAdmin = typeof window !== 'undefined' && localStorage.getItem('isAdminAuthenticated') === 'true';
        if (isFlaggedAdmin) {
          setAuthInitialized(true);
          return;
        }
        const session = await fetchAuthSession().catch(() => null);
        setAuthInitialized(true);
      } catch (error) {
        console.error("Error initializing admin auth:", error);
        setAuthInitialized(true);
      }
    };
    
    initAuth();
  }, [router]);
  
  // Only fetch data after auth is initialized
  const { data: authUser, isLoading: authLoading, error: authError } = useGetAuthUserQuery(undefined, {
    skip: !authInitialized
  });
  
  const { data: rawProperties, isLoading: propertiesLoading, error, refetch } = useGetAdminPropertiesQuery(undefined);
  
  // Define the expected property structure for admin view
  // Import or define the Amenity and Highlight types if needed
  type Amenity = string;
  type Highlight = string;

  interface EnhancedProperty {
    id: number;
    name: string;
    description: string;
    pricePerMonth: number;
    securityDeposit: number;
    applicationFee: number;
    photoUrls: string[];
    amenities: Amenity[];
    highlights: Highlight[];
    isPetsAllowed: boolean;
    isParkingIncluded: boolean;
    beds: number;
    baths: number;
    squareFeet: number;
    propertyType: string;
    postedDate: Date | string;  // Accept both Date and string
    averageRating: number;
    numberOfReviews: number;
    locationId: number;
    managerCognitoId: string;
    location: {
      id: number;
      address: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    manager: {
      id: number;
      name: string;
      cognitoId: string;
    };
    status: string;
    isDisabled?: boolean;
  }

  // Transform properties to ensure consistent structure with location and manager objects
  const properties = React.useMemo<EnhancedProperty[]>(() => {
    if (!rawProperties) return [];
    
    return rawProperties.map(property => {
      // Type assertion to avoid TypeScript errors
      const typedProperty = property as any;
      
      // Create a properly typed enhanced property
      const enhancedProperty: EnhancedProperty = {
        ...typedProperty,
        // Ensure location object exists, creating a default one if needed
        location: typedProperty.location || {
          id: typedProperty.locationId || 0,
          address: '',
          city: '',
          state: '',
          country: '',
          postalCode: ''
        },
        // Ensure manager object exists, creating a default one if needed
        manager: typedProperty.manager || {
          id: 0,
          name: 'Unknown',
          cognitoId: typedProperty.managerCognitoId || ''
        },
        // Use the actual status from the database
        status: typedProperty.status || 'Pending',
        isDisabled: typedProperty.isDisabled === true
      };
      
      return enhancedProperty;
    });
  }, [rawProperties]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "rooms" | "city">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterCity, setFilterCity] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Extract unique cities for filtering
  const cities = properties ? [...new Set(properties.map(property => 
    property.location.city || 'Unknown'))] : [];
  
  // Filter properties based on search term and city filter
  const filteredProperties = properties?.filter(property => {
    const matchesSearch = 
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (property.location.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (property.location.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (property.manager.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = !filterCity || property.location.city === filterCity;
    
    return matchesSearch && matchesCity;
  });
  
  // Sort properties based on sort selection
  const sortedProperties = filteredProperties ? [...filteredProperties].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "price") {
      comparison = a.pricePerMonth - b.pricePerMonth;
    } else if (sortBy === "rooms") {
      comparison = a.beds - b.beds;
    } else if (sortBy === "city") {
      comparison = (a.location.city || '').localeCompare(b.location.city || '');
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  }) : [];
  
  // Pagination logic
  const totalPages = Math.ceil(sortedProperties.length / itemsPerPage);
  const paginatedProperties = sortedProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCity, sortBy, sortOrder]);
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };
  
  // Check for authentication initialization
  if (!authInitialized) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 bg-blue-200 dark:bg-blue-800 rounded-full animate-pulse"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Initializing admin session...</p>
        </div>
      </div>
    );
  }

  // Check for authentication errors
  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg max-w-md text-center">
          <h3 className="font-semibold mb-2">Authentication Error</h3>
          <p className="text-sm">Your admin session could not be verified. Please sign in again.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push('/admin-login')} variant="default">
            Sign In
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Check for loading state
  if (authLoading || propertiesLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 bg-blue-200 dark:bg-blue-800 rounded-full animate-pulse"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading properties...</p>
        </div>
      </div>
    );
  }
  
  // Check for data loading errors
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg max-w-md text-center">
          <h3 className="font-semibold mb-2">Error Loading Properties</h3>
          <p className="text-sm">{(error as any)?.data?.message || "Failed to load properties. Please try again later."}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }
  
  // Check if auth user is available
  if (!authUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg max-w-md text-center">
          <h3 className="font-semibold mb-2">Admin Session Required</h3>
          <p className="text-sm">Please sign in with your admin credentials to view this page.</p>
        </div>
        <Button onClick={() => router.push('/admin-login')} variant="default">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Properties Management
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            View and manage all properties across the platform
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin')}
            className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs h-9 transition"
          >
            <Home className="mr-2 h-3.5 w-3.5" />
            Back to Dashboard
          </Button>
        </div>
      </div>
      
      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search properties, addresses, or landlords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-xl border-zinc-800 bg-zinc-900/80 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 rounded-xl border-zinc-800 bg-zinc-900 text-xs text-zinc-200 hover:bg-zinc-800 gap-2">
                <Filter className="h-3.5 w-3.5 text-zinc-400" />
                <span>{filterCity || "All Cities"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-zinc-800 bg-zinc-950 text-zinc-200 rounded-xl shadow-2xl">
              <DropdownMenuItem onClick={() => setFilterCity("")} className="text-xs hover:bg-zinc-900 cursor-pointer">
                All Cities
              </DropdownMenuItem>
              {cities.map((city) => (
                <DropdownMenuItem key={city} onClick={() => setFilterCity(city)} className="text-xs hover:bg-zinc-900 cursor-pointer">
                  {city}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as any)}
          >
            <SelectTrigger className="w-[180px] h-10 rounded-xl border-zinc-800 bg-zinc-900 text-xs text-zinc-200">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
                <span>Sort by: {sortBy}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-200 rounded-xl shadow-2xl">
              <SelectItem value="name" className="text-xs hover:bg-zinc-900 cursor-pointer">Name</SelectItem>
              <SelectItem value="price" className="text-xs hover:bg-zinc-900 cursor-pointer">Price</SelectItem>
              <SelectItem value="rooms" className="text-xs hover:bg-zinc-900 cursor-pointer">Number of Rooms</SelectItem>
              <SelectItem value="city" className="text-xs hover:bg-zinc-900 cursor-pointer">City</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortOrder}
            className="h-10 w-10 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>
      
      {/* Properties count */}
      <div className="text-xs text-zinc-400 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80 flex items-center">
        <Filter className="h-4 w-4 mr-2 text-blue-400" />
        Showing <span className="font-semibold mx-1 text-blue-400">{sortedProperties.length}</span> of <span className="font-semibold mx-1 text-blue-400">{properties?.length || 0}</span> properties
      </div>
      
      {/* Properties - Responsive Layout */}
      <Card className="border border-zinc-800/80 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden rounded-2xl">
        {/* Mobile Card Layout */}
        <div className="block lg:hidden bg-zinc-950">
          {paginatedProperties.length > 0 ? (
            <div className="divide-y divide-zinc-800/60 bg-zinc-950">
              {paginatedProperties.map((property) => (
                <div key={property.id} className="p-4 space-y-3 bg-zinc-950">
                  {/* Property Header */}
                  <div className="flex items-start gap-3">
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-900 border border-zinc-800">
                      {property.photoUrls && property.photoUrls.length > 0 ? (
                        <Image
                          src={property.photoUrls[0]}
                          alt={property.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="bg-zinc-900 h-full w-full flex items-center justify-center">
                          <Home className="h-6 w-6 text-zinc-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white truncate">{property.name}</div>
                      <div className="text-xs text-zinc-400">ID: {property.id}</div>
                      <Badge 
                        variant="outline"
                        className={
                          property.status === "Approved"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] mt-1"
                            : property.status === "Denied" || property.isDisabled
                              ? "border-rose-500/30 bg-rose-500/10 text-rose-400 text-[10px] mt-1"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] mt-1"
                        }
                      >
                        {property.isDisabled ? "Blocked" : (property.status || "Pending")}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Property Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <MapPin className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
                      <span className="truncate">{property.location.city || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <User className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
                      <span className="truncate">{property.manager.name || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <BedDouble className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{property.beds} beds</span>
                      <Bath className="h-3.5 w-3.5 text-zinc-500 ml-1" />
                      <span>{property.baths} baths</span>
                    </div>
                    <div className="font-semibold text-white">
                      R{property.pricePerMonth.toLocaleString()}/mo
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 min-w-[100px] rounded-xl border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-xs h-8"
                      onClick={() => router.push(`/admin/properties/${property.id}`)}
                    >
                      View Details
                    </Button>
                    
                    {property.status !== "Approved" && (
                      <Button 
                        size="sm" 
                        className="flex-1 min-w-[100px] rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs h-8"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/admin/properties/update-status`, { 
                              method: 'POST',
                              body: JSON.stringify({ id: property.id, status: 'Approved' })
                            });
                            if (!res.ok) throw new Error('Failed to approve property');
                            toast.success('Property approved successfully');
                            refetch();
                          } catch (err: any) {
                            toast.error(err.message);
                          }
                        }}
                      >
                        Approve
                      </Button>
                    )}

                    {property.status === "Pending" && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="flex-1 min-w-[100px] rounded-xl text-xs h-8"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/admin/properties/update-status`, { 
                              method: 'POST',
                              body: JSON.stringify({ id: property.id, status: 'Denied' })
                            });
                            if (!res.ok) throw new Error('Failed to deny property');
                            toast.success('Property denied');
                            refetch();
                          } catch (err: any) {
                            toast.error(err.message);
                          }
                        }}
                      >
                        Deny
                      </Button>
                    )}

                    {!property.isDisabled ? (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="flex-1 min-w-[100px] rounded-xl text-xs h-8"
                        onClick={async () => {
                          try {
                            const propId = property.id || (property as any)._id;
                            const res = await fetch(`/api/admin/properties/delete?id=${propId}`, { method: 'POST' });
                            if (!res.ok) {
                              const txt = await res.text();
                              throw new Error(txt || 'Failed to disable property');
                            }
                            toast.success('Property blocked successfully');
                            refetch();
                          } catch (err: any) {
                            console.error('Failed to block property', err);
                            toast.error(err?.message || 'Failed to block property');
                          }
                        }}
                      >
                        Block
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 min-w-[100px] rounded-xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs h-8"
                        onClick={async () => {
                          try {
                            const propId = property.id || (property as any)._id;
                            const res = await fetch(`/api/admin/properties/enable?id=${property.id}`, { method: 'POST' });
                            if (!res.ok) {
                              const txt = await res.text();
                              throw new Error(txt || 'Failed to unblock property');
                            }
                            toast.success('Property unblocked successfully');
                            refetch();
                          } catch (err: any) {
                            console.error('Failed to unblock property', err);
                            toast.error(err?.message || 'Failed to unblock property');
                          }
                        }}
                      >
                        Unblock
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500">
              {searchTerm || filterCity ? (
                <div className="flex flex-col items-center gap-2">
                  <Search className="h-8 w-8 text-zinc-600" />
                  <p className="text-xs">No properties match your search criteria</p>
                  <Button 
                    variant="link" 
                    className="text-xs text-blue-400"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterCity("");
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Building className="h-8 w-8 text-zinc-600" />
                  <p className="text-xs">No properties found in the system</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Table Layout - Pure Black Theme, No horizontal scroll */}
        <div className="hidden lg:block overflow-hidden bg-zinc-950">
          <Table containerClassName="overflow-hidden bg-zinc-950" className="w-full table-fixed border-collapse bg-zinc-950">
            <TableHeader className="bg-zinc-900/90 border-b border-zinc-800">
              <TableRow className="border-b border-zinc-800 bg-zinc-900/90 hover:bg-zinc-900/90">
                <TableHead className="w-[28%] text-xs font-semibold text-zinc-400 py-3.5 bg-zinc-900/90">Property</TableHead>
                <TableHead className="w-[24%] text-xs font-semibold text-zinc-400 py-3.5 bg-zinc-900/90">Location</TableHead>
                <TableHead className="w-[16%] text-xs font-semibold text-zinc-400 py-3.5 bg-zinc-900/90">Landlord</TableHead>
                <TableHead className="w-[10%] text-xs font-semibold text-zinc-400 py-3.5 bg-zinc-900/90">Rooms</TableHead>
                <TableHead className="w-[10%] text-xs font-semibold text-zinc-400 py-3.5 bg-zinc-900/90">Price</TableHead>
                <TableHead className="w-[6%] text-xs font-semibold text-zinc-400 py-3.5 bg-zinc-900/90">Status</TableHead>
                <TableHead className="w-[6%] text-right text-xs font-semibold text-zinc-400 py-3.5 bg-zinc-900/90">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-zinc-950 divide-y divide-zinc-800/60">
              {paginatedProperties.length > 0 ? (
                paginatedProperties.map((property) => (
                  <TableRow key={property.id} className="border-b border-zinc-800/60 bg-zinc-950 hover:bg-zinc-900/50 transition-colors">
                    <TableCell className="w-[28%] py-3.5 bg-transparent">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative h-11 w-11 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-900 border border-zinc-800">
                          {property.photoUrls && property.photoUrls.length > 0 ? (
                            <Image
                              src={property.photoUrls[0]}
                              alt={property.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Home className="h-5 w-5 text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-xs text-white truncate" title={property.name}>{property.name}</div>
                          <div className="text-[11px] text-zinc-500 font-mono truncate">
                            ID: {property.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[24%] py-3.5 bg-transparent">
                      <div className="flex items-start gap-1.5 min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-zinc-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-zinc-200 truncate" title={property.location.address || 'No address available'}>
                            {property.location.address || 'No address available'}
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate">
                            {property.location.city || 'Unknown'}{property.location.state ? `, ${property.location.state}` : ''}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[16%] py-3.5 bg-transparent">
                      <div 
                        className="flex items-center gap-1.5 min-w-0 cursor-pointer hover:text-blue-400 transition-colors"
                        onClick={() => router.push(`/admin/landlords/${property.manager.id}`)}
                      >
                        <User className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
                        <span className="text-xs text-zinc-300 truncate" title={property.manager.name}>{property.manager.name || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[10%] py-3.5 bg-transparent">
                      <div className="flex items-center gap-2 text-xs text-zinc-300">
                        <span className="flex items-center gap-1">
                          <BedDouble className="h-3.5 w-3.5 text-zinc-500" />
                          {property.beds}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="h-3.5 w-3.5 text-zinc-500" />
                          {property.baths}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[10%] py-3.5 bg-transparent">
                      <div className="font-semibold text-xs text-white">R{property.pricePerMonth.toLocaleString()}</div>
                      <div className="text-[10px] text-zinc-500">/month</div>
                    </TableCell>
                    <TableCell className="w-[6%] py-3.5 bg-transparent">
                      <Badge 
                        variant="outline"
                        className={
                          property.status === "Approved"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]"
                            : property.status === "Denied" || property.isDisabled
                              ? "border-rose-500/30 bg-rose-500/10 text-rose-400 text-[10px]"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px]"
                        }
                      >
                        {property.isDisabled ? "Blocked" : (property.status || "Pending")}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[6%] py-3.5 text-right bg-transparent">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="h-7 px-2.5 border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 hover:text-white rounded-lg">Actions</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-zinc-800 bg-zinc-950 text-zinc-200 rounded-xl shadow-2xl">
                          <DropdownMenuItem onSelect={async () => { router.push(`/admin/properties/${property.id}`); }} className="text-xs hover:bg-zinc-900 cursor-pointer">
                            View Details
                          </DropdownMenuItem>
                          
                          {property.status !== "Approved" && (
                            <DropdownMenuItem 
                              className="text-emerald-400 text-xs hover:bg-zinc-900 cursor-pointer"
                              onSelect={async () => {
                                try {
                                  const res = await fetch(`/api/admin/properties/update-status`, { 
                                    method: 'POST',
                                    body: JSON.stringify({ id: property.id, status: 'Approved' })
                                  });
                                  if (!res.ok) throw new Error('Failed to approve property');
                                  toast.success('Property approved successfully');
                                  refetch();
                                } catch (err: any) {
                                  toast.error(err.message);
                                }
                              }}
                            >
                              Approve Property
                            </DropdownMenuItem>
                          )}

                          {property.status === "Pending" && (
                            <DropdownMenuItem 
                              className="text-rose-400 text-xs hover:bg-zinc-900 cursor-pointer"
                              onSelect={async () => {
                                try {
                                  const res = await fetch(`/api/admin/properties/update-status`, { 
                                    method: 'POST',
                                    body: JSON.stringify({ id: property.id, status: 'Denied' })
                                  });
                                  if (!res.ok) throw new Error('Failed to deny property');
                                  toast.success('Property denied');
                                  refetch();
                                } catch (err: any) {
                                  toast.error(err.message);
                                }
                              }}
                            >
                              Deny Property
                            </DropdownMenuItem>
                          )}

                          {!property.isDisabled ? (
                            <DropdownMenuItem 
                              className="text-xs hover:bg-zinc-900 cursor-pointer text-rose-400"
                              onSelect={async () => {
                                try {
                                  const propId = property.id || (property as any)._id;
                                  const res = await fetch(`/api/admin/properties/delete?id=${propId}`, { method: 'POST' });
                                  if (!res.ok) {
                                    const txt = await res.text();
                                    throw new Error(txt || 'Failed to disable property');
                                  }
                                  toast.success('Property blocked successfully');
                                  refetch();
                                } catch (err: any) {
                                  console.error('Failed to block property', err);
                                  toast.error(err?.message || 'Failed to block property');
                                }
                              }}
                            >
                              Disable / Block Property
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              className="text-emerald-400 text-xs hover:bg-zinc-900 cursor-pointer"
                              onSelect={async () => {
                                try {
                                  const propId = property.id || (property as any)._id;
                                  const res = await fetch(`/api/admin/properties/enable?id=${propId}`, { method: 'POST' });
                                  if (!res.ok) {
                                    const txt = await res.text();
                                    throw new Error(txt || 'Failed to unblock property');
                                  }
                                  toast.success('Property unblocked successfully');
                                  refetch();
                                } catch (err: any) {
                                  console.error('Failed to unblock property', err);
                                  toast.error(err?.message || 'Failed to unblock property');
                                }
                              }}
                            >
                              Enable / Unblock Property
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="bg-zinc-950 hover:bg-zinc-950">
                  <TableCell colSpan={7} className="text-center py-12 text-zinc-500 bg-zinc-950">
                    {searchTerm || filterCity ? (
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-zinc-600" />
                        <p className="text-xs">No properties match your search criteria</p>
                        <Button 
                          variant="link" 
                          className="text-xs text-blue-400"
                          onClick={() => {
                            setSearchTerm("");
                            setFilterCity("");
                          }}
                        >
                          Clear filters
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Building className="h-8 w-8 text-zinc-600" />
                        <p className="text-xs">No properties found in the system</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {sortedProperties.length > itemsPerPage && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-950">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedProperties.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>
      
      {/* Property statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl hover:border-zinc-700 transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-400">Total Properties</p>
              <h3 className="text-3xl font-bold mt-1 text-white">{properties?.length || 0}</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Properties in database</p>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Building className="h-6 w-6" />
            </div>
          </div>
        </Card>
        
        <Card className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl hover:border-zinc-700 transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-400">Total Landlords</p>
              <h3 className="text-3xl font-bold mt-1 text-white">
                {properties ? new Set(properties.map(p => p.manager.name)).size : 0}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1">Verified managers</p>
            </div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <User className="h-6 w-6" />
            </div>
          </div>
        </Card>
        
        <Card className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl hover:border-zinc-700 transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-400">Average Rooms</p>
              <h3 className="text-3xl font-bold mt-1 text-white">
                {properties && properties.length > 0
                  ? (properties.reduce((sum, p) => sum + p.beds, 0) / properties.length).toFixed(1)
                  : 0}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1">Beds per accommodation</p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <BedDouble className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
