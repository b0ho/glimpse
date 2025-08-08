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
  private readonly sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|\*|\/\*|\*\/|xp_|sp_|0x)/gi,
    /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
    /(\bAND\b\s*\d+\s*=\s*\d+)/gi,
    /(\\'\s*OR\s*\\')/gi,
    /(\\'\s*AND\s*\\')/gi,
    /(WAITFOR\s+DELAY)/gi,
    /(BENCHMARK\s*\()/gi,
    /(SLEEP\s*\()/gi,
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
   */
  private containsSqlInjection(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }

    // URL 디코딩
    const decoded = decodeURIComponent(input);

    // 각 패턴 검사
    for (const pattern of this.sqlPatterns) {
      if (pattern.test(decoded)) {
        return true;
      }
    }

    return false;
  }
}
