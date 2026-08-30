import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { cookies } from "next/headers";

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
          role: "tenant", // default fallback, refined in jwt/session callbacks
        } as any;
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log('🔄 NextAuth redirect callback:', { url, baseUrl });
      
      let decodedUrl = url;
      try {
        decodedUrl = decodeURIComponent(url);
      } catch (e) {
        // ignore
      }
      
      if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
        try {
          const urlObj = new URL(decodedUrl);
          const baseUrlObj = new URL(baseUrl);
          
          if (urlObj.origin === baseUrlObj.origin) {
            return decodedUrl;
          }
          return baseUrl;
        } catch (error) {
          console.error('❌ Error parsing URL:', error);
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
        const email = user?.email || (profile as any)?.email;
        const sub = (profile as any)?.sub || (user as any)?.id || email;

        // Read target role from cookie if set during sign-in
        let targetRole: string | null = null;
        try {
          const cookieStore = await cookies();
          targetRole = cookieStore.get('user_target_role')?.value || null;
        } catch (e) {
          // ignore
        }

        const resolvedRole = targetRole || (user as any)?.role || "tenant";

        (token as any).role = resolvedRole;
        (token as any).provider = account?.provider ?? "google";
        (token as any).sub = sub;
        (token as any).id = sub;
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
