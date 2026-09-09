"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useQuery } from "convex/react";
import { anyApi } from "convex/server";
import { Building2, Users, FileText, Plus, ArrowUpRight, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MIGRATED_LANDLORD_IDS: Record<string, string> = {
  "manager@example.com": "70cca9cc-b0c1-7064-d6d6-8f92e52d4790",
  "banelesouthflow@gmail.com": "602ca91c-5001-70c7-a78a-e9b1e36ce93e",
  "info@maginvest.co.za": "e0ccb98c-e091-702a-0944-0c6416c31a2b",
  "alexsouthflow2@gmail.com": "708c39ec-60d1-70d6-bd79-286d43e5cf40",
  "marelismit@hotmail.com": "a0bcb94c-9021-70ba-90de-a0a8b41d12dc",
  "marketingadmin@mosaicgroup.co.za": "30bc291c-2021-70ee-bb87-d158fbaebee2",
  "matthieusnaith@gmail.com": "f07c499c-5051-70a6-1948-e5b0bc72b25e",
  "kian@conurban.co.za": "505ca9fc-c0c1-7068-94ff-fe61d5a3e8c0",
  "lenhlendaba@gmail.com": "000c092c-d031-7024-5b34-27ee476b4abb",
  "nicola.makuwa@icloud.com": "70bcd9cc-d0f1-70c0-4edc-6508f5254d5b",
  "lefufisha@gmail.com": "e0fc796c-0091-7016-4f0d-67b8a56c4d9c",
  "info@27cluver.co.za": "e00ce9ac-f031-70e5-2d3f-f88e95460f2b",
  "sibandablessed724@gmail.com": "208c796c-00b1-7015-d53a-ad27f2b677ff",
  "info@staysouthpoint.co.za": "50bc293c-c0c1-70b1-c593-4b2d2a4f1f40",
  "gina.moonsamy@gmail.com": "800cc96c-b091-70c2-7102-c338f616081c",
  "rosaliefloresfranco@gmail.com": "40ccb93c-60c1-70c0-bfe2-16551e4395a1",
  "princetinendi@yahoo.com": "e0bc69bc-e031-7009-14c9-c0f65dfad6d3",
  "lizen@cityprop.co.za": "40fc393c-a091-705e-7cab-c137b8a51f0d",
  "allistairem@gmail.com": "405c093c-2051-702e-e86d-8a625d775b0e",
  "infokiarashomestay@gmail.com": "d04cc9ac-1001-708d-2b4c-9d877fbdf21b",
  "shaeekahisra@gmail.com": "60fc69fc-7071-702c-c927-f70b14e6d334",
  "meevsuu@hotmail.com": "f04cb9ac-6041-7060-a1da-90eacad6fb62",
  "magitshimaanisa2@gmail.com": "e0ec19cc-c051-70ee-144b-01240730cf3f",
  "tsp.mjadu@gmail.com": "e0dc292c-d011-7071-e0de-4a65f863ebd7",
  "clip-plod-lesser@duck.com": "a0dc393c-a001-7078-2d0f-c1281d72a110",
  "wayne@centraladvisory.co.za": "407c79dc-c0f1-702e-e58e-1bcef352493d",
  "parklanejohn@hotmail.com": "e0fce95c-d081-7011-3934-5fe8e083a64d",
  "kmeyiswa021@student.wethinkcode.co.za": "80fc493c-50b1-70d9-15eb-ddf0684334dd",
  "unathindlovu28@gmail.com": "d04c697c-f061-7015-5342-9f4fd8909467",
  "angiep@louwcoetzee.co.za": "b00cb9ac-70f1-7079-8921-25cd4d45eabc",
  "zwelakhe.samuel@gmail.com": "101c293c-5081-7043-8179-30abb82807dc"
};

export default function ManagerDashboard() {
  const { user, isLoading: authLoading } = useUnifiedAuth();
  const router = useRouter();

  const managerId = (user as any)?.id || (user as any)?.sub || "";
  const managerEmail = user?.email || "";
  const migratedId = managerEmail ? MIGRATED_LANDLORD_IDS[managerEmail.toLowerCase()] : undefined;

  // Query properties from Convex
  // @ts-ignore
  const propertiesById = useQuery(
    anyApi.properties.getManagerProperties,
    managerId ? { managerId } : "skip"
  );
  // @ts-ignore
  const propertiesByEmail = useQuery(
    anyApi.properties.getManagerProperties,
    managerEmail && managerEmail !== managerId ? { managerId: managerEmail } : "skip"
  );
  // @ts-ignore
  const propertiesByMigratedId = useQuery(
    anyApi.properties.getManagerProperties,
    migratedId && migratedId !== managerId ? { managerId: migratedId } : "skip"
  );

  const properties = React.useMemo(() => {
    const list = [
      ...(propertiesById ?? []),
      ...(propertiesByEmail ?? []),
      ...(propertiesByMigratedId ?? []),
    ];
    const seen = new Set<string>();
    return list.filter((p: any) => {
      const id = p?._id || p?.id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [propertiesById, propertiesByEmail, propertiesByMigratedId]);

  const totalProperties = properties?.length || 0;

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-zinc-900/60 border border-zinc-800" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-zinc-900/40 border border-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  const displayName = user?.name || user?.email?.split("@")[0] || "Manager";

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner - Vercel Dark */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Welcome back, {displayName}
              </h1>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Here is what is happening across your student accommodation portfolio.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push("/managers/newproperty")}
              className="rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-zinc-200 transition-all shadow-md active:scale-95"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Property
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Properties */}
        <Card className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl p-5 hover:border-zinc-700/90 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Properties</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-white">{totalProperties}</div>
            <p className="text-[11px] text-zinc-500 mt-1">Managed listings in Convex & DB</p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-900">
            <button
              onClick={() => router.push("/managers/properties")}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition"
            >
              View portfolio <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </Card>

        {/* Room Availability */}
        <Card className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl p-5 hover:border-zinc-700/90 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Portfolio Status</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-white">Active</div>
            <p className="text-[11px] text-zinc-500 mt-1">Synchronized with search engine</p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-900">
            <button
              onClick={() => router.push("/managers/properties")}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition"
            >
              Manage availability <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </Card>

        {/* Applications */}
        <Card className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl p-5 hover:border-zinc-700/90 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Student Applications</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-white">Console</div>
            <p className="text-[11px] text-zinc-500 mt-1">Lease requests & inquiries</p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-900">
            <button
              onClick={() => router.push("/managers/applications")}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition"
            >
              Review submissions <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </Card>

        {/* Tenant Registry */}
        <Card className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl p-5 hover:border-zinc-700/90 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Tenant Directory</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-white">Tenants</div>
            <p className="text-[11px] text-zinc-500 mt-1">Active student leases</p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-900">
            <button
              onClick={() => router.push("/managers/tenants")}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition"
            >
              Open directory <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </Card>
      </div>

      {/* Quick Access Actions */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-100">Management Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => router.push("/managers/properties")}
            className="group cursor-pointer rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-6 backdrop-blur-xl transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/40"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 group-hover:text-white group-hover:border-zinc-700 transition-colors">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-sm text-white">Properties & Rooms</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Update room pricing, amenities, photo galleries, and availability statuses.
            </p>
          </div>

          <div
            onClick={() => router.push("/managers/applications")}
            className="group cursor-pointer rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-6 backdrop-blur-xl transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/40"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 group-hover:text-white group-hover:border-zinc-700 transition-colors">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-sm text-white">Application Review</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Review and approve student booking applications and deposit verifications.
            </p>
          </div>

          <div
            onClick={() => router.push("/managers/tenants")}
            className="group cursor-pointer rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-6 backdrop-blur-xl transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/40"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 group-hover:text-white group-hover:border-zinc-700 transition-colors">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-sm text-white">Resident Communications</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Communicate with students, manage lease timelines, and maintain records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
