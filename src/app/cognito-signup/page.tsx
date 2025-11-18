"use client";

import React from 'react';

export default function CognitoSignUpPage() {
  // This page will be handled by the Authenticator component in authProvider.tsx
  // but specifically for landlords using Cognito
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* The actual Cognito sign-up form will be rendered by the Authenticator component */}
      </div>
    </div>
  );
}
