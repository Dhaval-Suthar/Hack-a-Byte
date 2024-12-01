import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDevices = nextUrl.pathname.startsWith("/devices");
      const isOnDashBoard = nextUrl.pathname.startsWith("/dashboard");
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isOnPrivacy = nextUrl.pathname.startsWith("/privacy-policy");
      const isOnTerms = nextUrl.pathname.startsWith("/terms-of-service");
      const routes = nextUrl.pathname.split("/");

      if (isOnPrivacy || isOnTerms) {
        return true;
      } else if (isOnDevices || isOnDashBoard || (routes.length === 2 && !isOnLogin)) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
