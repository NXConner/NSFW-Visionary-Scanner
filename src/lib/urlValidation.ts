/**
 * URL Validation Utilities
 * Security-focused URL validation to prevent SSRF attacks
 */

// Private IP ranges that should be blocked
const PRIVATE_IP_RANGES = [
  /^127\./, // 127.0.0.0/8 (localhost)
  /^10\./, // 10.0.0.0/8 (Class A private)
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12 (Class B private)
  /^192\.168\./, // 192.168.0.0/16 (Class C private)
  /^169\.254\./, // 169.254.0.0/16 (link-local)
  /^::1$/, // IPv6 localhost
  /^fc00:/i, // IPv6 private
  /^fe80:/i, // IPv6 link-local
  /^0\.0\.0\.0$/, // All zeros
  /^localhost$/i, // localhost hostname
];

// Internal hostnames that should be blocked
const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "metadata.google",
  "169.254.169.254", // AWS/GCP metadata
];

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
}

/**
 * Validates a webhook URL for security
 * - Only allows HTTPS protocol
 * - Blocks private/internal IP addresses
 * - Blocks known metadata endpoints
 */
export function validateWebhookUrl(url: string): UrlValidationResult {
  if (!url || typeof url !== "string") {
    return { isValid: false, error: "URL is required" };
  }

  const trimmedUrl = url.trim();

  // Check basic URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return { isValid: false, error: "Invalid URL format" };
  }

  // Only allow HTTPS (except in development for localhost testing)
  const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_APP_ENV === "development";
  if (parsedUrl.protocol !== "https:") {
    if (!isDevelopment || parsedUrl.protocol !== "http:") {
      return { isValid: false, error: "Only HTTPS URLs are allowed" };
    }
  }

  // In production, block all private/internal addresses
  if (!isDevelopment) {
    const hostname = parsedUrl.hostname.toLowerCase();

    // Check against blocked hostnames
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return { isValid: false, error: "Internal/private addresses are not allowed" };
    }

    // Check against private IP patterns
    for (const pattern of PRIVATE_IP_RANGES) {
      if (pattern.test(hostname)) {
        return { isValid: false, error: "Private IP addresses are not allowed" };
      }
    }

    // Block URLs with credentials
    if (parsedUrl.username || parsedUrl.password) {
      return { isValid: false, error: "URLs with credentials are not allowed" };
    }
  }

  // Validate port (allow standard ports or > 1024)
  const port = parsedUrl.port
    ? parseInt(parsedUrl.port, 10)
    : parsedUrl.protocol === "https:"
      ? 443
      : 80;
  if (port <= 0 || port > 65535) {
    return { isValid: false, error: "Invalid port number" };
  }

  // Block common internal ports (except standard web ports)
  const blockedPorts = [22, 23, 25, 53, 110, 143, 445, 3306, 5432, 6379, 27017];
  if (blockedPorts.includes(port)) {
    return { isValid: false, error: `Port ${port} is not allowed for webhooks` };
  }

  // Limit URL length
  if (trimmedUrl.length > 2048) {
    return { isValid: false, error: "URL is too long (max 2048 characters)" };
  }

  return {
    isValid: true,
    normalizedUrl: parsedUrl.toString(),
  };
}

/**
 * Check if a URL is valid for general external use
 * Less strict than webhook validation
 */
export function isValidExternalUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}
