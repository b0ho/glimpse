import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as DOMPurify from 'isomorphic-dompurify';

/**
 * 입력 데이터 정제 인터셉터
 *
 * XSS 공격을 방지하기 위해 모든 입력 데이터를 정제합니다.
 */
@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // 요청 본문 정제
    if (request.body) {
      request.body = this.sanitizeObject(request.body);
    }

    // 쿼리 파라미터 정제
    if (request.query) {
      request.query = this.sanitizeObject(request.query);
    }

    // 응답 데이터도 정제
    return next.handle().pipe(
      map((data) => {
        if (typeof data === 'object' && data !== null) {
          return this.sanitizeObject(data);
        }
        return data;
      }),
    );
  }

  /**
   * 객체의 모든 문자열 값을 정제
   */
  private sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitized[key] = this.sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * 문자열에서 잠재적인 XSS 위협 제거
   * Prisma ORM이 SQL Injection을 방지하므로 XSS 방지에만 집중
   */
  private sanitizeString(str: string): string {
    // HTML 태그 제거 - XSS 방지
    const sanitized = DOMPurify.sanitize(str, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });

    // 전처리 후 문자열 반환 (SQL 키워드 제거하지 않음)
    // Prisma ORM이 prepared statements를 사용하여 SQL Injection 방지
    return sanitized.trim();
  }
}
