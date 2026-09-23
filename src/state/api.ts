import { cleanParams, createNewUserInDatabase, withToast } from "@/lib/utils"
import { isExplicitAdminEmail } from "@/lib/constants"
// Ensure prismaTypes correctly defines these or import directly from @prisma/client if preferred
// Assuming Tenant and Manager are the correct types for user details from DB
import type { Application, Lease, Manager, Payment, Property, Room, Tenant } from "@/types/prismaTypes"
import type { ExtendedAuthUser as CognitoAuthUser } from '@/types/cognito';
// Import RTK Query types
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { TagDescription } from '@reduxjs/toolkit/query';
import { toast } from 'sonner';

import { FiltersState } from "./index";

// Use relative paths for Next.js API routes
const API_BASE_URL = '/api';

export interface Admin {
  id: number;
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber?: string;
}

export interface AppUser {
  cognitoInfo: CognitoAuthUser;
  userInfo: Tenant | Manager | Admin;
  userRole: "tenant" | "manager" | "admin";
}

type CacheTagType = "Applications" | "Managers" | "Tenants" | "Properties" | "PropertyDetails" | "Leases" | "Payments" | "Rooms" | "Admins";

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    timeout: 60000,
    prepareHeaders: async (headers) => {
      // In Next.js, session cookies are sent automatically with same-origin requests
      return headers;
    },
    // Add response handling to properly handle non-JSON responses
    validateStatus: (response, body) => {
      if (response.status === 404) {
        // Return empty array for 404s on list endpoints
        if (response.url.includes('/rooms')) {
          return true;
        }
      }
      return response.status >= 200 && response.status < 300;
    },
    // Add custom response handling with retry logic
    async fetchFn(input, init) {
      // Check if this is a FormData request - if so, use simple fetch to avoid issues
      if (init?.body instanceof FormData) {
        console.log('RTK Query fetchFn: FormData detected, using simple fetch');
        console.log('Note: For updateProperty, this should be bypassed by queryFn');
        
        // Use a simple, direct fetch for FormData to avoid any potential issues
        const response = await fetch(input, {
          method: init.method || 'GET',
          headers: init.headers || {},
          body: init.body,
          credentials: init.credentials || 'same-origin',
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('FormData request failed:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        return response;
      }
      
      const maxRetries = 3;
      let retries = 0;
      let lastError;
      
      while (retries < maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          // Create a new Request object for each attempt to prevent reuse errors
          let requestInput = input;
          if (input instanceof Request) {
            // Clone the request properties but create a fresh Request object
            const url = input.url;
            const method = input.method;
            const headers = new Headers(input.headers);
            let body = null;
            
            // Only try to clone the body if it exists and we're not on a GET/HEAD request
            if (method !== 'GET' && method !== 'HEAD') {
              try {
                // We can't directly access the body, but we can create a new one from init if available
                if (init?.body) {
                  body = init.body;
                }
              } catch (e) {
                // Could not clone request body
              }
            }
            
            // Create a fresh Request object with the same properties
            requestInput = new Request(url, {
              method,
              headers,
              body,
              mode: input.mode,
              credentials: input.credentials,
              cache: input.cache,
              redirect: input.redirect,
              referrer: input.referrer,
              integrity: input.integrity,
            });
          }
          
          const response = await fetch(requestInput, {
            ...init,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          // Clone the response before reading it
          const clonedResponse = response.clone();
      
      try {
        // Try to parse as JSON first
        const data = await response.json();
        // Create a new Response with the JSON data
        return new Response(JSON.stringify(data), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (e) {
        // If parsing fails, handle based on status
        if (response.status === 404 && response.url.includes('/rooms')) {
          // Return empty array for 404s on rooms endpoint
          return new Response(JSON.stringify([]), {
            status: 200,
            statusText: 'OK',
            headers: response.headers
          });
        }
        
        // For other errors, get the text from the cloned response
        const errorText = await clonedResponse.text();
        throw {
          status: response.status,
          data: errorText,
          originalStatus: response.status
        };
      }
        } catch (error) {
          lastError = error;
          retries++;
          // API request failed, retry attempt
          
          if (retries >= maxRetries) {
            throw error;
          }
          
          // Exponential backoff: 1s, 2s, 4s, etc.
          const delay = Math.min(1000 * Math.pow(2, retries - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // This should never be reached due to the throw in the loop, but TypeScript needs it
      throw lastError;
    }
  }),
  reducerPath: "api",
  tagTypes: ["Managers", "Tenants", "Properties", "PropertyDetails", "Leases", "Payments", "Applications", "Rooms", "Admins", "TenantDashboard", "TenantFavorites", "Reviews"],
  endpoints: (build) => ({
    // --- Use the new AppUser type ---
    getAuthUser: build.query<AppUser, void>({
      queryFn: async (_, _queryApi, _extraoptions, fetchWithBQ) => {
        try {
          const res = await fetch('/api/auth/session');
          if (!res.ok) {
            return {
              error: {
                status: 401,
                error: "No authenticated user found",
                data: "User not authenticated"
              }
            } as const;
          }

          const session = await res.json();
          if (!session?.user?.email) {
            return {
              error: {
                status: 401,
                error: "No valid session found",
                data: "User not authenticated"
              }
            } as const;
          }

          const email = session.user.email.toLowerCase();
          const name = session.user.name || email.split('@')[0];
          const rawRole = (session.user.role || 'tenant').toLowerCase();

          const isExplicitAdmin = isExplicitAdminEmail(email);
          const userRole: "tenant" | "manager" | "admin" = isExplicitAdmin ? "admin" : 
                           (rawRole === "manager" ? "manager" : "tenant");

          const authUser: CognitoAuthUser = {
            userId: session.user.id || email,
            username: email,
            email: email,
            name: name,
            signInDetails: {
              loginId: email,
              attributes: {
                'custom:role': userRole
              }
            }
          };

          if (userRole === "admin") {
            const adminInfo: Admin = {
              id: 0,
              cognitoId: authUser.userId,
              name: name,
              email: email
            };
            return {
              data: {
                cognitoInfo: authUser,
                userInfo: adminInfo,
                userRole: "admin"
              }
            } as const;
          }

          const endpoint = userRole === "manager" ? `/managers/${authUser.userId}` : `/tenants/${authUser.userId}`;
          let userDetailsResponse = await fetchWithBQ(endpoint);

          if (userDetailsResponse.error && 
              ((userDetailsResponse.error as any).status === 404 || 
               (userDetailsResponse.error as any).status === 504)) {
            const fallbackToken = { payload: { email } };
            try {
              userDetailsResponse = await createNewUserInDatabase(authUser, fallbackToken, userRole, fetchWithBQ);
            } catch (err) {
              console.warn("Failed to create user in DB, using fallback", err);
            }
          }

          if (userDetailsResponse.error) {
            const fallbackUserInfo = {
              id: 1,
              cognitoId: authUser.userId,
              name: name,
              email: email,
              phoneNumber: ""
            };
            return {
              data: {
                cognitoInfo: authUser,
                userInfo: fallbackUserInfo as any,
                userRole: userRole
              }
            } as const;
          }

          const dbUser = userDetailsResponse.data as Tenant | Manager;
          const mergedUserInfo = {
            ...dbUser,
            email: email || dbUser.email,
          } as Tenant | Manager;

          return {
            data: {
              cognitoInfo: authUser,
              userInfo: mergedUserInfo,
              userRole: userRole
            }
          } as const;
        } catch (error: any) {
          const errorMessage = error?.message || error?.data?.message || "Could not fetch user data";
          return {
            error: {
              status: error?.status || 'CUSTOM_ERROR',
              error: errorMessage,
              details: error
            }
          } as const;
        }
      },
      providesTags: (result) => result?.userInfo
        ? (result.userRole === 'manager'
            ? [{ type: 'Managers', id: (result.userInfo as Manager).id }]
            : [{ type: 'Tenants', id: (result.userInfo as Tenant).id }])
        : [],
    }),

    // Property related endpoints
    getProperties: build.query<Property[], Partial<FiltersState> & { favoriteIds?: number[]; propertyName?: string; orderBy?: string; limit?: number }>({
      query: (filters) => {
        // Check if coordinates exist and are not [0, 0]
        const coords = filters.coordinates;
        const hasCoordinates = Array.isArray(coords) &&
          coords.length === 2 &&
          typeof coords[0] === 'number' &&
          typeof coords[1] === 'number' &&
          (coords[0] !== 0 || coords[1] !== 0);
        
        const params = cleanParams({
          location: filters.location,
          priceMin: filters.priceRange?.[0],
          priceMax: filters.priceRange?.[1],
          beds: filters.beds,
          baths: filters.baths,
          propertyType: filters.propertyType,
          squareFeetMin: filters.squareFeet?.[0],
          squareFeetMax: filters.squareFeet?.[1],
          amenities: filters.amenities?.join(","),
          availableFrom: filters.availableFrom,
          favoriteIds: filters.favoriteIds?.join(","),
          // Send coordinates in lng,lat format as expected by API
          coordinates: hasCoordinates ? `${coords[0]},${coords[1]}` : undefined,
          propertyName: filters.propertyName,
          orderBy: filters.orderBy,
          limit: filters.limit,
        });

        return { url: "properties", params };
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Properties" as const, id })), { type: "Properties", id: "LIST" }]
          : [{ type: "Properties", id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch properties.",
        });
      },
    }),

    getProperty: build.query<Property, number | string>({
      query: (id) => {
        return {
          url: `properties/${id}`,
          method: 'GET',
        };
      },
      transformErrorResponse: (response: any) => {
        if (response?.status === 404) {
          return { data: null };
        }
        return response;
      },
      providesTags: (result) => result ? [{ type: "PropertyDetails", id: result.id }] : [{ type: "PropertyDetails", id: 'LIST' }],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          // Failed to load property details
        }
      },
    }),

    // Create property with JSON data (no files)
    createProperty: build.mutation<Property, { propertyData: any, photoFiles?: File[] }>({
      async queryFn({ propertyData, photoFiles }, { dispatch, getState }, _extraOptions, baseQuery) {
        try {
          // First create the property without photos
          // Creating property
          const propertyResponse = await baseQuery({
            url: 'properties',
            method: 'POST',
            // Ensure the body is properly serialized as JSON
            body: JSON.stringify({ ...propertyData, photoUrls: [] }),
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (propertyResponse.error) {
            return { error: propertyResponse.error as FetchBaseQueryError };
          }
          
          const property = propertyResponse.data as Property;
          
          // If we have files to upload, do it in a second step
          if (photoFiles && photoFiles.length > 0) {
            try {
              // Upload each file individually
              const uploadPromises = photoFiles.map(async (file) => {
                // Uploading photo
                const formData = new FormData();
                formData.append('photo', file);
                formData.append('propertyId', property.id.toString());
                
                // Use a more direct approach for FormData
                const uploadResponse = await fetch(`/api/properties/${property.id}/photos`, {
                  method: 'POST',
                  body: formData,
                  // Don't set Content-Type, let the browser handle it
                }).then(res => res.json()).catch(err => {
                  return { error: { status: 'FETCH_ERROR', error: err.message } };
                });
                
                // Convert the fetch response to the format expected by RTK Query
                if (uploadResponse.error) {
                  throw new Error(uploadResponse.error.message || 'Error uploading photo');
                }
                
                return uploadResponse;
              });
              
              // Wait for all uploads to complete
              const uploadResults = await Promise.all(uploadPromises);
              // All photos uploaded successfully
              
              // Get the updated property with photo URLs
              const updatedPropertyResponse = await baseQuery({
                url: `properties/${property.id}`,
                method: 'GET',
              });
              
              if (updatedPropertyResponse.error) {
                return { error: updatedPropertyResponse.error as FetchBaseQueryError };
              }
              
              return { data: updatedPropertyResponse.data as Property };
            } catch (uploadError) {
              // Return the property even if photo upload failed
              return { data: property };
            }
          }
          
          return { data: property };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : String(error),
            } as FetchBaseQueryError 
          };
        }
      },
      invalidatesTags: (result) => [
        { type: "Properties", id: "LIST" },
        result ? { type: "PropertyDetails", id: result.id } : { type: "Properties", id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Property created successfully!",
          error: "Failed to create property.",
        });
      },
    }),

    updateProperty: build.mutation<Property, { id: string; body: FormData }>({
        // Use queryFn instead of query to completely bypass fetchBaseQuery for FormData
        async queryFn({ id, body }, { getState, extra, endpoint, forced, type }, extraOptions, baseQuery) {
            console.log('RTK Query updateProperty queryFn called with:');
            console.log('- ID:', id);
            console.log('- Body type:', body.constructor.name);
            console.log('- FormData entries:', Object.fromEntries(body.entries()));
            
            try {
                // Get auth token manually
                let authToken = '';
                try {
                    const session = await fetchAuthSession();
                    authToken = session.tokens?.idToken?.toString() || '';
                } catch (authError) {
                    console.warn('Could not get auth token:', authError);
                }
                
                // Use direct fetch to completely bypass RTK Query's request handling
                const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
                    method: 'PUT',
                    body: body, // Send FormData directly
                    headers: {
                        // Only include Authorization header, let browser set Content-Type for FormData
                        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
                    },
                });
                
                console.log('Direct fetch response status:', response.status);
                console.log('Direct fetch response headers:', Object.fromEntries(response.headers.entries()));
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Direct fetch failed:', errorText);
                    
                    // Parse error message if it's JSON
                    let errorData;
                    try {
                        errorData = JSON.parse(errorText);
                    } catch {
                        errorData = { message: errorText };
                    }
                    
                    return {
                        error: {
                            status: response.status,
                            data: errorData,
                        }
                    };
                }
                
                // Parse successful response
                const data = await response.json();
                console.log('Property update successful:', data);
                
                return { data };
                
            } catch (error) {
                console.error('Property update error:', error);
                return {
                    error: {
                        status: 'FETCH_ERROR',
                        error: error instanceof Error ? error.message : 'Unknown error occurred',
                    } as FetchBaseQueryError
                };
            }
        },
        invalidatesTags: (result, error, { id }) => [
            { type: "Properties", id: "LIST" },
            { type: "PropertyDetails", id: Number(id) },
        ],
        async onQueryStarted(_, { queryFulfilled }) {
            await withToast(queryFulfilled, {
                success: "Property updated successfully!",
                error: "Failed to update property.",
            });
        },
    }),

    deleteProperty: build.mutation<{ message: string; id: number }, { id: number; managerCognitoId?: string }>({
        query: ({ id, managerCognitoId }) => {
            // Ensure ID is a number
            const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
            
            // Build the URL with the manager ID as part of the query string
            const url = `properties/${numericId}`;
            
            return {
                url,
                method: "DELETE",
                params: managerCognitoId ? { managerCognitoId } : undefined,
            };
        },
        transformErrorResponse: (response: any) => {
            const message = response.data?.message || 
                          `Failed to delete property (Status: ${response.status})`;
            return { data: { message } };
        },
        invalidatesTags: (result, error, { id }) => [
            { type: "Properties", id: "LIST" },
            { type: "PropertyDetails", id },
        ],
        async onQueryStarted(_, { queryFulfilled }) {
            try {
                const result = await queryFulfilled;
                toast.success("Property deleted successfully!");
            } catch (error: any) {
                // Error deleting property
                toast.error(error?.data?.message || "Failed to delete property.");
            }
        },
    }),


    // Tenant related endpoints
    getTenant: build.query<Tenant, string>({
      query: (cognitoId) => `tenants/${cognitoId}`,
      providesTags: (result) => (result ? [{ type: "Tenants", id: result.id }] : []),
      // No error toast for tenant profile loading
    }),

    getCurrentResidences: build.query<Property[], string | 'skip'>({
      query: (cognitoId) => {
        // If skip indicator is passed, don't make the API call
        if (cognitoId === 'skip') {
          throw new Error('Skip query');
        }
        return `tenants/${cognitoId}/current-residences`;
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Properties" as const, id })), { type: "Properties", id: "LIST" }]
          : [{ type: "Properties", id: "LIST" }],
      async onQueryStarted(cognitoId, { queryFulfilled, dispatch }) {
        // Don't show error toast for skipped queries
        if (cognitoId === 'skip') return;

        try {
          await queryFulfilled;
        } catch (error: any) {
          // Only show error toast for non-404 errors to reduce noise
          if (error?.error?.status !== 404) {
            toast.error("Failed to fetch current residences.");
          }
        }
      },
    }),

    updateTenantSettings: build.mutation<Tenant, { cognitoId: string } & Partial<Tenant>>({
      query: ({ cognitoId, ...updatedTenant }) => ({
        url: `tenants/${cognitoId}`,
        method: "PUT",
        body: updatedTenant,
      }),
      invalidatesTags: (result) => (result ? [{ type: "Tenants", id: result.id }] : []),
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Settings updated successfully!",
          error: "Failed to update settings.",
        });
      },
    }),

    addFavoriteProperty: build.mutation<Tenant, { cognitoId: string; propertyId: number | string }>({
      query: ({ cognitoId, propertyId }) => ({
        url: `tenants/${cognitoId}/favorites/${propertyId}`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { cognitoId }) => [
        // Invalidate specific tenant data
        { type: "Tenants", id: cognitoId },
        // Invalidate tenant in general list
        { type: "Tenants", id: "LIST" },
        // Invalidate all properties since favorites status changes
        { type: "Properties", id: "LIST" },
        // Force refetch tenant dashboard data
        { type: "TenantDashboard", id: cognitoId },
        // Force refetch tenant favorites
        { type: "TenantFavorites", id: cognitoId },
      ],
      async onQueryStarted({ cognitoId, propertyId }, { dispatch, queryFulfilled }) {
        // Optimistic update for tenant data
        const patchResult = dispatch(
          api.util.updateQueryData('getTenant', cognitoId, (draft) => {
            if (draft && draft.favorites) {
              // Check if property is already in favorites to prevent duplicates
              if (!draft.favorites.some((fav: any) => fav.id === propertyId)) {
                // Add property ID to favorites (simplified, real data would have more fields)
                draft.favorites.push({ id: propertyId });
              }
            }
          })
        );
        
        try {
          // Wait for the actual API call
          const result = await queryFulfilled;
          toast.success("Added to favorites!");
        } catch (error) {
          // Undo the optimistic update if API call fails
          patchResult.undo();
          toast.error("Failed to add to favorites.");
        }
      },
    }),

    removeFavoriteProperty: build.mutation<Tenant, { cognitoId: string; propertyId: number | string }>({
      query: ({ cognitoId, propertyId }) => ({
        url: `tenants/${cognitoId}/favorites/${propertyId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { cognitoId }) => [
        // Invalidate specific tenant data
        { type: "Tenants", id: cognitoId },
        // Invalidate tenant in general list
        { type: "Tenants", id: "LIST" },
        // Invalidate all properties since favorites status changes
        { type: "Properties", id: "LIST" },
        // Force refetch tenant dashboard data
        { type: "TenantDashboard", id: cognitoId },
        // Force refetch tenant favorites
        { type: "TenantFavorites", id: cognitoId },
      ],
      async onQueryStarted({ cognitoId, propertyId }, { dispatch, queryFulfilled }) {
        // Optimistic update for tenant data
        const patchResult = dispatch(
          api.util.updateQueryData('getTenant', cognitoId, (draft) => {
            if (draft && draft.favorites) {
              // Filter out the property being removed
              draft.favorites = draft.favorites.filter((fav: any) => fav.id !== propertyId);
            }
          })
        );
        
        try {
          // Wait for the actual API call
          const result = await queryFulfilled;
          toast.success("Removed from favorites!");
        } catch (error) {
          // Undo the optimistic update if API call fails
          patchResult.undo();
          toast.error("Failed to remove from favorites.");
        }
      },
    }),

    // Manager related endpoints
    getManagerProperties: build.query<Property[], string>({
      query: (cognitoId) => `managers/${cognitoId}/properties`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Properties' as const, id })), { type: 'Properties', id: 'LIST' }]
          : [{ type: 'Properties', id: 'LIST' }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load manager properties.",
        });
      },
    }),

    updateManagerSettings: build.mutation<Manager, { cognitoId: string } & Partial<Manager>>({
      query: ({ cognitoId, ...updatedManager }) => ({
        url: `managers/${cognitoId}`,
        method: "PUT",
        body: updatedManager,
      }),
      invalidatesTags: (result) => (result ? [{ type: "Managers", id: result.id }] : []),
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Settings updated successfully!",
          error: "Failed to update settings.",
        });
      },
    }),

    getPropertiesByManagerId: build.query<Property[], string>({
      query: (managerId) => `managers/${managerId}/properties`,
      providesTags: (result) => 
        result 
          ? [
              ...result.map(({ id }) => ({ type: 'Properties' as const, id })),
              { type: 'Properties', id: 'LIST' }, // For list-wide invalidation
            ]
          : [{ type: 'Properties', id: 'LIST' }],
    }),

    // Room related endpoints
    getRooms: build.query<Room[], number | string>({
      query: (propertyId) => ({
        url: `properties/${propertyId}/rooms`,
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        if (!response || !Array.isArray(response)) {
          // Invalid rooms response
          return [];
        }
        return response;
      },
      transformErrorResponse: (response: any) => {
        if (response?.status === 404) {
          return { data: [] };
        }
        return response;
      },
      providesTags: (result, error, propertyId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Rooms' as const, id })),
              { type: 'Rooms', id: 'LIST' },
              // Add a property-specific tag to ensure this query is invalidated when rooms for this property change
              { type: 'Rooms', id: `property-${propertyId}` },
            ]
          : [{ type: 'Rooms', id: 'LIST' }, { type: 'Rooms', id: `property-${propertyId}` }],
      onQueryStarted: async (propertyId, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error) {
          // Just log the error without showing a toast
          // Error fetching rooms
          // Don't show toast for room fetch errors as it's disruptive
          // This prevents unnecessary error notifications
        }
      },
    }),

    getRoom: build.query<Room, { propertyId: number | string, roomId: number | string }>({
      query: ({ roomId }) => `rooms/${roomId}`,
      
      providesTags: (result, error, { roomId }) => [{ type: "Rooms", id: roomId }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load room details."
        });
      },
    }),

    createRoom: build.mutation<Room, { propertyId: number, body: FormData }>({
      // Using a custom queryFn to handle both room creation and photo uploads in one step
      async queryFn({ propertyId, body }, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          // Get auth token for API requests
          let token;
          try {
            const session = await fetchAuthSession();
            token = session.tokens?.idToken?.toString();
          } catch (e) {
            // Not authenticated
            throw new Error('Authentication required');
          }
          
          // Send the entire FormData with both room data and photos in a single request
          // The server will handle extracting room data and processing photos
          const createRoomResponse = await fetch(`${API_BASE_URL}/properties/${propertyId}/create-room`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
              // Don't set Content-Type, let the browser set it correctly for FormData
            },
            body: body // Send the entire FormData object with both room data and photos
          });
          
          if (!createRoomResponse.ok) {
            // Handle error response
            let errorData;
            try {
              errorData = await createRoomResponse.json();
            } catch {
              errorData = { message: 'Unknown server error' };
            }
            
            // Transform error based on status code
            let transformedError = errorData;
            if (createRoomResponse.status === 403) {
            } else if (createRoomResponse.status === 400) {
              transformedError = { 
                message: errorData?.message || "Invalid room data",
                details: errorData
              };
            } else if (createRoomResponse.status === 401) {
              transformedError = { message: "Unauthorized. Please log in again." };
            } else if (createRoomResponse.status === 403) {
              transformedError = { message: "You don't have permission to create rooms" };
            } else {
              // For other errors, try to get a meaningful message
              const errorMessage = errorData?.message ||
                errorData?.error ||
                "Failed to create room";
              transformedError = {
                message: errorMessage,
                details: errorData
              };
            }

            return { error: { status: createRoomResponse.status, data: transformedError } };
          }

          const data = createRoomResponse ? await createRoomResponse.json() : null;
          // The server returns the room directly (moved from transformResponse)
          return { data };
        } catch (error) {
          // Room creation error
          
          // Transform the error to match our error format
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const transformedError = {
            message: errorMessage,
            details: error instanceof Error ? { stack: error.stack } : error
          };
          
          return { 
            error: { 
              status: 500, 
              data: transformedError 
            } 
          };
        }
      },

      invalidatesTags: (result, error) => {
        if (error) return [];
        return result ? [
          { type: 'Rooms', id: 'LIST' },
          { type: 'Rooms', id: result.id },
          { type: 'PropertyDetails', id: result.propertyId },
          // Also invalidate rooms for this property specifically
          { type: 'Rooms', id: `property-${result.propertyId}` }
        ] : [];
      },
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error: any) {
          // Error creating room
          
          // Show a more detailed error message - ensure it's a string
          let errorMessage = "Failed to create room";
          
          if (typeof error?.data?.message === 'string') {
            errorMessage = error.data.message;
          } else if (typeof error?.data?.error === 'string') {
            errorMessage = error.data.error;
          } else if (typeof error?.error === 'string') {
            errorMessage = error.error;
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          
          toast.error(errorMessage);
        }
      },
    }),

    updateRoom: build.mutation<Room, { propertyId: number, roomId: number; data: FormData }>({
      queryFn: async ({ propertyId, roomId, data }, { getState }) => {
        try {
          console.log('=== updateRoom queryFn DEBUG ===');
          console.log('updateRoom: Using direct fetch bypass for FormData');
          console.log('- Property ID:', propertyId);
          console.log('- Room ID:', roomId);
          console.log('- FormData entries:');
          
          // Log FormData contents for debugging
          for (const [key, value] of data.entries()) {
            if (value instanceof File) {
              console.log(`  ${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`);
            } else {
              console.log(`  ${key}: ${value}`);
            }
          }
          
          // Get auth token manually since we're bypassing RTK Query's baseQuery
          const session = await fetchAuthSession();
          const idToken = session.tokens?.idToken?.toString();
          
          const headers: HeadersInit = {};
          if (idToken) {
            headers["Authorization"] = `Bearer ${idToken}`;
          }
          
          console.log('- Auth token present:', !!idToken);
          console.log('- Fetch URL:', `${API_BASE_URL}/rooms/${roomId}`);
          
          // Use direct fetch to avoid RTK Query's fetchBaseQuery interference
          const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
            method: 'PUT',
            headers,
            body: data, // FormData - don't set Content-Type, let browser handle it
          });
          
          console.log('- Response status:', response.status);
          console.log('- Response headers:', Object.fromEntries(response.headers.entries()));
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('updateRoom fetch failed:');
            console.error('- Status:', response.status);
            console.error('- Error text:', errorText);
            
            // Try to parse error as JSON for better error message
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { message: errorText || "Failed to update room" };
            }
            
            return {
              error: {
                status: response.status,
                data: errorData
              }
            };
          }
          
          const result = await response.json();
          console.log('updateRoom: Direct fetch successful');
          console.log('- Result:', result);
          console.log('=== END updateRoom DEBUG ===');
          return { data: result };
          
        } catch (error: any) {
          console.error('=== updateRoom CATCH ERROR ===');
          console.error('updateRoom: Direct fetch error:', error);
          console.error('Error type:', error.constructor.name);
          console.error('Error message:', error.message);
          console.error('Full error:', error);
          console.error('=== END CATCH ERROR ===');
          return {
            error: {
              status: 'FETCH_ERROR',
              error: error.message || "Network error updating room"
            }
          };
        }
      },
      invalidatesTags: (result, error, { roomId, propertyId }) => {
        if (error) return [];
        return [
          { type: 'Rooms', id: roomId },
          { type: 'Rooms', id: 'LIST' },
          { type: 'PropertyDetails', id: propertyId || result?.propertyId },
          { type: 'Properties', id: propertyId || result?.propertyId }
        ];
      },
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Room updated successfully!");
        } catch (error: any) {
          // Error updating room
          toast.error(error?.data?.message || "Failed to update room");
        }
      },
    }),

    deleteRoom: build.mutation<{ message: string; id: number }, { propertyId: number, roomId: number }>({
      query: ({ propertyId, roomId }) => ({
        url: `rooms/${roomId}?propertyId=${propertyId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { roomId }) => [
          { type: "Rooms", id: roomId },
          { type: "Rooms", id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Room deleted successfully!",
          error: "Failed to delete room.",
        });
      },
    }),

    // Lease related endpoints
    getLeases: build.query<Lease[], void>({
      query: () => "leases",
      providesTags: (result) =>
          result
              ? [...result.map(({ id }) => ({ type: 'Leases' as const, id })), { type: 'Leases', id: 'LIST' }]
              : [{ type: 'Leases', id: 'LIST' }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch leases.",
        });
      },
    }),

    getPropertyLeases: build.query<Lease[], number | string>({
      query: (propertyId) => ({
        url: `properties/${propertyId}/leases`,
        method: 'GET',
      }),
      transformErrorResponse: (response: any) => {
        if (response?.status === 404) {
          // Property leases not found
          return { data: [] }; // Return empty array on 404
        }
        return response;
      },
      providesTags: (result, error, propertyId) => [
          ...(result ?? []).map(({ id }) => ({ type: 'Leases' as const, id })),
          { type: 'Leases', id: 'LIST', propertyId },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          // Failed to fetch property leases
        }
      },
    }),

    getPayments: build.query<Payment[], number>({
      query: (leaseId) => `leases/${leaseId}/payments`,
      providesTags: (result, error, leaseId) => [
          ...(result ?? []).map(({ id }) => ({ type: 'Payments' as const, id })),
          { type: 'Payments', id: 'LIST', leaseId },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch payment info.",
        });
      },
    }),

    // Application related endpoints
    getApplications: build.query<Application[], { userId?: string; userType?: string }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.userId) {
          queryParams.append("userId", params.userId.toString());
        }
        if (params.userType) {
          queryParams.append("userType", params.userType);
        }
        const queryString = queryParams.toString();
        return `applications${queryString ? `?${queryString}` : ''}`;
      },
       providesTags: (result) =>
          result
              ? [...result.map(({ id }) => ({ type: 'Applications' as const, id })), { type: 'Applications', id: 'LIST' }]
              : [{ type: 'Applications', id: 'LIST' }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch applications.",
        });
      },
    }),

    updateApplicationStatus: build.mutation<Application & { lease?: Lease }, { id: number | string; status: string }>({
      query: ({ id, status }) => {
        console.log('RTK Query sending request:', { id, status });
        
        // Make sure status is properly formatted - backend expects 'Pending', 'Approved', or 'Denied'
        const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        
        // Use query parameters instead of a request body
        const params = new URLSearchParams();
        params.append('status', formattedStatus);
        console.log('Using URL parameters instead of body:', params.toString());
        
        return {
          // Include status as a query parameter to avoid body parsing issues
          url: `applications/${id}/status?${params.toString()}`,
          method: "PUT",
          // Include body as well for redundancy (some API frameworks prefer body)
          body: { status: formattedStatus },
          headers: {
            'Content-Type': 'application/json',
          },
        };
      },
      transformErrorResponse: (response) => {
        console.error('Application status update error response:', response);
        return response;
      },
      // --- CORRECTED invalidatesTags ---
      invalidatesTags: (result, error, { id }) => {
          // Explicitly define the type of the tags array
          const tags: TagDescription<CacheTagType>[] = [
              { type: 'Applications', id },
              { type: 'Applications', id: 'LIST' },
          ];
          // Conditionally add Lease tags if a lease was affected
          if (result?.lease) {
              tags.push({ type: 'Leases', id: 'LIST' });
              tags.push({ type: 'Leases', id: result.lease.id });
          }
          return tags;
      },
      // --- END CORRECTION ---
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Application status updated successfully!",
          error: "Failed to update application status.",
        });
      },
    }),

    createApplication: build.mutation<Application, Partial<Application>>({
      query: (body) => ({
        url: `applications`,
        method: "POST",
        body: body, // Don't stringify - RTK Query will handle this
        headers: {
          'Content-Type': 'application/json'
        },
      }),
      invalidatesTags: [{ type: "Applications", id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Application submitted successfully!",
          error: "Failed to submit application.",
        });
      },
    }),

    // Admin endpoints
    getAllManagers: build.query<(Manager & { status: 'Pending' | 'Active' | 'Disabled' | 'Banned' })[], { status?: string; includeDemo?: boolean }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.status) {
          queryParams.append("status", params.status);
        }
        if (params.includeDemo) {
          queryParams.append("includeDemo", params.includeDemo.toString());
        }
        const queryString = queryParams.toString();
        return `admin/managers${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Managers" as const, id })), { type: "Managers", id: "LIST" }]
          : [{ type: "Managers", id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch managers.",
        });
      },
    }),

    getAdminProperties: build.query<Property[], void>({
      query: () => ({
        url: `admin/properties`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Properties" as const, id })), { type: "Properties", id: "LIST" }]
          : [{ type: "Properties", id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch properties.",
        });
      },
    }),

    updateManagerStatus: build.mutation<Manager, { cognitoId: string; status: string; notes?: string }>({
      query: ({ cognitoId, status, notes }) => {
        // Build query string with parameters
        const params = new URLSearchParams();
        params.append('cognitoId', cognitoId);
        params.append('status', status);
        if (notes) params.append('notes', notes);
        
        return {
          url: `admin/managers/update-status?${params.toString()}`,
          method: "GET",
          // No body needed since we're using URL parameters
        };
      },
      invalidatesTags: (result) => [
        { type: "Managers", id: result?.id },
        { type: "Managers", id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Manager status updated successfully!",
          error: "Failed to update manager status.",
        });
      },
    }),
    
    updateAdminSettings: build.mutation<{ success: boolean, message: string, updatedAttributes: Record<string, string> }, { name?: string, email?: string, phoneNumber?: string }>({
      query: (data) => {
        return {
          url: `admin/settings/update`,
          method: "POST",
          body: data
        };
      },
      invalidatesTags: (result) => [
        { type: "Admins", id: "CURRENT" }
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Admin settings updated successfully!",
          error: "Failed to update admin settings."
        });
      },
    }),
    
    deleteManager: build.mutation<{ success: boolean, message: string, deletedManager: Manager }, string>({
      query: (cognitoId) => {
        // Build query string with parameters
        const params = new URLSearchParams();
        params.append('cognitoId', cognitoId);
        
        return {
          url: `admin/managers/delete?${params.toString()}`,
          method: "GET",
        };
      },
      invalidatesTags: (result) => [
        { type: "Managers", id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Manager deleted successfully!",
          error: "Failed to delete manager.",
        });
      },
    }),
    
    getManagerDetails: build.query<{
      id: number;
      name: string;
      email: string;
      phoneNumber: string;
      status: string;
      properties: {
        id: number;
        name: string;
        address: string;
        tenantCount: number;
        roomCount: number;
      }[];
      tenants: {
        id: number;
        name: string;
        email: string;
        propertyName: string;
      }[];
      stats: {
        propertyCount: number;
        tenantCount: number;
        occupancyRate: string;
        averageRent: string;
      }
    }, string>({
      query: (managerId) => {
        return {
          url: `admin/managers/${managerId}`,
          method: "GET",
        };
      },
      providesTags: (result, error, id) => [{ type: "Managers", id }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch landlord details.",
        });
      },
    }),
    
    getAllTenants: build.query<(Tenant & { favoriteCount?: number; applicationCount?: number; leaseCount?: number })[], void>({
      query: () => {
        return {
          url: `admin/tenants`,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Tenants" as const, id })), { type: "Tenants", id: "LIST" }]
          : [{ type: "Tenants", id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch tenants.",
        });
      },
    }),
    
    getTenantDetails: build.query<{
      tenantInfo: Tenant,
      favorites: {
        id: number;
        name: string;
        address: string;
        landlord: string;
        landlordEmail: string;
        landlordId: number;
        propertyId: number;
      }[];
      applications: {
        id: number;
        propertyName: string;
        propertyId: number;
        landlord: string;
        landlordEmail: string;
        landlordId: number;
        status: string;
        date: string;
      }[];
      leases: {
        id: number;
        propertyName: string;
        propertyId: number;
        startDate: string;
        endDate: string;
        rent: string;
        landlord: string;
        landlordEmail: string;
        landlordId: number;
      }[];
    }, string>({
      query: (tenantId) => {
        return {
          url: `admin/tenants/${tenantId}`,
          method: "GET",
        };
      },
      providesTags: (result, error, id) => [{ type: "Tenants", id }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch tenant details.",
        });
      },
    }),

    // Analytics endpoint
    getAnalytics: build.query<{
      summary: {
        totalProperties: number;
        totalLandlords: number;
        totalTenants: number;
        totalLeases: number;
      };
      propertyData: { name: string; count: number }[];
      cityData: { name: string; count: number }[];
      priceRangeData: { name: string; count: number }[];
      landlordActivityData: { name: string; properties: number; applications: number; leases: number }[];
      studentActivityData: { month: string; applications: number; favorites: number; leases: number }[];
      landlordStatusData: { name: string; value: number }[];
      propertyStatusData: { name: string; value: number }[];
    }, { timeRange?: string }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.timeRange) {
          searchParams.append('timeRange', params.timeRange);
        }
        
        return {
          url: `admin/analytics${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
          method: "GET",
        };
      },
      providesTags: ["Properties", "Managers", "Tenants", "Applications", "Leases"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch analytics data.",
        });
      },
    }),

    // ========================================
    // REVIEW ENDPOINTS
    // ========================================
    getReviews: build.query<{
      reviews: Array<{
        id: number;
        rating: number;
        comment: string | null;
        createdAt: string;
        updatedAt: string;
        tenantName: string | null;
        tenant: { name: string; email: string };
      }>;
      averageRating: number;
      totalReviews: number;
    }, number | string>({
      query: (propertyId) => ({
        url: `reviews?propertyId=${propertyId}`,
        method: 'GET',
      }),
      providesTags: (result, error, propertyId) => [
        { type: 'Reviews', id: propertyId },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: 'Failed to fetch reviews.',
        });
      },
    }),

    createReview: build.mutation<any, {
      propertyId: number | string;
      rating: number;
      comment?: string;
    }>({
      query: (body) => ({
        url: 'reviews',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Reviews', id: arg.propertyId },
        { type: 'Properties', id: arg.propertyId },
        { type: 'PropertyDetails', id: arg.propertyId },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: 'Review submitted successfully!',
          error: 'Failed to submit review.',
        });
      },
    }),

    updateReview: build.mutation<any, {
      id: number;
      rating?: number;
      comment?: string;
    }>({
      query: ({ id, ...body }) => ({
        url: `reviews/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Reviews', id: 'LIST' },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: 'Review updated successfully!',
          error: 'Failed to update review.',
        });
      },
    }),

    deleteReview: build.mutation<void, {
      id: number;
      propertyId: number | string;
    }>({
      query: ({ id }) => ({
        url: `reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Reviews', id: arg.propertyId },
        { type: 'Properties', id: arg.propertyId },
        { type: 'PropertyDetails', id: arg.propertyId },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: 'Review deleted successfully!',
          error: 'Failed to delete review.',
        });
      },
    }),

  }),
});

// Export hooks for usage in components
export const {
  useGetAuthUserQuery,
  useUpdateTenantSettingsMutation,
  useUpdateManagerSettingsMutation,
  useGetPropertiesQuery,
  useGetPropertyQuery,
  useGetCurrentResidencesQuery,
  useGetManagerPropertiesQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
  useGetTenantQuery,
  useAddFavoritePropertyMutation,
  useRemoveFavoritePropertyMutation,
  useGetLeasesQuery,
  useGetPropertyLeasesQuery,
  useGetPaymentsQuery,
  useGetApplicationsQuery,
  useUpdateApplicationStatusMutation,
  useCreateApplicationMutation,
  // Admin-specific hooks
  useGetAllManagersQuery,
  useGetManagerDetailsQuery,
  useUpdateManagerStatusMutation,
  useDeleteManagerMutation,
  useGetAllTenantsQuery,
  useGetTenantDetailsQuery,
  useUpdateAdminSettingsMutation,
  useGetAnalyticsQuery,

  // Room endpoints
  useGetRoomsQuery,
  useGetRoomQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useGetPropertiesByManagerIdQuery,
  
  // Review endpoints
  useGetReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useGetAdminPropertiesQuery,
} = api;
