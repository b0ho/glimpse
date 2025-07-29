// Validation utilities
export const validatePhoneNumber = (phone: string): boolean => {
  // Korean phone number format: 010-XXXX-XXXX or 01X-XXXX-XXXX
  const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;
  return phoneRegex.test(phone);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateNickname = (nickname: string): boolean => {
  // 2-10 characters, Korean/English/numbers allowed
  const nicknameRegex = /^[가-힣a-zA-Z0-9]{2,10}$/;
  return nicknameRegex.test(nickname);
};

// Age-related utilities
export const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1;
  }
  
  return age;
};

export const isValidAge = (age: number): boolean => {
  return age >= 18 && age <= 99;
};

// Distance calculation
export const calculateDistance = (
  lat1: number,
  lon1: number,  
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// String utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const formatPhoneNumber = (phone: string): string => {
  // Format as 010-XXXX-XXXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  return phone;
};

// Date utilities
export const formatDateKorean = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('ko-KR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
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

// ID generation utilities
export const generateId = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

// Encryption utilities (for client-side use)
export const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
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