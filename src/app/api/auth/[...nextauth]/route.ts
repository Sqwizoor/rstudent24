import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "tenant", // Automatically assign tenant role for Google auth users (students)
        } as any;
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log('🔄 NextAuth redirect callback:', { url, baseUrl });
      
      // If url starts with http(s), check if it's same origin
      if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
          const urlObj = new URL(url);
          const baseUrlObj = new URL(baseUrl);
          
          // Allow if same origin (handles both http://localhost and https://domain.com)
          if (urlObj.origin === baseUrlObj.origin) {
            console.log('✅ Redirecting to same origin URL:', url);
            return url;
          }
          
          console.log('⚠️ Different origin, falling back to baseUrl:', baseUrl);
          return baseUrl;
        } catch (error) {
          console.error('❌ Error parsing URL:', error);
          return baseUrl;
        }
      }
      
      // Relative callback URLs
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log('✅ Redirecting to relative URL:', redirectUrl);
        return redirectUrl;
      }
      
      console.log('⚠️ Falling back to baseUrl:', baseUrl);
      return baseUrl;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Ensure custom fields exist even without module augmentation
        (token as any).role = (user as any).role ?? "tenant";
        (token as any).provider = account?.provider ?? "google";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Mirror custom fields onto the session user
        (session.user as any).role = (token as any).role ?? "tenant";
        (session.user as any).provider = (token as any).provider ?? "google";
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Only allow Google sign-in for students
      if (account?.provider === "google") {
        try {
          // Prefer stable ID from profile.sub, fallback to user.id/email
          const id = (user as any)?.id ?? (profile as any)?.sub ?? (user as any)?.email ?? "";

          // Create user in your database if they don't exist
          await fetch(`${process.env.NEXTAUTH_URL}/api/tenants`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cognitoId: id,
              email: (user as any)?.email,
              name: (user as any)?.name,
              isGoogleAuth: true,
            }),
          }).catch((err) => {
            console.error("Failed to create user in database", err);
          });
        } catch (error) {
          console.error("Error creating user:", error);
        }
      }
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
