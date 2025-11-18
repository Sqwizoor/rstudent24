"use client";

import Header from "@/components/Header";
import ErrorBoundary from "@/components/ErrorBoundary";
import ModernPropertyCard, { type ModernPropertyCardProperty } from "@/components/ModernPropertyCard";
import {
  useGetApplicationsQuery,
  useGetCurrentResidencesQuery,
  useGetPropertiesQuery,
  useGetTenantQuery,
  useRemoveFavoritePropertyMutation,
} from "@/state/api";
import { ApplicationStatus, Property } from "@/types/prismaTypes";
import { Building2, FileText, Heart, Home, MapPin } from "lucide-react";
import Link from "next/link";
import React, { useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useSignInRedirect } from "@/hooks/useSignInRedirect";

const TENANT_ROLES = new Set(["tenant", "student"]);

const TenantDashboardContent = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const { signinUrl } = useSignInRedirect();

  const tenantAuthId = user?.id ?? "";
  const userRole = user?.role?.toLowerCase();
  const isTenant = tenantAuthId && userRole ? TENANT_ROLES.has(userRole) : false;
  const isManager = userRole === "manager";

  const tenantQueryArg = !authLoading && isAuthenticated && isTenant && tenantAuthId
    ? tenantAuthId
    : skipToken;

  const {
    data: tenant,
    isLoading: tenantLoading,
    isError: tenantError,
    error: tenantErrorData,
  } = useGetTenantQuery(tenantQueryArg);

  const favoriteIds = useMemo(() => {
    if (!tenant?.favorites || !Array.isArray(tenant.favorites)) return [];

    return tenant.favorites
      .map((favorite: any) => {
        if (typeof favorite === "number") return favorite;
        if (favorite?.id) return favorite.id;
        if (favorite?.propertyId) return favorite.propertyId;
        if (favorite?.property?.id) return favorite.property.id;
        return null;
      })
      .filter((id): id is number => typeof id === "number" && !Number.isNaN(id));
  }, [tenant?.favorites]);

  const shouldSkipFavorites =
    !isTenant || !isAuthenticated || favoriteIds.length === 0;

  const {
    data: favoriteProperties,
    isLoading: favoritesLoading,
    isError: favoritesError,
  } = useGetPropertiesQuery(
    { favoriteIds },
    { skip: shouldSkipFavorites }
  );

  const {
    data: residences,
    isLoading: residencesLoading,
    isError: residencesError,
  } = useGetCurrentResidencesQuery(
    isTenant && tenantAuthId ? tenantAuthId : skipToken,
    {
      skip: !isTenant || !tenantAuthId,
    }
  );

  const {
    data: applications,
    isLoading: applicationsLoading,
    isError: applicationsError,
  } = useGetApplicationsQuery(
    {
      userId: tenantAuthId || undefined,
      userType: userRole,
    },
    {
      skip: !isTenant || !tenantAuthId,
    }
  );

  const [removeFavorite] = useRemoveFavoritePropertyMutation();

  const handleFavoriteToggle = async (propertyId: number) => {
    if (!tenantAuthId) return;

    try {
      await removeFavorite({ cognitoId: tenantAuthId, propertyId }).unwrap();
    } catch (error) {
      console.error("Failed to update favorites:", error);
    }
  };

  // Log errors for debugging - MUST be before any conditional returns
  React.useEffect(() => {
    if (tenantError && tenantErrorData) {
      console.error('❌ Tenant error:', tenantError);
      console.error('Tenant error data:', tenantErrorData);
      console.error('Tenant error full object:', JSON.stringify(tenantErrorData, null, 2));
    }
    if (favoritesError) console.error('❌ Favorites error:', favoritesError);
    if (residencesError) console.error('❌ Residences error:', residencesError);
    if (applicationsError) console.error('❌ Applications error:', applicationsError);
  }, [tenantError, tenantErrorData, favoritesError, residencesError, applicationsError]);

  const isLoading = authLoading || tenantLoading || favoritesLoading || residencesLoading || applicationsLoading;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPrompt signinUrl={signinUrl} />;
  }

  if (isManager || !isTenant) {
    return <RestrictedNotice />;
  }

  if (!tenantAuthId) {
    return <MissingTenantProfile />;
  }

  // Handle individual errors more gracefully
  if (tenantError) {
    console.error('Tenant query failed, showing error screen');
    return <DataErrorNotice errors={{ tenantError, tenantErrorData }} primaryError="tenant" />;
  }

  // If tenant loaded successfully but other queries failed, we can show partial data
  if (favoritesError || residencesError || applicationsError) {
    console.warn('Some queries failed but tenant loaded successfully');
    // Continue rendering with partial data
  }

  const pendingApplications = applications?.filter(
    (app) => app.status === ApplicationStatus.Pending
  ) ?? [];

  const favoritesCount = favoriteIds.length;
  const residencesCount = residences?.length ?? 0;
  const applicationsCount = applications?.length ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div>
        <Header
          title="Tenant Dashboard"
          subtitle="Track your favorites, stay on top of applications, and manage your residences."
        />
        <p className="text-sm text-muted-foreground mt-3">
          Need to update your details? Head to the <Link href="/tenants/settings" className="text-blue-500 hover:underline">settings page</Link> to keep your profile current.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-4">Quick snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <SummaryCard
            title="Saved favorites"
            value={favoritesCount}
            icon={<Heart className="h-5 w-5" />}
            href="/tenants/favorites"
            accent="from-rose-500/90 via-red-500/90 to-pink-500/90"
          />
          <SummaryCard
            title="Current residences"
            value={residencesCount}
            icon={<Home className="h-5 w-5" />}
            href="/tenants/residences"
            accent="from-sky-500/90 via-cyan-500/90 to-blue-500/90"
          />
          <SummaryCard
            title="Total applications"
            value={applicationsCount}
            icon={<FileText className="h-5 w-5" />}
            href="/tenants/applications"
            accent="from-amber-500/90 via-orange-500/90 to-yellow-500/90"
          />
          <SummaryCard
            title="Pending decisions"
            value={pendingApplications.length}
            icon={<Building2 className="h-5 w-5" />}
            href="/tenants/applications"
            accent="from-emerald-500/90 via-teal-500/90 to-green-500/90"
          />
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Recently saved"
          description="A quick look at the properties you're most interested in."
          actionLabel="View favorites"
          actionHref="/tenants/favorites"
        />
        {favoritesCount > 0 && favoriteProperties && favoriteProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {favoriteProperties.slice(0, 3).map((property: Property) => {
              try {
                return (
                  <ModernPropertyCard
                    key={property.id}
                    property={normalizeProperty(property)}
                    isFavorite={favoriteIds.includes(property.id)}
                    showFavoriteButton
                    onFavoriteToggle={() => handleFavoriteToggle(property.id)}
                    propertyLink={`/properties/${property.id}`}
                    userRole="tenant"
                  />
                );
              } catch (error) {
                console.error(`Error rendering property ${property.id}:`, error);
                return (
                  <div key={property.id} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">Unable to display property</p>
                  </div>
                );
              }
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Heart className="h-10 w-10 text-rose-500" />}
            title="No favorites yet"
            message="Save properties you like to keep tabs on them here."
            actionLabel="Browse properties"
            actionHref="/search"
          />
        )}
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Application tracker"
          description="Stay updated on where each application stands."
          actionLabel="Manage applications"
          actionHref="/tenants/applications"
        />
        {applicationsCount > 0 && applications ? (
          <div className="overflow-x-auto rounded-xl border border-border/50">
            <table className="min-w-full divide-y divide-border/60">
              <thead className="bg-muted/30">
                <tr>
                  <TableHeading>Property</TableHeading>
                  <TableHeading>Status</TableHeading>
                  <TableHeading>Applied on</TableHeading>
                  <TableHeading>Action</TableHeading>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {applications.slice(0, 5).map((application) => (
                  <tr key={application.id} className="bg-background/60">
                    <td className="px-4 py-4 text-sm">
                      <div className="font-medium">
                        {application.property?.name ?? `Property #${application.propertyId}`}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {application.property?.location?.city ?? "Location pending"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={application.status} />
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {formatDate(application.applicationDate)}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/properties/${application.propertyId}`}
                        className="text-sm text-blue-500 hover:underline"
                      >
                        View property
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-10 w-10 text-amber-500" />}
            title="No applications yet"
            message="Once you submit an application, you’ll see the status updates here."
            actionLabel="Browse properties"
            actionHref="/search"
          />
        )}
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Current residences"
          description="Keep track of where you're staying and what’s included."
          actionLabel="Manage residences"
          actionHref="/tenants/residences"
        />
        {residencesCount > 0 && residences ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {residences.slice(0, 2).map((property: any) => {
              try {
                return (
                  <ModernPropertyCard
                    key={property.id}
                    property={normalizeProperty(property)}
                    isFavorite={favoriteIds.includes(property.id)}
                    showFavoriteButton={false}
                    propertyLink={`/tenants/residences/${property.id}`}
                    userRole="tenant"
                  />
                );
              } catch (error) {
                console.error(`Error rendering residence ${property.id}:`, error);
                return (
                  <div key={property.id} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">Unable to display residence</p>
                  </div>
                );
              }
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Home className="h-10 w-10 text-sky-500" />}
            title="No active residences"
            message="When you move into a property, details about your stay will surface here."
            actionLabel="Explore listings"
            actionHref="/search"
          />
        )}
      </section>
    </div>
  );
};

const TenantDashboard = () => {
  return (
    <ErrorBoundary>
      <TenantDashboardContent />
    </ErrorBoundary>
  );
};

const SummaryCard = ({
  title,
  value,
  icon,
  href,
  accent,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  accent: string;
}) => {
  return (
    <Link href={href} className="group">
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-[#111315] p-6 shadow-lg transition duration-200 group-hover:shadow-xl">
        <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-20 group-hover:opacity-30 transition`} />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
          </div>
          <div className="rounded-full bg-black/40 p-3 text-white">{icon}</div>
        </div>
      </div>
    </Link>
  );
};

const SectionHeader = ({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Link
      href={actionHref}
      className="text-sm font-medium text-blue-500 hover:underline"
    >
      {actionLabel}
    </Link>
  </div>
);

const StatusBadge = ({ status }: { status: ApplicationStatus | string }) => {
  const normalized = `${status}`;

  const { label, classes } = (() => {
    switch (normalized) {
      case ApplicationStatus.Approved:
        return { label: "Approved", classes: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" };
      case ApplicationStatus.Pending:
        return { label: "Pending", classes: "bg-amber-500/15 text-amber-300 border border-amber-500/30" };
      case ApplicationStatus.Denied:
        return { label: "Rejected", classes: "bg-rose-500/15 text-rose-300 border border-rose-500/30" };
      default:
        return { label: normalized ?? "Unknown", classes: "bg-slate-500/15 text-slate-300 border border-slate-500/30" };
    }
  })();

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
};

const EmptyState = ({
  icon,
  title,
  message,
  actionLabel,
  actionHref,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
}) => (
  <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/60 bg-[#121416] p-10 text-center">
    <div className="rounded-full bg-black/30 p-4">{icon}</div>
    <div>
      <h3 className="text-lg font-medium text-white">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </div>
    <Link
      href={actionHref}
      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
    >
      {actionLabel}
    </Link>
  </div>
);

const AuthPrompt = ({ signinUrl }: { signinUrl: string }) => (
  <div className="max-w-2xl mx-auto mt-20 rounded-2xl border border-border/60 bg-[#101214] p-10 text-center">
    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/10">
      <Heart className="h-6 w-6 text-blue-500" />
    </div>
    <h2 className="text-2xl font-semibold text-white">Sign in to view your dashboard</h2>
    <p className="mt-3 text-sm text-muted-foreground">
      You need to be signed in with your tenant or student account to manage favorites, applications, and residences.
    </p>
    <a
      href={signinUrl}
      className="mt-6 inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-blue-700"
    >
      Go to sign in
    </a>
  </div>
);

const RestrictedNotice = () => (
  <div className="max-w-3xl mx-auto mt-20 rounded-2xl border border-border/60 bg-[#101214] p-10 text-center">
    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
      <FileText className="h-6 w-6 text-amber-500" />
    </div>
    <h2 className="text-2xl font-semibold text-white">Dashboard reserved for tenants</h2>
    <p className="mt-3 text-sm text-muted-foreground">
      Manager accounts have their own dashboard experience. Switch to a tenant account to view this page.
    </p>
    <Link
      href="/manager/dashboard"
      className="mt-6 inline-flex items-center rounded-md bg-amber-500 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-amber-600"
    >
      Go to manager dashboard
    </Link>
  </div>
);

const MissingTenantProfile = () => (
  <div className="max-w-3xl mx-auto mt-20 rounded-2xl border border-border/60 bg-[#101214] p-10 text-center">
    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
      <Building2 className="h-6 w-6 text-rose-500" />
    </div>
    <h2 className="text-2xl font-semibold text-white">We couldn’t find your tenant profile</h2>
    <p className="mt-3 text-sm text-muted-foreground">
      If you recently signed up, your account may still be provisioning. Try refreshing the page in a moment.
    </p>
    <Link
      href="/tenants/settings"
      className="mt-6 inline-flex items-center rounded-md bg-rose-500 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-rose-600"
    >
      Check profile settings
    </Link>
  </div>
);

const DataErrorNotice = ({ errors, primaryError }: { errors?: any; primaryError?: string }) => {
  const errorMessage = primaryError === 'tenant' 
    ? 'We couldn\'t load your tenant profile. This usually means your account needs to be set up.'
    : 'Please refresh to try again. If the issue persists, get in touch with support so we can help restore your access.';

  const actionButton = primaryError === 'tenant' ? (
    <div className="flex flex-col gap-3 items-center">
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center rounded-md bg-rose-500 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-rose-600"
      >
        Refresh page
      </button>
      <Link
        href="/tenants/settings"
        className="text-sm text-blue-500 hover:underline"
      >
        Or go to settings to complete your profile
      </Link>
    </div>
  ) : (
    <button
      onClick={() => window.location.reload()}
      className="mt-6 inline-flex items-center rounded-md bg-rose-500 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-rose-600"
    >
      Refresh page
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto mt-20 rounded-2xl border border-border/60 bg-[#101214] p-10 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
        <FileText className="h-6 w-6 text-rose-500" />
      </div>
      <h2 className="text-2xl font-semibold text-white">We hit a snag pulling your data</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        {errorMessage}
      </p>
      {process.env.NODE_ENV === 'development' && errors && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-left max-w-2xl mx-auto">
          <p className="text-xs font-mono text-red-400 whitespace-pre-wrap overflow-auto max-h-64">
            {JSON.stringify(errors, null, 2)}
          </p>
        </div>
      )}
      {actionButton}
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-12 animate-pulse">
    <div className="space-y-3">
      <div className="h-6 w-48 rounded bg-muted" />
      <div className="h-4 w-72 rounded bg-muted" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-32 rounded-2xl border border-border/40 bg-muted/20" />
      ))}
    </div>
    <div className="space-y-4">
      <div className="h-5 w-40 rounded bg-muted" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-72 rounded-2xl border border-border/40 bg-muted/20" />
        ))}
      </div>
    </div>
  </div>
);

const TableHeading = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
    {children}
  </th>
);

const normalizeProperty = (property: Property | Record<string, unknown>): ModernPropertyCardProperty => {
  const location = property.location ?? {};
  const photoUrls = Array.isArray(property.photoUrls)
    ? property.photoUrls
    : Array.isArray((property as any).images)
      ? (property as any).images
      : [];

  return {
    id: property.id as number,
    name: property.name as string,
    location: {
      address: (location as any).address ?? "",
      city: (location as any).city ?? "",
    },
    photoUrls,
    price: (property as any).price ?? (property as any).pricePerMonth ?? (property as any).minRoomPrice ?? 0,
    beds: (property as any).beds ?? ((property as any).rooms?.[0]?.beds ?? 0),
    baths: (property as any).baths ?? ((property as any).rooms?.[0]?.baths ?? 0),
    squareFeet: (property as any).squareFeet ?? (property as any).size ?? 0,
  };
};

const formatDate = (date: string | Date | undefined) => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString();
  } catch (error) {
    return "—";
  }
};

export default TenantDashboard;
