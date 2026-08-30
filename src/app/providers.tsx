"use client";

import StoreProvider from "@/state/redux";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NextAuthProvider } from "@/components/NextAuthProvider";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <NextAuthProvider>
      <ConvexClientProvider>
        <StoreProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </StoreProvider>
      </ConvexClientProvider>
    </NextAuthProvider>
  );
};

export default Providers;
