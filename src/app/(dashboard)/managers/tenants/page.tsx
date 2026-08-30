"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetAuthUserQuery } from "@/state/api";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Home
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

// Define interfaces for type safety
interface Location {
  id: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface Property {
  id: number;
  title: string;
  address: string;
  location: Location;
}

interface Tenant {
  id: number;
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
  propertyDetails?: {
    id: number;
    title: string;
    address: string;
    city: string;
    status: string;
  };
  applicationStatus: string;
  applicationId: number;
}

// Custom hook to fetch tenants for a manager
const useGetManagerTenants = (managerId: string, skip: boolean) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchTenants = async () => {
      if (skip || !managerId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        let authHeaders = {};
        try {
          const { fetchAuthSession } = await import('aws-amplify/auth');
          const session = await fetchAuthSession();
          const idToken = session.tokens?.idToken?.toString();
          
          if (idToken) {
            authHeaders = {
              Authorization: `Bearer ${idToken}`
            };
          }
        } catch {
          // Continue with standard headers
        }
        
        const response = await fetch(`/api/managers/${managerId}/tenants`, {
          headers: {
            ...authHeaders
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTenants(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        console.warn("Tenants fetch:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTenants();
  }, [managerId, skip]);
  
  return { data: tenants, isLoading, error };
};

function ManagerTenantsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // Get authenticated unified user (Google, NextAuth, or Cognito)
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const managerId = (user as any)?.id || (user as any)?.sub || "";
  const userRole = user?.role?.toLowerCase() || (user as any)?.userRole?.toLowerCase() || "manager";
  
  // Get tenants for this manager
  const { 
    data: tenants, 
    isLoading: tenantsLoading, 
    error: tenantsError 
  } = useGetManagerTenants(
    managerId, 
    !managerId
  );
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  
  // Derived state - unique properties for filter dropdown
  const uniqueProperties = React.useMemo(() => {
    const properties = new Map();
    
    tenants?.forEach(tenant => {
      if (tenant.propertyDetails) {
        properties.set(tenant.propertyDetails.id, {
          id: tenant.propertyDetails.id,
          title: tenant.propertyDetails.title,
        });
      }
    });
    
    return Array.from(properties.values());
  }, [tenants]);
  
  // Filter tenants based on search and filters
  const filteredTenants = React.useMemo(() => {
    if (!tenants) return [];
    
    return tenants.filter(tenant => {
      // Search filter
      const searchMatch = 
        searchTerm === "" ||
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tenant.propertyDetails?.title || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const statusMatch = 
        statusFilter === "all" || 
        tenant.applicationStatus === statusFilter;
      
      // Property filter
      const propertyMatch = 
        propertyFilter === "all" || 
        (tenant.propertyDetails && tenant.propertyDetails.id.toString() === propertyFilter);
      
      return searchMatch && statusMatch && propertyMatch;
    });
  }, [tenants, searchTerm, statusFilter, propertyFilter]);
  
  // Loading state
  const isLoading = authLoading || tenantsLoading;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-10 w-10 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Check if authenticated
  if (!authLoading && !isAuthenticated && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <XCircle className="h-14 w-14 text-zinc-500 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Authentication Required</h1>
        <p className="text-xs text-zinc-400 mb-4 max-w-sm">Please sign in to view and manage your tenants.</p>
        <Button onClick={() => router.push("/signin")} className="rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold px-4 py-2">
          Go to Sign In
        </Button>
      </div>
    );
  }
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
            Unknown
          </Badge>
        );
    }
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className={cn(
          "text-3xl font-bold tracking-tight",
          isDark ? "text-white" : "text-slate-900"
        )}>
          Manage Tenants
        </h1>
        <Button 
          onClick={() => router.push('/managers/dashboard')}
          variant="outline"
        >
          Back to Dashboard
        </Button>
      </div>
      
      {/* Filters */}
      <Card className={cn(
        "shadow-sm",
        isDark ? "bg-gray-800" : "bg-white"
      )}>
        <CardHeader className="pb-2">
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter tenants by name, status, or property</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search tenants..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {uniqueProperties.map((property) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      {property.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPropertyFilter("all");
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tenants Table */}
      <Card className={cn(
        "shadow-sm",
        isDark ? "bg-gray-800" : "bg-white"
      )}>
        <CardHeader className="pb-2">
          <CardTitle>Tenants</CardTitle>
          <CardDescription>
            {filteredTenants.length} {filteredTenants.length === 1 ? "tenant" : "tenants"} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTenants.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium mb-1">No tenants found</h3>
              <p className="text-gray-500 mb-4">
                {tenants?.length ? "Try adjusting your filters" : "You don't have any tenants yet"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-full",
                            isDark ? "bg-blue-900/30" : "bg-blue-100"
                          )}>
                            <User className={cn(
                              "h-4 w-4",
                              isDark ? "text-blue-400" : "text-blue-600"
                            )} />
                          </div>
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-gray-500">{tenant.cognitoId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                            <span className="text-sm">{tenant.email}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                            <span className="text-sm">{tenant.phoneNumber || "Not provided"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.propertyDetails ? (
                          <div className="space-y-1">
                            <p className="font-medium">{tenant.propertyDetails.title}</p>
                            <p className="text-sm text-gray-500">
                              {tenant.propertyDetails.address}, {tenant.propertyDetails.city}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-500">No property assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(tenant.applicationStatus)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Tenant Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/managers/applications/${tenant.applicationId}`)}>
                              View Application
                            </DropdownMenuItem>
                            {tenant.propertyDetails && (
                              <DropdownMenuItem onClick={() => router.push(`/managers/properties/${tenant.propertyDetails?.id}`)}>
                                View Property
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => toast.info("Contact feature coming soon")}>
                              Contact Tenant
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ManagerTenantsPage;
