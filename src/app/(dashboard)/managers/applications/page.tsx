"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useQuery, useMutation } from "convex/react";
import { anyApi } from "convex/server";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { 
  CircleCheckBig, 
  Download, 
  Building, 
  Calendar, 
  Clock, 
  Filter, 
  User, 
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  AlertCircle,
  MessageSquare,
  Mail,
  Phone
} from "lucide-react";
import Link from "next/link";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const MIGRATED_LANDLORD_LOOKUP: Record<string, string> = {
  "manager@example.com": "70cca9cc-b0c1-7064-d6d6-8f92e52d4790",
  "banelesouthflow@gmail.com": "602ca91c-5001-70c7-a78a-e9b1e36ce93e",
  "info@maginvest.co.za": "e0ccb98c-e091-702a-0944-0c6416c31a2b",
  "alexsouthflow2@gmail.com": "708c39ec-60d1-70d6-bd79-286d43e5cf40",
  "marelismit@hotmail.com": "a0bcb94c-9021-70ba-90de-a0a8b41d12dc",
  "marketingadmin@mosaicgroup.co.za": "30bc291c-2021-70ee-bb87-d158fbaebee2",
  "matthieusnaith@gmail.com": "f07c499c-5051-70a6-1948-e5b0bc72b25e",
  "kian@conurban.co.za": "505ca9fc-c0c1-7068-94ff-fe61d5a3e8c0",
  "lenhlendaba@gmail.com": "000c092c-d031-7024-5b34-27ee476b4abb",
  "nicola.makuwa@icloud.com": "70bcd9cc-d0f1-70c0-4edc-6508f5254d5b",
  "lefufisha@gmail.com": "e0fc796c-0091-7016-4f0d-67b8a56c4d9c",
  "info@27cluver.co.za": "e00ce9ac-f031-70e5-2d3f-f88e95460f2b",
  "sibandablessed724@gmail.com": "208c796c-00b1-7015-d53a-ad27f2b677ff",
  "info@staysouthpoint.co.za": "50bc293c-c0c1-70b1-c593-4b2d2a4f1f40",
  "gina.moonsamy@gmail.com": "800cc96c-b091-70c2-7102-c338f616081c",
  "rosaliefloresfranco@gmail.com": "40ccb93c-60c1-70c0-bfe2-16551e4395a1",
  "princetinendi@yahoo.com": "e0bc69bc-e031-7009-14c9-c0f65dfad6d3",
  "lizen@cityprop.co.za": "40fc393c-a091-705e-7cab-c137b8a51f0d",
  "allistairem@gmail.com": "405c093c-2051-702e-e86d-8a625d775b0e",
  "infokiarashomestay@gmail.com": "d04cc9ac-1001-708d-2b4c-9d877fbdf21b",
  "shaeekahisra@gmail.com": "60fc69fc-7071-702c-c927-f70b14e6d334",
  "meevsuu@hotmail.com": "f04cb9ac-6041-7060-a1da-90eacad6fb62",
  "magitshimaanisa2@gmail.com": "e0ec19cc-c051-70ee-144b-01240730cf3f",
  "tsp.mjadu@gmail.com": "e0dc292c-d011-7071-e0de-4a65f863ebd7",
  "clip-plod-lesser@duck.com": "a0dc393c-a001-7078-2d0f-c1281d72a110",
  "wayne@centraladvisory.co.za": "407c79dc-c0f1-702e-e58e-1bcef352493d",
  "parklanejohn@hotmail.com": "e0fce95c-d081-7011-3934-5fe8e083a64d",
  "kmeyiswa021@student.wethinkcode.co.za": "80fc493c-50b1-70d9-15eb-ddf0684334dd",
  "unathindlovu28@gmail.com": "d04c697c-f061-7015-5342-9f4fd8909467",
  "angiep@louwcoetzee.co.za": "b00cb9ac-70f1-7079-8921-25cd4d45eabc",
  "zwelakhe.samuel@gmail.com": "101c293c-5081-7043-8179-30abb82807dc"
};

// Skeleton loader for applications
const ApplicationSkeleton = () => (
  <div className="w-full space-y-3">
    {[1, 2, 3].map((item) => (
      <Card key={item} className="p-4 border overflow-hidden dark:bg-gray-900/50 dark:border-gray-800 bg-white border-gray-200">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-3/4 dark:bg-gray-800 bg-gray-200" />
            <Skeleton className="h-6 w-16 dark:bg-gray-800 bg-gray-200 rounded-full" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-2/3 dark:bg-gray-800 bg-gray-200" />
            <Skeleton className="h-4 w-1/2 dark:bg-gray-800 bg-gray-200" />
          </div>
          <div className="flex justify-end gap-2">
            <Skeleton className="h-9 w-24 dark:bg-gray-800 bg-gray-200 rounded-md" />
            <Skeleton className="h-9 w-24 dark:bg-gray-800 bg-gray-200 rounded-md" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);

// Component for application status badge
interface StatusBadgeProps {
  status: 'Approved' | 'Denied' | 'Pending';
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig = {
    Approved: {
      color: "bg-green-500/20 text-green-400 border-green-500/50 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/50",
      icon: <Check className="w-3 h-3 mr-1" />
    },
    Denied: {
      color: "bg-red-500/20 text-red-400 border-red-500/50 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/50",
      icon: <X className="w-3 h-3 mr-1" />
    },
    Pending: {
      color: "bg-amber-500/20 text-amber-400 border-amber-500/50 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/50",
      icon: <Clock className="w-3 h-3 mr-1" />
    }
  };

  const config = statusConfig[status] || statusConfig.Pending;

  return (
    <Badge className={`px-2 py-1 ${config.color} flex items-center font-medium`}>
      {config.icon}
      {status}
    </Badge>
  );
};

// Main application card component
interface ApplicationItemProps {
  application: {
    id: number | string;
    status: 'Approved' | 'Denied' | 'Pending';
    applicationDate: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    message?: string;
    user?: {
      firstName: string;
      lastName: string;
    };
    property: {
      id: number | string;
      name: string;
      unit?: string;
      pricePerMonth: number;
      address: string;
    };
    room?: {
      name: string;
      pricePerMonth: number;
    };
  };
  handleStatusChange: (id: number | string, status: 'Approved' | 'Denied' | 'Pending') => Promise<void>;
}

const ApplicationItem = ({ application, handleStatusChange }: ApplicationItemProps) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => setExpanded(!expanded);

  // Format the application date safely
  let formattedDate = "Recently";
  try {
    if (application.applicationDate) {
      formattedDate = formatDistanceToNow(
        new Date(application.applicationDate),
        { addSuffix: true }
      );
    }
  } catch {
    formattedDate = "Recently";
  }

  const applicantDisplayName = (application.user?.firstName || application.user?.lastName)
    ? `${application.user?.firstName || ''} ${application.user?.lastName || ''}`.trim()
    : (application.name || "Student");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="overflow-hidden dark:bg-slate-950 dark:border-gray-800 bg-white border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-gray-700 dark:hover:border-gray-700">
        {/* Card Header - Always visible */}
        <div 
          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
          onClick={toggleExpand}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full dark:bg-gray-800 bg-gray-100 flex items-center justify-center">
                <User className="w-6 h-6 dark:text-gray-300 text-gray-600" />
              </div>
            </div>
            
            <div className="flex flex-col">
              <h3 className="font-semibold text-base dark:text-white text-gray-900">
                {applicantDisplayName}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm dark:text-gray-400 text-gray-500">
                <span className="flex items-center">
                  <Building className="w-3.5 h-3.5 mr-1 text-blue-500" />
                  {application.property.name}
                </span>
                <span className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={application.status} />
            <ChevronRight className={`w-5 h-5 dark:text-gray-500 text-gray-400 transition-transform duration-300 ${expanded ? "rotate-90" : ""}`} />
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t dark:bg-slate-950 border-gray-200 pt-4 space-y-4">
                {/* Applicant Contact Details */}
                <div className="p-3 dark:bg-gray-800/50 bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 dark:text-blue-400 text-blue-600" />
                    <h4 className="font-medium dark:text-white text-gray-900">Applicant Details</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="dark:text-gray-400 text-gray-500">Full Name: </span>
                      <span className="dark:text-white text-gray-900 font-medium">{applicantDisplayName}</span>
                    </div>
                    {application.email && (
                      <div>
                        <span className="dark:text-gray-400 text-gray-500">Email: </span>
                        <a href={`mailto:${application.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                          {application.email}
                        </a>
                      </div>
                    )}
                    {application.phoneNumber && (
                      <div>
                        <span className="dark:text-gray-400 text-gray-500">Phone: </span>
                        <a href={`tel:${application.phoneNumber}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                          {application.phoneNumber}
                        </a>
                      </div>
                    )}
                    {application.message && (
                      <div className="sm:col-span-2 pt-1 border-t dark:border-gray-700/60 border-gray-200">
                        <span className="dark:text-gray-400 text-gray-500">Message from student: </span>
                        <p className="dark:text-gray-200 text-gray-800 italic mt-0.5">&ldquo;{application.message}&rdquo;</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Property Information */}
                <div className="p-3 dark:bg-gray-800/50 bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                    <h4 className="font-medium dark:text-white text-gray-900">Property Details</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="dark:text-gray-400 text-gray-500">Property: </span>
                      <span className="dark:text-white text-gray-900 font-medium">{application.property.name}</span>
                    </div>
                    {application.room ? (
                      <div>
                        <span className="dark:text-gray-400 text-gray-500">Room: </span>
                        <span className="dark:text-white text-gray-900">{application.room.name}</span>
                      </div>
                    ) : (
                      <div>
                        <span className="dark:text-gray-400 text-gray-500">Unit: </span>
                        <span className="dark:text-white text-gray-900">{application.property.unit || "N/A"}</span>
                      </div>
                    )}
                    <div>
                      <span className="dark:text-gray-400 text-gray-500">Monthly Rent: </span>
                      <span className="dark:text-white text-gray-900 font-semibold">
                        R{application.room?.pricePerMonth?.toLocaleString('en-ZA') || application.property.pricePerMonth?.toLocaleString('en-ZA')}
                      </span>
                    </div>
                    <div>
                      <span className="dark:text-gray-400 text-gray-500">Address: </span>
                      <span className="dark:text-white text-gray-900">{application.property.address}</span>
                    </div>
                  </div>
                </div>

                {/* Application Details */}
                <div className="p-3 dark:bg-gray-800/50 bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CircleCheckBig className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                    <h4 className="font-medium dark:text-white text-gray-900">Application Info</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="dark:text-gray-400 text-gray-500">ID: </span>
                      <span className="dark:text-white text-gray-900 font-mono text-xs">{application.id}</span>
                    </div>
                    <div>
                      <span className="dark:text-gray-400 text-gray-500">Submitted: </span>
                      <span className="dark:text-white text-gray-900">
                        {application.applicationDate ? new Date(application.applicationDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 justify-end">
                  <Link
                    href={`/managers/applications/${application.id}`}
                    className="dark:bg-blue-800 bg-blue-100 dark:border-blue-700 border-blue-200 dark:text-blue-200 text-blue-700 py-2 px-4 
                      rounded-md flex items-center justify-center dark:hover:bg-blue-700 hover:bg-blue-200 transition-colors text-sm font-medium"
                    scroll={false}
                  >
                    <CircleCheckBig className="w-4 h-4 mr-2" />
                    View Details
                  </Link>

                  <Link
                    href={`/managers/properties/${application.property.id}`}
                    className="dark:bg-gray-800 bg-gray-100 dark:border-gray-700 border-gray-200 dark:text-gray-200 text-gray-700 py-2 px-4 
                      rounded-md flex items-center justify-center dark:hover:bg-gray-700 hover:bg-gray-200 transition-colors text-sm"
                    scroll={false}
                  >
                    <Building className="w-4 h-4 mr-2" />
                    View Property
                  </Link>
                  
                  {application.status === "Pending" && (
                    <div className="flex gap-2">
                      <Button
                        className="px-4 py-2 text-sm text-white bg-green-700 rounded hover:bg-green-600 transition-colors"
                        onClick={() => handleStatusChange(application.id, "Approved")}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        className="px-4 py-2 text-sm text-white bg-red-700 rounded hover:bg-red-600 transition-colors"
                        onClick={() => handleStatusChange(application.id, "Denied")}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Deny
                      </Button>
                    </div>
                  )}
                  
                  {application.email && (
                    <a
                      href={`mailto:${application.email}`}
                      className="dark:bg-gray-800 bg-gray-100 text-gray-700 dark:text-white py-2 px-4 rounded-md flex items-center
                      justify-center dark:hover:bg-gray-700 hover:bg-gray-200 transition-colors text-sm"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Student
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// Applications Page Component
const Applications = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const managerId = (user as any)?.id || (user as any)?.sub || "";
  const managerEmail = user?.email || "";
  const migratedId = managerEmail ? MIGRATED_LANDLORD_LOOKUP[managerEmail.toLowerCase()] : undefined;

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // ── Convex Live Queries for Applications ──
  // @ts-ignore
  const convexAppsById = useQuery(
    anyApi.applications.getManagerApplications,
    managerId ? { managerId } : "skip"
  );
  // @ts-ignore
  const convexAppsByEmail = useQuery(
    anyApi.applications.getManagerApplications,
    managerEmail && managerEmail !== managerId ? { managerId: managerEmail } : "skip"
  );
  // @ts-ignore
  const convexAppsByMigratedId = useQuery(
    anyApi.applications.getManagerApplications,
    migratedId && migratedId !== managerId && migratedId !== managerEmail ? { managerId: migratedId } : "skip"
  );

  // ── Convex Live Queries for Properties ──
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

  const properties = useMemo(() => {
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

  // Direct Convex mutation for status update
  const updateStatusMutation = useMutation(anyApi.applications.updateApplicationStatus);

  // Combine and deduplicate applications from Convex
  const allApplications = useMemo(() => {
    const list = [
      ...(Array.isArray(convexAppsById) ? convexAppsById : []),
      ...(Array.isArray(convexAppsByEmail) ? convexAppsByEmail : []),
      ...(Array.isArray(convexAppsByMigratedId) ? convexAppsByMigratedId : []),
    ];

    const seen = new Set<string>();
    const unique: any[] = [];
    for (const app of list) {
      const id = String(app._id || app.id);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      unique.push(app);
    }

    // Sort descending by date
    unique.sort((a, b) => {
      const dateA = new Date(a.applicationDate || a.createdAt || a._creationTime || 0).getTime();
      const dateB = new Date(b.applicationDate || b.createdAt || b._creationTime || 0).getTime();
      return dateB - dateA;
    });

    return unique;
  }, [convexAppsById, convexAppsByEmail, convexAppsByMigratedId]);

  const isLoading = (convexAppsById === undefined && convexAppsByEmail === undefined);

  const handleStatusChange = async (id: number | string, status: 'Approved' | 'Denied' | 'Pending') => {
    try {
      const validStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      console.log('Updating application status via Convex:', { id, status: validStatus });
      
      await updateStatusMutation({ 
        applicationId: String(id), 
        status: validStatus
      });
      
      toast.success(`Application ${validStatus.toLowerCase()}`);
    } catch (error) {
      console.error("Failed to update application status:", error);
      toast.error("Could not update application status. Please try again.");
    }
  };

  // Reset page to 1 when search or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // Filter applications based on tab and search term
  const filteredApplications = useMemo(() => {
    return allApplications.filter((application) => {
      const matchesTab = activeTab === "all" || (application.status || "").toLowerCase() === activeTab;
      
      if (!searchTerm) return matchesTab;
      
      const searchLower = searchTerm.toLowerCase();
      const name = (application.name || 
        (application.tenant ? `${application.tenant.firstName || ''} ${application.tenant.lastName || ''}` : '') ||
        (application.user ? `${application.user.firstName || ''} ${application.user.lastName || ''}` : '')).toLowerCase();
      const email = (application.email || application.tenant?.email || '').toLowerCase();
      const phone = (application.phoneNumber || application.tenant?.phoneNumber || '').toLowerCase();
      const property = application.property || (Array.isArray(properties) ? properties.find((p: any) => String(p.id) === String(application.propertyId)) : null);
      const propertyName = (property?.name || property?.title || '').toLowerCase();
      const address = (property?.address || property?.location?.address || property?.location?.city || '').toLowerCase();
      
      return matchesTab && (
        name.includes(searchLower) || 
        email.includes(searchLower) || 
        phone.includes(searchLower) ||
        propertyName.includes(searchLower) ||
        address.includes(searchLower)
      );
    });
  }, [allApplications, activeTab, searchTerm, properties]);

  // Transform applications to include property and user structures
  const transformedApplications = useMemo(() => {
    return filteredApplications.map((application: any) => {
      const matchingProperty = Array.isArray(properties)
        ? properties.find((p: any) => String(p.id) === String(application.propertyId))
        : null;

      const propSource = application.property || matchingProperty;
      const propertyName = propSource?.name || propSource?.title || "Student Accommodation";
      const propertyAddress = propSource?.address || 
        propSource?.location?.address || 
        (propSource?.location?.city ? `${propSource.location.city}` : "South Africa");
      const pricePerMonth = Number(propSource?.pricePerMonth ?? propSource?.price ?? 0);

      const applicantName = application.name || 
        (application.tenant ? `${application.tenant.firstName || ''} ${application.tenant.lastName || ''}`.trim() : '') ||
        (application.user ? `${application.user.firstName || ''} ${application.user.lastName || ''}`.trim() : '') ||
        "Student";

      return {
        ...application,
        id: application._id || application.id,
        name: applicantName,
        email: application.email || application.tenant?.email || "",
        phoneNumber: application.phoneNumber || application.tenant?.phoneNumber || "",
        message: application.message || "",
        applicationDate: application.applicationDate instanceof Date
          ? application.applicationDate.toISOString()
          : (application.applicationDate || new Date(application.createdAt || application._creationTime || Date.now()).toISOString()),
        user: {
          firstName: applicantName.split(' ')[0] || "Student",
          lastName: applicantName.split(' ').slice(1).join(' ') || "",
        },
        property: {
          id: propSource?._id || propSource?.id || application.propertyId,
          name: propertyName,
          unit: propSource?.unit || "N/A",
          pricePerMonth,
          address: propertyAddress,
        },
        room: application.room ? {
          name: application.room.name || '',
          pricePerMonth: application.room.pricePerMonth || 0,
        } : undefined,
      };
    });
  }, [filteredApplications, properties]);

  // Pagination calculation
  const totalPages = Math.ceil(transformedApplications.length / itemsPerPage) || 1;
  const paginatedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return transformedApplications.slice(startIndex, startIndex + itemsPerPage);
  }, [transformedApplications, currentPage, itemsPerPage]);

  // Count applications by status from total pool
  const statusCounts = useMemo(() => {
    return allApplications.reduce((acc: any, app: any) => {
      const status = (app.status || "").toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [allApplications]);

  // Check for authentication and authorization errors
  if (!authLoading && !isAuthenticated && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <AlertCircle className="w-14 h-14 text-zinc-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
        <p className="text-xs text-zinc-400 mb-4 max-w-sm">Please sign in as a landlord or manager to view student applications.</p>
        <Link
          href="/signin"
          className="inline-flex items-center px-4 py-2 bg-white text-black text-xs font-semibold rounded-xl hover:bg-zinc-200 transition-colors"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-slate-950 dark:text-white bg-white text-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-center sm:text-left dark:text-white text-gray-900">
              Applications
            </h1>
            <p className="dark:text-gray-400 text-gray-500 text-center sm:text-left">
              View and manage student applications for all your properties
            </p>
          </div>
          {allApplications.length > 0 && (
            <div className="text-center sm:text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400">Total Applications</span>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{allApplications.length}</p>
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by student name, email, phone, or property..."
              className="w-full dark:bg-gray-900 bg-gray-50 dark:border-gray-800 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 dark:text-gray-500 text-gray-400 dark:hover:text-gray-300 hover:text-gray-600"
                onClick={() => setSearchTerm("")}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="sm:flex-shrink-0">
            <Button 
              className="w-full sm:w-auto dark:bg-gray-800 bg-gray-100 dark:border-gray-700 border-gray-200 dark:text-gray-200 text-gray-700 py-2 px-4 
                rounded-md flex items-center justify-center dark:hover:bg-gray-700 hover:bg-gray-200 transition-colors"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Mobile-optimized Tabs */}
        <div className="mb-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="flex overflow-x-auto scrollbar-hide dark:bg-gray-900/50 bg-gray-100 rounded-lg p-1 mb-6">
              <TabsTrigger 
                value="all" 
                className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md py-2 px-4"
              >
                All
                {allApplications.length > 0 && (
                  <span className="ml-2 dark:bg-gray-800 bg-gray-200 dark:text-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {allApplications.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="pending" 
                className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md py-2 px-4"
              >
                Pending
                {statusCounts.pending > 0 && (
                  <span className="ml-2 dark:bg-amber-900/50 bg-amber-100 dark:text-amber-300 text-amber-700 px-2 py-0.5 rounded-full text-xs">
                    {statusCounts.pending}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="approved" 
                className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md py-2 px-4"
              >
                Approved
                {statusCounts.approved > 0 && (
                  <span className="ml-2 dark:bg-green-900/50 bg-green-100 dark:text-green-300 text-green-700 px-2 py-0.5 rounded-full text-xs">
                    {statusCounts.approved}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="denied" 
                className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md py-2 px-4"
              >
                Denied
                {statusCounts.denied > 0 && (
                  <span className="ml-2 dark:bg-red-900/50 bg-red-100 dark:text-red-300 text-red-700 px-2 py-0.5 rounded-full text-xs">
                    {statusCounts.denied}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Application List */}
            {isLoading ? (
              <ApplicationSkeleton />
            ) : (
              <div className="space-y-4">
                {transformedApplications.length === 0 ? (
                  <div className="text-center p-8 dark:bg-gray-900/50 bg-gray-50 dark:border-gray-800 border-gray-200 rounded-lg">
                    <CircleCheckBig className="w-10 h-10 dark:text-gray-400 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-medium dark:text-gray-300 text-gray-700 mb-2">No Applications Found</h3>
                    <p className="dark:text-gray-400 text-gray-500">
                      {searchTerm 
                        ? "No applications match your search criteria." 
                        : activeTab !== "all" 
                          ? `You don't have any ${activeTab} applications.` 
                          : "You don't have any applications yet."}
                    </p>
                  </div>
                ) : (
                  <>
                    <AnimatePresence>
                      {paginatedApplications.map((application) => (
                        <ApplicationItem
                          key={String(application.id)}
                          application={application}
                          handleStatusChange={handleStatusChange}
                        />
                      ))}
                    </AnimatePresence>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t dark:border-gray-800 border-gray-200">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                          {Math.min(currentPage * itemsPerPage, transformedApplications.length)} of{" "}
                          {transformedApplications.length} applications
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            className="dark:bg-gray-900 dark:border-gray-800 border-gray-200"
                          >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                          </Button>
                          <span className="px-3 py-1 text-sm font-medium dark:text-gray-300 text-gray-700">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            className="dark:bg-gray-900 dark:border-gray-800 border-gray-200"
                          >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Applications;
