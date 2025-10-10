# White Screen Issue - Root Cause Analysis

## Problem Identified

The dashboard layout (`(dashboard)/layout.tsx`) is using **Cognito-only authentication** (`useGetAuthUserQuery()`), while tenant pages are using **Unified Authentication** (`useUnifiedAuth()` which supports both NextAuth/Google AND Cognito).

### The Conflict:

1. **Layout checks**: Uses `useGetAuthUserQuery()` - **Cognito only**
2. **Tenant pages check**: Uses `useUnifiedAuth()` - **Supports both NextAuth (Google) and Cognito**

### What This Means:

If you're signed in with **Google (NextAuth)**:
- Layout: ❌ Doesn't detect you're logged in (Cognito query returns no user)
- Result: Shows "Sign in required" or redirects before tenant pages can load
- Tenant Pages: ✅ Would detect you're logged in but never get to render

## Solution Options

### Option 1: Update Dashboard Layout to Use Unified Auth (RECOMMENDED)
Change the layout to use `useUnifiedAuth()` instead of `useGetAuthUserQuery()`

### Option 2: Ensure Consistent Auth Method
Make sure you're logging in with Cognito (not Google) when accessing tenant dashboard

### Option 3: Add NextAuth Provider to Layout
Wrap the layout with NextAuth SessionProvider so both auth methods work

## Testing Steps

1. **First, let's test which auth you're using:**
   - Navigate to: `/tenants/test` or `/tenants/debug-favorites`
   - Check what the debug page shows

2. **Check your login method:**
   - Are you logging in with Google?
   - Or with email/password (Cognito)?

3. **Check browser console (F12):**
   - Look for auth-related errors
   - Check if there are API call failures
