// Standalone authentication user interface (no AWS dependency)
export interface ExtendedAuthUser {
  username?: string;
  userId?: string;
  email?: string;
  signInDetails?: {
    authFlowType?: string;
    attributes?: {
      'custom:role'?: string;
      [key: string]: string | undefined;
    };
  };
}
