import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma 서비스
 *
 * 데이터베이스 연결을 관리하고 Prisma 클라이언트를 제공합니다.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  /**
   * 모듈 초기화 시 데이터베이스 연결
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * 모듈 종료 시 데이터베이스 연결 해제
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * 트랜잭션을 사용한 데이터베이스 작업 헬퍼
   *
   * @param fn 트랜잭션 내에서 실행할 함수
   * @returns 트랜잭션 결과
   */
  async transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return await this.$transaction(fn);
  }
}
