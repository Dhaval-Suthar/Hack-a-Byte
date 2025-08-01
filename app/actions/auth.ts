"use server";

import connectDb from "@/db/connectDb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// This function is for server-side auth status checking
export async function getAuthStatus() {
  // Since NextAuth is removed, always return unauthenticated
  return {
    isAuthenticated: false,
    user: null
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

// Server-side login function for authentication
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
    
    // You would normally sign in the user here with a custom authentication system
    
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
