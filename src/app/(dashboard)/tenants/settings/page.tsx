"use client";
import SettingsForm from "@/components/SettingsForm";
import {
  useGetAuthUserQuery,
  useUpdateTenantSettingsMutation,
} from "@/state/api";

import { FormSkeleton } from "@/components/ui/skeletons";
import React from "react";

const TenantSettings = () => {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const [updateTenant] = useUpdateTenantSettingsMutation();

  if (isLoading) return <FormSkeleton />;

  // Make sure we have valid user data and the correct role
  if (!authUser || authUser.userRole !== 'tenant') {
    return (
      <div className="flex bg-[#0F1112] justify-center p-8">
        <div className="text-white text-center">
          <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
          <p>This page is only accessible to tenant users.</p>
        </div>
      </div>
    );
  }

  const initialData = {
    name: authUser?.userInfo?.name || '',
    email: authUser?.userInfo?.email || '',
    phoneNumber: authUser?.userInfo?.phoneNumber || '',
  };

  const handleSubmit = async (data: typeof initialData) => {
    await updateTenant({
      cognitoId: authUser?.cognitoInfo?.userId || "",
      ...data,
    });
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

export default TenantSettings;