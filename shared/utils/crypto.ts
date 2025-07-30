/**
 * Common cryptography utilities used across mobile and server
 * Note: Some functions may need platform-specific implementations
 */

/**
 * Generate a random ID
 */
export const generateId = (prefix: string = ''): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}${randomPart}` : `${timestamp}${randomPart}`;
};

/**
 * Generate a verification code
 */
export const generateVerificationCode = (length: number = 6): string => {
  const digits = '0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  
  return code;
};

/**
 * Generate a secure token
 */
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
};

/**
 * Hash a string (simple hash for non-sensitive data)
 * For sensitive data, use platform-specific crypto libraries
 */
export const simpleHash = (str: string): string => {
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

/**
 * Mask sensitive data
 */
export const maskData = (data: string, visibleChars: number = 4): string => {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }
  
  const visible = data.slice(-visibleChars);
  const masked = '*'.repeat(data.length - visibleChars);
  return masked + visible;
};

/**
 * Mask phone number
 */
export const maskPhoneNumber = (phone: string): string => {
  const clean = phone.replace(/[^0-9]/g, '');
  
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}-****-${clean.slice(-4)}`;
  } else if (clean.length === 11) {
    return `${clean.slice(0, 3)}-****-${clean.slice(-4)}`;
  }
  
  return maskData(phone, 4);
};

/**
 * Mask email
 */
export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  
  if (!domain) {
    return maskData(email, 3);
  }
  
  const maskedLocal = localPart.length > 3 
    ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
    : '*'.repeat(localPart.length);
  
  return `${maskedLocal}@${domain}`;
};

/**
 * Generate meeting code
 */
export const generateMeetingCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
};