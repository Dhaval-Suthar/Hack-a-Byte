'use client';

import { signIn, signOut } from 'next-auth/react';
import { checkUserExists, registerUser } from '@/app/actions/auth';

// Login with username and password
export async function login(username: string, password: string, redirectTo = "/") {
  try {
    const result = await signIn('credentials', {
      redirect: false,
      username,
      password
    });
    
    if (!result?.error) {
      // Successful login
      window.location.href = redirectTo;
      return { success: true };
    } else {
      return { 
        success: false, 
        error: result.error || "Login failed" 
      };
    }
  } catch (error) {
    console.error("Login error:", error);
    return { 
      success: false, 
      error: "Login failed" 
    };
  }
}

// Logout
export async function logout(redirectTo = "/") {
  try {
    await signOut({ redirect: false });
    window.location.href = redirectTo;
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { 
      success: false, 
      error: "Logout failed" 
    };
  }
}

// Register new user
export async function signup(formData: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  try {
    const { username, email, password, confirmPassword } = formData;
    
    // Client-side validation
    if (!username || !email || !password) {
      return { 
        success: false, 
        error: "All fields are required" 
      };
    }
    
    if (password !== confirmPassword) {
      return { 
        success: false, 
        error: "Passwords do not match" 
      };
    }
    
    if (password.length < 8) {
      return { 
        success: false, 
        error: "Password must be at least 8 characters" 
      };
    }
    
    // Check if user exists
    const userCheck = await checkUserExists(username, email);
    
    if (userCheck.exists) {
      return { 
        success: false, 
        error: "Username or email already exists" 
      };
    }
    
    // Register user using server action
    const result = await registerUser({
      username,
      email,
      password
    });
    
    if (result.success) {
      // Auto-login after registration
      return await login(username, password);
    } else {
      return { 
        success: false, 
        error: result.error || "Registration failed" 
      };
    }
  } catch (error) {
    console.error("Registration error:", error);
    return { 
      success: false, 
      error: "Registration failed" 
    };
  }
}
