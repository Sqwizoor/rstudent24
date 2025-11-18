'use client';

import { useEffect, useState } from 'react';
import { configureAdminAuth, checkAdminAuth } from './adminAuth';

/**
 * A component to test the admin authentication state
 * Add this to your admin page to debug authentication issues
 */
export default function TestAdminAuth() {
  const [status, setStatus] = useState<{ 
    isAuthenticated: boolean; 
    userDetails: any; 
    error: string | null 
  }>({ 
    isAuthenticated: false, 
    userDetails: null, 
    error: null 
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        setLoading(true);
        
        // Configure auth first
        configureAdminAuth();
        
        // Check admin authentication
        const { isAuthenticated, adminData } = await checkAdminAuth();
        
        setStatus({
          isAuthenticated,
          userDetails: adminData,
          error: null
        });
      } catch (error) {
        console.error('Authentication test error:', error);
        setStatus({
          isAuthenticated: false,
          userDetails: null,
          error: error instanceof Error ? error.message : String(error)
        });
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-lg mt-4">
      <h3 className="text-lg font-semibold mb-2">Admin Auth Status</h3>
      
      {loading ? (
        <p>Checking authentication...</p>
      ) : (
        <div>
          <p><strong>Authenticated:</strong> {status.isAuthenticated ? '✅ Yes' : '❌ No'}</p>
          
          {status.error && (
            <p className="text-red-500"><strong>Error:</strong> {status.error}</p>
          )}
          
          {status.userDetails && (
            <div className="mt-2">
              <p><strong>User Details:</strong></p>
              <pre className="bg-gray-200 p-2 rounded overflow-auto max-h-40 text-xs">
                {JSON.stringify(status.userDetails, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
