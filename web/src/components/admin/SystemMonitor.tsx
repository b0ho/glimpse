'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  MemoryStick,
  RefreshCw,
  Server,
  Wifi,
  XCircle,
} from 'lucide-react';

interface SystemHealth {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  responseTime?: number;
  details?: string;
  lastCheck: string;
}

interface PerformanceMetrics {
  totalResponseTime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  systemMemory: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  cpu: {
    cores: number;
    loadAverage: number[];
  };
  uptime: {
    system: number;
    process: number;
  };
}

interface MonitoringData {
  overallStatus: 'healthy' | 'warning' | 'error';
  healthChecks: SystemHealth[];
  performanceMetrics: PerformanceMetrics;
  systemInfo: {
    platform: string;
    arch: string;
    nodeVersion: string;
    uptime: number;
  };
  recentErrors: Array<{
    timestamp: string;
    level: string;
    message: string;
    service: string;
  }>;
  lastUpdated: string;
}

export default function SystemMonitor() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMonitoringData();

    let interval: ReturnType<typeof setInterval> | undefined;
    if (autoRefresh) {
      interval = setInterval(loadMonitoringData, 30000); // 30초마다 새로고침
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadMonitoringData = async () => {
    try {
      const response = await fetch('/api/admin/monitor');
      if (response.ok) {
        const data = await response.json();
        setMonitoringData(data);
      } else {
        console.error('Failed to load monitoring data');
      }
    } catch (error) {
      console.error('Monitoring data loading error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500">정상</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500">경고</Badge>;
      case 'error':
        return <Badge variant="destructive">오류</Badge>;
      default:
        return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  const getServiceIcon = (serviceName: string) => {
    if (serviceName.includes('Database')) return <Database className="h-4 w-4" />;
    if (serviceName.includes('System')) return <Server className="h-4 w-4" />;
    if (serviceName.includes('API')) return <Wifi className="h-4 w-4" />;
    if (serviceName.includes('Socket')) return <Activity className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}일 ${hours}시간 ${minutes}분`;
    } else if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else {
      return `${minutes}분`;
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse text-muted-foreground">
            시스템 모니터링 데이터를 로드하는 중...
          </div>
        </div>
      </div>
    );
  }

  if (!monitoringData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-muted-foreground">모니터링 데이터를 불러올 수 없습니다.</p>
            <Button onClick={loadMonitoringData} className="mt-4">
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 제어 패널 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon(monitoringData.overallStatus)}
          <h2 className="text-xl font-semibold">시스템 모니터링</h2>
          {getStatusBadge(monitoringData.overallStatus)}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={loadMonitoringData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 시스템 정보 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              시스템 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>플랫폼:</span>
              <span className="font-mono">{monitoringData.systemInfo.platform}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>아키텍처:</span>
              <span className="font-mono">{monitoringData.systemInfo.arch}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Node.js:</span>
              <span className="font-mono">{monitoringData.systemInfo.nodeVersion}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>시스템 가동시간:</span>
              <span>{formatUptime(monitoringData.performanceMetrics.uptime.system)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>프로세스 가동시간:</span>
              <span>{formatUptime(monitoringData.performanceMetrics.uptime.process)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MemoryStick className="h-5 w-5" />
              메모리 사용량
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>전체:</span>
              <span>{monitoringData.performanceMetrics.systemMemory.total} GB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>사용중:</span>
              <span>{monitoringData.performanceMetrics.systemMemory.used} GB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>사용률:</span>
              <span className={`font-semibold ${
                monitoringData.performanceMetrics.systemMemory.percentage > 80 
                  ? 'text-red-500' 
                  : monitoringData.performanceMetrics.systemMemory.percentage > 60 
                  ? 'text-yellow-500' 
                  : 'text-green-500'
              }`}>
                {monitoringData.performanceMetrics.systemMemory.percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  monitoringData.performanceMetrics.systemMemory.percentage > 80 
                    ? 'bg-red-500' 
                    : monitoringData.performanceMetrics.systemMemory.percentage > 60 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
                }`}
                style={{ width: `${monitoringData.performanceMetrics.systemMemory.percentage}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              성능 메트릭
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>CPU 코어:</span>
              <span>{monitoringData.performanceMetrics.cpu.cores}개</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>부하 평균:</span>
              <span className="font-mono">
                {monitoringData.performanceMetrics.cpu.loadAverage.join(', ')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>응답 시간:</span>
              <span className={`${
                monitoringData.performanceMetrics.totalResponseTime > 500 
                  ? 'text-red-500' 
                  : monitoringData.performanceMetrics.totalResponseTime > 200 
                  ? 'text-yellow-500' 
                  : 'text-green-500'
              }`}>
                {monitoringData.performanceMetrics.totalResponseTime}ms
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>힙 메모리:</span>
              <span>{monitoringData.performanceMetrics.memoryUsage.heapUsed} MB</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 서비스 상태 */}
      <Card>
        <CardHeader>
          <CardTitle>서비스 상태</CardTitle>
          <CardDescription>
            각 시스템 컴포넌트의 상태를 실시간으로 모니터링합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {monitoringData.healthChecks.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getServiceIcon(check.service)}
                  <div>
                    <div className="font-medium text-sm">{check.service}</div>
                    <div className="text-xs text-muted-foreground">{check.details}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {check.responseTime && (
                    <span className="text-xs text-muted-foreground">
                      {check.responseTime}ms
                    </span>
                  )}
                  {getStatusBadge(check.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 최근 오류 */}
      {monitoringData.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              최근 오류
            </CardTitle>
            <CardDescription>
              최근 발생한 시스템 오류 및 경고 메시지
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {monitoringData.recentErrors.map((error, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 border-l-2 border-l-red-500 bg-red-50 dark:bg-red-950">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{error.service}</span>
                        <Badge variant="outline" className="text-xs">
                          {error.level}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{error.message}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(error.timestamp).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* 마지막 업데이트 시간 */}
      <div className="text-center text-xs text-muted-foreground">
        마지막 업데이트: {new Date(monitoringData.lastUpdated).toLocaleString('ko-KR')}
      </div>
    </div>
  );
}