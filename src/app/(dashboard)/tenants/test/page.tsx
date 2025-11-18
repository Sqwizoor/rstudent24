"use client";

import React, { useEffect } from "react";

export default function TestPage() {
  useEffect(() => {
    console.log("✅ TestPage mounted successfully");
    console.log("Current URL:", window.location.href);
    console.log("Timestamp:", new Date().toISOString());
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="p-6 bg-green-900/20 border-2 border-green-600 rounded-xl">
          <h1 className="text-3xl font-bold mb-2">✅ Success!</h1>
          <p className="text-green-300">If you see this page, React rendering is working correctly.</p>
        </div>
        
        <div className="p-6 bg-gray-800 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">System Status:</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> 
              <span>Next.js Client-Side Rendering: <strong className="text-green-400">Working</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Dashboard Layout: <strong className="text-green-400">Loaded</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Page Component: <strong className="text-green-400">Mounted</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Tailwind CSS: <strong className="text-green-400">Active</strong></span>
            </li>
          </ul>
        </div>

        <div className="p-6 bg-blue-900/20 border border-blue-600 rounded-xl">
          <h2 className="text-xl font-semibold mb-3">Next Steps:</h2>
          <ol className="space-y-2 text-sm list-decimal list-inside">
            <li>Check browser console (F12) - Should show &quot;TestPage mounted successfully&quot;</li>
            <li>Try visiting <a href="/tenants/system-check" className="text-blue-400 hover:underline">/tenants/system-check</a></li>
            <li>Then try <a href="/tenants/dashboard" className="text-blue-400 hover:underline">/tenants/dashboard</a></li>
          </ol>
        </div>

        <div className="flex gap-4">
          <a 
            href="/tenants/system-check"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
          >
            Run System Check
          </a>
          <a 
            href="/tenants/dashboard"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
          >
            Go to Dashboard
          </a>
          <button
            onClick={() => console.log("Button clicked! Console is working.")}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
          >
            Test Console
          </button>
        </div>
      </div>
    </div>
  );
}
