"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetAuthUserQuery, useGetAllTenantsQuery } from "@/state/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Dialog imports removed as we're using page navigation instead
import { Input } from "@/components/ui/input";
import { Search, Eye, Mail, Phone, UserRound, User2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

// Define Tenant type for TypeScript
type Tenant = {
  id: number;
  cognitoId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string; // Making phoneNumber optional since it might be undefined
  favoriteCount?: number;
  applicationCount?: number;
  leaseCount?: number;
};

// Define TenantDetails type for the detailed view
type TenantDetails = {
  tenantInfo: {
    id: number;
    cognitoId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    favoriteCount?: number;
    applicationCount?: number;
    leaseCount?: number;
  };
  favorites: {
    id: number;
    name: string;
    address: string;
    landlord: string;
    landlordId: number;
    landlordEmail: string;
    propertyId: number;
  }[];
  applications: {
    id: number;
    propertyName: string;
    propertyId: number;
    landlord: string;
    landlordId: number;
    landlordEmail: string;
    status: string;
    date: string;
  }[];
  leases: {
    id: number;
    propertyName: string;
    propertyId: number;
    landlord: string;
    landlordId: number;
    landlordEmail: string;
    startDate: string;
    endDate: string;
    rent: string;
  }[];
};

export default function StudentsPage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: authUser } = useGetAuthUserQuery();
  const { data: tenants, isLoading: isLoadingTenants } = useGetAllTenantsQuery();
  
  const router = useRouter();

  // Filter tenants and add additional client-side check
  const filteredTenants = tenants ? tenants.filter(tenant => {
    const fullName = `${tenant.firstName} ${tenant.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                         tenant.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Additional safety check - exclude any emails that look like manager accounts
    const isLikelyManager = tenant.email.includes('sqwizoor') || 
                           tenant.email.includes('manager') ||
                           tenant.name?.toLowerCase().includes('manager');
    
    return matchesSearch && !isLikelyManager;
  }) : [];

  // Pagination logic
  const totalPages = Math.ceil((filteredTenants?.length || 0) / itemsPerPage);
  const paginatedTenants = filteredTenants?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Navigate to student details page instead of showing a dialog
  const viewTenantDetails = (tenant: Tenant) => {
    router.push(`/admin/students/${tenant.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Student Management - Students/Tenants Only</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push('/admin')}
        >
          Back to Dashboard
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search students..."
            className="w-full bg-white dark:bg-slate-950 pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoadingTenants ? (
        <div className="flex justify-center items-center p-8">
          <div className="flex flex-col items-center space-y-3">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <p className="text-sm text-gray-500">Loading students/tenants from tenant table...</p>
          </div>
        </div>
      ) : tenants && tenants.length === 0 ? (
        <div className="text-center p-8 text-slate-500 dark:text-slate-400">
          <p>No students/tenants found in the tenant database table</p>
          <p className="text-sm mt-2">This page shows ONLY data from the Tenant model</p>
        </div>
      ) : filteredTenants.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm">No matching students found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {paginatedTenants.map((tenant) => (
            <Card key={tenant.id} className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{tenant.firstName} {tenant.lastName}</h3>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">STUDENT/TENANT</Badge>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{tenant.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{tenant.phoneNumber}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 md:gap-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                    {tenant.favoriteCount ?? 0} Favorites
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                    {tenant.applicationCount ?? 0} Applications
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                    {tenant.leaseCount ?? 0} Leases
                  </Badge>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-100"
                    onClick={() => viewTenantDetails(tenant)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {tenants && tenants.length > 0 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTenants.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* No dialog needed - we're using page navigation to /admin/students/[id] */}
    </div>
  );
}
