/**
 * @module Database
 * @description 데이터베이스 연결 및 Prisma ORM 설정
 * 
 * PostgreSQL 데이터베이스와의 연결을 관리하고 Prisma ORM을 통한
 * 타입 안전한 데이터베이스 작업을 지원합니다.
 * 
 * 주요 기능:
 * - PostgreSQL 데이터베이스 연결 관리
 * - 개발/프로덕션 환경별 로깅 설정
 * - 애플리케이션 종료 시 안전한 연결 해제
 * - Prisma ORM을 통한 타입 안전한 쿼리 지원
 */

import { PrismaClient } from '@prisma/client';

/**
 * Prisma 클라이언트 인스턴스
 * 
 * PostgreSQL 데이터베이스와의 연결을 관리하는 Prisma 클라이언트입니다.
 * 환경에 따라 다른 로깅 레벨을 설정하여 개발과 프로덕션에서
 * 적절한 수준의 데이터베이스 로깅을 제공합니다.
 * 
 * 로깅 설정:
 * - 개발 환경: query, info, warn, error 모든 로그
 * - 프로덕션 환경: error 로그만
 * 
 * @constant {PrismaClient}
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

/**
 * 애플리케이션 종료 시 데이터베이스 연결 정리
 * 
 * 프로세스 종료 전에 Prisma 클라이언트의 데이터베이스 연결을
 * 안전하게 해제하여 리소스 누수를 방지합니다.
 * 
 * @event beforeExit
 */
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});