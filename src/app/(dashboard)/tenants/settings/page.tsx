"use client";
import React, { useMemo } from "react";
import SettingsForm from "@/components/SettingsForm";
import ErrorBoundary from "@/components/ErrorBoundary";
import { FormSkeleton } from "@/components/ui/skeletons";
import {
  useGetTenantQuery,
  useUpdateTenantSettingsMutation,
} from "@/state/api";
import { skipToken } from "@reduxjs/toolkit/query";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

const TenantSettingsContent = () => {
  const { user, isLoading: authLoading, isAuthenticated } = useUnifiedAuth();
  const tenantId = user?.id;
  const { data: tenantData, isLoading: tenantLoading } = useGetTenantQuery(
    tenantId ? tenantId : skipToken
  );

  const [updateTenant] = useUpdateTenantSettingsMutation();

  const isLoading = authLoading || (isAuthenticated && tenantLoading);
  const isTenant = user?.role === "tenant" || user?.role === "student";

  // useMemo must be called before any conditional returns
  const initialData = useMemo(
    () => ({
      name: tenantData?.name || user?.userInfo?.name || "",
      email: tenantData?.email || user?.userInfo?.email || "",
      phoneNumber: tenantData?.phoneNumber || user?.userInfo?.phoneNumber || "",
    }),
    [tenantData, user?.userInfo]
  );

  if (isLoading) return <FormSkeleton />;

  if (!isAuthenticated || !tenantId || !isTenant) {
    return (
      <div className="flex bg-[#0F1112] justify-center p-8">
        <div className="text-white text-center">
          <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
          <p>This page is only accessible to tenant users.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: typeof initialData) => {
    if (!tenantId) return;

    try {
      await updateTenant({
        cognitoId: tenantId,
        ...data,
      }).unwrap();
    } catch (error) {
      console.error("Failed to update tenant settings:", error);
    }
  };

  return (
    <div className="flex bg-[#0F1112] justify-center md:mx-w-10xl">
      <SettingsForm
        initialData={initialData}
        onSubmit={handleSubmit}
        userType="tenant"
      />
    </div>
  );
};

const TenantSettings = () => {
  return (
    <ErrorBoundary>
      <TenantSettingsContent />
    </ErrorBoundary>
  );
};

export default TenantSettings;