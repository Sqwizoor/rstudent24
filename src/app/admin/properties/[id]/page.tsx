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
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        <Card className="p-6">
          <p className="text-red-500">{error}</p>
          <Button className="mt-4" onClick={() => router.push('/admin/properties')}>Go to Properties</Button>
        </Card>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="p-6">
          <p className="text-slate-600">No property found.</p>
          <Button className="mt-4" onClick={() => router.push('/admin/properties')}>Back to list</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/properties')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
          <h1 className="text-2xl font-bold">Property #{property.id} Details</h1>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2 text-blue-600 dark:text-blue-400">{property.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">ID: {property.id} • Posted on {new Date(property.postedDate).toLocaleDateString()}</p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Description</h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">{property.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Location</h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">
                  {property.location?.address}, {property.location?.city}, {property.location?.state}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Price</h3>
                  <p className="text-xl font-bold text-blue-600">R{property.pricePerMonth.toLocaleString()}/mo</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Units</h3>
                  <p className="text-xl font-bold">{property.beds} Beds • {property.baths} Baths</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-64 space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-medium mb-3">Admin Controls</h3>
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-slate-500">Approval Status</span>
                  <Badge 
                    variant={
                      property.status === "Approved"
                        ? "default"
                        : property.status === "Denied" || property.isDisabled
                          ? "destructive"
                          : "outline"
                    } 
                    className="w-fit"
                  >
                    {property.isDisabled ? "Blocked" : (property.status || "Pending")}
                  </Badge>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  {property.status !== "Approved" && (
                    <Button 
                      size="sm" 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
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
                      className="w-full"
                      onClick={() => handleUpdateStatus('Denied')}
                      disabled={isProcessing}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Deny Content
                    </Button>
                  )}

                  {property.isDisabled ? (
                    <Button size="sm" variant="outline" className="w-full" onClick={handleEnable} disabled={isProcessing}>
                      <Eye className="mr-2 h-4 w-4" /> Unblock Property
                    </Button>
                  ) : (
                    <Button size="sm" variant="destructive" className="w-full" onClick={handleDisable} disabled={isProcessing}>
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
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Property Photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {property.photoUrls.map((url: string, index: number) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                <img src={url} alt={`Property ${index}`} className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
