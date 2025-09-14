import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "tenant" | "manager" | "admin";
      provider?: "google" | "cognito";
    };
  }

  interface User {
    id?: string;
    role?: "tenant" | "manager" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "tenant" | "manager" | "admin";
    provider?: "google" | "cognito";
  }
}
