"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGetApplicationsQuery } from "@/state/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Calendar, Home, Mail, Phone } from "lucide-react";

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Denied", value: "denied" },
];

const formatDate = (value?: string | Date | null) => {
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

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: applications, isLoading, error } = useGetApplicationsQuery({});

  const totalApplications = applications?.length ?? 0;
  const pendingCount = applications
    ? applications.filter((app) => app.status?.toString().toLowerCase() === "pending").length
    : 0;
  const approvedCount = applications
    ? applications.filter((app) => app.status?.toString().toLowerCase() === "approved").length
    : 0;
  const deniedCount = applications
    ? applications.filter((app) => app.status?.toString().toLowerCase() === "denied").length
    : 0;

  const filteredApplications = useMemo(() => {
    if (!applications || applications.length === 0) {
      return [];
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedStatus = statusFilter.toLowerCase();

    return applications.filter((application) => {
      const statusMatches =
        normalizedStatus === "all" ||
        application.status?.toString().toLowerCase() === normalizedStatus;

      if (!statusMatches) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchTargets = [
        application.name,
        application.email,
        application.phoneNumber,
        application.tenant?.name,
        application.property?.name,
        application.property?.location?.address,
        application.property?.location?.city,
        application.property?.location?.suburb,
      ];

      return searchTargets.some((target) =>
        typeof target === "string" && target.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [applications, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Applications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Review every room application submitted by students.
          </p>
        </div>
  <Button variant="outline" onClick={() => router.push("/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Search by name, email, or property"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">Total applications</p>
            <p className="text-2xl font-semibold text-blue-900 dark:text-blue-100">{totalApplications}</p>
          </div>
          <div className="rounded-md bg-amber-50 p-4 dark:bg-amber-900/20">
            <p className="text-sm text-amber-700 dark:text-amber-300">Pending</p>
            <p className="text-2xl font-semibold text-amber-900 dark:text-amber-100">{pendingCount}</p>
          </div>
          <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-sm text-green-700 dark:text-green-300">Approved</p>
            <p className="text-2xl font-semibold text-green-900 dark:text-green-100">{approvedCount}</p>
          </div>
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">Denied</p>
            <p className="text-2xl font-semibold text-red-900 dark:text-red-100">{deniedCount}</p>
          </div>
        </div>
      </Card>

      {error ? (
        <Card className="p-6 text-center text-sm text-red-500">
          Failed to load applications. Please try again later.
        </Card>
      ) : isLoading ? (
        <Card className="space-y-3 p-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </Card>
      ) : filteredApplications.length === 0 ? (
        <Card className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          No applications match the current filters.
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const propertyName = application.property?.name ?? `Property #${application.propertyId}`;
            const propertyLocation = application.property?.location;
            const appliedDate = formatDate(application.applicationDate ?? application.createdAt);
            const tenantId = application.tenant?.id;

            return (
              <Card key={application.id} className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {application.name || application.tenant?.name || "Student"}
                      </h3>
                      <Badge className={getStatusBadgeClass(application.status)}>
                        {application.status?.toString() ?? "Pending"}
                      </Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      Applied on {appliedDate}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {tenantId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/students/${tenantId}`)}
                      >
                        View student profile
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Mail className="h-4 w-4" />
                    <span>{application.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Phone className="h-4 w-4" />
                    <span>{application.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Home className="h-4 w-4" />
                    <span>{propertyName}</span>
                  </div>
                  {propertyLocation ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Location:</span>
                      <span>
                        {[propertyLocation.suburb, propertyLocation.city]
                          .filter(Boolean)
                          .join(", ") || propertyLocation.address}
                      </span>
                    </div>
                  ) : null}
                </div>

                {application.message ? (
                  <div className="mt-4 rounded-md bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
                    <p className="font-medium text-gray-900 dark:text-gray-100">Student message</p>
                    <p className="mt-1 whitespace-pre-line">{application.message}</p>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
