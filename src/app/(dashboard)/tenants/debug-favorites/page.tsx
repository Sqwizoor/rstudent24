"use client";

import React, { useEffect } from "react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

export default function DebugFavorites() {
  const { user, isLoading, isAuthenticated } = useUnifiedAuth();

  useEffect(() => {
    console.log("=== DEBUG FAVORITES PAGE ===");
    console.log("Auth State:", { user, isLoading, isAuthenticated });
    console.log("User ID:", user?.id);
    console.log("User Role:", user?.role);
  }, [user, isLoading, isAuthenticated]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Debug Favorites Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Authentication Status:</h2>
          <ul className="space-y-1 text-sm">
            <li>Loading: {isLoading ? "✅ Yes" : "❌ No"}</li>
            <li>Authenticated: {isAuthenticated ? "✅ Yes" : "❌ No"}</li>
            <li>User ID: {user?.id || "None"}</li>
            <li>User Role: {user?.role || "None"}</li>
            <li>User Email: {user?.email || "None"}</li>
          </ul>
        </div>

        {isLoading && (
          <div className="p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
            <p>⏳ Loading authentication...</p>
          </div>
        )}

        {!isLoading && !isAuthenticated && (
          <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg">
            <p>❌ Not authenticated - Please sign in</p>
          </div>
        )}

        {!isLoading && isAuthenticated && (
          <div className="p-4 bg-green-900/20 border border-green-600 rounded-lg">
            <p>✅ Authenticated successfully!</p>
            <p className="mt-2">User: {user?.name || user?.email}</p>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
        <h3 className="font-semibold mb-2">Check Browser Console (F12)</h3>
        <p className="text-sm">Look for detailed logs and any errors</p>
      </div>
    </div>
  );
}
