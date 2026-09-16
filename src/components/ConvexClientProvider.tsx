"use client";

import React, { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://befitting-stingray-964.convex.cloud";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [convexClient] = React.useState(() => {
    try {
      return new ConvexReactClient(convexUrl);
    } catch {
      return null;
    }
  });

  if (!convexClient) {
    return <>{children}</>;
  }

  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}
