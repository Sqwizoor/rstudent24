import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://befitting-stingray-964.convex.cloud';

async function syncUserWithConvex(user: { id: string; email: string; name: string; role: string }) {
  try {
    const mutationName = user.role === "manager" ? "users:upsertManager" : "users:upsertTenant";
    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: mutationName,
        args: {
          userId: user.id,
          email: user.email,
          name: user.name || user.email.split("@")[0],
        },
      }),
    });
    console.log(`✅ Synced user ${user.email} (${user.role}) with Convex`);
  } catch (err) {
    console.warn("Could not sync user with Convex in NextAuth callback:", err);
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "tenant", // default, refined below
        } as any;
      },
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error("Email is required");
        }

        const email = credentials.email.toLowerCase().trim();
        const requestedRole = credentials.role || "tenant";

        // Check if user exists in Prisma
        let dbUser: any = null;
        try {
          if (requestedRole === "manager") {
            dbUser = await prisma.manager.findFirst({ where: { email } });
          } else if (requestedRole === "admin") {
            dbUser = await prisma.admin.findFirst({ where: { email } });
          } else {
            dbUser = await prisma.tenant.findFirst({ where: { email } });
          }
        } catch (dbErr) {
          console.warn("Prisma lookup during credentials login:", dbErr);
        }

        const name = dbUser?.name || email.split("@")[0];
        const userId = dbUser?.cognitoId || `usr_${Buffer.from(email).toString("hex").slice(0, 16)}`;
        const role: "tenant" | "manager" | "admin" = 
          requestedRole === "manager" ? "manager" : requestedRole === "admin" ? "admin" : "tenant";

        return {
          id: userId,
          email: email,
          name: name,
          role: role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      let decodedUrl = url;
      try {
        decodedUrl = decodeURIComponent(url);
      } catch (e) {
        // ignore
      }

      if (decodedUrl.startsWith("http://") || decodedUrl.startsWith("https://")) {
        try {
          const urlObj = new URL(decodedUrl);
          const baseUrlObj = new URL(baseUrl);
          if (urlObj.origin === baseUrlObj.origin) {
            return decodedUrl;
          }
          return baseUrl;
        } catch (error) {
          return baseUrl;
        }
      }

      if (decodedUrl.startsWith("/")) {
        return `${baseUrl}${decodedUrl}`;
      }

      return baseUrl;
    },

    async jwt({ token, user, account, profile }) {
      if (user || profile) {
        const email = (user?.email || (profile as any)?.email || "").toLowerCase().trim();
        const sub = (profile as any)?.sub || user?.id || (token as any)?.sub || email;

        // Read target role preference from cookie if set during sign-in
        let targetRole: string | null = null;
        try {
          const cookieStore = await cookies();
          targetRole = cookieStore.get("user_target_role")?.value || null;
        } catch (e) {
          // ignore
        }

        // Check if email belongs to manager/admin in Prisma
        let autoResolvedRole = targetRole || (user as any)?.role || "tenant";
        try {
          if (email) {
            const isManager = await prisma.manager.findFirst({ where: { email } });
            if (isManager) {
              autoResolvedRole = "manager";
            }
            const isAdmin = await prisma.admin.findFirst({ where: { email } });
            if (isAdmin) {
              autoResolvedRole = "admin";
            }
          }
        } catch (e) {
          // fallback to targetRole
        }

        (token as any).role = autoResolvedRole;
        (token as any).provider = account?.provider ?? "google";
        (token as any).sub = sub;
        (token as any).id = sub;

        // Sync with Convex in background to link properties
        syncUserWithConvex({
          id: sub,
          email,
          name: user?.name || (profile as any)?.name || email.split("@")[0],
          role: autoResolvedRole,
        });
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = (token as any).role ?? "tenant";
        (session.user as any).provider = (token as any).provider ?? "google";
        (session.user as any).sub = (token as any).sub;
        (session.user as any).id = (token as any).id;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      return true;
    },
  },
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
