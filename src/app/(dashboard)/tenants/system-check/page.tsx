"use client";

import React, { useEffect, useState } from "react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

export default function SystemCheck() {
  const { user, isLoading, isAuthenticated, provider } = useUnifiedAuth();
  const [checks, setChecks] = useState({
    authSystem: "checking",
    userDetected: "checking",
    roleValid: "checking",
    providerActive: "checking",
  });

  useEffect(() => {
    if (!isLoading) {
      setChecks({
        authSystem: "pass",
        userDetected: isAuthenticated ? "pass" : "fail",
        roleValid: user?.role ? "pass" : "fail",
        providerActive: provider ? "pass" : "fail",
      });
    }
  }, [isLoading, isAuthenticated, user, provider]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "fail":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "checking":
        return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass":
        return "bg-green-900/20 border-green-600";
      case "fail":
        return "bg-red-900/20 border-red-600";
      case "checking":
        return "bg-yellow-900/20 border-yellow-600";
      default:
        return "bg-gray-900/20 border-gray-600";
    }
  };

  const allPassed = Object.values(checks).every((v) => v === "pass");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Tenant Dashboard System Check
          </h1>
          <p className="text-gray-400">
            Verifying all systems are operational
          </p>
        </div>

        {/* Overall Status */}
        <div
          className={`p-6 rounded-2xl border-2 ${
            isLoading
              ? "bg-yellow-900/10 border-yellow-600"
              : allPassed
              ? "bg-green-900/10 border-green-600"
              : "bg-red-900/10 border-red-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isLoading ? (
                <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
              ) : allPassed ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
              <div>
                <h2 className="text-2xl font-semibold">
                  {isLoading
                    ? "Checking..."
                    : allPassed
                    ? "All Systems Operational"
                    : "Issues Detected"}
                </h2>
                <p className="text-sm text-gray-400">
                  {isLoading
                    ? "Running diagnostics..."
                    : allPassed
                    ? "Your dashboard should work perfectly!"
                    : "Please review the issues below"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Checks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CheckCard
            title="Authentication System"
            status={checks.authSystem}
            details="Unified auth system initialized"
            icon={getStatusIcon(checks.authSystem)}
            color={getStatusColor(checks.authSystem)}
          />
          <CheckCard
            title="User Detection"
            status={checks.userDetected}
            details={isAuthenticated ? "User session found" : "No active session"}
            icon={getStatusIcon(checks.userDetected)}
            color={getStatusColor(checks.userDetected)}
          />
          <CheckCard
            title="Role Validation"
            status={checks.roleValid}
            details={user?.role ? `Role: ${user.role}` : "No role assigned"}
            icon={getStatusIcon(checks.roleValid)}
            color={getStatusColor(checks.roleValid)}
          />
          <CheckCard
            title="Auth Provider"
            status={checks.providerActive}
            details={provider ? `Provider: ${provider}` : "No provider detected"}
            icon={getStatusIcon(checks.providerActive)}
            color={getStatusColor(checks.providerActive)}
          />
        </div>

        {/* User Info */}
        {!isLoading && isAuthenticated && (
          <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-2xl">
            <h3 className="text-xl font-semibold mb-4">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <InfoRow label="User ID" value={user?.id || "N/A"} />
              <InfoRow label="Name" value={user?.name || "N/A"} />
              <InfoRow label="Email" value={user?.email || "N/A"} />
              <InfoRow label="Role" value={user?.role || "N/A"} />
              <InfoRow label="Provider" value={provider || "N/A"} />
              <InfoRow
                label="Authenticated"
                value={isAuthenticated ? "Yes" : "No"}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="/tenants/dashboard"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
          >
            Go to Dashboard
          </a>
          <a
            href="/tenants/favorites"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
          >
            Go to Favorites
          </a>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition"
          >
            Refresh Check
          </button>
        </div>

        {/* Instructions */}
        {!allPassed && !isLoading && (
          <div className="p-6 bg-amber-900/20 border border-amber-600 rounded-2xl">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Troubleshooting Steps
            </h3>
            <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
              <li>Sign in with your account if you haven&apos;t already</li>
              <li>
                Make sure you&apos;re using a tenant/student account (not manager)
              </li>
              <li>Clear browser cache and refresh (Ctrl + Shift + R)</li>
              <li>Check browser console (F12) for detailed errors</li>
              <li>
                Try opening in incognito/private mode to rule out cache issues
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

const CheckCard = ({
  title,
  status,
  details,
  icon,
  color,
}: {
  title: string;
  status: string;
  details: string;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className={`p-4 rounded-xl border ${color}`}>
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-white">{title}</h4>
        <p className="text-sm text-gray-400 mt-1 truncate">{details}</p>
      </div>
    </div>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <span className="text-gray-400 text-xs uppercase tracking-wide">{label}</span>
    <span className="text-white font-medium truncate">{value}</span>
  </div>
);
