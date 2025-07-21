import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDb from "@/db/connectDb";
// TODO: Update to use appropriate model (DeviceUser, PlayspaceUser, etc.)
// import DeviceUser from "@/models/DeviceUser";
// import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";

// Extend the next-auth types to include custom fields
declare module "next-auth" {
  interface User {
    id: string;
    isAdmin?: boolean;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin?: boolean;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isAdmin?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  // Ensure we have a consistent secret for JWT encryption/decryption
  secret: process.env.NEXTAUTH_SECRET || 'a-fallback-secret-that-is-at-least-32-chars',
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        await connectDb();

        // TODO: Replace with appropriate model (DeviceUser, PlayspaceUser, etc.)
        // The current User model is not available. You need to either:
        // 1. Create a User model with the expected fields (username, email, passwordHash, isAdmin)
        // 2. Update this auth logic to use DeviceUser or another existing model
        // 3. Modify the existing models to include the required authentication fields
        
        /* Original User-based logic - needs to be updated:
        const user = await User.findOne({ username: credentials.username });
        
        if (!user) {
          return null;
        }
        
        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        
        if (!isPasswordValid) {
          return null;
        }
        
        return {
          id: user._id.toString(),
          name: user.username,
          email: user.email,
          isAdmin: user.isAdmin,
        };
        */
        
        // Temporary return null until proper model is implemented
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id,
          isAdmin: token.isAdmin,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/signup"
  },
  debug: process.env.NODE_ENV === "development",
};
