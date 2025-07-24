'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<{
    status: string;
    timestamp?: string;
    database?: string;
    version?: string;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setHealthStatus(data);
      } catch (error) {
        console.error('Health check failed:', error);
        setHealthStatus({ status: 'error', error: 'Failed to connect' });
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 dark:from-pink-900 dark:via-purple-900 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold">📱 Glimpse</CardTitle>
          <CardDescription className="text-lg">익명 데이팅 앱</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">개요</TabsTrigger>
              <TabsTrigger value="status">시스템 상태</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">🚀 NextJS + shadcn/ui</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    최신 UI 라이브러리로 업그레이드되었습니다!
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="space-y-1">
                  <Badge variant="secondary" className="w-full">🎭</Badge>
                  <p className="text-xs text-muted-foreground">완전 익명</p>
                </div>
                <div className="space-y-1">
                  <Badge variant="secondary" className="w-full">💬</Badge>
                  <p className="text-xs text-muted-foreground">안전한 채팅</p>
                </div>
                <div className="space-y-1">
                  <Badge variant="secondary" className="w-full">🏢</Badge>
                  <p className="text-xs text-muted-foreground">그룹 매칭</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="status" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">⚡ 시스템 상태</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={healthStatus?.status === 'healthy' ? 'default' : 'destructive'}>
                          {healthStatus?.status === 'healthy' ? '✅ 정상' : '❌ 오류'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>데이터베이스: {healthStatus?.database}</div>
                        <div>업데이트: {healthStatus?.timestamp ? new Date(healthStatus.timestamp).toLocaleString('ko-KR') : '-'}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" size="lg">
            웹에서 시작하기
          </Button>
          
          <Button asChild variant="secondary" className="w-full" size="lg">
            <Link href="/chat">
              💬 실시간 채팅 테스트
            </Link>
          </Button>
          
          <p className="text-sm text-center text-muted-foreground">
            또는 <span className="font-medium text-primary">모바일 앱</span>을 다운로드하세요
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
