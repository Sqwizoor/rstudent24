"use client";

import Header from "@/components/Header";
import Loading from "@/components/Loading";
import ModernPropertyCard from "@/components/ModernPropertyCard";
import { 
  useGetAuthUserQuery, 
  useGetPropertiesQuery, 
  useGetTenantQuery,
  useGetApplicationsQuery,
  useAddFavoritePropertyMutation,
  useRemoveFavoritePropertyMutation
} from "@/state/api";
import { ApplicationStatus, Tenant } from "@/types/prismaTypes";
import { Building2, FileText, Heart, Home } from "lucide-react";
import Link from "next/link";
import React from "react";

const TenantDashboard = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const { data: tenant, isLoading: tenantLoading } = useGetTenantQuery(
    authUser?.cognitoInfo?.userId || "",
    {
      // Skip if no user ID or if user is a manager
      skip: !authUser?.cognitoInfo?.userId || authUser?.userRole === "manager",
    }
  );

  const { data: applications, isLoading: applicationsLoading } = useGetApplicationsQuery(
    { userId: authUser?.cognitoInfo?.userId || "" },
    {
      skip: !authUser?.cognitoInfo?.userId || authUser?.userRole === "manager",
    }
  );
  
  // Add favorite toggle handlers - moved outside of the map function to fix hooks order error
  const [addFavorite] = useAddFavoritePropertyMutation();
  const [removeFavorite] = useRemoveFavoritePropertyMutation();
  
  // Get favorite properties (limited to 3 for dashboard preview)
  // Cast tenant to Tenant type to ensure TypeScript recognizes all needed properties
  const tenantWithFavorites = tenant as Tenant & { 
    favorites?: Array<{ id: number }>,
    residences?: Array<any>
  };
  
  const {
    data: favoriteProperties,
    isLoading: favoritesLoading,
  } = useGetPropertiesQuery(
    { 
      favoriteIds: tenantWithFavorites?.favorites?.map(fav => fav.id)
    },
    { skip: !tenantWithFavorites?.favorites || tenantWithFavorites?.favorites.length === 0 }
  );
  
  // Limit the displayed favorite properties to 3
  const limitedFavoriteProperties = favoriteProperties?.slice(0, 3);

  // Handle toggling favorite status - moved outside of the map function
  const handleFavoriteToggle = (propertyId: number) => {
    // Since these are already favorites, we only need to handle removal
    if (authUser?.cognitoInfo?.userId) {
      try {
        removeFavorite({ 
          cognitoId: authUser.cognitoInfo.userId, 
          propertyId: propertyId 
        });
        console.log(`Property removed from favorites: ${propertyId}`);
      } catch (error) {
        console.error("Error removing property from favorites:", error);
      }
    }
  };

  if (tenantLoading || favoritesLoading || applicationsLoading) return <Loading />;

  // Count of active applications
  const pendingApplicationsCount = applications?.filter(
    (app) => app.status === ApplicationStatus.Pending
  ).length || 0;

  return (
    <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Header
        title="Tenant Dashboard"
        subtitle="Welcome back! Here's an overview of your rental journey"
      />
      
      {/* Dashboard cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
        <DashboardCard
          title="Favorites"
          count={tenantWithFavorites?.favorites?.length || 0}
          icon={<Heart className="h-6 w-6" />}
          link="/tenants/favorites"
          color="bg-gradient-to-br from-rose-500 to-pink-600"
        />
        <DashboardCard
          title="Residences"
          count={tenantWithFavorites?.residences?.length || 0}
          icon={<Home className="h-6 w-6" />}
          link="/tenants/residences"
          color="bg-gradient-to-br from-blue-500 to-cyan-600"
        />
        <DashboardCard
          title="Applications"
          count={applications?.length || 0}
          icon={<FileText className="h-6 w-6" />}
          link="/tenants/applications"
          color="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <DashboardCard
          title="Pending Applications"
          count={pendingApplicationsCount}
          icon={<Building2 className="h-6 w-6" />}
          link="/tenants/applications"
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
      </div>
      
      {/* Recent Favorites */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Favorites</h2>
          <Link href="/tenants/favorites" className="text-blue-500 hover:underline">View all</Link>
        </div>
        
        {favoriteProperties && favoriteProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {limitedFavoriteProperties?.map((property) => {
              // Transform property to include the location field required by ModernPropertyCard
              // Create a location object using the locationId from the property
              const propertyWithRequiredFields = {
                id: property.id,
                name: property.name || '',
                location: {
                  address: '',
                  city: '',
                  id: property.locationId || 0
                },
                // Convert null values to undefined for type compatibility
                averageRating: property.averageRating ?? undefined,
                numberOfReviews: property.numberOfReviews ?? undefined,
                squareFeet: property.squareFeet || 0,
                beds: (property as any).beds || 0,
                baths: (property as any).baths || 0,
                // Use a type assertion to access pricePerMonth, or fall back to a default
                // This handles the case where the property might have a different field structure
                pricePerMonth: (property as any).pricePerMonth || 
                              (property as any).price || 
                              (property as any).rentAmount || 
                              0
              };
              
              return (
                <ModernPropertyCard
                  key={property.id}
                  property={propertyWithRequiredFields}
                  isFavorite={true}
                  userRole="tenant"
                  showFavoriteButton={true}
                  onFavoriteToggle={() => handleFavoriteToggle(property.id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-[#0F1112] border border-[#333] rounded-xl text-center">
            <Heart className="h-8 w-8 text-gray-500 mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">No Favorites Yet</h3>
            <p className="text-gray-400">Start adding properties to your favorites to see them here.</p>
          </div>
        )}
      </div>

      {/* Recent Applications */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Applications</h2>
          <Link href="/tenants/applications" className="text-blue-500 hover:underline">View all</Link>
        </div>
        
        {applications && applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0F1112] text-gray-300">
                  <th className="p-4 border-b border-[#333]">Property</th>
                  <th className="p-4 border-b border-[#333]">Status</th>
                  <th className="p-4 border-b border-[#333]">Applied Date</th>
                  <th className="p-4 border-b border-[#333]">Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 3).map((application) => (
                  <tr key={application.id} className="border-b border-[#222] hover:bg-[#1A1B1E]">
                    <td className="p-4">Property #{application.propertyId}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        application.status === ApplicationStatus.Approved ? "bg-green-900 text-green-300" :
                        application.status === ApplicationStatus.Denied ? "bg-red-900 text-red-300" :
                        application.status === ApplicationStatus.Pending ? "bg-yellow-900 text-yellow-300" :
                        "bg-blue-900 text-blue-300"
                      }`}>
                        {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">{new Date(application.applicationDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <Link 
                        href={`/properties/${application.propertyId}`} 
                        className="text-blue-500 hover:underline"
                      >
                        View Property
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-[#0F1112] border border-[#333] rounded-xl text-center">
            <FileText className="h-8 w-8 text-gray-500 mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">No Applications</h3>
            <p className="text-gray-400">You haven&apos;t submitted any rental applications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Dashboard card component
const DashboardCard = ({ 
  title, 
  count, 
  icon, 
  link, 
  color 
}: { 
  title: string; 
  count: number; 
  icon: React.ReactNode; 
  link: string; 
  color: string;
}) => {
  return (
    <Link href={link}>
      <div className={`${color} rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          <div className="p-2 bg-white/20 rounded-full">
            {icon}
          </div>
        </div>
        <p className="text-3xl font-semibold text-white mt-4">{count}</p>
      </div>
    </Link>
  );
};

export default TenantDashboard;
