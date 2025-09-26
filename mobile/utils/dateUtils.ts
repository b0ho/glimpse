/**
 * 날짜와 시간 관련 유틸리티 함수들
 */

import i18n from '@/services/i18n/i18n';
import { Platform } from 'react-native';

/**
 * Cross-platform translation helper
 */
const safeT = (key: string, options?: any): string => {
  // 모든 플랫폼에서 i18n이 초기화되지 않았을 때 fallback 제공
  if (!i18n.isInitialized) {
    if (key.includes('justNow')) return '방금 전';
    if (key.includes('minutesAgo')) return `${options?.count || 1}분 전`;
    if (key.includes('hoursAgo')) return `${options?.count || 1}시간 전`;
    if (key.includes('daysAgo')) return `${options?.count || 1}일 전`;
    if (key.includes('weeksAgo')) return `${options?.count || 1}주 전`;
    if (key.includes('monthsAgo')) return `${options?.count || 1}개월 전`;
    if (key.includes('yearsAgo')) return `${options?.count || 1}년 전`;
  }
  
  const translation = i18n.t(key, options);
  
  // 모든 플랫폼에서 키가 그대로 반환되면 fallback 제공
  if (translation === key) {
    if (key.includes('justNow')) return '방금 전';
    if (key.includes('minutesAgo')) return `${options?.count || 1}분 전`;
    if (key.includes('hoursAgo')) return `${options?.count || 1}시간 전`;
    if (key.includes('daysAgo')) return `${options?.count || 1}일 전`;
    if (key.includes('weeksAgo')) return `${options?.count || 1}주 전`;
    if (key.includes('monthsAgo')) return `${options?.count || 1}개월 전`;
    if (key.includes('yearsAgo')) return `${options?.count || 1}년 전`;
  }
  
  return translation as string;
};

/**
 * 주어진 날짜로부터 현재까지의 시간을 현재 언어로 표현
 * @param dateInput - 계산할 기준 날짜 (Date 객체, timestamp, 또는 날짜 문자열)
 * @returns 시간 표현 (예: "방금 전", "5분 전", "2시간 전")
 */
export const formatTimeAgo = (dateInput: Date | number | string): string => {
  const now = new Date();
  
  // dateInput을 Date 객체로 변환
  let date: Date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
  }
  
  // Invalid date 체크
  if (isNaN(date.getTime())) {
    console.warn('Invalid date input:', dateInput);
    return safeT('common:time.justNow');
  }
  
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return safeT('common:time.justNow');
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return safeT('common:time.minutesAgo', { count: minutes });
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return safeT('common:time.hoursAgo', { count: hours });
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return safeT('common:time.daysAgo', { count: days });
  } else if (diffInSeconds < 2592000) { // 30일
    const weeks = Math.floor(diffInSeconds / 604800);
    return safeT('common:time.weeksAgo', { count: weeks });
  } else if (diffInSeconds < 31536000) { // 365일
    const months = Math.floor(diffInSeconds / 2592000);
    return safeT('common:time.monthsAgo', { count: months });
  } else {
    const locale = (i18n.language === 'ko' || !i18n.isInitialized) ? 'ko-KR' : 'en-US';
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    });
  }
};

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 * @param date - 포맷할 날짜
 * @returns YYYY-MM-DD 형식의 문자열
 */
export const formatDateString = (date: Date): string => {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\. /g, '-').replace('.', '');
};

/**
 * 상대적 시간 표현을 더 자세하게 제공
 * @param date - 기준 날짜
 * @returns 자세한 시간 표현
 */
export const formatDetailedTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return safeT('common:time.justNow');
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return safeT('common:time.minutesAgo', { count: minutes });
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    return minutes > 0 
      ? safeT('common:time.hoursAndMinutesAgo', { hours, minutes })
      : safeT('common:time.hoursAgo', { count: hours });
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return safeT('common:time.daysAgo', { count: days });
  } else {
    const locale = (i18n.language === 'ko' || !i18n.isInitialized) ? 'ko-KR' : 'en-US';
    return date.toLocaleDateString(locale);
  }
};

/**
 * 상대적 시간 표현 (formatTimeAgo의 별칭)
 */
export const formatRelativeTime = formatTimeAgo;

/**
 * formatTimeAgo의 별칭 (date-fns와 유사한 이름)
 */
export const formatDistanceToNow = formatTimeAgo;

/**
 * 날짜를 한국어 형식으로 표현
 * @param date - 포맷할 날짜
 * @returns "YYYY년 M월 D일" 형식의 문자열
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * 시간을 HH:mm 형식으로 표현
 * @param date - 포맷할 날짜
 * @returns "HH:mm" 형식의 문자열
 */
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/**
 * 오늘 날짜인지 확인
 * @param date - 확인할 날짜
 * @returns 오늘이면 true
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
};

/**
 * 어제 날짜인지 확인
 * @param date - 확인할 날짜
 * @returns 어제면 true
 */
export const isYesterday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    dateObj.getDate() === yesterday.getDate() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * 두 날짜 사이의 일수 차이 계산
 * @param date1 - 첫 번째 날짜
 * @param date2 - 두 번째 날짜
 * @returns 일수 차이 (date2 - date1)
 */
export const getDaysDifference = (date1: Date | string, date2: Date | string): number => {
  const dateObj1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const dateObj2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffInTime = dateObj2.getTime() - dateObj1.getTime();
  return Math.floor(diffInTime / (1000 * 60 * 60 * 24));
};