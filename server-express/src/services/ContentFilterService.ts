import { createError } from '../middleware/errorHandler';
import { prisma } from '../config/database';

/**
 * 필터링 결과 인터페이스
 * @interface FilterResult
 */
interface FilterResult {
  /** 깨끗한 콘텐츠 여부 */
  isClean: boolean;
  /** 위반 사항 목록 */
  violations: string[];
  /** 필터링된 텍스트 */
  filteredText?: string;
  /** 심각도 수준 */
  severity: 'safe' | 'warning' | 'blocked';
}

/**
 * 금지어 인터페이스
 * @interface BannedWord
 */
interface BannedWord {
  /** 금지어 ID */
  id: string;
  /** 금지어 또는 패턴 */
  word: string;
  /** 카테고리 */
  category: string;
  /** 심각도 */
  severity: 'warning' | 'blocked';
  /** 정규식 여부 */
  regex?: boolean;
}

/**
 * 콘텐츠 필터링 서비스 - 부적절한 콘텐츠 검사 및 필터링
 * @class ContentFilterService
 */
export class ContentFilterService {
  private static instance: ContentFilterService;
  private bannedWords: BannedWord[] = [];
  private lastCacheUpdate: Date = new Date(0);
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5분

  private constructor() {
    this.initializeBannedWords();
  }

  static getInstance(): ContentFilterService {
    if (!ContentFilterService.instance) {
      ContentFilterService.instance = new ContentFilterService();
    }
    return ContentFilterService.instance;
  }

  /**
   * 금지어 목록 초기화
   * @private
   * @returns {Promise<void>}
   */
  private async initializeBannedWords() {
    // 기본 금지어 목록 (욕설, 차별, 성적 콘텐츠 등)
    this.bannedWords = [
      // 욕설 및 비속어
      { id: '1', word: '시발', category: '욕설', severity: 'blocked', regex: false },
      { id: '2', word: '씨발', category: '욕설', severity: 'blocked', regex: false },
      { id: '3', word: 'ㅅㅂ', category: '욕설', severity: 'blocked', regex: false },
      { id: '4', word: '새끼', category: '욕설', severity: 'blocked', regex: false },
      { id: '5', word: '개새끼', category: '욕설', severity: 'blocked', regex: false },
      { id: '6', word: '병신', category: '욕설', severity: 'blocked', regex: false },
      { id: '7', word: '지랄', category: '욕설', severity: 'blocked', regex: false },
      { id: '8', word: '좆', category: '욕설', severity: 'blocked', regex: false },
      { id: '9', word: '꺼져', category: '욕설', severity: 'warning', regex: false },
      { id: '10', word: '닥쳐', category: '욕설', severity: 'warning', regex: false },
      
      // 성적 표현
      { id: '11', word: '섹스', category: '성적표현', severity: 'blocked', regex: false },
      { id: '12', word: '야동', category: '성적표현', severity: 'blocked', regex: false },
      { id: '13', word: '자위', category: '성적표현', severity: 'blocked', regex: false },
      { id: '14', word: '따먹', category: '성적표현', severity: 'blocked', regex: false },
      { id: '15', word: '보지', category: '성적표현', severity: 'blocked', regex: false },
      
      // 차별 표현
      { id: '16', word: '장애인', category: '차별', severity: 'warning', regex: false },
      { id: '17', word: '게이', category: '차별', severity: 'warning', regex: false },
      { id: '18', word: '레즈', category: '차별', severity: 'warning', regex: false },
      { id: '19', word: '흑인', category: '차별', severity: 'warning', regex: false },
      
      // 스팸 패턴 (정규식)
      { id: '20', word: '(광고|홍보).{0,10}문의', category: '스팸', severity: 'warning', regex: true },
      { id: '21', word: '텔레그램.{0,5}@', category: '스팸', severity: 'blocked', regex: true },
      { id: '22', word: '카톡.{0,5}ID', category: '스팸', severity: 'warning', regex: true },
      { id: '23', word: '\\d{3,4}-\\d{3,4}-\\d{4}', category: '개인정보', severity: 'blocked', regex: true },
      { id: '24', word: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', category: '개인정보', severity: 'warning', regex: true },
    ];

    // 데이터베이스에서 추가 금지어 로드 (향후 구현)
    await this.loadBannedWordsFromDB();
  }

  /**
   * 데이터베이스에서 금지어 목록 로드
   * @private
   * @returns {Promise<void>}
   */
  private async loadBannedWordsFromDB() {
    // 캐시 확인
    if (new Date().getTime() - this.lastCacheUpdate.getTime() < this.CACHE_DURATION) {
      return;
    }

    try {
      // 향후 데이터베이스에서 금지어 목록을 로드하는 로직 구현
      // const dbWords = await prisma.bannedWord.findMany();
      // this.bannedWords = [...this.bannedWords, ...dbWords];
      
      this.lastCacheUpdate = new Date();
    } catch (error) {
      console.error('금지어 목록 로드 실패:', error);
    }
  }

  /**
   * 텍스트 필터링
   * @param {string} text - 검사할 텍스트
   * @param {'profile' | 'chat' | 'group'} [context] - 콘텐츠 컨텍스트
   * @returns {Promise<FilterResult>} 필터링 결과
   */
  async filterText(text: string, context?: 'profile' | 'chat' | 'group'): Promise<FilterResult> {
    await this.loadBannedWordsFromDB();

    const violations: string[] = [];
    let filteredText = text;
    let severity: 'safe' | 'warning' | 'blocked' = 'safe';

    for (const bannedWord of this.bannedWords) {
      let isMatch = false;
      
      if (bannedWord.regex) {
        // 정규식 패턴으로 검사
        const regex = new RegExp(bannedWord.word, 'gi');
        isMatch = regex.test(text);
        if (isMatch) {
          filteredText = filteredText.replace(regex, this.getMaskString(bannedWord.word.length));
        }
      } else {
        // 일반 텍스트로 검사 (대소문자 구분 없음)
        const wordRegex = new RegExp(this.escapeRegex(bannedWord.word), 'gi');
        isMatch = wordRegex.test(text);
        if (isMatch) {
          filteredText = filteredText.replace(wordRegex, this.getMaskString(bannedWord.word.length));
        }
      }

      if (isMatch) {
        violations.push(`${bannedWord.category}: ${bannedWord.word}`);
        if (bannedWord.severity === 'blocked') {
          severity = 'blocked';
        } else if (bannedWord.severity === 'warning' && severity !== 'blocked') {
          severity = 'warning';
        }
      }
    }

    // 추가 필터링 규칙
    const additionalChecks = this.performAdditionalChecks(text, context);
    violations.push(...additionalChecks.violations);
    if (additionalChecks.severity === 'blocked' || (additionalChecks.severity === 'warning' && severity === 'safe')) {
      severity = additionalChecks.severity;
    }

    return {
      isClean: violations.length === 0,
      violations,
      filteredText: violations.length > 0 ? filteredText : undefined,
      severity
    };
  }

  /**
   * 추가 필터링 규칙 검사
   * @private
   * @param {string} text - 검사할 텍스트
   * @param {string} [context] - 컨텍스트
   * @returns {Object} 위반 사항과 심각도
   */
  private performAdditionalChecks(text: string, context?: string): { violations: string[]; severity: 'safe' | 'warning' | 'blocked' } {
    const violations: string[] = [];
    let severity: 'safe' | 'warning' | 'blocked' = 'safe';

    // 대문자 남용 체크 (전체 텍스트의 70% 이상이 대문자)
    const upperCaseRatio = (text.match(/[A-Z가-힣]/g) || []).length / text.length;
    if (upperCaseRatio > 0.7 && text.length > 10) {
      violations.push('과도한 대문자 사용');
      severity = 'warning';
    }

    // 반복 문자 체크
    if (/(.)\1{4,}/.test(text)) {
      violations.push('반복 문자 사용');
      severity = 'warning';
    }

    // URL 체크 (프로필에서는 허용, 채팅에서는 경고)
    const urlPattern = /https?:\/\/[^\s]+/gi;
    if (urlPattern.test(text) && context === 'chat') {
      violations.push('URL 포함');
      severity = 'warning';
    }

    // 이모지 스팸 체크 (5개 이상 연속)
    const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojiMatches = text.match(emojiPattern) || [];
    if (emojiMatches.length > 10) {
      violations.push('과도한 이모지 사용');
      severity = 'warning';
    }

    return { violations, severity };
  }

  /**
   * 이미지 필터링
   * @param {string} imageUrl - 이미지 URL
   * @returns {Promise<FilterResult>} 필터링 결과
   */
  async filterImage(imageUrl: string): Promise<FilterResult> {
    // 이미지 필터링은 외부 API (Google Vision API의 Safe Search 등)를 사용
    // 개발 환경에서는 모의 결과 반환
    
    if (process.env.NODE_ENV === 'development') {
      return {
        isClean: true,
        violations: [],
        severity: 'safe'
      };
    }

    try {
      // Google Vision API Safe Search 예시
      if (process.env.GOOGLE_VISION_API_KEY) {
        return await this.checkImageWithGoogleVision(imageUrl);
      }

      // 기본적으로 통과
      return {
        isClean: true,
        violations: [],
        severity: 'safe'
      };
    } catch (error) {
      console.error('이미지 필터링 오류:', error);
      // 오류 시 안전을 위해 차단
      return {
        isClean: false,
        violations: ['이미지 검증 실패'],
        severity: 'blocked'
      };
    }
  }

  /**
   * Google Vision API를 사용한 이미지 안전 검사
   * @private
   * @param {string} imageUrl - 이미지 URL
   * @returns {Promise<FilterResult>} 검사 결과
   * @throws {Error} API 호출 실패 시
   */
  private async checkImageWithGoogleVision(imageUrl: string): Promise<FilterResult> {
    const VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`;
    
    const response = await fetch(VISION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{
          image: {
            source: {
              imageUri: imageUrl
            }
          },
          features: [{
            type: 'SAFE_SEARCH_DETECTION',
            maxResults: 1
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Google Vision API 호출 실패');
    }

    const data = await response.json();
    const safeSearch = data.responses[0]?.safeSearchAnnotation;

    if (!safeSearch) {
      return {
        isClean: true,
        violations: [],
        severity: 'safe'
      };
    }

    const violations: string[] = [];
    let severity: 'safe' | 'warning' | 'blocked' = 'safe';

    // Google의 likelihood 레벨: UNKNOWN, VERY_UNLIKELY, UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY
    const dangerousLevels = ['LIKELY', 'VERY_LIKELY'];
    const warningLevels = ['POSSIBLE'];

    if (dangerousLevels.includes(safeSearch.adult)) {
      violations.push('성인 콘텐츠');
      severity = 'blocked';
    } else if (warningLevels.includes(safeSearch.adult)) {
      violations.push('성인 콘텐츠 의심');
      severity = 'warning';
    }

    if (dangerousLevels.includes(safeSearch.violence)) {
      violations.push('폭력적 콘텐츠');
      severity = 'blocked';
    }

    if (dangerousLevels.includes(safeSearch.racy)) {
      violations.push('선정적 콘텐츠');
      severity = severity === 'safe' ? 'warning' : severity;
    }

    return {
      isClean: violations.length === 0,
      violations,
      severity
    };
  }

  /**
   * 콘텐츠 신고
   * @param {string} reporterId - 신고자 ID
   * @param {'profile' | 'chat' | 'image'} contentType - 콘텐츠 타입
   * @param {string} contentId - 콘텐츠 ID
   * @param {string} reason - 신고 사유
   * @returns {Promise<void>}
   * @throws {Error} 신고 처리 실패 시
   */
  async reportContent(
    reporterId: string,
    contentType: 'profile' | 'chat' | 'image',
    contentId: string,
    reason: string
  ): Promise<void> {
    // 신고 내용 저장
    try {
      // 향후 데이터베이스에 신고 내용 저장
      // await prisma.contentReport.create({
      //   data: {
      //     reporterId,
      //     contentType,
      //     contentId,
      //     reason,
      //     status: 'pending'
      //   }
      // });

      // 관리자에게 알림 전송
      console.log('콘텐츠 신고:', { reporterId, contentType, contentId, reason });
    } catch (error) {
      console.error('콘텐츠 신고 실패:', error);
      throw createError(500, '신고 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * 정규식 이스케이프 처리
   * @private
   * @param {string} string - 이스케이프할 문자열
   * @returns {string} 이스케이프된 문자열
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 마스킹 문자열 생성
   * @private
   * @param {number} length - 마스킹할 길이
   * @returns {string} 마스킹 문자열
   */
  private getMaskString(length: number): string {
    return '*'.repeat(Math.min(length, 5));
  }

  /**
   * 금지어 추가 (관리자용)
   * @param {string} word - 금지어 또는 패턴
   * @param {string} category - 카테고리
   * @param {'warning' | 'blocked'} severity - 심각도
   * @param {boolean} [regex=false] - 정규식 여부
   * @returns {Promise<void>}
   */
  async addBannedWord(word: string, category: string, severity: 'warning' | 'blocked', regex: boolean = false): Promise<void> {
    const newWord: BannedWord = {
      id: Date.now().toString(),
      word,
      category,
      severity,
      regex
    };

    this.bannedWords.push(newWord);
    
    // 데이터베이스에도 저장 (향후 구현)
    // await prisma.bannedWord.create({ data: newWord });
  }

  /**
   * 금지어 제거 (관리자용)
   * @param {string} wordId - 금지어 ID
   * @returns {Promise<void>}
   */
  async removeBannedWord(wordId: string): Promise<void> {
    this.bannedWords = this.bannedWords.filter(w => w.id !== wordId);
    
    // 데이터베이스에서도 삭제 (향후 구현)
    // await prisma.bannedWord.delete({ where: { id: wordId } });
  }

  /**
   * 금지어 목록 조회 (관리자용)
   * @returns {BannedWord[]} 금지어 목록
   */
  getBannedWords(): BannedWord[] {
    return this.bannedWords;
  }
}

export const contentFilterService = ContentFilterService.getInstance();