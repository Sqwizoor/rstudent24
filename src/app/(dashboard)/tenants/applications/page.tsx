"use client";

import Header from "@/components/Header";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ApplicationsPageSkeleton } from "@/components/ui/skeletons";
import { useGetApplicationsQuery } from "@/state/api";
import { Application, ApplicationStatus } from "@/types/prismaTypes";
import { Clock, Download, FileText, Home, MapPin, XCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo } from "react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useSignInRedirect } from "@/hooks/useSignInRedirect";

const TENANT_ROLES = new Set(["tenant", "student"]);

const ApplicationsContent = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const { signinUrl } = useSignInRedirect();

  const tenantAuthId = user?.id ?? "";
  const userRole = user?.role?.toLowerCase();
  const isTenant = userRole ? TENANT_ROLES.has(userRole) : false;
  const isManager = userRole === "manager";

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

  const isLoading = authLoading || applicationsLoading;

  const groupedByStatus = useMemo(() => {
    if (!applications) return { approved: [], pending: [], denied: [] };
    return {
      approved: applications.filter((app) => app.status === ApplicationStatus.Approved),
      pending: applications.filter((app) => app.status === ApplicationStatus.Pending),
      denied: applications.filter((app) => app.status === ApplicationStatus.Denied),
    };
  }, [applications]);

  if (isLoading) {
    return <PageWrapper><ApplicationsPageSkeleton /></PageWrapper>;
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

  if (applicationsError) {
    return <DataErrorNotice />;
  }

  const totalApplications = applications?.length ?? 0;

  return (
    <PageWrapper>
      <Header
        title="Rental applications"
        subtitle="Monitor every submission, their latest status, and next steps."
      />

      <section className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        <SummaryTile
          title="Total submitted"
          value={totalApplications}
          description="All time"
        />
        <SummaryTile
          title="Awaiting decision"
          value={groupedByStatus.pending.length}
          description="Pending with managers"
          accent="bg-amber-500/20 text-amber-300 border border-amber-500/40"
        />
        <SummaryTile
          title="Approved"
          value={groupedByStatus.approved.length}
          description="Ready for next steps"
          accent="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
        />
      </section>

      <section className="mt-12 space-y-6">
        <SectionHeader title="All applications" description="Review current progress and revisit property details at any time." />
        {totalApplications > 0 && applications ? (
          <div className="space-y-6">
            {applications.map((application: Application) => {
              try {
                return (
                  <ApplicationCard key={application.id} application={application} />
                );
              } catch (error) {
                console.error(`Error rendering application ${application.id}:`, error);
                return (
                  <div key={application.id} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">Unable to display application</p>
                  </div>
                );
              }
            })}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-12 w-12 text-blue-400" />}
            title="No applications yet"
            message="When you apply for a property, you'll see its status and actions here."
            actionLabel="Browse properties"
            actionHref="/search"
          />
        )}
      </section>
    </PageWrapper>
  );
};

const Applications = () => {
  return (
    <ErrorBoundary>
      <ApplicationsContent />
    </ErrorBoundary>
  );
};

const ApplicationCard = ({ application }: { application: Application }) => {
  const property = application.property;
  const room = application.room;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-[#111315] shadow-lg">
      <div className="flex flex-col gap-4 p-6 md:flex-row">
        <div className="relative h-40 w-full overflow-hidden rounded-xl bg-black/20 md:h-36 md:w-40">
          {property?.photoUrls?.[0] ? (
            <Image
              src={property.photoUrls[0]}
              alt={property.name ?? `Property #${property?.id ?? application.propertyId}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Home className="h-10 w-10" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {property?.name ?? `Property #${application.propertyId}`}
                </h3>
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {property?.location?.address ?? "Address pending"}, {property?.location?.city ?? "City pending"}
                  </span>
                </div>
                {room && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Room: <span className="font-medium text-white/90">{room.name}</span> · R{room.pricePerMonth?.toLocaleString("en-ZA")}/month
                  </div>
                )}
              </div>
              <StatusBadge status={application.status} />
            </div>

            <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
              <DetailItem label="Submitted" value={formatDate(application.applicationDate ?? application.createdAt)} icon={<Clock className="h-4 w-4" />} />
              <DetailItem label="Last updated" value={formatDate(application.updatedAt)} icon={<Clock className="h-4 w-4" />} />
              <DetailItem label="Reference" value={`APP-${application.id}`} icon={<FileText className="h-4 w-4" />} />
            </div>

            <ApplicationStatusNote application={application} />
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Link
              href={`/properties/${application.propertyId}`}
              className="inline-flex items-center rounded-md border border-border/60 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
            >
              View property
            </Link>
            {application.status === ApplicationStatus.Approved && (
              <button className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700">
                <Download className="mr-2 h-4 w-4" />
                Download agreement
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ApplicationStatusNote = ({ application }: { application: Application }) => {
  const leaseEndDate = (application as any)?.lease?.endDate as string | Date | undefined;

  switch (application.status) {
    case ApplicationStatus.Approved:
      return (
        <StatusPanel
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
          tone="bg-emerald-500/10 border-emerald-500/30"
          message={
            leaseEndDate
              ? `Approved! Your lease runs until ${formatDate(leaseEndDate)}.`
              : "Approved! The property manager will reach out with next steps."
          }
        />
      );
    case ApplicationStatus.Pending:
      return (
        <StatusPanel
          icon={<Clock className="h-5 w-5 text-amber-300" />}
          tone="bg-amber-500/10 border-amber-500/30"
          message="Pending review. We'll notify you as soon as there's a decision."
        />
      );
    case ApplicationStatus.Denied:
      return (
        <StatusPanel
          icon={<XCircle className="h-5 w-5 text-rose-400" />}
          tone="bg-rose-500/10 border-rose-500/30"
          message="This application was declined. Explore other listings and apply again."
        />
      );
    default:
      return null;
  }
};

const StatusPanel = ({ icon, tone, message }: { icon: React.ReactNode; tone: string; message: string }) => (
  <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm text-white/90 ${tone}`}>
    <span className="mt-0.5">{icon}</span>
    <p>{message}</p>
  </div>
);

const SummaryTile = ({
  title,
  value,
  description,
  accent,
}: {
  title: string;
  value: number;
  description: string;
  accent?: string;
}) => (
  <div className={`rounded-2xl border border-border/70 bg-[#111315] p-6 shadow ${accent ?? ""}`}>
    <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
    <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
  </div>
);

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="flex flex-col gap-2">
    <h2 className="text-xl font-semibold text-white">{title}</h2>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const DetailItem = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="flex items-center gap-2">
    <span className="text-muted-foreground">{icon}</span>
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm text-white/90">{value}</div>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: ApplicationStatus | string }) => {
  const normalized = `${status}`;

  switch (normalized) {
    case ApplicationStatus.Approved:
      return <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 border border-emerald-500/30">Approved</span>;
    case ApplicationStatus.Pending:
      return <span className="inline-flex items-center rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300 border border-amber-500/30">Pending</span>;
    case ApplicationStatus.Denied:
      return <span className="inline-flex items-center rounded-full bg-rose-500/15 px-3 py-1 text-xs font-medium text-rose-300 border border-rose-500/30">Rejected</span>;
    default:
      return <span className="inline-flex items-center rounded-full bg-slate-500/15 px-3 py-1 text-xs font-medium text-slate-300 border border-slate-500/30">{normalized}</span>;
  }
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
  <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/70 bg-[#101214] p-12 text-center">
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
  <div className="mx-auto mt-20 max-w-2xl rounded-2xl border border-border/70 bg-[#101214] p-12 text-center">
    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/10">
      <FileText className="h-6 w-6 text-blue-500" />
    </div>
    <h2 className="text-2xl font-semibold text-white">Sign in to view applications</h2>
    <p className="mt-3 text-sm text-muted-foreground">
      You need to be signed in with your tenant account to monitor application progress.
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
  <div className="mx-auto mt-20 max-w-2xl rounded-2xl border border-border/70 bg-[#101214] p-12 text-center">
    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
      <FileText className="h-6 w-6 text-amber-500" />
    </div>
    <h2 className="text-2xl font-semibold text-white">Applications are tenant only</h2>
    <p className="mt-3 text-sm text-muted-foreground">
      Manager accounts can review tenant submissions from their dashboard instead.
    </p>
    <Link
      href="/manager/dashboard"
      className="mt-6 inline-flex items-center rounded-md bg-amber-500 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-amber-600"
    >
      Visit manager dashboard
    </Link>
  </div>
);

const MissingTenantProfile = () => (
  <div className="mx-auto mt-20 max-w-2xl rounded-2xl border border-border/70 bg-[#101214] p-12 text-center">
    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
      <FileText className="h-6 w-6 text-rose-500" />
    </div>
    <h2 className="text-2xl font-semibold text-white">We couldn&apos;t find your tenant profile</h2>
    <p className="mt-3 text-sm text-muted-foreground">
      If you just created your account, give us a moment to finish setting it up and refresh the page.
    </p>
    <Link
      href="/tenants/settings"
      className="mt-6 inline-flex items-center rounded-md bg-rose-500 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-rose-600"
    >
      View profile settings
    </Link>
  </div>
);

const DataErrorNotice = () => (
  <div className="mx-auto mt-20 max-w-2xl rounded-2xl border border-border/70 bg-[#101214] p-12 text-center">
    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
      <FileText className="h-6 w-6 text-rose-500" />
    </div>
    <h2 className="text-2xl font-semibold text-white">Something went wrong loading applications</h2>
    <p className="mt-3 text-sm text-muted-foreground">
      Try refreshing the page. If the issue persists, reach out to support so we can help troubleshoot.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="mt-6 inline-flex items-center rounded-md bg-rose-500 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-rose-600"
    >
      Refresh page
    </button>
  </div>
);

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto max-w-6xl px-4 py-12 space-y-10">{children}</div>
);

const formatDate = (date: string | Date | undefined) => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString();
  } catch (error) {
    return "—";
  }
};

export default Applications;
