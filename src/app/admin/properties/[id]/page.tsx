"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash, Eye, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPropertyDetails() {
  const params = useParams();
  const idStr = params.id as string;
  const id = Number(idStr);
  const router = useRouter();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function fetchProperty() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/properties/${id}`);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'Failed to load property');
        }
        const data = await res.json();
        setProperty(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load property');
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProperty();
  }, [id]);

  const handleDisable = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/properties/delete?id=${id}`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Property blocked');
      // Refresh and navigate back to list
      router.push('/admin/properties');
    } catch (err: any) {
      console.error('Disable error:', err);
      toast.error(err?.message || 'Failed to disable');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnable = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/properties/enable?id=${id}`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Property enabled');
      router.push('/admin/properties');
    } catch (err: any) {
      console.error('Enable error:', err);
      toast.error(err?.message || 'Failed to enable');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = async (status: 'Approved' | 'Denied') => {
    if (!id) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/properties/update-status`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`Property ${status.toLowerCase()}`);
      // Reload the page to show updated status
      window.location.reload();
    } catch (err: any) {
      console.error('Status update error:', err);
      toast.error(err?.message || 'Failed to update status');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 bg-blue-200 dark:bg-blue-800 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mr-4 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white">Error</h1>
        </div>
        <Card className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/70">
          <p className="text-rose-400 text-sm">{error}</p>
          <Button className="mt-4 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700" onClick={() => router.push('/admin/properties')}>Go to Properties</Button>
        </Card>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/70">
          <p className="text-zinc-400 text-sm">No property found.</p>
          <Button className="mt-4 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700" onClick={() => router.push('/admin/properties')}>Back to list</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/properties')} className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs h-9">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Property #{property.id}</h1>
            <p className="text-xs text-zinc-400 mt-0.5">{property.name}</p>
          </div>
        </div>
      </div>

      <Card className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl text-zinc-100">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2 text-white">{property.name}</h2>
            <p className="text-xs text-zinc-400 mb-4 font-mono">ID: {property.id} • Posted on {new Date(property.postedDate).toLocaleDateString()}</p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-mono">Description</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-300">{property.description}</p>
              </div>
              
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-mono">Location</h3>
                <p className="mt-1 text-xs text-zinc-300">
                  {[property.location?.address, property.location?.city, property.location?.state].filter(Boolean).join(", ")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-mono">Price</h3>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">R{property.pricePerMonth?.toLocaleString() || 0}/mo</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-mono">Units</h3>
                  <p className="text-2xl font-bold text-white mt-1">{property.beds} Beds • {property.baths} Baths</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-64 space-y-4">
            <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono mb-3">Admin Controls</h3>
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-zinc-500">Approval Status</span>
                  <Badge 
                    variant="outline"
                    className={
                      property.status === "Approved"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs w-fit"
                        : property.status === "Denied" || property.isDisabled
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs w-fit"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs w-fit"
                    }
                  >
                    {property.isDisabled ? "Blocked" : (property.status || "Pending")}
                  </Badge>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  {property.status !== "Approved" && (
                    <Button 
                      size="sm" 
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                      onClick={() => handleUpdateStatus('Approved')}
                      disabled={isProcessing}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve Content
                    </Button>
                  )}

                  {property.status === "Pending" && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="w-full rounded-xl text-xs h-8"
                      onClick={() => handleUpdateStatus('Denied')}
                      disabled={isProcessing}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Deny Content
                    </Button>
                  )}

                  {property.isDisabled ? (
                    <Button size="sm" variant="outline" className="w-full rounded-xl border-zinc-700 bg-zinc-800 text-zinc-200 hover:text-white text-xs h-8" onClick={handleEnable} disabled={isProcessing}>
                      <Eye className="mr-2 h-4 w-4" /> Unblock Property
                    </Button>
                  ) : (
                    <Button size="sm" variant="destructive" className="w-full rounded-xl text-xs h-8" onClick={handleDisable} disabled={isProcessing}>
                      <Trash className="mr-2 h-4 w-4" /> Block Property
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {property.photoUrls && property.photoUrls.length > 0 && (
        <Card className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl text-zinc-100">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono mb-4">Property Photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {property.photoUrls.map((url: string, index: number) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                <img src={url} alt={`Property ${index}`} className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
