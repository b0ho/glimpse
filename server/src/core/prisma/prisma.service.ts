import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

// Vercel 서버리스 환경을 위한 글로벌 Prisma 인스턴스
declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Prisma 서비스
 *
 * 데이터베이스 연결을 관리하고 Prisma 클라이언트를 제공합니다.
 * Vercel 서버리스 환경에 최적화된 싱글톤 패턴 구현
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'production'
          ? (['error', 'warn'] as any)
          : (['query', 'info', 'warn', 'error'] as any),
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Vercel 서버리스 환경에서 연결 재사용
    if (process.env.NODE_ENV === 'production') {
      if (!global.prisma) {
        global.prisma = this;
      }
      return global.prisma as any;
    }
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
