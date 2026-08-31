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
import { ArrowLeft, Calendar, Download, Home, Mail, Phone } from "lucide-react";

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
  const [isExporting, setIsExporting] = useState(false);

  const { data: applications, isLoading, error } = useGetApplicationsQuery({});

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/admin/applications/export');
      
      if (!response.ok) {
        throw new Error('Failed to export applications');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applications_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting applications:', error);
      alert('Failed to export applications. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Student Applications</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Review and manage all student room applications across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleExportCSV}
            disabled={isExporting || isLoading || !applications || applications.length === 0}
            className="rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 text-xs h-9"
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            {isExporting ? "Exporting..." : "Export to CSV"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push("/admin")}
            className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs h-9"
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      <Card className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Search by name, email, or property..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-10 rounded-xl border-zinc-800 bg-zinc-900/80 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 rounded-xl border-zinc-800 bg-zinc-900 text-xs text-zinc-200">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-200 rounded-xl">
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
          <p className="text-xs text-zinc-400 font-medium">Total Applications</p>
          <p className="text-2xl font-bold text-white mt-1">{totalApplications}</p>
        </Card>
        <Card className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
          <p className="text-xs text-amber-400 font-medium">Pending</p>
          <p className="text-2xl font-bold text-white mt-1">{pendingCount}</p>
        </Card>
        <Card className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
          <p className="text-xs text-emerald-400 font-medium">Approved</p>
          <p className="text-2xl font-bold text-white mt-1">{approvedCount}</p>
        </Card>
        <Card className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
          <p className="text-xs text-rose-400 font-medium">Denied</p>
          <p className="text-2xl font-bold text-white mt-1">{deniedCount}</p>
        </Card>
      </div>

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
        <div className="grid gap-3">
          {filteredApplications.map((application) => {
            const propertyName = application.property?.name ?? `Property #${application.propertyId}`;
            const propertyLocation = application.property?.location;
            const appliedDate = formatDate(application.applicationDate ?? application.createdAt);
            const tenantId = application.tenant?.id;

            return (
              <Card key={application.id} className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl hover:border-zinc-700/90 transition-all">
                <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">
                        {application.name || application.tenant?.name || "Student"}
                      </h3>
                      <Badge className={getStatusBadgeClass(application.status)}>
                        {application.status?.toString() ?? "Pending"}
                      </Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                      <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                      Applied on {appliedDate}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {tenantId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/students/${tenantId}`)}
                        className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white text-xs h-8"
                      >
                        View student profile
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-2.5 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <Mail className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{application.email}</span>
                  </div>
                  {application.phoneNumber && (
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Phone className="h-3.5 w-3.5 text-zinc-500" />
                      <span className="font-mono">{application.phoneNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <Home className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="font-medium text-white">{propertyName}</span>
                  </div>
                  {propertyLocation ? (
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="text-zinc-500">Location:</span>
                      <span>
                        {[propertyLocation.suburb, propertyLocation.city]
                          .filter(Boolean)
                          .join(", ") || propertyLocation.address}
                      </span>
                    </div>
                  ) : null}
                </div>

                {application.message ? (
                  <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 text-xs text-zinc-300">
                    <p className="font-semibold text-zinc-200">Student message</p>
                    <p className="mt-1 whitespace-pre-line text-zinc-400">{application.message}</p>
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
