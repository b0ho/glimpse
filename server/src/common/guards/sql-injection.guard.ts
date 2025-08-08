import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * SQL Injection 방지 가드
 *
 * 요청에 SQL Injection 패턴이 포함되어 있는지 검사합니다.
 */
@Injectable()
export class SqlInjectionGuard implements CanActivate {
  // 더 정교한 SQL Injection 패턴 검사
  private readonly sqlPatterns = [
    // 명확한 SQL 쿼리 구조 패턴
    /(\bSELECT\b.*\bFROM\b|\bINSERT\b.*\bINTO\b|\bUPDATE\b.*\bSET\b|\bDELETE\b.*\bFROM\b)/gi,
    // 위험한 SQL 명령어 조합
    /(\bDROP\b.*\b(TABLE|DATABASE)\b|\bCREATE\b.*\b(TABLE|DATABASE)\b|\bALTER\b.*\bTABLE\b)/gi,
    // SQL 주입 시도 패턴
    /(--\s*$|\/\*[\s\S]*?\*\/|;.*\b(SELECT|INSERT|UPDATE|DELETE|DROP)\b)/gim,
    // 스택 쿼리 시도
    /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)/gi,
    // 논리적 바이패스 시도
    /(\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+|\bOR\b\s+1\s*=\s*1|\bOR\b\s+true)/gi,
    /(\bAND\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+|\bAND\b\s+1\s*=\s*1|\bAND\b\s+true)/gi,
    // 시간 기반 공격
    /(WAITFOR\s+DELAY|BENCHMARK\s*\(|SLEEP\s*\(|PG_SLEEP)/gi,
    // Union 기반 공격
    /\bUNION\b.*\bSELECT\b/gi,
    // 시스템 함수 호출
    /(xp_cmdshell|sp_executesql|exec\s*\(|execute\s*\()/gi,
    // 16진수 인코딩 시도
    /0x[0-9a-fA-F]+/,
  ];

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    // 요청 본문 검사
    if (
      request.body &&
      this.containsSqlInjection(JSON.stringify(request.body))
    ) {
      throw new BadRequestException(
        '잠재적인 SQL Injection 공격이 감지되었습니다',
      );
    }

    // 쿼리 파라미터 검사
    if (
      request.query &&
      this.containsSqlInjection(JSON.stringify(request.query))
    ) {
      throw new BadRequestException(
        '잠재적인 SQL Injection 공격이 감지되었습니다',
      );
    }

    // URL 파라미터 검사
    if (
      request.params &&
      this.containsSqlInjection(JSON.stringify(request.params))
    ) {
      throw new BadRequestException(
        '잠재적인 SQL Injection 공격이 감지되었습니다',
      );
    }

    return true;
  }

  /**
   * 문자열에 SQL Injection 패턴이 포함되어 있는지 확인
   * 컨텍스트를 고려하여 false positive를 줄임
   */
  private containsSqlInjection(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }

    // URL 디코딩
    let decoded: string;
    try {
      decoded = decodeURIComponent(input);
    } catch {
      // 디코딩 실패 시 원본 사용
      decoded = input;
    }

    // 일반적인 허용 패턴 제외 (이메일, URL 등)
    const allowedPatterns = [
      /^[\w.-]+@[\w.-]+\.\w+$/, // 이메일
      /^https?:\/\//i, // URL
      /^[a-zA-Z0-9_-]+$/, // 영숫자와 언더스코어, 하이픈만
    ];

    // 허용된 패턴이면 검사 건너뛰기
    for (const allowed of allowedPatterns) {
      if (allowed.test(decoded)) {
        return false;
      }
    }

    // 각 SQL 패턴 검사
    for (const pattern of this.sqlPatterns) {
      if (pattern.test(decoded)) {
        // 패턴 매칭 후 재검증 (false positive 방지)
        pattern.lastIndex = 0; // 패턴 리셋
        return true;
      }
    }

    return false;
  }
}
