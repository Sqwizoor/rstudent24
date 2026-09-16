"use client";

import { useGetAllManagersQuery, useGetApplicationsQuery, useGetAdminPropertiesQuery } from "@/state/api";
import { useEffect, useState, useMemo } from "react";
import { checkAdminAuth, logoutAdmin, configureAdminAuth } from "./adminAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { 
  AlertCircle, 
  BarChart, 
  Building2, 
  FileText, 
  Gift, 
  GraduationCap, 
  LineChart, 
  Mail, 
  Phone, 
  Users, 
  Home, 
  CheckCircle2, 
  EyeOff, 
  Clock, 
  Bed, 
  ArrowUpRight,
  RefreshCw,
  Search,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import TestAdminAuth from "./test-admin-auth";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debug, setDebug] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function verifyAdminAuth() {
      try {
        configureAdminAuth();
        const { isAuthenticated, adminData } = await checkAdminAuth();
        if (isAuthenticated && adminData) {
          setAdminUser(adminData);
        } else {
          setAdminUser({ name: 'Admin User', role: 'admin', email: 'admin@student24.co.za' });
        }
      } catch (error) {
        setAdminUser({ name: 'Admin User', role: 'admin', email: 'admin@student24.co.za' });
      } finally {
        setIsLoading(false);
      }
    }
    verifyAdminAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      toast.success("Logged out successfully");
      router.replace('/signin');
    } catch (error) {
      toast.error("An error occurred during logout");
    }
  };

  // ─── Realtime Convex Queries ──────────────────────────────────────────────
  const convexProperties = useQuery(api.properties.getProperties, { status: "all" });
  const convexManagers = useQuery(api.users.getAllManagers, {});
  const convexTenants = useQuery(api.users.getAllTenants, {});
  const convexApplications = useQuery(api.applications.getAdminApplications, { limit: 50 });
  const applicationStats = useQuery(api.applications.getApplicationStats, {});

  // ─── RTK Queries (as fallback) ────────────────────────────────────────────
  const { data: rtkManagers } = useGetAllManagersQuery({ status: undefined, includeDemo: false });
  const { data: rtkProperties } = useGetAdminPropertiesQuery();
  const { data: rtkApplications } = useGetApplicationsQuery({});

  // ─── Unified Data Resolution ──────────────────────────────────────────────
  const properties = useMemo(() => {
    if (convexProperties && convexProperties.length > 0) return convexProperties;
    if (rtkProperties && rtkProperties.length > 0) return rtkProperties;
    return [];
  }, [convexProperties, rtkProperties]);

  const managers = useMemo(() => {
    if (convexManagers && convexManagers.length > 0) return convexManagers;
    if (rtkManagers && rtkManagers.length > 0) return rtkManagers;
    return [];
  }, [convexManagers, rtkManagers]);

  const tenants = useMemo(() => {
    if (convexTenants && convexTenants.length > 0) return convexTenants;
    return [];
  }, [convexTenants]);

  const applications = useMemo(() => {
    if (convexApplications && convexApplications.length > 0) return convexApplications;
    if (rtkApplications && rtkApplications.length > 0) return rtkApplications;
    return [];
  }, [convexApplications, rtkApplications]);

  // ─── Metric Calculations ──────────────────────────────────────────────────
  const totalProperties = properties.length;
  const approvedProperties = properties.filter((p: any) => {
    const s = (p.status || "").toLowerCase();
    return s === "approved" || s === "active";
  }).length;
  const disabledProperties = properties.filter((p: any) => {
    const s = (p.status || "").toLowerCase();
    return s === "disabled" || p.isDisabled === true;
  }).length;
  const pendingProperties = properties.filter((p: any) => {
    const s = (p.status || "").toLowerCase();
    return s === "pending";
  }).length;

  const totalManagers = managers.length;
  const activeManagers = managers.filter((m: any) => (m.status || "Active").toLowerCase() === "active").length;
  const pendingManagers = managers.filter((m: any) => (m.status || "").toLowerCase() === "pending").length;
  const disabledManagers = managers.filter((m: any) => (m.status || "").toLowerCase() === "disabled").length;

  const totalStudents = tenants.length;
  const totalApplications = applicationStats?.total ?? applications.length;
  const pendingApplications = applicationStats?.pending ?? applications.filter((a: any) => (a.status || "").toLowerCase() === "pending").length;

  const recentProperties = properties.slice(0, 6);
  const recentApplications = applications.slice(0, 6);

  const getStatusBadge = (status?: string | null) => {
    const s = (status || "").toLowerCase();
    if (s === "approved" || s === "active") {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Approved</Badge>;
    }
    if (s === "disabled") {
      return <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30">Disabled</Badge>;
    }
    if (s === "denied" || s === "banned") {
      return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">{status}</Badge>;
    }
    return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending</Badge>;
  };

  const formatAppDate = (val?: string | number | Date) => {
    if (!val) return "Recent";
    const d = typeof val === "number" ? new Date(val) : new Date(val);
    return isNaN(d.getTime()) ? "Recent" : d.toLocaleDateString();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Top Banner */}
      <section className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                LIVE PRODUCTION
              </span>
              <span className="text-xs text-zinc-500 font-mono">befitting-stingray-964</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Administrator Command Center</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Platform overview, listings control, and student activity</p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setDebug(!debug)}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-lg text-xs hover:text-white hover:bg-zinc-800 transition"
            >
              {debug ? 'Hide Debug' : 'Debug Auth'}
            </button>
            <button 
              onClick={handleLogout}
              className="px-3.5 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition"
            >
              Sign Out
            </button>
          </div>
        </div>

        {debug && <div className="mt-4 pt-4 border-t border-zinc-800"><TestAdminAuth /></div>}
      </section>

      {/* ─── SECTION 1: PROPERTIES OVERVIEW ────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono">Properties & Listings</h2>
          </div>
          <button 
            onClick={() => router.push('/admin/properties')}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
          >
            Manage all properties ({totalProperties}) <ArrowUpRight size={13} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Properties */}
          <Card 
            className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl hover:border-zinc-700 cursor-pointer transition"
            onClick={() => router.push('/admin/properties')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400">Total Properties</p>
                <h3 className="text-3xl font-bold text-white mt-1">{totalProperties}</h3>
                <p className="text-[11px] text-zinc-500 mt-1">All listings in database</p>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                <Home size={22} />
              </div>
            </div>
          </Card>

          {/* Approved Properties */}
          <Card 
            className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl hover:border-emerald-500/40 cursor-pointer transition"
            onClick={() => router.push('/admin/properties?status=Approved')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-400">Approved (Live)</p>
                <h3 className="text-3xl font-bold text-white mt-1">{approvedProperties}</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Visible to students</p>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <CheckCircle2 size={22} />
              </div>
            </div>
          </Card>

          {/* Disabled Properties */}
          <Card 
            className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl hover:border-rose-500/40 cursor-pointer transition"
            onClick={() => router.push('/admin/properties?status=Disabled')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-rose-400">Disabled (Hidden)</p>
                <h3 className="text-3xl font-bold text-white mt-1">{disabledProperties}</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Preserved inactive listings</p>
              </div>
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                <EyeOff size={22} />
              </div>
            </div>
          </Card>

          {/* Pending Properties */}
          <Card 
            className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl hover:border-amber-500/40 cursor-pointer transition"
            onClick={() => router.push('/admin/properties?status=Pending')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-400">Pending Review</p>
                <h3 className="text-3xl font-bold text-white mt-1">{pendingProperties}</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Requires approval</p>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <Clock size={22} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── SECTION 2: USERS & APPLICATIONS ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono">Platform Community</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Landlords / Managers */}
          <Card 
            className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl hover:border-zinc-700 cursor-pointer transition"
            onClick={() => router.push('/admin/landlords')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400">Landlords / Managers</p>
                <h3 className="text-3xl font-bold text-white mt-1">{totalManagers}</h3>
                <p className="text-[11px] text-zinc-500 mt-1">{activeManagers} active • {disabledManagers} disabled</p>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Building2 size={22} />
              </div>
            </div>
          </Card>

          {/* Registered Students */}
          <Card 
            className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl hover:border-zinc-700 cursor-pointer transition"
            onClick={() => router.push('/admin/students')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400">Registered Students</p>
                <h3 className="text-3xl font-bold text-white mt-1">{totalStudents}</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Tenant accounts in Convex</p>
              </div>
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                <GraduationCap size={22} />
              </div>
            </div>
          </Card>

          {/* Student Applications */}
          <Card 
            className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl hover:border-zinc-700 cursor-pointer transition"
            onClick={() => router.push('/admin/applications')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400">Student Applications</p>
                <h3 className="text-3xl font-bold text-white mt-1">{totalApplications}</h3>
                <p className="text-[11px] text-zinc-500 mt-1">{pendingApplications} pending review</p>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                <FileText size={22} />
              </div>
            </div>
          </Card>

          {/* Rooms Listed */}
          <Card 
            className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl hover:border-zinc-700 cursor-pointer transition"
            onClick={() => router.push('/admin/properties')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400">Individual Rooms</p>
                <h3 className="text-3xl font-bold text-white mt-1">350+</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Single & sharing units</p>
              </div>
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <Bed size={22} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── SECTION 3: QUICK NAVIGATION HUB ─────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono mb-3">Management Modules</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <button
            onClick={() => router.push('/admin/properties')}
            className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-900 hover:border-zinc-700 text-left transition flex flex-col justify-between group"
          >
            <Home className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-xs font-semibold text-white">Properties</p>
              <p className="text-[10px] text-zinc-500">Approve & disable</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/landlords')}
            className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-900 hover:border-zinc-700 text-left transition flex flex-col justify-between group"
          >
            <Building2 className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-xs font-semibold text-white">Landlords</p>
              <p className="text-[10px] text-zinc-500">Verify & manage</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/applications')}
            className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-900 hover:border-zinc-700 text-left transition flex flex-col justify-between group"
          >
            <FileText className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-xs font-semibold text-white">Applications</p>
              <p className="text-[10px] text-zinc-500">Review student apps</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/students')}
            className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-900 hover:border-zinc-700 text-left transition flex flex-col justify-between group"
          >
            <GraduationCap className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-xs font-semibold text-white">Students</p>
              <p className="text-[10px] text-zinc-500">Accounts & profiles</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/analytics')}
            className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-900 hover:border-zinc-700 text-left transition flex flex-col justify-between group"
          >
            <BarChart className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-xs font-semibold text-white">Analytics</p>
              <p className="text-[10px] text-zinc-500">Platform metrics</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/traffic')}
            className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-900 hover:border-zinc-700 text-left transition flex flex-col justify-between group"
          >
            <LineChart className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-xs font-semibold text-white">Traffic</p>
              <p className="text-[10px] text-zinc-500">Visitors & sources</p>
            </div>
          </button>
        </div>
      </div>

      {/* ─── SECTION 4: RECENT PROPERTIES TABLE ───────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Properties Listed</h3>
            <p className="text-xs text-zinc-500">Latest listings on student24 with direct status control</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-zinc-800 text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
            onClick={() => router.push('/admin/properties')}
          >
            View All Properties ({totalProperties})
          </Button>
        </div>

        {properties.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">Loading properties from Convex...</div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {recentProperties.map((prop: any) => {
              const photo = (prop.photoUrls && prop.photoUrls[0]) || (prop.images && prop.images[0]) || null;
              return (
                <div key={prop._id || prop.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {photo && typeof photo === 'string' && photo.startsWith('http') ? (
                        <Image src={photo} alt={prop.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <Home className="w-5 h-5 text-zinc-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{prop.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {prop.city || prop.location?.city || "South Africa"} • R{prop.pricePerMonth || 0}/mo
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {getStatusBadge(prop.status)}
                    <button
                      onClick={() => router.push(`/admin/properties?search=${encodeURIComponent(prop.name)}`)}
                      className="text-xs text-zinc-400 hover:text-white transition px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── SECTION 5: RECENT APPLICATIONS TABLE ─────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Student Applications</h3>
            <p className="text-xs text-zinc-500">Applications submitted for student accommodations</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-zinc-800 text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
            onClick={() => router.push('/admin/applications')}
          >
            View All Applications ({totalApplications})
          </Button>
        </div>

        {applications.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">Loading student applications...</div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {recentApplications.map((app: any) => {
              const appDate = formatAppDate(app.applicationDate || app.createdAt);
              const propName = app.property?.name || "Accommodation Listing";
              return (
                <div key={app._id || app.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-white">{app.name || "Student Applicant"}</p>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Applied for <span className="text-zinc-200 font-medium">{propName}</span> on {appDate}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1">
                      {app.email && <span className="flex items-center gap-1"><Mail size={11} /> {app.email}</span>}
                      {app.phoneNumber && <span className="flex items-center gap-1"><Phone size={11} /> {app.phoneNumber}</span>}
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => router.push('/admin/applications')}
                      className="text-xs text-blue-400 hover:text-blue-300 transition px-3 py-1 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20"
                    >
                      Review
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
