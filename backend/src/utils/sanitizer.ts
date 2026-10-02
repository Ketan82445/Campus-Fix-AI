/**
 * Input sanitization utility for preventing XSS and injection
 */
export class Sanitizer {
  /**
   * Strip HTML tags, script blocks, and dangerous attributes
   */
  public static sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
      // Remove script tags and contents
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove iframe tags and contents
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      // Remove inline event handlers like onload, onerror, onclick
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\s*[^>\s]+/gi, '')
      // Remove javascript: pseudo-protocols
      .replace(/javascript:[^"'>\s]*/gi, '')
      // Strip any remaining dangerous HTML tags
      .replace(/<[^>]*>?/gm, '')
      .trim();
  }

  /**
   * Sanitize an object of string fields
   */
  public static sanitizeObject<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
    const result = { ...obj };
    for (const field of fields) {
      if (typeof result[field] === 'string') {
        (result as any)[field] = this.sanitizeText(result[field] as string);
      }
    }
    return result;
  }
}
