/**
 * 로거 설정 및 생성
 * @module utils/logger
 * @description Winston을 사용한 로깅 시스템 설정
 */

import winston from 'winston';
import path from 'path';

/** 로그 레벨 설정 (환경변수 또는 기본값 'info') */
const logLevel = process.env.LOG_LEVEL || 'info';

/**
 * 로그 디렉토리 경로
 * @constant logDir
 * @description 로그 파일을 저장할 디렉토리 경로
 */
const logDir = path.join(process.cwd(), 'logs');

/**
 * 로그 포맷 정의
 * @constant logFormat
 * @description 타임스탬프, 에러 스택, JSON 형식을 포함한 로그 포맷
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Winston 로거 인스턴스
 * @constant logger
 * @description 애플리케이션 전체에서 사용하는 로거
 * @example
 * ```typescript
 * logger.info('서버 시작', { port: 3000 });
 * logger.error('에러 발생', { error });
 * ```
 */
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'glimpse-server' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    }),
  ],
});

/**
 * 개발 환경 콘솔 로깅
 * @description 프로덕션이 아닌 환경에서는 콘솔에도 로그 출력
 */
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}