"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useGetApplicationsQuery, useGetAuthUserQuery, useGetManagerPropertiesQuery } from "@/state/api";
import { Building2, Users, FileText, CreditCard, AlertCircle, LogOut, BarChart, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface Property {
  status: string;
}

interface Application {
  status: string;
  property?: {
    title: string;
  };
  tenant?: {
    name: string;
  };
}

function ManagerDashboard() {
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // Get manager properties
  const { data: properties, isLoading: propertiesLoading } = useGetManagerPropertiesQuery(
    authUser?.cognitoInfo?.userId || "", 
    { skip: !authUser?.cognitoInfo?.userId || authUser?.userRole === "tenant" }
  );
  
  // Fetch applications for this manager
  const { data: applicationData, isLoading: applicationsLoading } = useGetApplicationsQuery(
    { userId: authUser?.cognitoInfo?.userId || "", userType: "manager" },
    { skip: !authUser?.cognitoInfo?.userId || authUser?.userRole !== "manager" }
  );
  
  // Process applications data
  const applications = (applicationData || []).filter(app => app.status === 'Pending');
  const tenants: { name: string; property: string; status: string }[] = [];
  
  const isLoading = authLoading || propertiesLoading || applicationsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-12 w-12 bg-blue-200 dark:bg-blue-800 rounded-full animate-pulse"></div>
      </div>
    );
  }

  // Calculate statistics
  const totalProperties = properties?.length || 0;
  // Since 'status' doesn't exist on the Property type, we'll assume all properties are available
  // In a real implementation, you might want to check if a property has active leases
  const availableProperties = properties?.length || 0; // Assuming all properties are available for now
  const totalApplications = applications?.length || 0;
  const pendingApplications = applications?.filter(app => app.status === 'Pending')?.length || 0;
  const totalTenants = 0; // Mock data for now
  const occupancyRate = totalProperties > 0 
    ? Math.round(((totalProperties - availableProperties) / totalProperties) * 100) 
    : 0;

  // Define stats cards for the dashboard
  const statsCards = [
    {
      title: "Total Properties",
      value: totalProperties,
      icon: Building2,
      description: "Properties under management",
      color: "blue"
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate}%`,
      icon: BarChart,
      description: "Of properties occupied",
      color: "green"
    },
    {
      title: "Total Applications",
      value: totalApplications,
      icon: FileText,
      description: `${pendingApplications} pending review`,
      color: "amber"
    },
    {
      title: "Total Tenants",
      value: totalTenants,
      icon: Users,
      description: "Active tenant accounts",
      color: "purple"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <h1 className={cn(
          "text-3xl font-bold tracking-tight",
          isDark ? "text-white" : "text-slate-900"
        )}>
          Manager Dashboard
        </h1>
        <div className="flex items-center space-x-4">
          <span className={cn(
            "text-sm",
            isDark ? "text-slate-400" : "text-slate-600"
          )}>
            Welcome, <span className={cn(
              "font-medium",
              isDark ? "text-white" : "text-slate-900"
            )}>{authUser?.userInfo?.name || authUser?.userInfo?.email}</span>
          </span>
          <button 
            onClick={() => router.push('/logout')}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
              isDark 
                ? "bg-red-900/30 hover:bg-red-900/50 text-red-400" 
                : "bg-red-100 hover:bg-red-200 text-red-600"
            )}
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Properties */}
        <Card className={cn(
          "p-4 shadow-sm hover:shadow-md transition-shadow",
          isDark ? "bg-gray-800" : "bg-white"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className={cn(
                "text-sm font-medium",
                isDark ? "text-slate-400" : "text-slate-600"
              )}>Total Properties</p>
              <h3 className={cn(
                "text-2xl font-bold",
                isDark ? "text-white" : "text-slate-900"
              )}>{totalProperties}</h3>
            </div>
            <div className={cn(
              "p-2 rounded-full",
              isDark ? "bg-blue-900/30" : "bg-blue-100"
            )}>
              <Building2 className={cn(
                "w-6 h-6",
                isDark ? "text-blue-400" : "text-blue-600"
              )} />
            </div>
          </div>
          <button 
            onClick={() => router.push('/managers/properties')}
            className={cn(
              "mt-4 text-sm hover:underline",
              isDark ? "text-blue-400" : "text-blue-600"
            )}
          >
            View all properties
          </button>
        </Card>

        {/* Pending Applications */}
        <Card className={cn(
          "p-4 shadow-sm hover:shadow-md transition-shadow",
          isDark ? "bg-gray-800" : "bg-white"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className={cn(
                "text-sm font-medium",
                isDark ? "text-slate-400" : "text-slate-600"
              )}>Pending Applications</p>
              <h3 className={cn(
                "text-2xl font-bold",
                isDark ? "text-white" : "text-slate-900"
              )}>{pendingApplications}</h3>
            </div>
            <div className={cn(
              "p-2 rounded-full",
              isDark ? "bg-yellow-900/30" : "bg-yellow-100"
            )}>
              <FileText className={cn(
                "w-6 h-6",
                isDark ? "text-yellow-400" : "text-yellow-600"
              )} />
            </div>
          </div>
          <button 
            onClick={() => router.push('/managers/applications')}
            className={cn(
              "mt-4 text-sm hover:underline",
              isDark ? "text-blue-400" : "text-blue-600"
            )}
          >
            View applications
          </button>
        </Card>

        {/* Total Tenants */}
        <Card className={cn(
          "p-4 shadow-sm hover:shadow-md transition-shadow",
          isDark ? "bg-gray-800" : "bg-white"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className={cn(
                "text-sm font-medium",
                isDark ? "text-slate-400" : "text-slate-600"
              )}>Total Tenants</p>
              <h3 className={cn(
                "text-2xl font-bold",
                isDark ? "text-white" : "text-slate-900"
              )}>{totalTenants}</h3>
            </div>
            <div className={cn(
              "p-2 rounded-full",
              isDark ? "bg-green-900/30" : "bg-green-100"
            )}>
              <Users className={cn(
                "w-6 h-6",
                isDark ? "text-green-400" : "text-green-600"
              )} />
            </div>
          </div>
          <button 
            onClick={() => router.push('/managers/tenants')}
            className={cn(
              "mt-4 text-sm hover:underline",
              isDark ? "text-blue-400" : "text-blue-600"
            )}
          >
            View all tenants
          </button>
        </Card>

        {/* Available Properties */}
        <Card className={cn(
          "p-4 shadow-sm hover:shadow-md transition-shadow",
          isDark ? "bg-gray-800" : "bg-white"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className={cn(
                "text-sm font-medium",
                isDark ? "text-slate-400" : "text-slate-600"
              )}>Available Properties</p>
              <h3 className={cn(
                "text-2xl font-bold",
                isDark ? "text-white" : "text-slate-900"
              )}>{availableProperties}</h3>
            </div>
            <div className={cn(
              "p-2 rounded-full",
              isDark ? "bg-purple-900/30" : "bg-purple-100"
            )}>
              <Building2 className={cn(
                "w-6 h-6",
                isDark ? "text-purple-400" : "text-purple-600"
              )} />
            </div>
          </div>
          <button 
            onClick={() => router.push('/managers/properties?status=available')}
            className={cn(
              "mt-4 text-sm hover:underline",
              isDark ? "text-blue-400" : "text-blue-600"
            )}
          >
            View available properties
          </button>
        </Card>
      </div>

      {/* Additional Management Features */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Property Management</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Add Property */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => router.push('/managers/properties/new')}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Add New Property</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">List a new property for rent</p>
              </div>
            </div>
          </Card>
          
          {/* View Applications */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/managers/applications')}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <FileText className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Review Applications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">View and manage tenant applications</p>
              </div>
            </div>
          </Card>
          
          {/* Manage Tenants */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/managers/tenants')}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Manage Tenants</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">View and manage current tenants</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className={cn(
        isDark 
          ? "bg-slate-900 border-slate-800" 
          : "bg-white border-slate-200"
      )}>
        <CardHeader>
          <CardTitle className={cn(
            isDark ? "text-white" : "text-slate-900"
          )}>
            Quick Actions
          </CardTitle>
          <CardDescription className={cn(
            isDark ? "text-slate-400" : "text-slate-500"
          )}>
            Manage your properties and applications
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "View Properties",
              description: "Manage your property listings",
              icon: Building2,
              action: () => router.push("/managers/properties"),
              color: "blue",
            },
            {
              title: "Applications",
              description: "Review pending applications",
              icon: FileText,
              action: () => router.push("/managers/applications"),
              color: "amber",
            },
            {
              title: "Tenants",
              description: "Manage your tenants",
              icon: Users,
              action: () => router.push("/managers/tenants"),
              color: "green",
            },
            {
              title: "Payments",
              description: "View payment history",
              icon: CreditCard,
              action: () => router.push("/managers/payments"),
              color: "purple",
            },
          ].map((action, i) => (
            <button
              key={i}
              onClick={action.action}
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-4 transition-all hover:shadow-md",
                isDark ? "bg-slate-800" : "bg-slate-100"
              )}
            >
              <div className={cn(
                "rounded-full p-2",
                action.color === "blue" && (isDark ? "bg-blue-900/20 text-blue-400" : "bg-blue-100 text-blue-600"),
                action.color === "amber" && (isDark ? "bg-amber-900/20 text-amber-400" : "bg-amber-100 text-amber-600"),
                action.color === "green" && (isDark ? "bg-green-900/20 text-green-400" : "bg-green-100 text-green-600"),
                action.color === "purple" && (isDark ? "bg-purple-900/20 text-purple-400" : "bg-purple-100 text-purple-600")
              )}>
                <action.icon className="h-4 w-4" />
              </div>
              <span className="font-semibold">{action.title}</span>
              <span className="text-xs text-slate-500">{action.description}</span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Additional Management Features */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Property Management</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Add Property */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => router.push('/managers/properties/new')}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Add New Property</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">List a new property for rent</p>
              </div>
            </div>
          </Card>
          
          {/* View Applications */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/managers/applications')}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <FileText className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Review Applications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">View and manage tenant applications</p>
              </div>
            </div>
          </Card>
          
          {/* Manage Tenants */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/managers/tenants')}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Manage Tenants</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">View and manage current tenants</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((card, index) => (
              <Card key={index} className={cn(
                "transition-all hover:shadow-md",
                isDark 
                  ? "bg-slate-900 border-slate-800 hover:border-slate-700" 
                  : "bg-white border-slate-200 hover:border-slate-300"
              )}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className={cn(
                    "text-sm font-medium",
                    isDark ? "text-slate-400" : "text-slate-500"
                  )}>
                    {card.title}
                  </CardTitle>
                  <div className={cn(
                    "rounded-full p-2",
                    card.color === "blue" && (isDark ? "bg-blue-900/20 text-blue-400" : "bg-blue-100 text-blue-600"),
                    card.color === "amber" && (isDark ? "bg-amber-900/20 text-amber-400" : "bg-amber-100 text-amber-600"),
                    card.color === "green" && (isDark ? "bg-green-900/20 text-green-400" : "bg-green-100 text-green-600"),
                    card.color === "purple" && (isDark ? "bg-purple-900/20 text-purple-400" : "bg-purple-100 text-purple-600")
                  )}>
                    {React.createElement(card.icon, { className: "h-4 w-4" })}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-1">
                    {card.value}
                  </div>
                  <p className={cn(
                    "text-xs",
                    isDark ? "text-slate-400" : "text-slate-500"
                  )}>
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className={cn(
            isDark 
              ? "bg-slate-900 border-slate-800" 
              : "bg-white border-slate-200"
          )}>
            <CardHeader>
              <CardTitle className={cn(
                isDark ? "text-white" : "text-slate-900"
              )}>
                Quick Actions
              </CardTitle>
              <CardDescription className={cn(
                isDark ? "text-slate-400" : "text-slate-500"
              )}>
                Manage your properties and applications
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "View Properties",
                  description: "Manage your property listings",
                  icon: Building2,
                  action: () => router.push("/managers/properties"),
                  color: "blue",
                },
                {
                  title: "Applications",
                  description: "Review pending applications",
                  icon: FileText,
                  action: () => router.push("/managers/applications"),
                  color: "amber",
                },
                {
                  title: "Tenants",
                  description: "Manage your tenants",
                  icon: Users,
                  action: () => router.push("/managers/tenants"),
                  color: "green",
                },
                {
                  title: "Payments",
                  description: "View payment history",
                  icon: CreditCard,
                  action: () => router.push("/managers/payments"),
                  color: "purple",
                },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={action.action}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-lg border p-4 transition-all hover:shadow-md",
                    isDark 
                      ? "bg-slate-800 border-slate-700 hover:bg-slate-700" 
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "rounded-full p-2",
                    action.color === "blue" && (isDark ? "bg-blue-900/20 text-blue-400" : "bg-blue-100 text-blue-600"),
                    action.color === "amber" && (isDark ? "bg-amber-900/20 text-amber-400" : "bg-amber-100 text-amber-600"),
                    action.color === "green" && (isDark ? "bg-green-900/20 text-green-400" : "bg-green-100 text-green-600"),
                    action.color === "purple" && (isDark ? "bg-purple-900/20 text-purple-400" : "bg-purple-100 text-purple-600")
                  )}>
                    {React.createElement(action.icon, { className: "h-4 w-4" })}
                  </div>
                  <div className="space-y-1">
                    <h3 className={cn(
                      "font-medium",
                      isDark ? "text-white" : "text-slate-900"
                    )}>
                      {action.title}
                    </h3>
                    <p className={cn(
                      "text-xs",
                      isDark ? "text-slate-400" : "text-slate-500"
                    )}>
                      {action.description}
                    </p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className={cn(
            isDark 
              ? "bg-slate-900 border-slate-800" 
              : "bg-white border-slate-200"
          )}>
            <CardHeader>
              <CardTitle className={cn(
                isDark ? "text-white" : "text-slate-900"
              )}>
                Recent Activity
              </CardTitle>
              <CardDescription className={cn(
                isDark ? "text-slate-400" : "text-slate-500"
              )}>
                Your recent property and application activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications && applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.slice(0, 5).map((application: Application, i: number) => (
                    <div key={i} className={cn(
                      "flex items-center gap-4 rounded-lg p-3",
                      isDark ? "bg-slate-800" : "bg-slate-50"
                    )}>
                      <div className={cn(
                        "rounded-full p-2",
                        application.status === "pending" 
                          ? (isDark ? "bg-amber-900/20 text-amber-400" : "bg-amber-100 text-amber-600")
                          : application.status === "approved"
                            ? (isDark ? "bg-green-900/20 text-green-400" : "bg-green-100 text-green-600")
                            : (isDark ? "bg-red-900/20 text-red-400" : "bg-red-100 text-red-600")
                      )}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={cn(
                          "font-medium",
                          isDark ? "text-white" : "text-slate-900"
                        )}>
                          New application for {application.property?.title || "Property"}
                        </p>
                        <p className={cn(
                          "text-xs",
                          isDark ? "text-slate-400" : "text-slate-500"
                        )}>
                          From {application.tenant?.name || "Tenant"} • Status: {application.status}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/managers/applications`)}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-medium",
                          isDark 
                            ? "bg-slate-700 text-white hover:bg-slate-600" 
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        )}
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={cn(
                  "flex flex-col items-center justify-center py-8 text-center",
                  isDark ? "text-slate-400" : "text-slate-500"
                )}>
                  <FileText className="h-12 w-12 mb-2 opacity-20" />
                  <h3 className="font-medium mb-1">No recent activity</h3>
                  <p className="text-sm">
                    You don&apos;t have any recent applications or activity
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className={cn(
            isDark 
              ? "bg-slate-900 border-slate-800" 
              : "bg-white border-slate-200"
          )}>
            <CardHeader>
              <CardTitle className={cn(
                isDark ? "text-white" : "text-slate-900"
              )}>
                Property Analytics
              </CardTitle>
              <CardDescription className={cn(
                isDark ? "text-slate-400" : "text-slate-500"
              )}>
                Overview of your property performance
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className={cn(
                "flex flex-col items-center justify-center text-center",
                isDark ? "text-slate-400" : "text-slate-500"
              )}>
                <TrendingUp className="h-12 w-12 mb-2 opacity-20" />
                <h3 className="font-medium mb-1">Analytics Coming Soon</h3>
                <p className="text-sm max-w-md">
                  We&apos;re working on comprehensive analytics for your properties. Check back soon for detailed insights and performance metrics.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagerDashboard;
