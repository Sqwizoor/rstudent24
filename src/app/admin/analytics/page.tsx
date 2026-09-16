"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetAuthUserQuery, useGetAnalyticsQuery } from "@/state/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building2, Users, Home, Banknote, MapPin, Loader2 } from "lucide-react";

// Define colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("month");
  const { data: authUser } = useGetAuthUserQuery();
  const { data: analyticsData, isLoading, error, refetch } = useGetAnalyticsQuery({ timeRange });
  const router = useRouter();

  // Refetch data when time range changes
  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange);
    // The query will automatically refetch due to the parameter change
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">Analytics Dashboard</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin')}
            className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs h-9"
          >
            Back to Dashboard
          </Button>
        </div>
        <div className="flex items-center justify-center h-64 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <span className="ml-2 text-sm">Loading analytics data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">Analytics Dashboard</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin')}
            className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs h-9"
          >
            Back to Dashboard
          </Button>
        </div>
        <div className="text-center text-rose-400 py-12">
          <p>Error loading analytics data. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">Analytics Dashboard</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin')}
            className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs h-9"
          >
            Back to Dashboard
          </Button>
        </div>
        <div className="text-center text-zinc-400 py-12">
          <p>No analytics data available.</p>
        </div>
      </div>
    );
  }

  const { 
    summary, 
    propertyData, 
    cityData, 
    priceRangeData, 
    landlordActivityData, 
    studentActivityData,
    landlordStatusData,
    propertyStatusData
  } = analyticsData;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Analytics Dashboard</h1>
          <p className="text-xs text-zinc-400 mt-1">Real-time platform insights, landlord metrics, and student activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[160px] h-9 rounded-xl border-zinc-800 bg-zinc-900 text-xs text-zinc-200">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-200 rounded-xl">
              <SelectItem value="week" className="text-xs">Last 7 days</SelectItem>
              <SelectItem value="month" className="text-xs">Last 30 days</SelectItem>
              <SelectItem value="quarter" className="text-xs">Last 3 months</SelectItem>
              <SelectItem value="year" className="text-xs">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin')}
            className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs h-9"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-400">Total Properties</p>
              <h3 className="text-2xl font-bold text-white mt-1">{summary.totalProperties}</h3>
            </div>
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <Home className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-400">Total Landlords</p>
              <h3 className="text-2xl font-bold text-white mt-1">{summary.totalLandlords}</h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-400">Total Students</p>
              <h3 className="text-2xl font-bold text-white mt-1">{summary.totalTenants}</h3>
            </div>
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-400">Active Leases</p>
              <h3 className="text-2xl font-bold text-white mt-1">{summary.totalLeases}</h3>
            </div>
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Banknote className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs for different analytics views */}
      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-900 border border-zinc-800 text-zinc-400 p-1 rounded-xl">
          <TabsTrigger value="properties" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-lg text-xs font-medium">Property Analytics</TabsTrigger>
          <TabsTrigger value="landlords" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-lg text-xs font-medium">Landlord Analytics</TabsTrigger>
          <TabsTrigger value="students" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-lg text-xs font-medium">Student Analytics</TabsTrigger>
        </TabsList>
        
        {/* Property Analytics */}
        <TabsContent value="properties" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Property Types */}
            <Card className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
              <h3 className="text-base font-semibold mb-4 text-white">Property Types</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={propertyData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={(entry) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {propertyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid #27272a', color: '#ffffff' }} />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* Property Locations */}
            <Card className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
              <h3 className="text-base font-semibold mb-4 text-white">Property Locations</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={cityData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis type="number" stroke="#71717a" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={80} stroke="#71717a" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid #27272a', color: '#ffffff' }} />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                    <Bar dataKey="count" fill="#3b82f6" name="Properties" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* Price Ranges */}
            <Card className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
              <h3 className="text-base font-semibold mb-4 text-white">Price Ranges</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={priceRangeData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis stroke="#71717a" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid #27272a', color: '#ffffff' }} />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                    <Bar dataKey="count" fill="#10b981" name="Properties" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* Property Availability */}
            <Card className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
              <h3 className="text-base font-semibold mb-4 text-white">Property Status</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={propertyStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {propertyStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid #27272a', color: '#ffffff' }} />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>
        
        {/* Landlord Analytics */}
        <TabsContent value="landlords" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Landlords by Properties */}
            <Card className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
              <h3 className="text-base font-semibold mb-4 text-white">Top Landlords by Properties</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={landlordActivityData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis type="number" stroke="#71717a" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={100} stroke="#71717a" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid #27272a', color: '#ffffff' }} />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                    <Bar dataKey="properties" fill="#8b5cf6" name="Properties" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* Top Landlords by Applications */}
            <Card className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
              <h3 className="text-base font-semibold mb-4 text-white">Top Landlords by Applications</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={landlordActivityData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis type="number" stroke="#71717a" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={100} stroke="#71717a" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid #27272a', color: '#ffffff' }} />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                    <Bar dataKey="applications" fill="#10b981" name="Applications" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* Top Landlords by Leases */}
            <Card className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
              <h3 className="text-base font-semibold mb-4 text-white">Top Landlords by Leases</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={landlordActivityData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis type="number" stroke="#71717a" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={100} stroke="#71717a" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid #27272a', color: '#ffffff' }} />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                    <Bar dataKey="leases" fill="#f59e0b" name="Leases" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* Landlord Status */}
            <Card className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
              <h3 className="text-base font-semibold mb-4 text-white">Landlord Status</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={landlordStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {landlordStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid #27272a', color: '#ffffff' }} />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>
        
        {/* Student Analytics */}
        <TabsContent value="students" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Student Activity Over Time */}
            <Card className="p-5 md:col-span-2 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
              <h3 className="text-base font-semibold mb-4 text-white">Student Activity Over Time</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={studentActivityData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="month" stroke="#71717a" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis stroke="#71717a" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid #27272a', color: '#ffffff' }} />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                    <Bar dataKey="favorites" fill="#8b5cf6" name="Favorites" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="applications" fill="#10b981" name="Applications" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="leases" fill="#f59e0b" name="Leases" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* Student Preferences - Property Types */}
            <Card className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
              <h3 className="text-base font-semibold mb-4 text-white">Student Preferences - Property Types</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={propertyData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {propertyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid #27272a', color: '#ffffff' }} />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* Student Preferences - Price Range */}
            <Card className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
              <h3 className="text-base font-semibold mb-4 text-white">Student Preferences - Price Range</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priceRangeData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {priceRangeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid #27272a', color: '#ffffff' }} />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
