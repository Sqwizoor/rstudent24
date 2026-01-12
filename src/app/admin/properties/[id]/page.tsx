"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash, Eye } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Property #{property.id} Details</h1>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h2 className="text-xl font-bold mb-2">{property.name}</h2>
            <p className="text-sm text-slate-500 mb-2">ID: {property.id}</p>
            <p className="text-sm mb-2">{property.description}</p>
            <p className="text-sm">Location: {property.location?.address}, {property.location?.city}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div>
              <Badge variant="outline" className="text-sm">Status: {property.status || 'Unknown'}</Badge>
            </div>
            <div className="flex gap-2">
              {property.isDisabled ? (
                <Button size="sm" variant="default" onClick={handleEnable} disabled={isProcessing}>
                  <Eye className="mr-2 h-4 w-4" /> Enable
                </Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={handleDisable} disabled={isProcessing}>
                  <Trash className="mr-2 h-4 w-4" /> Disable
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Additional details can be added here (rooms, reviews, leases etc.) */}
    </div>
  );
}
