"use client";

import { useGetAllManagersQuery } from "@/state/api";
import { useEffect, useState } from "react";
import { checkAdminAuth, logoutAdmin, configureAdminAuth } from "./adminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { Building2, Users, Home, AlertCircle, LogOut, BarChart, GraduationCap, LineChart, TrendingUp, FileText } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
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
