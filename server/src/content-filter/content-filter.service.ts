import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { AdminService } from '../admin/admin.service';

/**
 * 콘텐츠 필터링 서비스
 *
 * 부적절한 콘텐츠를 감지하고 차단합니다.
 */
@Injectable()
export class ContentFilterService {
  private bannedWords: Set<string>;
  private suspiciousPatterns: RegExp[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminService: AdminService,
  ) {
    this.initializeFilters();
  }

  /**
   * 필터 초기화
   */
  private async initializeFilters() {
    // 금지어 목록 로드
    const bannedWordsList = await this.loadBannedWords();
    this.bannedWords = new Set(bannedWordsList);

    // 의심스러운 패턴 설정
    this.suspiciousPatterns = [
      // 전화번호 패턴
      /\d{3}[-.\s]?\d{4}[-.\s]?\d{4}/g,
      /\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4}/g,
      // 이메일 패턴
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      // SNS 계정 패턴
      /@[a-zA-Z0-9_]+/g,
      // 카카오톡 ID 패턴
      /카카오톡|카톡|kakao|kt|line|라인/gi,
      // URL 패턴
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
      // 외부 만남 유도 패턴
      /만나|보자|나와|나오|직접|바로|연락|전화|통화/gi,
    ];
  }

  /**
   * 텍스트 검증
   *
   * @param text 검증할 텍스트
   * @param context 컨텍스트 (프로필, 채팅, 그룹 등)
   * @returns 검증 결과
   */
  async validateText(
    text: string,
    context: 'PROFILE' | 'CHAT' | 'GROUP' | 'REVIEW',
  ): Promise<{
    isValid: boolean;
    reason?: string;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH';
    matchedPatterns?: string[];
  }> {
    if (!text || text.trim().length === 0) {
      return { isValid: true };
    }

    const normalizedText = this.normalizeText(text);
    const issues: string[] = [];
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    // 1. 금지어 검사
    const bannedWordFound = this.checkBannedWords(normalizedText);
    if (bannedWordFound.length > 0) {
      issues.push(`금지어 발견: ${bannedWordFound.join(', ')}`);
      severity = 'HIGH';
    }

    // 2. 개인정보 노출 검사
    const personalInfoPatterns = this.checkPersonalInfo(text);
    if (personalInfoPatterns.length > 0) {
      issues.push('개인정보 노출 위험');
      severity = context === 'PROFILE' ? 'HIGH' : 'MEDIUM';
    }

    // 3. 스팸/광고 검사
    const spamScore = this.calculateSpamScore(text);
    if (spamScore > 0.7) {
      issues.push('스팸/광고 의심');
      severity = 'MEDIUM';
    }

    // 4. 반복 문자 검사
    if (this.hasExcessiveRepetition(text)) {
      issues.push('과도한 반복 문자');
      severity = 'LOW';
    }

    // 5. 이모지 남용 검사
    const emojiRatio = this.calculateEmojiRatio(text);
    if (emojiRatio > 0.5) {
      issues.push('과도한 이모지 사용');
      severity = 'LOW';
    }

    // 6. 컨텍스트별 추가 검증
    if (context === 'PROFILE') {
      const profileIssues = this.validateProfileContent(text);
      issues.push(...profileIssues);
    } else if (context === 'CHAT') {
      const chatIssues = this.validateChatContent(text);
      issues.push(...chatIssues);
    }

    const isValid = issues.length === 0;

    // 위반 사항 로깅
    if (!isValid) {
      await this.logViolation(text, context, issues, severity);
    }

    return {
      isValid,
      reason: issues.join(', '),
      severity,
      matchedPatterns: issues,
    };
  }

  /**
   * 이미지 검증 (메타데이터)
   *
   * @param imageUrl 이미지 URL
   * @param context 컨텍스트
   * @returns 검증 결과
   */
  async validateImage(
    imageUrl: string,
    context: 'PROFILE' | 'CHAT' | 'GROUP',
  ): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    // 이미지 메타데이터 검증
    // 실제 구현에서는 AI 기반 이미지 분석 서비스 연동 필요

    // 임시 구현: URL 패턴 검사
    if (imageUrl.includes('nsfw') || imageUrl.includes('adult')) {
      return {
        isValid: false,
        reason: '부적절한 이미지',
      };
    }

    return { isValid: true };
  }

  /**
   * 신고 내용 분석
   *
   * @param reportedContent 신고된 내용
   * @param reportReason 신고 사유
   * @returns 분석 결과
   */
  async analyzeReport(
    reportedContent: string,
    reportReason: string,
  ): Promise<{
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    recommendedAction: 'DISMISS' | 'WARN' | 'BLOCK';
    analysis: string;
  }> {
    const validation = await this.validateText(reportedContent, 'CHAT');

    let recommendedAction: 'DISMISS' | 'WARN' | 'BLOCK' = 'DISMISS';
    let analysis = '';

    if (!validation.isValid) {
      if (validation.severity === 'HIGH') {
        recommendedAction = 'BLOCK';
        analysis = '심각한 규정 위반이 확인되었습니다.';
      } else if (validation.severity === 'MEDIUM') {
        recommendedAction = 'WARN';
        analysis = '경고 조치가 필요한 내용입니다.';
      } else {
        recommendedAction = 'WARN';
        analysis = '경미한 규정 위반이 확인되었습니다.';
      }
    } else {
      analysis = '명확한 규정 위반이 확인되지 않았습니다.';
    }

    return {
      severity: validation.severity || 'LOW',
      recommendedAction,
      analysis: `${analysis} ${validation.reason || ''}`.trim(),
    };
  }

  /**
   * 텍스트 정규화
   *
   * @param text 원본 텍스트
   * @returns 정규화된 텍스트
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, '') // 특수문자 제거
      .replace(/\s+/g, ' ') // 연속 공백 제거
      .trim();
  }

  /**
   * 금지어 검사
   *
   * @param text 검사할 텍스트
   * @returns 발견된 금지어 목록
   */
  private checkBannedWords(text: string): string[] {
    const found: string[] = [];

    this.bannedWords.forEach((word) => {
      if (text.includes(word)) {
        found.push(word);
      }
    });

    return found;
  }

  /**
   * 개인정보 검사
   *
   * @param text 검사할 텍스트
   * @returns 발견된 패턴
   */
  private checkPersonalInfo(text: string): string[] {
    const found: string[] = [];

    this.suspiciousPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        found.push(pattern.source);
      }
    });

    return found;
  }

  /**
   * 스팸 점수 계산
   *
   * @param text 텍스트
   * @returns 스팸 점수 (0-1)
   */
  private calculateSpamScore(text: string): number {
    let score = 0;
    const indicators = [
      { pattern: /광고|홍보|마케팅|프로모션/gi, weight: 0.3 },
      { pattern: /클릭|방문|가입|신청/gi, weight: 0.2 },
      { pattern: /할인|이벤트|무료|특가/gi, weight: 0.2 },
      { pattern: /bit\.ly|tinyurl|goo\.gl/gi, weight: 0.4 },
      { pattern: /[\$\₩][0-9,]+/g, weight: 0.2 },
    ];

    indicators.forEach(({ pattern, weight }) => {
      if (pattern.test(text)) {
        score += weight;
      }
    });

    // 대문자 비율
    const uppercaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (uppercaseRatio > 0.3) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  /**
   * 반복 문자 검사
   *
   * @param text 텍스트
   * @returns 과도한 반복 여부
   */
  private hasExcessiveRepetition(text: string): boolean {
    // 같은 문자가 5번 이상 연속
    return /(.)\1{4,}/g.test(text);
  }

  /**
   * 이모지 비율 계산
   *
   * @param text 텍스트
   * @returns 이모지 비율
   */
  private calculateEmojiRatio(text: string): number {
    const emojiPattern =
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojiCount = (text.match(emojiPattern) || []).length;
    return emojiCount / text.length;
  }

  /**
   * 프로필 콘텐츠 검증
   *
   * @param text 프로필 텍스트
   * @returns 문제점 목록
   */
  private validateProfileContent(text: string): string[] {
    const issues: string[] = [];

    // 프로필에서는 직접적인 연락처 공유 금지
    if (/카톡|카카오톡|인스타|페북|페이스북/gi.test(text)) {
      issues.push('외부 SNS 언급 금지');
    }

    // 성적 암시 검사
    if (/19금|성인|야한|섹시/gi.test(text)) {
      issues.push('부적절한 내용');
    }

    return issues;
  }

  /**
   * 채팅 콘텐츠 검증
   *
   * @param text 채팅 텍스트
   * @returns 문제점 목록
   */
  private validateChatContent(text: string): string[] {
    const issues: string[] = [];

    // 매칭 전 개인정보 공유 시도
    if (/실명|본명|진짜 이름/gi.test(text)) {
      issues.push('개인정보 공유 시도');
    }

    // 금전 거래 시도
    if (/송금|계좌|입금|대출/gi.test(text)) {
      issues.push('금전 거래 시도');
    }

    return issues;
  }

  /**
   * 금지어 목록 로드
   *
   * @returns 금지어 목록
   */
  private async loadBannedWords(): Promise<string[]> {
    // TODO: bannedWord 테이블 추가 필요
    const words: any[] = [];
    // const words = await this.prisma.bannedWord.findMany({
    //   where: { isActive: true },
    //   select: { word: true },
    // });

    // 기본 금지어
    const defaultBannedWords = [
      '자살',
      '살인',
      '마약',
      '도박',
      '사기',
      '피싱',
      '몸캠',
      '조건만남',
      // 욕설 및 비속어 (실제로는 더 포괄적인 목록 필요)
    ];

    return [...defaultBannedWords, ...words.map((w: any) => w.word)];
  }

  /**
   * 위반 로깅
   *
   * @param content 콘텐츠
   * @param context 컨텍스트
   * @param violations 위반 사항
   * @param severity 심각도
   */
  private async logViolation(
    content: string,
    context: string,
    violations: string[],
    severity: string,
  ) {
    // TODO: contentViolationLog 테이블 추가 필요
    console.log('Content violation:', {
      content: content.substring(0, 500),
      context,
      violations,
      severity,
    });
  }

  /**
   * 금지어 추가
   *
   * @param word 금지어
   * @param category 카테고리
   */
  async addBannedWord(word: string, category?: string) {
    // TODO: bannedWord 테이블 추가 필요
    console.log('Add banned word:', {
      word: word.toLowerCase(),
      category,
    });

    // 캐시 갱신
    await this.initializeFilters();
  }

  /**
   * 금지어 제거
   *
   * @param word 금지어
   */
  async removeBannedWord(word: string) {
    // TODO: bannedWord 테이블 추가 필요
    console.log('Remove banned word:', word.toLowerCase());

    // 캐시 갱신
    await this.initializeFilters();
  }

  /**
   * 텍스트 필터링
   *
   * @param text 필터링할 텍스트
   * @returns 필터링 결과
   */
  async filterText(text: string): Promise<{
    severity: 'safe' | 'warning' | 'blocked';
    filteredText?: string;
  }> {
    const validation = await this.validateText(text, 'CHAT');

    if (!validation.isValid) {
      if (validation.severity === 'HIGH') {
        return { severity: 'blocked' };
      } else if (validation.severity === 'MEDIUM') {
        // 중간 심각도의 경우 금지어를 마스킹 처리
        let filteredText = text;
        this.bannedWords.forEach((word) => {
          const regex = new RegExp(word, 'gi');
          filteredText = filteredText.replace(regex, '*'.repeat(word.length));
        });
        return { severity: 'warning', filteredText };
      }
    }

    return { severity: 'safe', filteredText: text };
  }
}
