// Security Key Authentication using WebAuthn API
import { logger } from "./logger";

export interface SecurityKeyAuthResult {
  success: boolean;
  error?: string;
  credential?: Credential | null;
}

export class SecurityKeyAuth {
  private static readonly RP_NAME = "HackaByte Admin";
  private static readonly RP_ID = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  private static readonly USER_ID = new TextEncoder().encode("hackabyte-admin");
  private static readonly CHALLENGE_TIMEOUT = 60000; // 60 seconds

  /**
   * Check if WebAuthn is supported in the current browser
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 
           'navigator' in window && 
           'credentials' in navigator &&
           'create' in navigator.credentials &&
           typeof PublicKeyCredential !== 'undefined';
  }

  /**
   * Register a new security key
   */
  static async registerKey(): Promise<SecurityKeyAuthResult> {
    if (!this.isSupported()) {
      return { success: false, error: 'WebAuthn is not supported in this browser' };
    }

    try {
      const challenge = this.generateChallenge();
      
      const credentialCreationOptions: CredentialCreationOptions = {
        publicKey: {
          challenge: challenge as BufferSource,
          rp: {
            name: this.RP_NAME,
            id: this.RP_ID,
          },
          user: {
            id: this.USER_ID,
            name: "admin@hackabyte.com",
            displayName: "HackaByte Administrator",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "cross-platform", // External security keys
            userVerification: "preferred",
            requireResidentKey: false,
          },
          timeout: this.CHALLENGE_TIMEOUT,
          attestation: "direct",
        },
      };

      const credential = await navigator.credentials.create(credentialCreationOptions);
      
      if (!credential) {
        return { success: false, error: 'Failed to create credential' };
      }

      // Store the credential ID for future authentication
      this.storeCredentialId(credential.id);

      return { success: true, credential };
    } catch (error: unknown) {
      logger.error("Security key registration failed", { error: this.getErrorMessage(error) });
      return { 
        success: false, 
        error: this.getErrorMessage(error) 
      };
    }
  }

  /**
   * Authenticate using a registered security key
   */
  static async authenticateKey(): Promise<SecurityKeyAuthResult> {
    if (!this.isSupported()) {
      return { success: false, error: 'WebAuthn is not supported in this browser' };
    }

    const storedCredentials = this.getStoredCredentials();
    if (storedCredentials.length === 0) {
      return { success: false, error: 'No security keys registered. Please register a key first.' };
    }

    try {
      const challenge = this.generateChallenge();
      
      const credentialRequestOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: challenge as BufferSource,
          allowCredentials: storedCredentials.map(id => ({
            id: this.base64UrlToBuffer(id),
            type: "public-key" as const,
            transports: ["usb", "ble", "nfc", "internal"] as AuthenticatorTransport[],
          })),
          timeout: this.CHALLENGE_TIMEOUT,
          userVerification: "preferred",
          rpId: this.RP_ID,
        },
      };

      const assertion = await navigator.credentials.get(credentialRequestOptions);
      
      if (!assertion) {
        return { success: false, error: 'Authentication failed' };
      }

      return { success: true, credential: assertion };
    } catch (error: unknown) {
      logger.error("Security key authentication failed", { error: this.getErrorMessage(error) });
      return { 
        success: false, 
        error: this.getErrorMessage(error) 
      };
    }
  }

  /**
   * Remove all registered security keys
   */
  static clearRegisteredKeys(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hackabyte-admin-credentials');
    }
  }

  /**
   * Get list of registered credential IDs
   */
  static getRegisteredKeys(): string[] {
    return this.getStoredCredentials();
  }

  /**
   * Check if any security keys are registered
   */
  static hasRegisteredKeys(): boolean {
    return this.getStoredCredentials().length > 0;
  }

  // Private helper methods
  private static generateChallenge(): Uint8Array {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    return challenge;
  }

  private static storeCredentialId(credentialId: string): void {
    if (typeof window === 'undefined') return;
    
    const existingCredentials = this.getStoredCredentials();
    const newCredentials = [...existingCredentials, credentialId];
    localStorage.setItem('hackabyte-admin-credentials', JSON.stringify(newCredentials));
  }

  private static getStoredCredentials(): string[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem('hackabyte-admin-credentials');
    return stored ? JSON.parse(stored) : [];
  }

  private static base64UrlToBuffer(base64url: string): ArrayBuffer {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const binary = atob(padded);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      view[i] = binary.charCodeAt(i);
    }
    return buffer;
  }

  private static getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'name' in error) {
      const errorName = (error as { name: string }).name;
      
      if (errorName === 'NotAllowedError') {
        return 'Authentication was cancelled or timed out';
      } else if (errorName === 'InvalidStateError') {
        return 'Security key is already registered';
      } else if (errorName === 'NotSupportedError') {
        return 'Security key authentication is not supported';
      } else if (errorName === 'SecurityError') {
        return 'Security error occurred during authentication';
      } else if (errorName === 'AbortError') {
        return 'Authentication was aborted';
      } else if (errorName === 'ConstraintError') {
        return 'Security key does not meet requirements';
      } else if (errorName === 'NotReadableError') {
        return 'Error reading from security key';
      } else if (errorName === 'UnknownError') {
        return 'Unknown error occurred';
      }
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      return (error as { message: string }).message;
    }
    
    return 'An unknown error occurred';
  }
}
