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
  callbacks: {
    // Block Google accounts not in our DB (must be invited first)
    async signIn({ user }) {
      const existingUser = await db.user.findUnique({
        where: { email: user.email! },
      });
      return !!existingUser;
    },
    // After Google auth succeeds → go to our bridge route
    async redirect() {
      return `${process.env.NEXTAUTH_URL}/api/auth/google-session`;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
