/**
 * Security utilities for data masking and sanitization
 */

// Mask sensitive data for logging
export function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveFields = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
    'phoneNumber',
    'email',
    'creditCard',
    'cardNumber',
    'cvv',
    'ssn',
    'bankAccount',
    'stripePaymentId',
    'stripeCustomerId',
    'stripeSubscriptionId'
  ];

  const masked = { ...data };

  for (const key in masked) {
    if (masked.hasOwnProperty(key)) {
      const lowerKey = key.toLowerCase();
      
      // Check if the field name contains sensitive keywords
      if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
        if (typeof masked[key] === 'string' && masked[key]) {
          // Keep first and last 2 characters for partial identification
          if (masked[key].length > 4) {
            masked[key] = `${masked[key].slice(0, 2)}****${masked[key].slice(-2)}`;
          } else {
            masked[key] = '****';
          }
        }
      } else if (typeof masked[key] === 'object') {
        // Recursively mask nested objects
        masked[key] = maskSensitiveData(masked[key]);
      }
    }
  }

  return masked;
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return input;
  }

  // Basic HTML entity encoding
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate and sanitize file names
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'unknown';
  }

  // Remove path traversal attempts
  fileName = fileName.replace(/\.\./g, '');
  
  // Remove special characters except for dots and hyphens
  fileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  if (fileName.length > 255) {
    const ext = fileName.split('.').pop();
    const base = fileName.substring(0, 240);
    fileName = ext ? `${base}.${ext}` : base;
  }

  return fileName;
}

// Check if a URL is safe to redirect to
export function isSafeRedirectUrl(url: string, allowedDomains: string[] = []): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    
    // Check for javascript: or data: protocols
    if (['javascript:', 'data:', 'vbscript:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // If allowed domains are specified, check against them
    if (allowedDomains.length > 0) {
      return allowedDomains.some(domain => 
        parsedUrl.hostname === domain || 
        parsedUrl.hostname.endsWith(`.${domain}`)
      );
    }

    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    // Invalid URL
    return false;
  }
}

// Generate secure random tokens
export function generateSecureToken(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  const crypto = require('crypto');
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    token += charset[randomBytes[i] % charset.length];
  }
  
  return token;
}