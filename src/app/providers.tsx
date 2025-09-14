"use client";

import StoreProvider from "@/state/redux";
import { Authenticator } from "@aws-amplify/ui-react";
import Auth from "./(auth)/authProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NextAuthProvider } from "@/components/NextAuthProvider";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <NextAuthProvider>
      <StoreProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Authenticator.Provider>
            <Auth>{children}</Auth>
          </Authenticator.Provider>
        </ThemeProvider>
      </StoreProvider>
    </NextAuthProvider>
  );
};

export default Providers;
