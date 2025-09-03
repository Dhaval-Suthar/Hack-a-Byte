"use server";

// This function is for server-side auth status checking
export async function getAuthStatus() {
  // Since NextAuth is removed, always return unauthenticated
  return {
    isAuthenticated: false,
    user: null
  };
}
