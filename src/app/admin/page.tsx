"use client";

import { useGetAllManagersQuery, useGetApplicationsQuery } from "@/state/api";
import { useEffect, useState } from "react";
import { checkAdminAuth, logoutAdmin, configureAdminAuth } from "./adminAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { AlertCircle, BarChart, Building2, FileText, Gift, GraduationCap, LineChart, Mail, Phone, Users } from "lucide-react";
import { toast } from "sonner";
import TestAdminAuth from "./test-admin-auth";


// Define Manager type for TypeScript
type Manager = {
  id: number;
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
  status: ManagerStatus;
};

// Define ManagerStatus enum to match the Prisma schema
enum ManagerStatus {
  Pending = "Pending",
  Active = "Active",
  Disabled = "Disabled",
  Banned = "Banned"
}

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debug, setDebug] = useState(false); // Debug mode toggle
  const router = useRouter();
  
  // Fetch admin user details when component mounts
  useEffect(() => {
    async function verifyAdminAuth() {
      try {
        console.log('✅ Verifying admin authentication...');
        // Configure admin auth
        configureAdminAuth();
        
        // Check admin authentication state
        const { isAuthenticated, adminData } = await checkAdminAuth();
        console.log('✅ Admin auth check result:', { isAuthenticated, adminData });
        
        if (isAuthenticated && adminData) {
          setAdminUser(adminData);
          setIsLoading(false);
        } else {
          console.log('❌ Not authenticated as admin, redirecting to login');
          router.replace('/admin-login?from=/admin');
        }
      } catch (error) {
        console.error('❌ Error verifying admin authentication:', error);
        setIsLoading(false);
        toast.error('Error verifying admin status');
        router.replace('/admin-login?from=/admin&error=auth_check_failed');
      }
    }
    
    verifyAdminAuth();
  }, [router]);
  
  // Handle admin logout
  const handleLogout = async () => {
    try {
      // Call standard admin logout function
      const result = await logoutAdmin();
      
      if (result.success) {
        toast.success("Logged out successfully");
        router.replace('/admin-login'); // Use router for navigation
      } else {
        toast.error("Failed to logout");
      }
    } catch (error) {
      console.error('❌ Error during admin logout:', error);
      toast.error("An error occurred during logout");
    }
  };
  
  // Fetch managers data once we have admin user details - exclude demo data
  const { data: managers } = useGetAllManagersQuery({
    status: undefined,
    includeDemo: false
  }, {
    skip: !adminUser?.cognitoId
  });

  const { data: applications, isLoading: isLoadingApplications } = useGetApplicationsQuery({}, {
    skip: !adminUser?.cognitoId
  });

  const totalApplications = applications?.length ?? 0;
  const pendingApplications = applications
    ? applications.filter((app) => app.status?.toString().toLowerCase() === "pending").length
    : 0;
  const recentApplications = applications ? applications.slice(0, 5) : [];

  const formatApplicationDate = (value: string | Date | undefined) => {
    if (!value) return "Unknown date";
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }
    return date.toLocaleDateString();
  };

  const getStatusBadgeClass = (status?: string | null) => {
    const normalized = (status ?? "").toString().toLowerCase();
    if (normalized === "approved") {
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
    }
    if (normalized === "denied") {
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
    }
    return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800";
  };

  // Count managers by status
  const pendingManagers = managers?.filter(m => m.status === "Pending")?.length || 0;
  const activeManagers = managers?.filter(m => m.status === "Active")?.length || 0;
  const disabledManagers = managers?.filter(m => m.status === "Disabled")?.length || 0;
  const bannedManagers = managers?.filter(m => m.status === "Banned")?.length || 0;

  return (
    <div className="space-y-6">
      {/* Admin header with welcome message and debug toggle */}
      <section className="p-6 dark:bg-gray-800 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center  mb-4">
          <h2 className="text-2xl font-semibold">Administrator Dashboard</h2>
          <button 
            onClick={() => setDebug(!debug)}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors"
          >
            {debug ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>
        
        <div className="dark:bg-slate-700 bg-blue-100 p-4 rounded-md mb-6">
          <p className="font-medium text-blue-600 dark:text-blue-400">Welcome, {adminUser?.name || 'Admin'}!</p>
          <p className="text-sm dark:text-gray-100 text-gray-600 mt-1">You are logged in as {adminUser?.email}</p>
          <button 
            onClick={handleLogout}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
        
        {/* Debug information when enabled */}
        {debug && <TestAdminAuth />}
      </section>

      {/* Manager statistics */}
      {managers && managers.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
            <p className="text-yellow-800 dark:text-yellow-200">
              <strong>No real landlords found.</strong> Your database currently contains only demo/seed data. 
              Real landlords will appear here when they register through your platform.
            </p>
          </div>
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Landlords</p>
              <h3 className="text-2xl font-bold">{pendingManagers}</h3>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <button 
            onClick={() => router.push('/admin/landlords?status=Pending')}
            className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View pending landlords
          </button>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Landlords</p>
              <h3 className="text-2xl font-bold">{activeManagers}</h3>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
              <Building2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <button 
            onClick={() => router.push('/admin/landlords?status=Active')}
            className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View active landlords
          </button>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Disabled Landlords</p>
              <h3 className="text-2xl font-bold">{disabledManagers}</h3>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
              <Users className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <button 
            onClick={() => router.push('/admin/landlords?status=Disabled')}
            className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View disabled landlords
          </button>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Banned Landlords</p>
              <h3 className="text-2xl font-bold">{bannedManagers}</h3>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <button 
            onClick={() => router.push('/admin/landlords?status=Banned')}
            className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View banned landlords
          </button>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Student Applications</p>
              <h3 className="text-2xl font-bold">{totalApplications}</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Pending: {pendingApplications}</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <button 
            onClick={() => router.push('/admin/applications')}
            className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View student applications
          </button>
        </Card>
      </div>

      {/* Additional Admin Features */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Admin Management</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Student Management */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => router.push('/admin/students')}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Student Management</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">View and manage student accounts, applications, and leases</p>
              </div>
            </div>
          </Card>
          
          {/* Referral System Tracking */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/referrals')}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Gift className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Referral Tracking</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Monitor student referrals and voucher rewards</p>
              </div>
            </div>
          </Card>
          
          {/* Analytics Dashboard */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/analytics')}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <BarChart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Analytics Dashboard</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">View detailed statistics and insights about properties and users</p>
              </div>
            </div>
          </Card>
          
          {/* Traffic Analytics */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/traffic')}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                <LineChart className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Traffic Analytics</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Monitor visitor traffic, referral sources, and engagement metrics</p>
              </div>
            </div>
          </Card>
          
          {/* System Settings */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                <LineChart className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-lg">System Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configure application settings and preferences</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Student Applications</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/applications')}
          >
            View all
          </Button>
        </div>
        <Card className="bg-white dark:bg-gray-800">
          {isLoadingApplications ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 rounded-md bg-gray-100 dark:bg-gray-700 animate-pulse"
                />
              ))}
            </div>
          ) : recentApplications.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No student applications yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentApplications.map((application) => {
                const appliedDate = formatApplicationDate(application.applicationDate ?? application.createdAt);
                const propertyName = application.property?.name ?? `Property #${application.propertyId}`;
                const tenantId = application.tenant?.id;

                return (
                  <div
                    key={application.id}
                    className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {application.name || application.tenant?.name || "Student"}
                        </p>
                        <Badge className={getStatusBadgeClass(application.status)}>
                          {application.status?.toString() ?? "Pending"}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{application.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{application.phoneNumber}</span>
                        </div>
                        <p>
                          Applied for <span className="font-medium text-gray-700 dark:text-gray-200">{propertyName}</span> on {appliedDate}
                        </p>
                        {application.message && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            &quot;{application.message.length > 160 ? `${application.message.slice(0, 160)}...` : application.message}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {tenantId ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/students/${tenantId}`)}
                        >
                          View student
                        </Button>
                      ) : null}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => router.push('/admin/applications')}
                      >
                        Application details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card className="p-4 bg-white dark:bg-gray-800">
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <p>Activity log will appear here</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
