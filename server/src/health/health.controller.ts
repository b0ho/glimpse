import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../core/prisma/prisma.service';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async checkHealth() {
    try {
      // Database connection check
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'connected',
        version: process.env.npm_package_version || '1.0.0',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'disconnected',
        error: error.message,
      };
    }
  }

  @Get('health/db')
  @ApiOperation({ summary: 'Database health check' })
  @ApiResponse({ status: 200, description: 'Database is healthy' })
  async checkDatabase() {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          current_database() as database,
          current_user as user,
          version() as version,
          pg_database_size(current_database()) as size
      `;
      
      const userCount = await this.prisma.user.count();
      const groupCount = await this.prisma.group.count();
      const matchCount = await this.prisma.match.count();
      
      return {
        status: 'ok',
        connection: result[0],
        stats: {
          users: userCount,
          groups: groupCount,
          matches: matchCount,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}