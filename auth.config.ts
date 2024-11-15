import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl} }) {
      const isLoggedIn = !!auth?.user;
      const isOnDevices = nextUrl.pathname.startsWith("/devices");
      const isOnDashBoard = nextUrl.pathname.startsWith("/dashboard");
      const routes = nextUrl.pathname.split("/");

      if (isOnDevices || isOnDashBoard || routes.length === 2) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
  secret: process.env.AUTH_SECRET
} satisfies NextAuthConfig;
