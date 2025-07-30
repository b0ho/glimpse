/**
 * Common validation utilities used across mobile and server
 */

/**
 * Validate Korean phone number
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const phoneRegex = /^01[0-9]{8,9}$/;
  return phoneRegex.test(cleanPhone);
};

/**
 * Format Korean phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  if (cleanPhone.length === 10) {
    return `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
  } else if (cleanPhone.length === 11) {
    return `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 7)}-${cleanPhone.slice(7)}`;
  }
  
  return cleanPhone;
};

/**
 * Validate email address
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

/**
 * Validate nickname
 */
export const validateNickname = (nickname: string): {
  isValid: boolean;
  error?: string;
} => {
  if (!nickname || nickname.trim().length === 0) {
    return { isValid: false, error: '닉네임을 입력해주세요' };
  }
  
  if (nickname.length < 2) {
    return { isValid: false, error: '닉네임은 2자 이상이어야 합니다' };
  }
  
  if (nickname.length > 20) {
    return { isValid: false, error: '닉네임은 20자 이하여야 합니다' };
  }
  
  // Check for inappropriate characters
  const invalidChars = /[<>"'&]/;
  if (invalidChars.test(nickname)) {
    return { isValid: false, error: '사용할 수 없는 문자가 포함되어 있습니다' };
  }
  
  return { isValid: true };
};

/**
 * Validate age
 */
export const validateAge = (birthDate: Date | string): {
  isValid: boolean;
  age?: number;
  error?: string;
} => {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) 
    ? age - 1 
    : age;
  
  if (actualAge < 19) {
    return { isValid: false, error: '만 19세 이상만 가입할 수 있습니다' };
  }
  
  if (actualAge > 100) {
    return { isValid: false, error: '올바른 생년월일을 입력해주세요' };
  }
  
  return { isValid: true, age: actualAge };
};

/**
 * Validate URL
 */
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>"']/g, '')
    .replace(/\s+/g, ' ');
};

/**
 * Validate payment amount
 */
export const validatePaymentAmount = (
  amount: number,
  currency: string
): {
  isValid: boolean;
  error?: string;
} => {
  if (amount <= 0) {
    return { isValid: false, error: '금액은 0보다 커야 합니다' };
  }
  
  const minAmount = currency === 'KRW' ? 100 : 1;
  const maxAmount = currency === 'KRW' ? 10000000 : 10000;
  
  if (amount < minAmount) {
    return { isValid: false, error: `최소 금액은 ${minAmount}${currency}입니다` };
  }
  
  if (amount > maxAmount) {
    return { isValid: false, error: `최대 금액은 ${maxAmount}${currency}입니다` };
  }
  
  return { isValid: true };
};