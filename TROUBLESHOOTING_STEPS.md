# 🚨 Still Seeing White Screen? Here's What to Do

## Quick Diagnostic Steps

### 1. **Check Browser Console (MOST IMPORTANT)**
```
Press F12 → Go to Console tab
Look for RED error messages
```

**Common errors to look for:**
- `useSearchParams` error → Fixed with Suspense (just applied)
- `Network Error` → API/backend issue
- `Auth error` → Login issue
- `Module not found` → Missing dependency

### 2. **Hard Refresh Browser**
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### 3. **Test System Check Page**
Navigate to: **`/tenants/system-check`**

This will show you:
- ✅ If authentication is working
- ✅ Your user role
- ✅ Which auth provider you're using
- ✅ If all systems are operational

### 4. **Check Which Auth You're Using**

#### If using **Google (NextAuth)**:
- Make sure you signed in via `/signin` page
- Check if session exists: Open console and type `sessionStorage`

#### If using **Cognito**:
- Make sure you signed in via `/cognito-signin` page  
- Check if token exists: Open console and type `localStorage`

## What I Just Fixed

### Problem: `useSearchParams` Hook Error
The `useSignInRedirect` hook uses `useSearchParams()` which can cause issues in layouts without Suspense boundaries.

### Solution Applied:
1. ✅ Wrapped layout with `<Suspense>` boundary
2. ✅ Removed direct `useSignInRedirect` from layout
3. ✅ Using simple redirect URLs instead

## Still Not Working?

### Share This Info:

1. **Browser Console Errors** (F12 → Console)
   - Screenshot or copy the exact error message

2. **System Check Results**
   - Navigate to `/tenants/system-check`
   - Screenshot what you see

3. **Authentication Method**
   - Are you using Google or Cognito login?
   - What URL did you use to sign in?

4. **Which Page Shows White Screen?**
   - /tenants/dashboard
   - /tenants/favorites
   - /tenants/residences
   - All of them?

## Manual Testing Checklist

- [ ] Open browser console (F12)
- [ ] Hard refresh (Ctrl + Shift + R)
- [ ] Navigate to `/tenants/system-check`
- [ ] Check if green "All Systems Operational" shows
- [ ] Try `/tenants/dashboard`
- [ ] If white screen, check console for errors
- [ ] Screenshot any red errors and share

## Emergency Fallback

If nothing works, try:

### Option 1: Test Basic Page
Navigate to: `/tenants/test`
- If this loads → Issue is with data/API
- If white screen → Issue is with layout/auth

### Option 2: Incognito Mode
Open incognito/private browsing window and try again
- Rules out cache issues

### Option 3: Different Browser
Try Chrome, Firefox, or Edge
- Rules out browser-specific issues

## Key Files to Check

1. **Layout**: `src/app/(dashboard)/layout.tsx` ✅ Just updated
2. **Auth Hook**: `src/hooks/useUnifiedAuth.ts`
3. **API State**: `src/state/api.ts`

---

**Next Steps:**
1. Hard refresh your browser
2. Open console (F12)
3. Go to `/tenants/system-check`
4. Report what you see there

The Suspense wrapper should fix the `useSearchParams` error if that was the issue!
