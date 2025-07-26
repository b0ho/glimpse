import {
  formatRelativeTime,
  formatDate,
  formatTime,
  isToday,
  isYesterday,
  getDaysDifference,
} from '../../utils/dateUtils';

describe('dateUtils', () => {
  describe('formatRelativeTime', () => {
    it('should format "방금 전" for times less than a minute ago', () => {
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
      
      expect(formatRelativeTime(thirtySecondsAgo)).toBe('방금 전');
    });

    it('should format minutes correctly', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5분 전');
    });

    it('should format hours correctly', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      expect(formatRelativeTime(twoHoursAgo)).toBe('2시간 전');
    });

    it('should format days correctly', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      
      expect(formatRelativeTime(threeDaysAgo)).toBe('3일 전');
    });

    it('should format weeks correctly', () => {
      const now = new Date();
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      expect(formatRelativeTime(twoWeeksAgo)).toBe('2주 전');
    });

    it('should format months correctly', () => {
      const now = new Date();
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      expect(formatRelativeTime(twoMonthsAgo)).toBe('2개월 전');
    });
  });

  describe('formatDate', () => {
    it('should format date in Korean format', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('2024년 1월 15일');
    });

    it('should handle string dates', () => {
      expect(formatDate('2024-01-15')).toBe('2024년 1월 15일');
    });
  });

  describe('formatTime', () => {
    it('should format time in 24-hour format', () => {
      const date = new Date('2024-01-15T14:30:00');
      expect(formatTime(date)).toBe('14:30');
    });

    it('should pad single digit hours and minutes', () => {
      const date = new Date('2024-01-15T09:05:00');
      expect(formatTime(date)).toBe('09:05');
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const now = new Date();
      expect(isToday(now)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });
  });

  describe('isYesterday', () => {
    it('should return true for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isYesterday(yesterday)).toBe(true);
    });

    it('should return false for today', () => {
      const today = new Date();
      expect(isYesterday(today)).toBe(false);
    });
  });

  describe('getDaysDifference', () => {
    it('should calculate days difference correctly', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-20');
      
      expect(getDaysDifference(date1, date2)).toBe(5);
    });

    it('should return 0 for same day', () => {
      const date = new Date('2024-01-15');
      expect(getDaysDifference(date, date)).toBe(0);
    });

    it('should handle negative differences', () => {
      const date1 = new Date('2024-01-20');
      const date2 = new Date('2024-01-15');
      
      expect(getDaysDifference(date1, date2)).toBe(-5);
    });
  });
});