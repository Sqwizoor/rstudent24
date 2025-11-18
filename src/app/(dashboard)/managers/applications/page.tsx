"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  useGetApplicationsQuery,
  useGetAuthUserQuery,
  useUpdateApplicationStatusMutation,
  useGetPropertiesQuery
} from "@/state/api";
import { 
  CircleCheckBig, 
  Download, 
  Building, 
  Calendar, 
  Clock, 
  Filter, 
  User, 
  ChevronRight,
  X,
  Check,
  AlertCircle,
  MessageSquare
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
    id: number;
    status: 'Approved' | 'Denied' | 'Pending';
    applicationDate: string;
    user?: {
      firstName: string;
      lastName: string;
    };
    property: {
      id: number;
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
  handleStatusChange: (id: number, status: 'Approved' | 'Denied' | 'Pending') => Promise<void>;
}

const ApplicationItem = ({ application, handleStatusChange }: ApplicationItemProps) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => setExpanded(!expanded);

  // Format the application date
  const formattedDate = formatDistanceToNow(
    new Date(application.applicationDate),
    { addSuffix: true }
  );

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
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full dark:bg-gray-800 bg-gray-100 flex items-center justify-center">
                <User className="w-6 h-6 dark:text-gray-300 text-gray-600" />
              </div>
            </div>
            
            <div className="flex flex-col">
              <h3 className="font-medium dark:text-white text-gray-900">
                {application.user?.firstName} {application.user?.lastName}
              </h3>
              <div className="text-sm dark:text-gray-400 text-gray-500 flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formattedDate}
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
              <div className="px-4 pb-4 border-t dark:bg-slate-950 border-gray-200 pt-4">
                {/* Property Information */}
                <div className="mb-4 p-3 dark:bg-gray-800/50 bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                    <h4 className="font-medium dark:text-white text-gray-900">Property Details</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="dark:text-gray-400 text-gray-500">Name: </span>
                      <span className="dark:text-white text-gray-900">{application.property.name}</span>
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
                      <span className="dark:text-white text-gray-900">
                        R{application.room?.pricePerMonth?.toLocaleString('en-ZA') || application.property.pricePerMonth}
                      </span>
                    </div>
                    <div>
                      <span className="dark:text-gray-400 text-gray-500">Address: </span>
                      <span className="dark:text-white text-gray-900">{application.property.address}</span>
                    </div>
                  </div>
                </div>

                {/* Application Details */}
                <div className="mb-4 p-3 dark:bg-gray-800/50 bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CircleCheckBig className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                    <h4 className="font-medium dark:text-white text-gray-900">Application Details</h4>
                  </div>
                  <div className="text-sm">
                    <div className="mb-1">
                      <span className="dark:text-gray-400 text-gray-500">Application ID: </span>
                      <span className="dark:text-white text-gray-900">{application.id}</span>
                    </div>
                    <div className="mb-1">
                      <span className="dark:text-gray-400 text-gray-500">Submitted: </span>
                      <span className="dark:text-white text-gray-900">{new Date(application.applicationDate).toLocaleDateString()}</span>
                    </div>
                    <div className="mb-1">
                      <span className="dark:text-gray-400 text-gray-500">Status: </span>
                      <StatusBadge status={application.status} />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-4 justify-end">
                  <Link
                    href={`/managers/applications/${application.id}`}
                    className="dark:bg-blue-800 bg-blue-100 dark:border-blue-700 border-blue-200 dark:text-blue-200 text-blue-700 py-2 px-4 
                      rounded-md flex items-center justify-center dark:hover:bg-blue-700 hover:bg-blue-200 transition-colors text-sm"
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
                  
                  {application.status === "Approved" && (
                    <Button
                      className="dark:bg-gray-800 bg-gray-100 dark:border-gray-700 border-gray-200 dark:text-gray-200 text-gray-700 py-2 px-4
                      rounded-md flex items-center justify-center dark:hover:bg-gray-700 hover:bg-gray-200 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                  
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
                  
                  {application.status === "Denied" && (
                    <Button
                      className="dark:bg-gray-800 bg-gray-100 text-gray-700 dark:text-white py-2 px-4 rounded-md flex items-center
                      justify-center dark:hover:bg-gray-700 hover:bg-gray-200 transition-colors text-sm"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact User
                    </Button>
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
  const { data: authUser } = useGetAuthUserQuery();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const {
    data: applicationsList,
    isLoading,
    isError,
    error: applicationsError,
  } = useGetApplicationsQuery(
    {
      userId: authUser?.cognitoInfo?.userId,
      userType: "manager",
    },
    {
      skip: !authUser?.cognitoInfo?.userId || authUser?.userRole !== "manager",
    }
  );
  
  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();

  // Fetch property details for applications
  const { data: properties, error: propertiesError } = useGetPropertiesQuery(
    {}, // Use empty filter object since we want all properties for this manager
    { skip: !authUser?.cognitoInfo?.userId || authUser?.userRole !== "manager" }
  );

  const handleStatusChange = async (id: number, status: 'Approved' | 'Denied' | 'Pending') => {
    try {
      // Ensure status is capitalized correctly as the API expects
      const validStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      
      console.log('Updating application status:', { id, status: validStatus });
      
      // Send ID and status directly - the mutation will handle creating the request body
      const result = await updateApplicationStatus({ 
        id, 
        status: validStatus as 'Approved' | 'Denied' | 'Pending'
      }).unwrap();
      
      console.log('Status update successful:', result);
      toast.success(`Application ${validStatus.toLowerCase()}`);
    } catch (error) {
      console.error("Failed to update application status:", error);
      toast.error("Could not update application status. Please try again.");
    }
  };

  // Check for authentication and authorization errors
  if (!authUser) {
    return (
      <div className="min-h-screen dark:bg-slate-950 bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 dark:text-white text-gray-900">Authentication Required</h2>
          <p className="dark:text-gray-400 text-gray-600 mb-4">Please sign in to view applications.</p>
          <Link
            href="/signin"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (authUser?.userRole !== "manager") {
    return (
      <div className="min-h-screen dark:bg-slate-950 bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 dark:text-white text-gray-900">Access Denied</h2>
          <p className="dark:text-gray-400 text-gray-600">You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    );
  }

  // Filter applications based on tab and search term
  const filteredApplications = Array.isArray(applicationsList) ? applicationsList.filter((application) => {
    const matchesTab = activeTab === "all" || application.status.toLowerCase() === activeTab;
    
    if (!searchTerm) return matchesTab;
    
    // Use tenant's name if available
    const name = application.tenant ? `${application.tenant.firstName} ${application.tenant.lastName}`.toLowerCase() : '';
    // Access email from tenant object if available
    const email = application.tenant?.email?.toLowerCase() || '';
    // Try to find the property name if we have properties data
    const property = Array.isArray(properties) ? properties.find(p => p.id === application.propertyId) : null;
    const propertyName = property?.name?.toLowerCase() || '';
    
    const searchLower = searchTerm.toLowerCase();
    
    return matchesTab && (
      name.includes(searchLower) || 
      email.includes(searchLower) || 
      propertyName.includes(searchLower)
    );
  }) : [];

  // Transform applications to include the property object required by ApplicationItem
  const transformedApplications = Array.isArray(filteredApplications) ? filteredApplications.map(application => {
    // Find the matching property from our properties data
    const matchingProperty = Array.isArray(properties) ? properties.find(p => p.id === application.propertyId) : null;
    
    return {
      ...application,
      // Convert Date to string if needed
      applicationDate: application.applicationDate instanceof Date ? 
        application.applicationDate.toISOString() : application.applicationDate,
      // Add user object from tenant or fallback to undefined
      user: application.tenant ? {
        firstName: application.tenant.firstName || '',
        lastName: application.tenant.lastName || ''
      } : undefined,
      // Add property object
      property: matchingProperty ? {
        id: matchingProperty.id,
        name: matchingProperty.name || 'Unknown Property',
        pricePerMonth: 'pricePerMonth' in matchingProperty ? Number(matchingProperty.pricePerMonth) : 0,
        // Using locationId instead of location.address as the location object may not be populated in the API response
        address: matchingProperty.locationId ? `Property ID: ${matchingProperty.id}` : ''
      } : {
        id: application.propertyId,
        name: 'Unknown Property',
        pricePerMonth: 0,
        address: ''
      },
      // Add room object if it exists in the original application
      room: (application as any).room ? {
        name: (application as any).room.name || '',
        pricePerMonth: (application as any).room.pricePerMonth || 0
      } : undefined
    };
  }) : [];

  // Count applications by status
  const statusCounts = Array.isArray(filteredApplications) ? filteredApplications.reduce((acc: any, app: any) => {
    const status = app.status.toLowerCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}) : {};

  return (
    <div className="min-h-screen dark:bg-slate-950 dark:text-white bg-white text-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-center sm:text-left dark:text-white text-gray-900">Applications</h1>
          <p className="dark:text-gray-400 text-gray-500 text-center sm:text-left">
            View and manage applications for your properties
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by applicant or property name..."
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
                {applicationsList && applicationsList.length > 0 && (
                  <span className="ml-2 dark:bg-gray-800 bg-gray-200 dark:text-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {applicationsList.length}
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
            ) : isError ? (
              <div className="text-center p-8 dark:bg-red-900/20 bg-red-50 dark:border-red-800 border-red-200 rounded-lg">
                <AlertCircle className="w-10 h-10 dark:text-red-400 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium dark:text-red-300 text-red-700 mb-2">Error Loading Applications</h3>
                <p className="dark:text-gray-300 text-gray-700">There was an error fetching your applications. Please try again later.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(filteredApplications || []).length === 0 ? (
                  <div className="text-center p-8 dark:bg-gray-900/50 bg-gray-50 dark:border-gray-800 border-gray-200 rounded-lg">
                    <CircleCheckBig className="w-10 h-10 dark:text-gray-400 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-medium dark:text-gray-300 text-gray-700 mb-2">No Applications Found</h3>
                    <p className="dark:text-gray-400 text-gray-500">
                      {searchTerm 
                        ? "No applications match your search criteria." 
                        : activeTab !== "all" 
                          ? `You don&apos;t have any ${activeTab} applications.` 
                          : "You don&apos;t have any applications yet."}
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {(transformedApplications || []).map((application) => (
                      <ApplicationItem
                        key={application.id}
                        application={application}
                        handleStatusChange={handleStatusChange}
                      />
                    ))}
                  </AnimatePresence>
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
