import type { AuthUser } from 'aws-amplify/auth';

// Instead of extending the AuthUser type, create a completely new type
// This avoids compatibility issues with AWS Amplify v6
export interface ExtendedAuthUser {
    // Include the core AuthUser properties that are actually used in your app
    username?: string;
    userId?: string;
    
    // Add our custom properties
    signInDetails?: {
        authFlowType?: string;
        attributes?: {
            'custom:role'?: string;
            [key: string]: string | undefined;
        };
    };
}
