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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Student Directory</h1>
          <p className="text-xs text-zinc-400 mt-1">Manage registered student tenants, application history, and favorites.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push('/admin')}
          className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs h-9"
        >
          Back to Dashboard
        </Button>
      </div>

      <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            type="search"
            placeholder="Search students by name or email..."
            className="w-full h-10 rounded-xl border-zinc-800 bg-zinc-900/80 text-xs text-zinc-100 placeholder:text-zinc-500 pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoadingTenants ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-10 w-10 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
          <p className="mt-3 text-xs font-mono text-zinc-500">Loading student directory...</p>
        </div>
      ) : filteredTenants.length === 0 ? (
        <Card className="p-8 text-center rounded-2xl border border-zinc-800 bg-zinc-950/70">
          <p className="text-zinc-400 text-xs">No matching students found</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {paginatedTenants.map((tenant) => (
            <Card key={tenant.id} className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl hover:border-zinc-700/90 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-sm">{tenant.firstName} {tenant.lastName}</h3>
                    <Badge variant="outline" className="text-[10px] border-blue-500/30 bg-blue-500/10 text-blue-400 font-mono">STUDENT</Badge>
                  </div>
                  <div className="text-xs text-zinc-400 flex flex-col sm:flex-row sm:items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{tenant.email}</span>
                    </div>
                    {tenant.phoneNumber && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="font-mono">{tenant.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-[11px] border-zinc-800 bg-zinc-900 text-zinc-300">
                    {tenant.favoriteCount ?? 0} Favorites
                  </Badge>
                  <Badge variant="outline" className="text-[11px] border-zinc-800 bg-zinc-900 text-zinc-300">
                    {tenant.applicationCount ?? 0} Applications
                  </Badge>
                  <Badge variant="outline" className="text-[11px] border-zinc-800 bg-zinc-900 text-zinc-300">
                    {tenant.leaseCount ?? 0} Leases
                  </Badge>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-200 hover:text-white text-xs h-8"
                    onClick={() => viewTenantDetails(tenant)}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
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
