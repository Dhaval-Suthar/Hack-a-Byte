import DOMPurify from 'isomorphic-dompurify';

// Input sanitization utilities (client-safe, no server dependencies)
export class InputSanitizer {
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      ALLOWED_ATTR: [],
    });
  }

  static sanitizeText(input: string): string {
    // Remove potentially dangerous characters
    return input.replace(/[<>'"&]/g, '');
  }

  static sanitizeEmail(email: string): string {
    // Basic email sanitization
    return email.toLowerCase().trim();
  }

  static sanitizeUsername(username: string): string {
    // Allow only alphanumeric characters, underscores, and hyphens
    return username.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
  }

  static sanitizeGameInput(input: string): string {
    // For game-related inputs, be more restrictive
    return input.replace(/[<>'"&]/g, '').substring(0, 1000);
  }
}

// SQL injection prevention (for raw queries if any)
export function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}
