"use server";

import connectDb from "@/db/connectDb";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { signIn } from "next-auth/react";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

// This function is for server-side auth status checking
export async function getAuthStatus() {
  const session = await getServerSession(authOptions);
  return {
    isAuthenticated: !!session?.user,
    user: session?.user || null
  };
}

// Register a new user
export async function registerUser(formData: {
  username: string;
  email: string;
  password: string;
}) {
  try {
    const { username, email, password } = formData;
    
    // Validate inputs
    if (!username || !email || !password) {
      return { 
        success: false, 
        error: "All fields are required" 
      };
    }
    
    await connectDb();
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return { 
        success: false, 
        error: "Username or email already exists" 
      };
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = await User.create({
      username,
      email,
      passwordHash,
      isAuthenticated: true,
      isMentor: false,
      isAdmin: false,
      createdAt: new Date()
    });
    
    return { 
      success: true, 
      userId: newUser._id.toString() 
    };
  } catch (error) {
    console.error("Registration error:", error);
    return { 
      success: false, 
      error: "Registration failed" 
    };
  }
}

// Note: Frontend login will still use the signIn function from next-auth/react
// This is a server-side version for reference
export async function serverLogin(formData: {
  username: string;
  password: string;
}) {
  try {
    const { username, password } = formData;
    
    // Validate inputs
    if (!username || !password) {
      return { 
        success: false, 
        error: "Username and password are required" 
      };
    }
    
    await connectDb();
    
    // Find the user
    const user = await User.findOne({ username });
    
    if (!user) {
      return { 
        success: false, 
        error: "Invalid username or password" 
      };
    }
    
    // Compare passwords
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      return { 
        success: false, 
        error: "Invalid username or password" 
      };
    }
    
    // You would normally sign in the user here,
    // but we'll use next-auth's signIn on the client side
    
    return { 
      success: true,
      userId: user._id.toString()
    };
  } catch (error) {
    console.error("Login error:", error);
    return { 
      success: false, 
      error: "Login failed" 
    };
  }
}

// Check if user exists
export async function checkUserExists(username: string, email: string) {
  try {
    await connectDb();
    
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }]
    });
    
    return { exists: !!existingUser };
  } catch (error) {
    console.error("User check error:", error);
    return { error: "Failed to check user" };
  }
}
