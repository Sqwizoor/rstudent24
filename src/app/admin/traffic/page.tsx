"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, Eye, Clock, TrendingDown, Globe, Monitor, Smartphone, Tablet,
  ArrowLeft, RefreshCw, ExternalLink, Loader2
} from "lucide-react";
import { configureAdminAuth, checkAdminAuth } from "../adminAuth";
import { fetchAuthSession } from "aws-amplify/auth";
import { AnalyticsSkeleton } from "./AnalyticsSkeleton";

// Chart colors
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const GRADIENT_COLORS = {
  primary: ['#6366f1', '#4f46e5'],
  success: ['#22c55e', '#16a34a'],
  warning: ['#f59e0b', '#d97706'],
  danger: ['#ef4444', '#dc2626'],
};

interface AnalyticsData {
  summary: {
    totalPageviews: number;
    uniqueVisitors: number;
    avgSessionDuration: string;
    bounceRate: number;
  };
  dailyTrend: Array<{ date: string; pageviews: number; visitors?: number }>;
  referrers: Array<{ name: string; count: number }>;
  topPages: Array<{ page: string; count: number }>;
  countries: Array<{ country: string; count: number }>;
  devices: Array<{ name: string; value: number }>;
  timeRange: string;
}

export default function TrafficAnalyticsPage() {
  const router = useRouter();
  const [authInitialized, setAuthInitialized] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        configureAdminAuth();
        setAuthInitialized(true);
      } catch (error) {
        setAuthInitialized(true);
      }
    };
    initAuth();
  }, [router]);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/traffic-analytics?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authInitialized) {
      fetchAnalytics();
    }
  }, [authInitialized, timeRange]);

  if (!authInitialized) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Initializing admin session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Traffic & Page Analytics</h1>
          <p className="text-xs text-zinc-400 mt-1">Real-time web traffic, unique visitor trends, and device analytics.</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeRange === range
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchAnalytics} 
            disabled={isLoading}
            className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white h-9 w-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin')}
            className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs h-9"
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {isLoading ? (
        <AnalyticsSkeleton />
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchAnalytics} className="mt-4">Retry</Button>
        </Card>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-indigo-900/60 to-indigo-950/80 text-white border-b border-indigo-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-indigo-300">Total Pageviews</p>
                    <h3 className="text-3xl font-bold mt-1 text-white">{data.summary.totalPageviews.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-300">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-emerald-900/60 to-emerald-950/80 text-white border-b border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-300">Unique Visitors</p>
                    <h3 className="text-3xl font-bold mt-1 text-white">{data.summary.uniqueVisitors.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-amber-900/60 to-amber-950/80 text-white border-b border-amber-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-amber-300">Avg. Session</p>
                    <h3 className="text-3xl font-bold mt-1 text-white">{data.summary.avgSessionDuration}</h3>
                  </div>
                  <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-rose-900/60 to-rose-950/80 text-white border-b border-rose-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-rose-300">Bounce Rate</p>
                    <h3 className="text-3xl font-bold mt-1 text-white">{data.summary.bounceRate}%</h3>
                  </div>
                  <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Daily Trend Chart */}
          <Card className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl text-zinc-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white text-base">
                <Eye className="h-4 w-4 text-indigo-400" />
                Daily Traffic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dailyTrend}>
                    <defs>
                      <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#09090b', 
                        borderRadius: '12px',
                        border: '1px solid #27272a',
                        color: '#ffffff'
                      }} 
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="pageviews" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorPageviews)" 
                      name="Pageviews"
                    />
                    {data.dailyTrend[0]?.visitors !== undefined && (
                      <Area 
                        type="monotone" 
                        dataKey="visitors" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorVisitors)" 
                        name="Visitors"
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Two Column Layout */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Referrers */}
            <Card className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl text-zinc-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white text-base">
                  <ExternalLink className="h-4 w-4 text-emerald-400" />
                  Top Referrers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.referrers} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#09090b', 
                          borderRadius: '12px',
                          border: '1px solid #27272a',
                          color: '#ffffff'
                        }} 
                      />
                      <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} name="Visits" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl text-zinc-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white text-base">
                  <Monitor className="h-4 w-4 text-purple-400" />
                  Device Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.devices}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.devices.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#09090b', 
                          borderRadius: '12px',
                          border: '1px solid #27272a',
                          color: '#ffffff'
                        }} 
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs text-zinc-300">Desktop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-zinc-300">Mobile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tablet className="h-4 w-4 text-amber-400" />
                    <span className="text-xs text-zinc-300">Tablet</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Two Column Layout - Pages and Countries */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Pages */}
            <Card className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl text-zinc-100">
              <CardHeader>
                <CardTitle className="text-white text-base">Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {data.topPages.map((page, index) => (
                    <div key={page.page} className="flex items-center justify-between p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
                          {index + 1}
                        </span>
                        <span className="font-medium text-xs text-zinc-200 truncate max-w-[200px]">{page.page}</span>
                      </div>
                      <span className="text-xs font-mono text-zinc-400">{page.count.toLocaleString()} views</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Countries */}
            <Card className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl text-zinc-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white text-base">
                  <Globe className="h-4 w-4 text-blue-400" />
                  Visitors by Country
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.countries.map((country) => {
                    const maxCount = data.countries[0]?.count || 1;
                    const percentage = (country.count / maxCount) * 100;
                    return (
                      <div key={country.country} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-zinc-200">{country.country}</span>
                          <span className="text-xs font-mono text-zinc-400">{country.count.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PostHog Attribution */}
          <Card className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl text-zinc-100 border-dashed">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M64 128C99.3462 128 128 99.3462 128 64C128 28.6538 99.3462 0 64 0C28.6538 0 0 28.6538 0 64C0 99.3462 28.6538 128 64 128Z" fill="#1D4AFF"/>
                    <path d="M35.5 89.5L51.5 73.5L66.5 88.5L92.5 62.5" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-white">Powered by PostHog</p>
                  <p className="text-[11px] text-zinc-400">Open-source product analytics</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-900">
                <a href="https://posthog.com" target="_blank" rel="noopener noreferrer">
                  Visit PostHog
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
