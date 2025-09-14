"use client";

import Header from "@/components/Header";
import { ApplicationsPageSkeleton } from "@/components/ui/skeletons";
import { useGetApplicationsQuery, useGetAuthUserQuery } from "@/state/api";
import { CircleCheckBig, Clock, Download, FileText, Home, XCircle } from "lucide-react";
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { Application, Room } from "@/types/prismaTypes";

const Applications = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const userRole = authUser?.userRole || '';
  const userId = authUser?.cognitoInfo?.userId;
  
  // Skip the API call if the user is a manager trying to access tenant routes
  const shouldSkipQuery = userRole === 'manager';
  
  const {
    data: applications,
    isLoading,
    isError,
  } = useGetApplicationsQuery({
    userId: userId,
    userType: userRole,
  }, { skip: shouldSkipQuery });
  
  // Early return with a message for managers
  if (userRole === 'manager') {
    return (
      <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header
          title="Applications"
          subtitle="This page is only accessible to tenants"
        />
        <div className="flex flex-col items-center justify-center p-12 mt-8 border border-gray-200 dark:border-gray-700 rounded-xl text-center bg-white dark:bg-gray-800">
          <FileText className="h-12 w-12 text-gray-500 dark:text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Access Restricted</h3>
          <p className="text-gray-600 dark:text-gray-400">As a property manager, you don&apos;t have access to the tenant applications page. Please use the manager dashboard to view applications for your properties.</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 hover:bg-green-200 dark:hover:bg-green-600/30">Approved</Badge>;
      case "Pending":
        return <Badge className="bg-yellow-100 dark:bg-yellow-600/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-500/20 hover:bg-yellow-200 dark:hover:bg-yellow-600/30">Pending</Badge>;
      case "Rejected":
        return <Badge className="bg-red-100 dark:bg-red-600/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:bg-red-200 dark:hover:bg-red-600/30">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 dark:bg-gray-600/20 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-500/20">Unknown</Badge>;
    }
  };

  if (isLoading) return <ApplicationsPageSkeleton />;
  if (isError) return <div>Error loading applications</div>;

  return (
    <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Header
        title="Applications"
        subtitle="Track and manage your property rental applications"
      />
      
      <div className="space-y-6 mt-8">
        {applications && applications.length > 0 ? (
          applications.map((application: Application) => (
            <Card key={application.id} className="border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden bg-white dark:bg-gray-800">
              <div className="flex flex-col md:flex-row">
                {/* Property Image - Reduced height, added padding and rounded corners */}
                <div className="relative md:w-1/4 h-28 md:h-auto p-2 overflow-hidden">
                  <div className="relative w-full h-full rounded-md overflow-hidden">
                    {application.property?.photoUrls?.[0] ? (
                      <Image
                        src={application.property.photoUrls[0] || "/placeholder.svg"}
                        alt={application.property.name}
                        fill
                        className="object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md">
                        <Home className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content - Reduced padding for more compact layout */}
                <div className="flex-1 p-4 flex flex-col">
                  {/* Status Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {application.property?.name || "Unknown Property"}
                        {application.room && (
                          <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                            - {application.room.name}
                          </span>
                        )}
                      </h3>
                      {getStatusBadge(application.status)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Submitted: {new Date(application.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="mb-3">
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      {application.property?.location.address}, {application.property?.location.city}
                    </p>
                    {application.room && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Room:</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">{application.room.name}</span>
                        {application.room.pricePerMonth && (
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            R{application.room.pricePerMonth.toLocaleString('en-ZA')}/month
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Details - Reduced padding for more compact layout */}
                  <div className="flex-1">
                    {application.status === "Approved" ? (
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md text-green-700 dark:text-green-300 flex items-center border border-green-200 dark:border-green-800/30 text-sm">
                        <CircleCheckBig className="w-4 h-4 mr-2 flex-shrink-0" />
                        <p>
                          Your application has been approved! The property is being rented by you until{" "}
                          <span className="font-semibold">
                            {new Date((application as any).lease?.endDate).toLocaleDateString()}
                          </span>
                        </p>
                      </div>
                    ) : application.status === "Pending" ? (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md text-yellow-700 dark:text-yellow-300 flex items-center border border-yellow-200 dark:border-yellow-800/30 text-sm">
                        <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                        <p>Your application is pending approval. We&apos;ll notify you once there&apos;s an update.</p>
                      </div>
                    ) : (
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-red-700 dark:text-red-300 flex items-center border border-red-200 dark:border-red-800/30 text-sm">
                        <XCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        <p>
                          Your application has been denied. You can apply to other properties or contact support for more
                          information.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions - Reduced top margin */}
                  <div className="mt-4 flex justify-end space-x-3">
                    <Link href={`/properties/${application.property?.id}`}>
                      <Button variant="outline" size="sm" className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                        View Property
                      </Button>
                    </Link>

                    {application.status === "Approved" && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Download className="w-3 h-3 mr-2" />
                        Download Agreement
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-12 mt-8 border border-gray-200 dark:border-gray-700 rounded-xl text-center bg-white dark:bg-gray-800">
            <FileText className="h-12 w-12 text-gray-500 dark:text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Applications Found</h3>
            <p className="text-gray-600 dark:text-gray-400">You haven&apos;t submitted any rental applications yet. Browse properties and apply for ones you&apos;re interested in.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;