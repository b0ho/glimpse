import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import os from 'os';

const prisma = new PrismaClient();

interface SystemHealth {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  responseTime?: number;
  details?: string;
  lastCheck: string;
}

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const adminToken = request.cookies.get('admin_token')?.value;
    if (!adminToken) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const healthChecks: SystemHealth[] = [];
    const startTime = Date.now();

    // 1. 데이터베이스 상태 확인
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbResponseTime = Date.now() - dbStart;
      
      healthChecks.push({
        service: 'PostgreSQL Database',
        status: dbResponseTime < 100 ? 'healthy' : dbResponseTime < 300 ? 'warning' : 'error',
        responseTime: dbResponseTime,
        details: `Query response time: ${dbResponseTime}ms`,
        lastCheck: new Date().toISOString(),
      });
    } catch (error) {
      healthChecks.push({
        service: 'PostgreSQL Database',
        status: 'error',
        details: `Database connection failed: ${error}`,
        lastCheck: new Date().toISOString(),
      });
    }

    // 2. 시스템 리소스 확인
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: os.uptime(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      loadAverage: os.loadavg(),
    };

    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = ((systemInfo.totalMemory - systemInfo.freeMemory) / systemInfo.totalMemory) * 100;

    healthChecks.push({
      service: 'System Resources',
      status: memoryUsagePercent < 80 ? 'healthy' : memoryUsagePercent < 90 ? 'warning' : 'error',
      details: `Memory usage: ${memoryUsagePercent.toFixed(1)}%, Load: ${systemInfo.loadAverage[0].toFixed(2)}`,
      lastCheck: new Date().toISOString(),
    });

    // 3. API 응답 시간 확인
    const apiResponseTime = Date.now() - startTime;
    healthChecks.push({
      service: 'API Response',
      status: apiResponseTime < 200 ? 'healthy' : apiResponseTime < 500 ? 'warning' : 'error',
      responseTime: apiResponseTime,
      details: `API response time: ${apiResponseTime}ms`,
      lastCheck: new Date().toISOString(),
    });

    // 4. Socket.IO 서비스 상태 (더미 - 실제로는 Socket.IO 서버 상태 확인)
    healthChecks.push({
      service: 'Socket.IO Server',
      status: 'healthy',
      details: 'WebSocket connections active',
      lastCheck: new Date().toISOString(),
    });

    // 5. 외부 서비스 상태 확인 (더미)
    const externalServices = [
      { name: 'Firebase FCM', status: 'healthy' as const },
      { name: 'AWS S3', status: 'healthy' as const },
      { name: 'Clerk Auth', status: 'healthy' as const },
      { name: 'Stripe Payments', status: 'warning' as const },
      { name: 'Kakao Map API', status: 'healthy' as const },
    ];

    externalServices.forEach(service => {
      healthChecks.push({
        service: service.name,
        status: service.status,
        details: service.status === 'healthy' ? 'Service operational' : 'Service experiencing issues',
        lastCheck: new Date().toISOString(),
      });
    });

    // 전체 시스템 상태 결정
    const hasError = healthChecks.some(check => check.status === 'error');
    const hasWarning = healthChecks.some(check => check.status === 'warning');
    
    const overallStatus = hasError ? 'error' : hasWarning ? 'warning' : 'healthy';

    // 성능 메트릭
    const performanceMetrics = {
      totalResponseTime: Date.now() - startTime,
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      },
      systemMemory: {
        total: Math.round(systemInfo.totalMemory / 1024 / 1024 / 1024), // GB
        free: Math.round(systemInfo.freeMemory / 1024 / 1024 / 1024), // GB
        used: Math.round((systemInfo.totalMemory - systemInfo.freeMemory) / 1024 / 1024 / 1024), // GB
        percentage: Math.round(memoryUsagePercent),
      },
      cpu: {
        cores: systemInfo.cpus,
        loadAverage: systemInfo.loadAverage.map(load => Math.round(load * 100) / 100),
      },
      uptime: {
        system: Math.round(systemInfo.uptime),
        process: Math.round(process.uptime()),
      },
    };

    // 최근 에러 로그 (더미 데이터)
    const recentErrors = [
      {
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        level: 'warning',
        message: 'High memory usage detected',
        service: 'System Monitor',
      },
      {
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        level: 'error',
        message: 'Database connection timeout',
        service: 'PostgreSQL',
      },
    ];

    return NextResponse.json({
      overallStatus,
      healthChecks,
      performanceMetrics,
      systemInfo: {
        platform: systemInfo.platform,
        arch: systemInfo.arch,
        nodeVersion: systemInfo.nodeVersion,
        uptime: systemInfo.uptime,
      },
      recentErrors,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('System monitoring error:', error);
    return NextResponse.json(
      { error: '시스템 모니터링 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}