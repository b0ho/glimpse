/**
 * @module Sentry
 * @description Sentry 에러 추적 및 모니터링 설정
 * 
 * Sentry를 통해 애플리케이션에서 발생하는 오류를 실시간으로 추적하고
 * 성능 모니터링을 수행합니다. 개발자가 오류를 빠르게 발견하고
 * 디버깅할 수 있도록 도와줍니다.
 * 
 * 주요 기능:
 * - 실시간 에러 리포팅
 * - 성능 모니터링 및 프로파일링
 * - 사용자 컴텍스트 추적
 * - 민감한 정보 필터링
 * - Breadcrumb 추적으로 오류 전후 상황 파악
 * 
 * 보안 고려사항:
 * - 비밀번호, 토큰 등 민감 정보 자동 필터링
 * - 사용자 식별 정보 익명화
 * - 인증 관련 오류는 리포팅에서 제외
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import env from './env';

/**
 * Sentry 초기화 함수
 * 
 * Sentry SDK를 초기화하고 에러 추적, 성능 모니터링을 설정합니다.
 * 환경별로 다른 설정을 적용하여 개발과 프로덕션에 적합한
 * 모니터링 레벨을 제공합니다.
 * 
 * 설정 항목:
 * - DSN 설정 및 환경 구분
 * - HTTP, Express 인트그레이션
 * - 성능 모니터링 샘플 비율
 * - 민감 데이터 필터링
 * - Breadcrumb 설정
 * 
 * @param _app - Express 애플리케이션 인스턴스 (미사용)
 */
export function initializeSentry(_app: any) {
  if (env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      integrations: [
        // Enable HTTP calls tracing
        Sentry.httpIntegration(),
        // Enable Express.js middleware tracing
        Sentry.expressIntegration(),
        // Enable profiling
        nodeProfilingIntegration(),
        // Additional integrations
        Sentry.requestDataIntegration({
          include: {
            data: true,
            headers: true,
            query_string: true,
            url: true,
          },
        }),
      ],
      
      // Performance Monitoring
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Release tracking
      release: 'unknown',
      
      // Environment-specific settings
      debug: env.NODE_ENV === 'development',
      
      // Filter out specific errors
      beforeSend(event, hint) {
        // Filter out specific errors that we don't want to track
        const error = hint.originalException;
        
        // Don't send validation errors
        if (error && typeof error === 'object' && 'statusCode' in error) {
          const statusCode = (error as any).statusCode;
          if (statusCode >= 400 && statusCode < 500) {
            return null;
          }
        }
        
        // Filter out specific error messages
        if (event.exception?.values?.[0]?.value) {
          const errorMessage = event.exception.values[0].value;
          const ignoredMessages = [
            'jwt expired',
            'jwt malformed',
            'invalid signature',
            'No authorization token provided',
          ];
          
          if (ignoredMessages.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()))) {
            return null;
          }
        }
        
        // Add user context
        if (event.user) {
          event.user = {
            ...event.user,
            // Remove sensitive data
            email: undefined,
            phoneNumber: undefined,
          };
        }
        
        return event;
      },
      
      // Breadcrumb configuration
      beforeBreadcrumb(breadcrumb) {
        // Filter out sensitive breadcrumbs
        if (breadcrumb.category === 'console') {
          return null;
        }
        
        // Sanitize data in breadcrumbs
        if (breadcrumb.data) {
          const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
          Object.keys(breadcrumb.data).forEach(key => {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
              breadcrumb.data![key] = '[REDACTED]';
            }
          });
        }
        
        return breadcrumb;
      },
    });

    console.log('✅ Sentry initialized successfully');
  } else {
    console.log('⚠️  Sentry DSN not provided, error monitoring disabled');
  }
}

/**
 * 커스텀 에러 캐처 함수
 * 
 * 추가적인 컴텍스트 정보와 함께 에러를 Sentry에 전송합니다.
 * 에러 발생 시 디버깅에 필요한 추가 정보를 제공하여
 * 미빠른 문제 해결을 도와줍니다.
 * 
 * @param error - 캡처할 에러 객체
 * @param context - 추가 컴텍스트 정보 (선택사항)
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
      tags: {
        service: 'api',
        version: 'unknown',
      },
    });
  } else {
    console.error('Error:', error, context);
  }
}

/**
 * 성능 모니터링 트랜잭션 시작
 * 
 * 특정 작업의 성능을 측정하기 위한 트랜잭션을 시작합니다.
 * API 요청 시간, 데이터베이스 쿼리 시간 등을 추적할 수 있습니다.
 * 
 * @param name - 트랜잭션 이름
 * @param op - 연산 타입 (기본값: 'http')
 * @returns 트랜잭션 객체
 */
export function startTransaction(name: string, op: string = 'http') {
  return Sentry.startSpan({
    name,
    op,
  }, () => {});
}

/**
 * 에러 추적을 위한 사용자 식별
 * 
 * 에러가 발생한 사용자를 식별하여 문제를 사용자별로 추적할 수 있도록 합니다.
 * 개인정보는 최소한만 수집하여 프라이버시를 보호합니다.
 * 
 * @param userId - 사용자 ID
 * @param userData - 추가 사용자 데이터 (선택사항)
 */
export function identifyUser(userId: string, userData?: Partial<Sentry.User>) {
  Sentry.setUser({
    id: userId,
    ...userData,
  });
}

/**
 * 로그아웃 시 사용자 컴텍스트 클리어
 * 
 * 사용자가 로그아웃할 때 Sentry에서 사용자 정보를 제거합니다.
 * 개인정보 보호와 세션 관리를 위해 필수적입니다.
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * 커스텀 Breadcrumb 추가
 * 
 * 에러 발생 전후의 상황을 파악하기 위해 커스텀 Breadcrumb을 추가합니다.
 * 사용자 액션, API 호출, 중요 이벤트 등을 기록하여 디버깅을 도웁니다.
 * 
 * @param message - Breadcrumb 메시지
 * @param data - 추가 데이터 (선택사항)
 * @param level - 심각도 레벨 (기본값: 'info')
 */
export function addBreadcrumb(message: string, data?: Record<string, any>, level: Sentry.SeverityLevel = 'info') {
  Sentry.addBreadcrumb({
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}