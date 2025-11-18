"use client";

import Header from "@/components/Header";
import ModernPropertyCard, { type ModernPropertyCardProperty } from "@/components/ModernPropertyCard";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  useGetCurrentResidencesQuery,
  useGetTenantQuery,
} from "@/state/api";
import { Property } from "@/types/prismaTypes";
import { Building, Home } from "lucide-react";
import Link from "next/link";
import React, { useMemo } from "react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useSignInRedirect } from "@/hooks/useSignInRedirect";
import { skipToken } from "@reduxjs/toolkit/query";

const TENANT_ROLES = new Set(["tenant", "student"]);

const ResidencesContent = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const { signinUrl } = useSignInRedirect();

  const tenantAuthId = user?.id ?? "";
  const userRole = user?.role?.toLowerCase();
  const isTenant = userRole ? TENANT_ROLES.has(userRole) : false;
  const isManager = userRole === "manager";

  const tenantQueryArg = !authLoading && isAuthenticated && isTenant && tenantAuthId
    ? tenantAuthId
    : skipToken;

  const {
    data: tenant,
    isLoading: tenantLoading,
    isError: tenantError,
  } = useGetTenantQuery(tenantQueryArg);

  const {
    data: residences,
    isLoading: residencesLoading,
    isError: residencesError,
    error: residencesErrorDetails,
  } = useGetCurrentResidencesQuery(
    isTenant && tenantAuthId ? tenantAuthId : skipToken,
    { skip: !isTenant || !tenantAuthId }
  );

  // Log errors for debugging
  React.useEffect(() => {
    if (residencesError && residencesErrorDetails) {
      console.error('❌ Residences error:', residencesErrorDetails);
    }
  }, [residencesError, residencesErrorDetails]);

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

  const isLoading = authLoading || tenantLoading || residencesLoading;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <ResidencesSkeleton />
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

  if (tenantError || residencesError) {
    return <DataErrorNotice />;
  }

  const residenceCount = residences?.length ?? 0;

  const renderResidences = () => {
    if (residenceCount === 0) {
      return (
        <EmptyState
          icon={<Home className="h-12 w-12 text-sky-500" />}
          title="No active residences"
          message="Once you move into a property, we'll show lease details and quick links right here."
          actionLabel="Discover properties"
          actionHref="/search"
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {residences?.map((residence: Property) => {
          try {
            return (
              <ModernPropertyCard
                key={residence.id}
                property={normalizeResidence(residence)}
                isFavorite={favoriteIds.includes(residence.id)}
                showFavoriteButton={false}
                propertyLink={`/tenants/residences/${residence.id}`}
                userRole="tenant"
              />
            );
          } catch (error) {
            console.error(`Error rendering residence ${residence.id}:`, error);
            return (
              <div key={residence.id} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">Unable to display residence</p>
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      <div className="space-y-3">
        <Header
          title="Current residences"
          subtitle="Review your active stays, see what's included, and jump to property details in one click."
        />
        <p className="text-sm text-muted-foreground">
          Need to update contact details or preferences? Visit <Link href="/tenants/settings" className="text-blue-500 hover:underline">tenant settings</Link> to keep everything accurate.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <SummaryCard
          title="Active stays"
          value={residenceCount}
          description="Homes you're currently renting"
        />
        <SummaryCard
          title="Saved favorites"
          value={favoriteIds.length}
          description="Quick access to properties you love"
        />
        <SummaryCard
          title="Explore more"
          value={0}
          description="Find your next place to live"
          linkText="Browse listings"
          linkHref="/search"
        />
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Your residences"
          description="Each card contains the essentials—location, rent, and quick actions for your stay."
        />
        {renderResidences()}
      </section>

      {residenceCount > 0 && (
        <section className="rounded-2xl border border-border/60 bg-[#111315] p-8">
          <h2 className="text-lg font-semibold text-white">Helpful next steps</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep track of tenancy paperwork, stay in touch with property managers, and gather everything you need for move-in day.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            <HelpCard
              title="Download lease agreements"
              description="Approved applications include a digital agreement so you can store or print whenever you need."
              href="/tenants/applications"
            />
            <HelpCard
              title="Update contact info"
              description="Make sure managers can reach you with important notices about your stay."
              href="/tenants/settings"
            />
          </ul>
        </section>
      )}
    </div>
  );
};

const Residences = () => {
  return (
    <ErrorBoundary>
      <ResidencesContent />
    </ErrorBoundary>
  );
};

const SummaryCard = ({
  title,
  value,
  description,
  linkText,
  linkHref,
}: {
  title: string;
  value: number;
  description: string;
  linkText?: string;
  linkHref?: string;
}) => (
  <div className="rounded-2xl border border-border/60 bg-[#111315] p-6">
    <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
    <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    {linkText && linkHref && (
      <Link href={linkHref} className="mt-4 inline-flex text-sm font-medium text-blue-500 hover:underline">
        {linkText}
      </Link>
    )}
  </div>
);

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="flex flex-col gap-2">
    <h2 className="text-xl font-semibold text-white">{title}</h2>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const HelpCard = ({ title, description, href }: { title: string; description: string; href: string }) => (
  <li className="rounded-2xl border border-border/50 bg-[#0f1113] p-5">
    <h3 className="text-sm font-semibold text-white">{title}</h3>
    <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    <Link href={href} className="mt-4 inline-flex text-sm font-medium text-blue-500 hover:underline">
      View details
    </Link>
  </li>
);

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
  <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/60 bg-[#101214] p-12 text-center">
    <div className="rounded-full bg-black/30 p-4">{icon}</div>
    <div>
      <h3 className="text-lg font-medium text-white">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
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
  <div className="mx-auto mt-20 max-w-2xl rounded-2xl border border-border/60 bg-[#101214] p-12 text-center">
    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/10">
      <Home className="h-6 w-6 text-blue-500" />
    </div>
    <h2 className="text-2xl font-semibold text-white">Sign in to view residences</h2>
    <p className="mt-3 text-sm text-muted-foreground">
      Log in with your tenant account to see active stays, lease details, and quick actions.
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
  <div className="mx-auto mt-20 max-w-2xl rounded-2xl border border-border/60 bg-[#101214] p-12 text-center">
    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
      <Building className="h-6 w-6 text-amber-500" />
    </div>
    <h2 className="text-2xl font-semibold text-white">Residences are tenant only</h2>
    <p className="mt-3 text-sm text-muted-foreground">
      Manager accounts can monitor tenant stays from the manager dashboard.
    </p>
    <Link
      href="/manager/dashboard"
      className="mt-6 inline-flex items-center rounded-md bg-amber-500 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-amber-600"
    >
      View manager dashboard
    </Link>
  </div>
);

const MissingTenantProfile = () => (
  <div className="mx-auto mt-20 max-w-2xl rounded-2xl border border-border/60 bg-[#101214] p-12 text-center">
    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
      <Building className="h-6 w-6 text-rose-500" />
    </div>
    <h2 className="text-2xl font-semibold text-white">We couldn&apos;t find your tenant profile</h2>
    <p className="mt-3 text-sm text-muted-foreground">
      If you just signed up, your account may still be syncing. Refresh the page in a moment or complete your profile details.
    </p>
    <Link
      href="/tenants/settings"
      className="mt-6 inline-flex items-center rounded-md bg-rose-500 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-rose-600"
    >
      Review profile
    </Link>
  </div>
);

const DataErrorNotice = () => {
  const { user } = useUnifiedAuth();
  const tenantAuthId = user?.id ?? "";
  
  const {
    error: residencesErrorDetails,
  } = useGetCurrentResidencesQuery(
    tenantAuthId ? tenantAuthId : skipToken,
    { skip: !tenantAuthId }
  );

  return (
    <div className="mx-auto mt-20 max-w-2xl rounded-2xl border border-border/60 bg-[#101214] p-12 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
        <Building className="h-6 w-6 text-rose-500" />
      </div>
      <h2 className="text-2xl font-semibold text-white">We hit a snag loading residences</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Please refresh the page. If the problem remains, contact support so we can help restore access to your residence data.
      </p>
      {process.env.NODE_ENV === 'development' && residencesErrorDetails && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-left">
          <p className="text-xs font-mono text-red-400">
            {JSON.stringify(residencesErrorDetails, null, 2)}
          </p>
        </div>
      )}
      <button
        onClick={() => window.location.reload()}
        className="mt-6 inline-flex items-center rounded-md bg-rose-500 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-rose-600"
      >
        Refresh page
      </button>
    </div>
  );
};

const ResidencesSkeleton = () => (
  <div className="space-y-10 animate-pulse">
    <div className="space-y-3">
      <div className="h-6 w-48 rounded bg-muted" />
      <div className="h-4 w-64 rounded bg-muted" />
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-28 rounded-2xl border border-border/40 bg-muted/20" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="h-80 rounded-2xl border border-border/40 bg-muted/20" />
      ))}
    </div>
  </div>
);

const normalizeResidence = (residence: Property | Record<string, unknown>): ModernPropertyCardProperty => {
  try {
    const location = residence.location ?? {};
    const photoUrls = Array.isArray(residence.photoUrls)
      ? residence.photoUrls
      : Array.isArray((residence as any).images)
        ? (residence as any).images
        : [];

    return {
      id: residence.id as number,
      name: residence.name as string,
      location: {
        address: (location as any).address ?? "",
        city: (location as any).city ?? "",
      },
      photoUrls,
      price: (residence as any).price ?? (residence as any).pricePerMonth ?? 0,
      beds: (residence as any).beds ?? ((residence as any).rooms?.[0]?.beds ?? 0),
      baths: (residence as any).baths ?? ((residence as any).rooms?.[0]?.baths ?? 0),
      squareFeet: (residence as any).squareFeet ?? (residence as any).size ?? 0,
    };
  } catch (error) {
    console.error("Error normalizing residence:", error);
    // Return a minimal valid object
    return {
      id: (residence.id as number) ?? 0,
      name: (residence.name as string) ?? "Unknown Property",
      location: {
        address: "",
        city: "",
      },
      photoUrls: [],
      price: 0,
      beds: 0,
      baths: 0,
      squareFeet: 0,
    };
  }
};

export default Residences;
