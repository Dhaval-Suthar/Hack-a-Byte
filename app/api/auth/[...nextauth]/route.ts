import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// This creates the NextAuth API routes at /api/auth/*
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };