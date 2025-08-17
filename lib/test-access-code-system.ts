"use server";

import { registerForEvent, resendAccessCode } from "@/app/actions/eventRegistration";
import { validateAccessCodeUsage } from "@/lib/access-code-generation";

export interface TestRegistrationResult {
  success: boolean;
  message: string;
  details?: {
    registrationId?: string;
    accessCode?: string;
    playspaceName?: string;
    usageValidation?: {
      isValid: boolean;
      usagesLeft?: number;
      maxUsages?: number;
    };
  };
  error?: string;
}

/**
 * Test function for the access code system
 * This creates a test registration and validates the access code
 */
export async function testAccessCodeSystem(
  email: string = "test@hackabyte.com",
  playingDevice: "smartphone" | "pc_laptop" = "smartphone",
  numberOfPlayers: number = 2
): Promise<TestRegistrationResult> {
  try {
    console.log("=== Testing Access Code System ===");
    
    // Step 1: Register for event
    console.log("Step 1: Creating event registration...");
    const registrationResult = await registerForEvent({
      eventId: 999, // Test event ID
      email,
      playingDevice,
      numberOfPlayers
    });
    
    if (!registrationResult.success) {
      return {
        success: false,
        message: "Failed to register for event",
        error: registrationResult.error
      };
    }
    
    console.log("✅ Registration successful:", registrationResult.registrationId);
    console.log("✅ Access code generated:", registrationResult.accessCode);
    console.log("✅ Playspace created:", registrationResult.playspaceName);
    
    // Step 2: Validate access code usage
    if (registrationResult.accessCode) {
      console.log("Step 2: Validating access code usage...");
      const validationResult = await validateAccessCodeUsage(registrationResult.accessCode);
      
      if (validationResult.success) {
        console.log("✅ Access code validation:", {
          isValid: validationResult.isValid,
          usagesLeft: validationResult.usagesLeft,
          maxUsages: validationResult.maxUsages
        });
        
        return {
          success: true,
          message: "Access code system test completed successfully!",
          details: {
            registrationId: registrationResult.registrationId,
            accessCode: registrationResult.accessCode,
            playspaceName: registrationResult.playspaceName,
            usageValidation: {
              isValid: validationResult.isValid!,
              usagesLeft: validationResult.usagesLeft,
              maxUsages: validationResult.maxUsages
            }
          }
        };
      } else {
        return {
          success: false,
          message: "Access code validation failed",
          error: validationResult.error
        };
      }
    } else {
      return {
        success: false,
        message: "No access code was generated",
        error: "Access code missing from registration result"
      };
    }
    
  } catch (error) {
    console.error("Test access code system error:", error);
    return {
      success: false,
      message: "Test failed with exception",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Test function to verify access code usage limits work correctly
 */
export async function testAccessCodeUsageLimit(accessCode: string): Promise<{
  success: boolean;
  message: string;
  usageTests?: Array<{
    attempt: number;
    isValid: boolean;
    usagesLeft?: number;
  }>;
  error?: string;
}> {
  try {
    console.log("=== Testing Access Code Usage Limits ===");
    console.log("Access code:", accessCode);
    
    const usageTests = [];
    
    // Test initial validation
    const initialValidation = await validateAccessCodeUsage(accessCode);
    if (!initialValidation.success) {
      return {
        success: false,
        message: "Failed to validate access code initially",
        error: initialValidation.error
      };
    }
    
    console.log("Initial validation:", {
      isValid: initialValidation.isValid,
      usagesLeft: initialValidation.usagesLeft,
      maxUsages: initialValidation.maxUsages
    });
    
    const maxUsages = initialValidation.maxUsages || 1;
    
    // Test multiple usage attempts
    for (let i = 1; i <= maxUsages + 2; i++) {
      console.log(`Testing usage attempt ${i}...`);
      
      const validation = await validateAccessCodeUsage(accessCode);
      
      usageTests.push({
        attempt: i,
        isValid: validation.isValid!,
        usagesLeft: validation.usagesLeft
      });
      
      console.log(`Attempt ${i}:`, {
        isValid: validation.isValid,
        usagesLeft: validation.usagesLeft
      });
      
      // If invalid and we haven't reached the limit, something's wrong
      if (!validation.isValid && i <= maxUsages) {
        return {
          success: false,
          message: `Access code became invalid too early (attempt ${i}/${maxUsages})`,
          usageTests
        };
      }
      
      // If still valid after exceeding limit, something's wrong
      if (validation.isValid && i > maxUsages) {
        return {
          success: false,
          message: `Access code should be invalid after ${maxUsages} uses but still valid at attempt ${i}`,
          usageTests
        };
      }
    }
    
    return {
      success: true,
      message: "Usage limit test completed successfully!",
      usageTests
    };
    
  } catch (error) {
    console.error("Test usage limit error:", error);
    return {
      success: false,
      message: "Usage limit test failed with exception",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Test the resend access code functionality
 */
export async function testResendAccessCode(registrationId: string): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    console.log("=== Testing Resend Access Code ===");
    console.log("Registration ID:", registrationId);
    
    const resendResult = await resendAccessCode(registrationId);
    
    if (resendResult.success) {
      console.log("✅ Access code resent successfully");
      console.log("Access code:", resendResult.accessCode);
      return {
        success: true,
        message: "Resend access code test completed successfully!"
      };
    } else {
      return {
        success: false,
        message: "Failed to resend access code",
        error: resendResult.error
      };
    }
    
  } catch (error) {
    console.error("Test resend access code error:", error);
    return {
      success: false,
      message: "Resend test failed with exception",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
