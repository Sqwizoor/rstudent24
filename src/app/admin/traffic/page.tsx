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
        const session = await fetchAuthSession();
        if (!session.tokens) {
          router.push("/admin-login");
          return;
        }
        setAuthInitialized(true);
      } catch (error) {
        console.error("Error initializing admin auth:", error);
        router.push("/admin-login");
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
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 p-6 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Traffic Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Monitor your website visitors, referral sources, and engagement
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Range Selector */}
          <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-700">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          
          <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <span className="ml-2 text-slate-500">Loading analytics...</span>
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchAnalytics} className="mt-4">Retry</Button>
        </Card>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-100">Total Pageviews</p>
                    <h3 className="text-3xl font-bold mt-1">{data.summary.totalPageviews.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <Eye className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-100">Unique Visitors</p>
                    <h3 className="text-3xl font-bold mt-1">{data.summary.uniqueVisitors.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-100">Avg. Session</p>
                    <h3 className="text-3xl font-bold mt-1">{data.summary.avgSessionDuration}</h3>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-rose-500 to-rose-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-rose-100">Bounce Rate</p>
                    <h3 className="text-3xl font-bold mt-1">{data.summary.bounceRate}%</h3>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Daily Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-indigo-500" />
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
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-emerald-500" />
                  Top Referrers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.referrers} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} name="Visits" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-purple-500" />
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
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-indigo-500" />
                    <span className="text-sm">Desktop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm">Mobile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tablet className="h-5 w-5 text-amber-500" />
                    <span className="text-sm">Tablet</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Two Column Layout - Pages and Countries */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topPages.map((page, index) => (
                    <div key={page.page} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium text-sm truncate max-w-[200px]">{page.page}</span>
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{page.count.toLocaleString()} views</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Countries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  Visitors by Country
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.countries.map((country, index) => {
                    const maxCount = data.countries[0]?.count || 1;
                    const percentage = (country.count / maxCount) * 100;
                    return (
                      <div key={country.country} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{country.country}</span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">{country.count.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
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
          <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-dashed">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                  <svg className="w-6 h-6" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M64 128C99.3462 128 128 99.3462 128 64C128 28.6538 99.3462 0 64 0C28.6538 0 0 28.6538 0 64C0 99.3462 28.6538 128 64 128Z" fill="#1D4AFF"/>
                    <path d="M35.5 89.5L51.5 73.5L66.5 88.5L92.5 62.5" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Powered by PostHog</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Open-source product analytics</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href="https://posthog.com" target="_blank" rel="noopener noreferrer">
                  Visit PostHog
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
