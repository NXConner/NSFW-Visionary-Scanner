/**
 * Content Security Policy Helper
 * Enhanced CSP headers for NSFW content pages
 */

export interface CSPDirectives {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  mediaSrc?: string[];
  connectSrc?: string[];
  fontSrc?: string[];
  objectSrc?: string[];
  frameSrc?: string[];
  baseUri?: string[];
  formAction?: string[];
}

export class ContentSecurityPolicy {
  /**
   * Generate CSP header value from directives
   */
  static generate(directives: CSPDirectives): string {
    const parts: string[] = [];

    for (const [key, values] of Object.entries(directives)) {
      if (!values || values.length === 0) continue;

      // Convert camelCase to kebab-case
      const directive = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
      parts.push(`${directive} ${values.join(" ")}`);
    }

    return parts.join("; ");
  }

  /**
   * Get strict CSP for NSFW content pages
   */
  static getNSFWPageCSP(): string {
    return this.generate({
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // TensorFlow.js needs eval
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      mediaSrc: ["'self'", "blob:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    });
  }

  /**
   * Apply CSP as meta tag
   */
  static applyToDocument(csp: string): void {
    if (typeof document === "undefined") return;

    // Remove existing CSP meta tag
    const existingMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingMeta) {
      existingMeta.remove();
    }

    // Add new CSP meta tag
    const meta = document.createElement("meta");
    meta.httpEquiv = "Content-Security-Policy";
    meta.content = csp;
    document.head.appendChild(meta);
  }
}
