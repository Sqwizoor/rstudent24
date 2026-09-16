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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Referral System & Vouchers</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Monitor and manage student referral rewards, active vouchers, and user invites.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleExportCSV}
            disabled={isExporting || isLoading || referrals.length === 0}
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
            placeholder="Search by name, email, or referral code..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-10 rounded-xl border-zinc-800 bg-zinc-900/80 text-xs text-zinc-100 placeholder:text-zinc-500"
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-400">Total Referrals</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalReferrals}</p>
            </div>
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-400">Completed</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.completedReferrals}</p>
            </div>
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-400">Pending</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.pendingReferrals}</p>
            </div>
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-400">Active Vouchers</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.activeVouchers}</p>
            </div>
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <Gift className="h-5 w-5 text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {error ? (
        <Card className="p-8 text-center rounded-2xl border border-zinc-800 bg-zinc-950/70 text-rose-400 text-xs">
          {error}
        </Card>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-10 w-10 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
          <p className="mt-3 text-xs font-mono text-zinc-500">Loading referral directory...</p>
        </div>
      ) : filteredReferrals.length === 0 ? (
        <Card className="p-8 text-center rounded-2xl border border-zinc-800 bg-zinc-950/70 text-zinc-400 text-xs">
          No referrals found matching the current filters.
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReferrals.map((referral) => {
            const createdDate = formatDate(referral.createdAt);
            const completedDate = formatDate(referral.completedAt);
            const voucher = referral.vouchers[0];

            return (
              <Card key={referral.id} className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl text-zinc-100">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-white">
                          {referral.referralCode}
                        </h3>
                        <Badge className={getStatusBadgeClass(referral.isCompleted)}>
                          {referral.isCompleted ? "Completed" : "Pending"}
                        </Badge>
                        {referral.voucherGenerated && (
                          <Badge className="bg-purple-950/80 text-purple-300 border border-purple-800">
                            <Gift className="h-3 w-3 mr-1" />
                            Voucher Generated
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Calendar className="h-3.5 w-3.5" />
                        Created on {createdDate}
                        {referral.isCompleted && ` • Completed on ${completedDate}`}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                      <h4 className="text-xs font-medium text-zinc-300 mb-2 flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                        Referrer (Who Shared)
                      </h4>
                      {referral.referrer ? (
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold text-white">{referral.referrer.name}</p>
                          <p className="text-zinc-400">{referral.referrer.email}</p>
                          <p className="text-zinc-500 font-mono">{referral.referrer.phoneNumber}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white text-xs h-7"
                            onClick={() => router.push(`/admin/students/${referral.referrer?.id}`)}
                          >
                            View Profile
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500">No referrer data</p>
                      )}
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                      <h4 className="text-xs font-medium text-zinc-300 mb-2 flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-emerald-400" />
                        Referred (Who Joined)
                      </h4>
                      {referral.referred ? (
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold text-white">{referral.referred.name}</p>
                          <p className="text-zinc-400">{referral.referred.email}</p>
                          <p className="text-zinc-500 font-mono">{referral.referred.phoneNumber}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white text-xs h-7"
                            onClick={() => router.push(`/admin/students/${referral.referred?.id}`)}
                          >
                            View Profile
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500">Pending sign-up</p>
                      )}
                    </div>
                  </div>

                  {voucher && (
                    <div className="rounded-xl bg-purple-950/20 border border-purple-800/40 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-purple-200 flex items-center gap-2 text-xs">
                            <Gift className="h-3.5 w-3.5 text-purple-400" />
                            Voucher Details
                          </h4>
                          <div className="mt-2 space-y-1 text-xs">
                            <p className="text-purple-300">
                              <span className="font-medium text-zinc-300">Code:</span> {voucher.code}
                            </p>
                            <p className="text-purple-300">
                              <span className="font-medium text-zinc-300">Discount:</span> R{voucher.discountAmount}
                              {voucher.discountPercent && ` (${voucher.discountPercent}%)`}
                            </p>
                            <p className="text-purple-300">
                              <span className="font-medium text-zinc-300">Status:</span> {voucher.status}
                            </p>
                            <p className="text-purple-300">
                              <span className="font-medium text-zinc-300">Expires:</span> {formatDate(voucher.expiresAt)}
                            </p>
                            {voucher.usedAt && (
                              <p className="text-purple-300">
                                <span className="font-medium text-zinc-300">Used on:</span> {formatDate(voucher.usedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className={
                          voucher.status === 'Active' 
                            ? "bg-emerald-950/80 text-emerald-400 border-emerald-800" 
                            : voucher.status === 'Used' 
                            ? "bg-blue-950/80 text-blue-400 border-blue-800"
                            : "bg-zinc-800 text-zinc-300 border-zinc-700"
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
