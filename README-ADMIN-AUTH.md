# Admin Authentication Setup

This application uses a separate admin authentication flow while leveraging the same AWS Cognito User Pool.

## Required Environment Variables

Ensure the following environment variables are set in your `.env.local` file:

```
# User Pool (shared by all users)
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID=your-user-pool-client-id
```

## Setting Up Admin Users

1. Create admin users in your existing AWS Cognito User Pool
2. Set the `custom:role` attribute to `admin` for these users
3. Alternatively, use the designated admin email: `admin@student24.co.za`

## Admin Authentication Flow

The admin authentication system is separate from the tenant/landlord flow while using the same user pool:
- It has its own dedicated login page at `/admin-login`
- It provides access to admin-only functionality
- The middleware ensures only users with admin role or the designated admin email can access admin routes
- Admin users are redirected to the admin dashboard after successful login
- Regular users attempting to access admin routes are redirected to the home page
