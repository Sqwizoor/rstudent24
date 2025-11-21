"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Calendar, Download, Gift, TrendingUp, Users, CheckCircle, Clock } from "lucide-react";

const statusOptions = [
  { label: "All referrals", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
];

const formatDate = (value?: string | Date | null) => {
  if (!value) return "N/A";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }
  return date.toLocaleDateString();
};

const getStatusBadgeClass = (isCompleted: boolean) => {
  if (isCompleted) {
    return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
  }
  return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800";
};

interface Referral {
  id: number;
  referralCode: string;
  createdAt: string | Date;
  completedAt?: string | Date | null;
  isCompleted: boolean;
  voucherGenerated: boolean;
  referrer: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  } | null;
  referred: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  } | null;
  vouchers: Array<{
    id: number;
    code: string;
    discountAmount: number;
    discountPercent: number | null;
    status: string;
    expiresAt: string | Date;
    usedAt?: string | Date | null;
  }>;
}

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  vouchersGenerated: number;
  totalVouchers: number;
  activeVouchers: number;
  usedVouchers: number;
}

export default function AdminReferralsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    vouchersGenerated: 0,
    totalVouchers: 0,
    activeVouchers: 0,
    usedVouchers: 0,
  });

  useEffect(() => {
    fetchReferrals();
  }, [statusFilter]);

  const fetchReferrals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/admin/referrals?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch referrals');
      }

      const data = await response.json();
      setReferrals(data.referrals || []);
      setStats(data.stats || {
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        vouchersGenerated: 0,
        totalVouchers: 0,
        activeVouchers: 0,
        usedVouchers: 0,
      });
    } catch (err) {
      console.error('Error fetching referrals:', err);
      setError('Failed to load referrals. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/admin/referrals/export');
      
      if (!response.ok) {
        throw new Error('Failed to export referrals');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `referrals_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting referrals:', error);
      alert('Failed to export referrals. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredReferrals = useMemo(() => {
    if (!referrals || referrals.length === 0) {
      return [];
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return referrals;
    }

    return referrals.filter((referral) => {
      const searchTargets = [
        referral.referralCode,
        referral.referrer?.name,
        referral.referrer?.email,
        referral.referred?.name,
        referral.referred?.email,
      ];

      return searchTargets.some((target) =>
        typeof target === "string" && target.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [referrals, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Referral System Tracking</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitor and manage all student referrals and vouchers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="default" 
            onClick={handleExportCSV}
            disabled={isExporting || isLoading || referrals.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export to CSV"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Search by name, email, or referral code"
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Referrals</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.totalReferrals}</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-semibold text-green-900 dark:text-green-100">{stats.completedReferrals}</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-semibold text-amber-900 dark:text-amber-100">{stats.pendingReferrals}</p>
            </div>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-full">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Vouchers</p>
              <p className="text-2xl font-semibold text-purple-900 dark:text-purple-100">{stats.activeVouchers}</p>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
              <Gift className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {error ? (
        <Card className="p-6 text-center text-sm text-red-500">
          {error}
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
      ) : filteredReferrals.length === 0 ? (
        <Card className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          No referrals found matching the current filters.
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReferrals.map((referral) => {
            const createdDate = formatDate(referral.createdAt);
            const completedDate = formatDate(referral.completedAt);
            const voucher = referral.vouchers[0];

            return (
              <Card key={referral.id} className="p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {referral.referralCode}
                        </h3>
                        <Badge className={getStatusBadgeClass(referral.isCompleted)}>
                          {referral.isCompleted ? "Completed" : "Pending"}
                        </Badge>
                        {referral.voucherGenerated && (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300">
                            <Gift className="h-3 w-3 mr-1" />
                            Voucher Generated
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        Created on {createdDate}
                        {referral.isCompleted && ` • Completed on ${completedDate}`}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Referrer (Who Shared)
                      </h4>
                      {referral.referrer ? (
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{referral.referrer.name}</p>
                          <p className="text-gray-600 dark:text-gray-400">{referral.referrer.email}</p>
                          <p className="text-gray-600 dark:text-gray-400">{referral.referrer.phoneNumber}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => router.push(`/admin/students/${referral.referrer?.id}`)}
                          >
                            View Profile
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No referrer data</p>
                      )}
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Referred (Who Joined)
                      </h4>
                      {referral.referred ? (
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{referral.referred.name}</p>
                          <p className="text-gray-600 dark:text-gray-400">{referral.referred.email}</p>
                          <p className="text-gray-600 dark:text-gray-400">{referral.referred.phoneNumber}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => router.push(`/admin/students/${referral.referred?.id}`)}
                          >
                            View Profile
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pending sign-up</p>
                      )}
                    </div>
                  </div>

                  {voucher && (
                    <div className="rounded-md bg-purple-50 dark:bg-purple-900/20 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-purple-900 dark:text-purple-100 flex items-center gap-2">
                            <Gift className="h-4 w-4" />
                            Voucher Details
                          </h4>
                          <div className="mt-2 space-y-1 text-sm">
                            <p className="text-purple-700 dark:text-purple-300">
                              <span className="font-medium">Code:</span> {voucher.code}
                            </p>
                            <p className="text-purple-700 dark:text-purple-300">
                              <span className="font-medium">Discount:</span> R{voucher.discountAmount}
                              {voucher.discountPercent && ` (${voucher.discountPercent}%)`}
                            </p>
                            <p className="text-purple-700 dark:text-purple-300">
                              <span className="font-medium">Status:</span> {voucher.status}
                            </p>
                            <p className="text-purple-700 dark:text-purple-300">
                              <span className="font-medium">Expires:</span> {formatDate(voucher.expiresAt)}
                            </p>
                            {voucher.usedAt && (
                              <p className="text-purple-700 dark:text-purple-300">
                                <span className="font-medium">Used on:</span> {formatDate(voucher.usedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className={
                          voucher.status === 'Active' 
                            ? "bg-green-100 text-green-700" 
                            : voucher.status === 'Used' 
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }>
                          {voucher.status}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
