// Re-export all utility modules
export * from './date';
export * from './location';
export * from './validation';
export * from './crypto';

// Legacy utilities (to be migrated to specific modules)
// These are kept for backward compatibility

// String utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Anonymity utilities
export const maskNickname = (nickname: string): string => {
  if (nickname.length <= 2) return nickname;
  const firstChar = nickname.charAt(0);
  const masked = '*'.repeat(nickname.length - 1);
  return firstChar + masked;
};

export const generateAnonymousName = (): string => {
  const adjectives = ['귀여운', '멋진', '똑똑한', '친절한', '활발한', '조용한', '유쾌한', '신비한'];
  const animals = ['고양이', '강아지', '토끼', '여우', '펭귄', '판다', '코알라', '햄스터'];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  
  return `${randomAdjective} ${randomAnimal}`;
};

// Error handling utilities
export const createApiError = (message: string, code?: string, statusCode?: number) => {
  const error = new Error(message) as any;
  error.code = code;
  error.statusCode = statusCode || 400;
  error.isOperational = true;
  return error;
};

// Pagination utilities
export const calculatePagination = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrevious = page > 1;
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrevious,
    offset: (page - 1) * limit
  };
};

// Business logic utilities
export const canUserLike = (userCredits: number, isPremium: boolean): boolean => {
  return isPremium || userCredits > 0;
};

export const calculateLikeCost = (isPremium: boolean): number => {
  return isPremium ? 0 : 1;
};

export const getMatchCompatibilityScore = (
  user1Age: number,
  user2Age: number,
  maxAgeDiff: number = 10
): number => {
  const ageDiff = Math.abs(user1Age - user2Age);
  if (ageDiff > maxAgeDiff) return 0;
  
  // Score from 0 to 100 based on age compatibility
  return Math.round((1 - (ageDiff / maxAgeDiff)) * 100);
};

// Re-export from specific modules (for backward compatibility)
export { 
  validatePhoneNumber,
  validateEmail,
  validateNickname,
  validateAge,
  formatPhoneNumber,
  sanitizeInput,
  maskPhoneNumber,
  maskEmail,
} from './validation';

export {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  isToday,
  isWithinDays,
  addDays,
  getDaysBetween,
  getKoreanDayOfWeek,
} from './date';

export {
  calculateDistance,
  formatDistance,
  isWithinRadius,
  getBoundingBox,
  calculateLocationScore,
} from './location';

export {
  generateId,
  generateVerificationCode,
  generateSecureToken,
  generateMeetingCode,
  simpleHash,
  maskData,
} from './crypto';

// Aliases for backward compatibility
export { validateAge as isValidAge } from './validation';
export { formatRelativeTime as formatDateKorean } from './date';
export { generateId as generateUniqueId } from './crypto';