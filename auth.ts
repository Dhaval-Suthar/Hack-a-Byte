import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { z } from "zod";
import clientPromise from "@/app/lib/mongodb";
import type { User } from "@/app/lib/definitions";
import bcrypt from "bcrypt";

async function getUser(username: string): Promise<User | null> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);

    const user = await db.collection("users").findOne({ username: username });

    if (!user) return null;

    return { id: user._id.toString(), name: user.username, email: user.email, password: user.password };
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ username: z.string(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { username, password } = parsedCredentials.data;
          const user = await getUser(username);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            return user;
          }
        }

        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
});
