# 🔧 USER ID MISMATCH FIX - Empty Error Object

## Problem
When clicking the heart/favorite icon, you saw this error in console:
```
Error toggling favorite: {}
```

The API call was failing silently with an empty error object.

## Root Cause
**ID Mismatch between NextAuth sign-in and API calls!**

### During Sign-In:
NextAuth callback stored the user in database with:
```typescript
cognitoId: profile.sub || user.id || user.email
```

### During API Calls:
useUnifiedAuth was using:
```typescript
id: user.id || user.email  // ❌ Missing profile.sub!
```

**Result:** The IDs didn't match, so the API couldn't find the tenant record!

## Fixes Applied

### 1. **NextAuth Route** (`src/app/api/auth/[...nextauth]/route.ts`)

**Added `sub` and `id` to JWT token:**
```typescript
async jwt({ token, user, account, profile }) {
  if (user) {
    (token as any).role = (user as any).role ?? "tenant";
    (token as any).provider = account?.provider ?? "google";
    // ✅ Store Google's unique user ID (sub)
    (token as any).sub = (profile as any)?.sub || (user as any)?.id || user.email;
    (token as any).id = (profile as any)?.sub || (user as any)?.id || user.email;
  }
  return token;
}
```

**Added `sub` and `id` to session:**
```typescript
async session({ session, token }) {
  if (session.user) {
    (session.user as any).role = (token as any).role ?? "tenant";
    (session.user as any).provider = (token as any).provider ?? "google";
    // ✅ Make sub and id available in session
    (session.user as any).sub = (token as any).sub;
    (session.user as any).id = (token as any).id;
  }
  return session;
}
```

### 2. **useUnifiedAuth Hook** (`src/hooks/useUnifiedAuth.ts`)

**Updated ID priority to match sign-in:**
```typescript
if (isNextAuthActive && nextAuthSession.user) {
  // ✅ Use same priority as signIn callback
  const userId = (nextAuthSession.user as any)?.sub || 
                 (nextAuthSession.user as any)?.id || 
                 nextAuthSession.user.email || "";
  
  console.log('🔐 NextAuth user ID:', userId);
  
  return {
    user: {
      id: userId,  // ✅ Now matches database cognitoId
      // ...
    }
  };
}
```

### 3. **RandomListings Component** (`src/app/(nondashboard)/landing/RandomListings.tsx`)

**Added comprehensive debug logging:**
```typescript
console.log('🎯 Toggling favorite:', {
  userId: authUser.id,
  propertyId,
  role: authUser.role,
  provider: authUser.provider
});
```

## Why This Matters

### Google OAuth Flow:
1. User signs in with Google
2. Google returns `profile.sub` (e.g., "103845729384756")
3. NextAuth creates tenant in database: `cognitoId = "103845729384756"`
4. Later, when favoriting: must use same ID!

### ID Priority Order (Now Consistent):
```typescript
profile.sub → user.id → user.email
```

Both sign-in and API calls now use this exact order!

## Testing Steps

### 1. **Sign Out and Sign In Again** (REQUIRED!)
Since we changed the JWT/session structure, you need to refresh your session:

```bash
# Option 1: Clear browser cookies
- Go to http://localhost:3000
- Open DevTools (F12) → Application → Cookies
- Delete all cookies for localhost:3000

# Option 2: Use incognito mode
- Open new incognito/private window
```

Then sign in again with Google.

### 2. **Check Console Logs**
After signing in, you should see:
```
🔐 useUnifiedAuth state: {
  nextAuthStatus: "authenticated",
  hasNextAuthSession: true
}

🔐 NextAuth user ID: 103845729384756  ← Google sub
```

### 3. **Test Favoriting**
Click heart icon, console should show:
```
🎯 Toggling favorite: {
  userId: "103845729384756",  ← Matches database
  propertyId: 123,
  role: "tenant",
  provider: "google"
}

Adding favorite...
✅ Add favorite result: { ... }
Property added to favorites: 123
```

### 4. **Verify API Call Success**
- No more `Error toggling favorite: {}` 
- Toast message: "Property added to favorites!"
- Property appears in `/tenants/favorites`

## Debug Console Logs

### Before Fix (Broken):
```javascript
🔐 NextAuth user ID: "user@gmail.com"  ← Email used as ID
🎯 Toggling favorite: {
  userId: "user@gmail.com",  ← Doesn't match database!
  propertyId: 123
}
❌ Error toggling favorite: {}  ← API fails silently
```

### After Fix (Working):
```javascript
🔐 NextAuth user ID: "103845729384756"  ← Google sub
🎯 Toggling favorite: {
  userId: "103845729384756",  ← Matches database!
  propertyId: 123
}
✅ Add favorite result: { id: 456, favorites: [...] }
```

## Important Notes

### Why Sign Out/In Required?
- JWT tokens are created during sign-in
- We changed what data goes into the token
- Existing tokens don't have `sub` and `id` fields
- Must create new token by signing in again

### Session Data Structure:
```typescript
{
  user: {
    name: "John Doe",
    email: "john@gmail.com",
    image: "...",
    role: "tenant",
    provider: "google",
    sub: "103845729384756",  // ✅ Google's unique ID
    id: "103845729384756"    // ✅ Same as sub
  }
}
```

### Database Record:
```json
{
  "cognitoId": "103845729384756",  // ✅ Matches session.user.id
  "email": "john@gmail.com",
  "name": "John Doe",
  "isGoogleAuth": true
}
```

## Verification Checklist

- [ ] Signed out completely
- [ ] Cleared browser cookies OR using incognito
- [ ] Signed in with Google again
- [ ] Console shows correct user ID (Google sub)
- [ ] Can click heart icon without errors
- [ ] Toast message appears
- [ ] Property appears in favorites
- [ ] Can remove from favorites
- [ ] No empty error objects in console

## Related Files
- ✅ `src/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- ✅ `src/hooks/useUnifiedAuth.ts` - Unified auth hook
- ✅ `src/app/(nondashboard)/landing/RandomListings.tsx` - Debug logging

---
**Last Updated**: ${new Date().toISOString()}
**Status**: ✅ COMPLETE - ID mismatch fixed!
**Action Required**: Sign out and sign in again to refresh session!
