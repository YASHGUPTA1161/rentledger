import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import db from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // ── Catch ALL internal NextAuth errors (OAuthCallback, etc.) ──────────────
  logger: {
    error(code, ...message) {
      console.error("[NextAuth ERROR]", code, ...message);
    },
    warn(code, ...message) {
      console.warn("[NextAuth WARN]", code, ...message);
    },
    debug(code, ...message) {
      console.log("[NextAuth DEBUG]", code, ...message);
    },
  },

  // Enable debug in dev so we see every internal step
  debug: process.env.NODE_ENV === "development",

  callbacks: {
    async signIn({ user, account }) {
      console.log("[signIn] Provider:", account?.provider);
      console.log("[signIn] Google email:", user.email);
      console.log("[signIn] NEXTAUTH_URL env:", process.env.NEXTAUTH_URL);

      try {
        const existingUser = await db.user.findUnique({
          where: { email: user.email! },
        });

        if (existingUser) {
          console.log("[signIn] Existing user OK:", existingUser.email);
          return true;
        }

        console.log("[signIn] New user — creating account:", user.email);

        const newUser = await db.user.create({
          data: {
            email: user.email!,
            name: user.name ?? user.email!.split("@")[0],
          },
        });
        console.log("[signIn] User created id:", newUser.id);

        const landlord = await db.landlord.create({
          data: { userId: newUser.id, name: newUser.name ?? "" },
        });
        console.log("[signIn] Landlord created id:", landlord.id);

        await db.userRole.create({
          data: {
            userId: newUser.id,
            role: "landlord",
            landlordId: landlord.id,
          },
        });
        console.log("[signIn] UserRole created — account ready");

        return true;
      } catch (err) {
        console.error("[signIn] DB error:", err);
        return false;
      }
    },

    async redirect({ url, baseUrl }) {
      console.log("[redirect] url:", url, "baseUrl:", baseUrl);
      return `${process.env.NEXTAUTH_URL}/api/auth/google-session`;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
