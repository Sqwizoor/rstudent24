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
        // Configure admin authentication
        configureAdminAuth();
        
        // Verify authentication session
        const session = await fetchAuthSession();
        if (!session.tokens) {
          console.error("No valid auth session found");
          router.push("/admin-login");
          return;
        }
        
        setAuthInitialized(true);
      } catch (error) {
        console.error("Error initializing admin auth:", error);
        router.push("/admin-login");
      }
    };
    
    initAuth();
  }, [router]);
  
  // Only fetch data after auth is initialized
  const { data: authUser, isLoading: authLoading, error: authError } = useGetAuthUserQuery(undefined, {
    skip: !authInitialized
  });
  
  const { data: rawProperties, isLoading: propertiesLoading, error } = useGetAdminPropertiesQuery(undefined, {
    skip: !authInitialized || !authUser
  });
  
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
        // Add status field if missing
        status: typedProperty.status || 'available',
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
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-6 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Properties Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            View and manage all properties across the platform
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin')}
            className="border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
      
      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search properties, addresses, or landlords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                <span>{filterCity || "All Cities"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setFilterCity("")}>
                All Cities
              </DropdownMenuItem>
              {cities.map((city) => (
                <DropdownMenuItem key={city} onClick={() => setFilterCity(city)}>
                  {city}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as any)}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <span>Sort by: {sortBy}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="rooms">Number of Rooms</SelectItem>
              <SelectItem value="city">City</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortOrder}
            className="h-10 w-10"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>
      
      {/* Properties count */}
      <div className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center">
        <Filter className="h-4 w-4 mr-2 text-blue-500" />
        Showing <span className="font-semibold mx-1 text-blue-600 dark:text-blue-400">{sortedProperties.length}</span> of <span className="font-semibold mx-1 text-blue-600 dark:text-blue-400">{properties?.length || 0}</span> properties
      </div>
      
      {/* Properties - Responsive Layout */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
        {/* Mobile Card Layout */}
        <div className="block lg:hidden">
          {paginatedProperties.length > 0 ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedProperties.map((property) => (
                <div key={property.id} className="p-4 space-y-3">
                  {/* Property Header */}
                  <div className="flex items-start gap-3">
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                      {property.photoUrls && property.photoUrls.length > 0 ? (
                        <Image
                          src={property.photoUrls[0]}
                          alt={property.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="bg-slate-200 dark:bg-slate-700 h-full w-full flex items-center justify-center">
                          <Home className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{property.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">ID: {property.id}</div>
                      <Badge 
                        variant={
                          property.isDisabled
                            ? "destructive"
                            : property.status === "available"
                              ? "default"
                              : property.status === "rented"
                                ? "secondary"
                                : "outline"
                        }
                        className="mt-1"
                      >
                        {property.isDisabled ? "Blocked" : (property.status || "Available")}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Property Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{property.location.city || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{property.manager.name || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-slate-400" />
                      <span>{property.beds} beds</span>
                      <Bath className="h-4 w-4 text-slate-400 ml-2" />
                      <span>{property.baths} baths</span>
                    </div>
                    <div className="font-semibold text-blue-600 dark:text-blue-400">
                      R{property.pricePerMonth.toLocaleString()}/mo
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => router.push(`/admin/properties/${property.id}`)}
                    >
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="flex-1"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/admin/properties/delete?id=${property.id}`, { method: 'POST' });
                          if (!res.ok) {
                            const txt = await res.text();
                            throw new Error(txt || 'Failed to disable property');
                          }
                          toast.success('Property blocked successfully');
                          router.refresh();
                        } catch (err: any) {
                          console.error('Failed to block property', err);
                          toast.error(err?.message || 'Failed to block property');
                        }
                      }}
                    >
                      Disable
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              {searchTerm || filterCity ? (
                <div className="flex flex-col items-center gap-2">
                  <Search className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p>No properties match your search criteria</p>
                  <Button 
                    variant="link" 
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
                  <Building className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p>No properties found in the system</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Landlord</TableHead>
                <TableHead>Rooms</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProperties.length > 0 ? (
                paginatedProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
                          {property.photoUrls && property.photoUrls.length > 0 ? (
                            <Image
                              src={property.photoUrls[0]}
                              alt={property.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="bg-slate-200 dark:bg-slate-700 h-full w-full flex items-center justify-center">
                              <Home className="h-6 w-6 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{property.name}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            ID: {property.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm">{property.location.address || 'No address available'}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {property.location.city || 'Unknown'}{property.location.state ? `, ${property.location.state}` : ''}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span>{property.manager.name || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <BedDouble className="h-4 w-4 text-slate-400" />
                          <span>{property.beds}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="h-4 w-4 text-slate-400" />
                          <span>{property.baths}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">R{property.pricePerMonth.toLocaleString()}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">per month</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          property.isDisabled
                            ? "destructive"
                            : property.status === "available"
                              ? "default"
                              : property.status === "rented"
                                ? "secondary"
                                : "outline"
                        }
                      >
                        {property.isDisabled ? "Blocked" : (property.status || "Available")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">Actions</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={async () => {
                            try {
                              const res = await fetch(`/api/admin/properties/delete?id=${property.id}`, { method: 'POST' });
                              if (!res.ok) {
                                const txt = await res.text();
                                throw new Error(txt || 'Failed to disable property');
                              }
                              toast.success('Property blocked successfully');
                              router.refresh();
                            } catch (err: any) {
                              console.error('Failed to block property', err);
                              toast.error(err?.message || 'Failed to block property');
                            }
                          }}>
                            Disable / Block Property
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={async () => { router.push(`/admin/properties/${property.id}`); }}>
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500 dark:text-slate-400">
                    {searchTerm || filterCity ? (
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        <p>No properties match your search criteria</p>
                        <Button 
                          variant="link" 
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
                        <Building className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        <p>No properties found in the system</p>
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
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
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
        <Card className="border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-200 hover:shadow-lg group">
          <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 group-hover:from-blue-100 group-hover:to-blue-200 dark:group-hover:from-blue-900/30 dark:group-hover:to-blue-800/30 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Properties</p>
                <h3 className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{properties?.length || 0}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-200 dark:bg-blue-800/50 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
                <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-200 hover:shadow-lg group">
          <CardContent className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/20 group-hover:from-purple-100 group-hover:to-purple-200 dark:group-hover:from-purple-900/30 dark:group-hover:to-purple-800/30 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Landlords</p>
                <h3 className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">
                  {properties ? new Set(properties.map(p => p.manager.name)).size : 0}
                </h3>
              </div>
              <div className="h-12 w-12 bg-purple-200 dark:bg-purple-800/50 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
                <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-200 hover:shadow-lg group">
          <CardContent className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/20 group-hover:from-green-100 group-hover:to-green-200 dark:group-hover:from-green-900/30 dark:group-hover:to-green-800/30 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Rooms</p>
                <h3 className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
                  {properties && properties.length > 0
                    ? (properties.reduce((sum, p) => sum + p.beds, 0) / properties.length).toFixed(1)
                    : 0}
                </h3>
              </div>
              <div className="h-12 w-12 bg-green-200 dark:bg-green-800/50 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
                <BedDouble className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
