/**
 * 데이터베이스 연결 관리
 * @module db
 * @description Prisma ORM을 통한 PostgreSQL 데이터베이스 연결
 */

import { PrismaClient } from '@prisma/client';

/**
 * Prisma 클라이언트 인스턴스
 * @constant prisma
 * @type {PrismaClient}
 * @description 데이터베이스 접근을 위한 Prisma 클라이언트 싱글톤 인스턴스
 * @example
 * // 사용자 조회
 * const user = await prisma.user.findUnique({ where: { id } });
 * 
 * // 트랜잭션 사용
 * await prisma.$transaction(async (tx) => {
 *   // 여러 작업 수행
 * });
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;